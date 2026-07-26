/**
 * APPLICATION PRINCIPALE - PORTFOLIO TRACKER
 */

const POLL_INTERVAL_MS = 30000;

let currentUser = null;
let valeursPollInterval = null;
let alertesPollInterval = null;
let indicesPollInterval = null;
let chartInstance = null;
let graphiqueState = { ticker: null, alertable: false };
let placementAlerteActif = false;

document.addEventListener('alpine:init', () => {
  Alpine.store('portfolio', {
    valeurs: [],
    sections: [],
    sectionsPartagees: [],
    indices: [],
    alertes: [],
    chargee: false,

    // Regroupement par section calcule une seule fois par changement de
    // valeurs (au lieu de refiltrer/retrier a chaque appel - valeursDeSection
    // est invoquee une fois par section a chaque rendu Alpine), invalide
    // explicitement aux deux seuls endroits qui modifient valeurs (voir
    // invaliderValeursParSection). Impact reel negligeable a l'echelle de ce
    // projet personnel, mais evite un refiltrage O(sections x valeurs) pour
    // un cout nul en dehors des mutations. Voir CLAUDE.md Historique des
    // revues, Revue n°2.
    _valeursParSection: null,

    valeursDeSection(sectionId) {
      if (!this._valeursParSection) {
        const grouped = new Map();
        for (const v of this.valeurs) {
          if (!grouped.has(v.sectionId)) grouped.set(v.sectionId, []);
          grouped.get(v.sectionId).push(v);
        }
        for (const liste of grouped.values()) {
          liste.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        }
        this._valeursParSection = grouped;
      }
      return this._valeursParSection.get(sectionId) || [];
    },

    invaliderValeursParSection() {
      this._valeursParSection = null;
    },

    // Getter derive plutot qu'un effet de bord de displayAlertes() (voir
    // CLAUDE.md Historique des revues, Revue n°5) : alertesActivesPour()
    // lit toujours le dernier `alertes` charge, sans structure separee a
    // maintenir en synchronisation.
    alertesActivesPour(ticker) {
      return this.alertes.filter((a) => a.active && a.ticker === ticker);
    }
  });
});

// ========================================
// INITIALISATION
// ========================================

(async function start() {
  currentUser = await checkAuthAndRedirect();
  if (currentUser) {
    initApp();
  }
})();

async function initApp() {
  console.log('Utilisateur connecte:', currentUser.email);

  document.getElementById('userName').textContent = currentUser.displayName || currentUser.email.split('@')[0];
  document.getElementById('userEmail').textContent = currentUser.email;

  setupDataPolling();
  setupEventListeners();
  initTheme();
  registerServiceWorker();
  chargerVersion();
}

// ========================================
// THEME CLAIR/SOMBRE
// ========================================

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  const iconMoon = document.getElementById('themeIconMoon');
  const iconSun = document.getElementById('themeIconSun');

  function appliquerIcone() {
    const theme = getTheme();
    iconMoon.style.display = theme === 'dark' ? 'none' : 'block';
    iconSun.style.display = theme === 'dark' ? 'block' : 'none';
  }

  appliquerIcone();

  btn.addEventListener('click', () => {
    const nouveau = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nouveau);
    localStorage.setItem('theme', nouveau);
    appliquerIcone();
  });
}

async function chargerVersion() {
  try {
    const res = await apiFetch('/api/version');
    if (!res.ok) throw new Error('Erreur chargement version');

    const { version } = await res.json();
    document.getElementById('appVersion').textContent = `v${version}`;
  } catch (error) {
    console.error('Erreur chargement version:', error);
  }
}

// ========================================
// SERVICE WORKER
// ========================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker enregistre');

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Nouvelle version disponible. Rechargez la page.', 'info');
            }
          });
        });
      })
      .catch((err) => console.error('Service Worker erreur:', err));
  }
}

// ========================================
// CHARGEMENT DES DONNEES (polling)
// ========================================

function setupDataPolling() {
  chargerValeurs();
  chargerAlertes();
  chargerIndices();

  valeursPollInterval = setInterval(chargerValeurs, POLL_INTERVAL_MS);
  alertesPollInterval = setInterval(chargerAlertes, POLL_INTERVAL_MS);
  indicesPollInterval = setInterval(chargerIndices, POLL_INTERVAL_MS);
}

async function chargerValeurs() {
  try {
    const [resValeurs, resSections] = await Promise.all([apiFetch('/api/valeurs'), apiFetch('/api/sections')]);
    if (!resValeurs.ok) throw new Error('Erreur chargement des valeurs');
    if (!resSections.ok) throw new Error('Erreur chargement des sections');

    const valeurs = await resValeurs.json();
    const sections = await resSections.json();

    displayValeurs(valeurs, sections);

    await chargerSectionsPartagees(sections.filter((s) => s.role !== 'proprietaire'));
  } catch (error) {
    console.error('Erreur chargement valeurs:', error);
  }
}

async function chargerIndices() {
  try {
    const res = await apiFetch('/api/indices');
    if (!res.ok) throw new Error('Erreur chargement des indices');

    Alpine.store('portfolio').indices = await res.json();
  } catch (error) {
    console.error('Erreur chargement indices:', error);
  }
}

async function chargerSectionsPartagees(sections) {
  const store = Alpine.store('portfolio');

  const resultats = await Promise.all(
    sections.map(async (section) => {
      try {
        const res = await apiFetch(`/api/sections/${section.id}/valeurs`);
        const valeurs = res.ok ? await res.json() : [];
        return { ...section, valeurs };
      } catch (error) {
        console.error('Erreur chargement valeurs partagees:', error);
        return { ...section, valeurs: [] };
      }
    })
  );

  store.sectionsPartagees = resultats;
}

async function chargerAlertes() {
  try {
    const res = await apiFetch('/api/alertes');
    if (!res.ok) throw new Error('Erreur chargement des alertes');

    const alertes = await res.json();
    Alpine.store('portfolio').alertes = alertes;
    displayAlertes(alertes);
  } catch (error) {
    console.error('Erreur chargement alertes:', error);
  }
}

// ========================================
// AFFICHAGE DES DONNEES
// ========================================

function displayValeurs(valeurs, sections) {
  const store = Alpine.store('portfolio');
  store.valeurs = valeurs;
  store.invaliderValeursParSection();
  store.sections = sections.filter((s) => s.role === 'proprietaire');
  store.chargee = true;
}

function avatarInitiales(ticker) {
  return ticker.split('.')[0].slice(0, 2).toUpperCase();
}

function avatarCouleur(ticker) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const teinte = Math.abs(hash) % 360;
  return `hsl(${teinte}, 55%, 45%)`;
}

function displayAlertes(alertes) {
  const container = document.getElementById('alertesListe');
  container.innerHTML = '';

  const alertesArray = alertes.filter((a) => a.active);

  if (alertesArray.length === 0) {
    container.innerHTML = `
      <div class="empty-state-small">
        <p>Aucune alerte active</p>
      </div>
    `;
    return;
  }

  alertesArray.forEach((alerte) => {
    const card = createAlerteCard(alerte.id, alerte);
    container.appendChild(card);
  });
}

function createAlerteCard(id, alerte) {
  const div = document.createElement('div');
  div.className = 'alerte-card';

  const seuils = [];
  if (alerte.seuilHaut) seuils.push(`Haut: ${formatCours(alerte.seuilHaut)}`);
  if (alerte.seuilBas) seuils.push(`Bas: ${formatCours(alerte.seuilBas)}`);

  div.innerHTML = `
    <div class="alerte-info">
      <div class="alerte-ticker">${alerte.ticker}</div>
      <div class="alerte-seuils">${seuils.join(' - ')}</div>
    </div>
    <button class="btn-icon-small btn-icon-xs" onclick="supprimerAlerte('${id}')" title="Supprimer" aria-label="Supprimer">
      <svg class="icon icon-sm"><use href="#icon-trash"></use></svg>
    </button>
  `;

  return div;
}

// ========================================
// ACTIONS CRUD
// ========================================

// Section ciblee par la modale d'ajout ("+ ajouter" sur une section possedee
// ou partagee en ecriture), ou null pour le comportement par defaut (ajout
// dans la section proprietaire par defaut de l'utilisateur, voir
// ouvrirAjoutValeur). Le role de la section (`proprietaire` vs `ecriture`)
// determine la route appelee par ajouterValeur().
let sectionCibleAjout = null;

// Squelette showLoader/try/catch/finally/toast partage par les actions CRUD
// ci-dessous (ajout/suppression de valeur, section, partage, alerte) : une
// meme forme repetee depuis l'origine du projet (voir CLAUDE.md Historique
// des revues, Revue n°2). `fn` porte la logique propre a chaque action (son
// propre appel reseau, son propre toast de succes, ses propres effets de
// bord) ; seul l'affichage du loader et le toast d'erreur generique sont
// factorises ici.
async function executerAction(fn, libelleErreur) {
  showLoader(true);

  try {
    await fn();
  } catch (error) {
    console.error(`${libelleErreur}:`, error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

function ouvrirAjoutValeur(section = null) {
  sectionCibleAjout = section;
  document.getElementById('modalAddValeurTitre').textContent = section
    ? `Ajouter une valeur - ${section.nom}`
    : 'Ajouter une valeur';
  masquerRechercheResultats();
  openModal('modalAddValeur');
}

// ========================================
// RECHERCHE DE VALEUR (ajouter par nom, ex. "Schneider" -> SU.PA)
// ========================================

let rechercheTimeout = null;

function masquerRechercheResultats() {
  const conteneur = document.getElementById('rechercheResultats');
  conteneur.hidden = true;
  conteneur.innerHTML = '';
}

function selectionnerResultatRecherche(resultat) {
  document.getElementById('inputTicker').value = resultat.ticker;
  document.getElementById('inputNom').value = resultat.nom;
  masquerRechercheResultats();
}

function afficherRechercheResultats(resultats) {
  const conteneur = document.getElementById('rechercheResultats');

  if (resultats.length === 0) {
    masquerRechercheResultats();
    return;
  }

  conteneur.innerHTML = '';
  for (const resultat of resultats) {
    const item = document.createElement('div');
    item.className = 'recherche-item';
    item.innerHTML = `
      <div class="recherche-item-nom">${resultat.nom}</div>
      <div class="recherche-item-detail">${resultat.ticker}${resultat.bourse ? ' · ' + resultat.bourse : ''}</div>
    `;
    // pointerdown (avant le blur de l'input) plutot que click : le blur de
    // #inputTicker masquerait la liste avant qu'un click n'ait le temps de
    // se declencher dessus.
    item.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      selectionnerResultatRecherche(resultat);
    });
    conteneur.appendChild(item);
  }
  conteneur.hidden = false;
}

async function rechercherValeur(query) {
  try {
    const res = await apiFetch(`/api/valeurs/recherche?q=${encodeURIComponent(query)}`);
    if (!res.ok) return;

    const resultats = await res.json();
    afficherRechercheResultats(resultats);
  } catch (error) {
    console.error('Erreur recherche valeur:', error);
  }
}

function onInputTickerChange() {
  const query = document.getElementById('inputTicker').value.trim();

  clearTimeout(rechercheTimeout);
  if (query.length < 2) {
    masquerRechercheResultats();
    return;
  }

  rechercheTimeout = setTimeout(() => rechercherValeur(query), 300);
}

async function ajouterValeur() {
  const ticker = document.getElementById('inputTicker').value.trim().toUpperCase();
  const type = document.getElementById('selectType').value;
  const nom = document.getElementById('inputNom').value.trim();

  if (!ticker) {
    showToast('Ticker requis', 'warning');
    return;
  }

  await executerAction(async () => {
    const section = sectionCibleAjout;
    // Une section possedee (role "proprietaire") passe toujours par
    // /api/valeurs (avec sectionId pour cibler une section precise) ; seule
    // une section partagee en ecriture (appartenant a un autre utilisateur)
    // passe par la route dediee /api/sections/:id/valeurs.
    const url = section && section.role !== 'proprietaire' ? `/api/sections/${section.id}/valeurs` : '/api/valeurs';
    const body = { ticker, type, nom };
    if (section && section.role === 'proprietaire') {
      body.sectionId = section.id;
    }

    const res = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (res.status === 409) {
      const data = await res.json();
      showToast(data.error || 'Cette valeur est deja suivie', 'warning');
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur ajout valeur');
    }

    await chargerValeurs();

    showToast(`${ticker} ajoute`, 'success');
    closeAllModals();

    document.getElementById('inputTicker').value = '';
    document.getElementById('inputNom').value = '';
  }, 'Erreur ajout valeur');
}

async function supprimerValeur(id, ticker) {
  const ok = await showConfirm(`Supprimer ${ticker} de vos valeurs suivies ?`, 'Supprimer la valeur');
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/valeurs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression valeur');

    await chargerValeurs();
    await chargerAlertes();

    showToast(`${ticker} supprime`, 'success');
  }, 'Erreur suppression valeur');
}

async function supprimerValeurSection(section, ticker) {
  const ok = await showConfirm(`Supprimer ${ticker} de la section "${section.nom}" ?`, 'Supprimer la valeur');
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/sections/${section.id}/valeurs/${encodeURIComponent(ticker)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression valeur');

    await chargerValeurs();

    showToast(`${ticker} supprime`, 'success');
  }, 'Erreur suppression valeur');
}

// ========================================
// SECTIONS ET GLISSER-DEPOSER
// ========================================

async function ajouterSection() {
  const nom = await showPrompt('Nom de la nouvelle section :');
  if (!nom || !nom.trim()) return;

  await executerAction(async () => {
    const res = await apiFetch('/api/sections', {
      method: 'POST',
      body: JSON.stringify({ nom: nom.trim() })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur creation section');
    }

    await chargerValeurs();
    showToast('Section creee', 'success');
  }, 'Erreur creation section');
}

async function renommerSection(section) {
  const nom = await showPrompt('Nouveau nom de la section :', section.nom);
  if (!nom || !nom.trim() || nom.trim() === section.nom) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/sections/${section.id}`, {
      method: 'PUT',
      body: JSON.stringify({ nom: nom.trim() })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur renommage section');
    }

    await chargerValeurs();
    showToast('Section renommee', 'success');
  }, 'Erreur renommage section');
}

async function supprimerSection(section) {
  const ok = await showConfirm(
    `Supprimer la section "${section.nom}" ? Les valeurs qu'elle contient seront deplacees vers une autre section.`,
    'Supprimer la section'
  );
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/sections/${section.id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur suppression section');
    }

    await chargerValeurs();
    showToast('Section supprimee', 'success');
  }, 'Erreur suppression section');
}

// ========================================
// PARTAGE DE SECTION
// ========================================

let sectionCiblePartage = null;

async function ouvrirPartageModal(section) {
  sectionCiblePartage = section;
  document.getElementById('partageTitre').textContent = `Partager "${section.nom}"`;
  document.getElementById('inputPartageEmail').value = '';
  document.getElementById('selectPartageRole').value = 'lecture';
  openModal('modalPartage');

  await Promise.all([chargerPartagesSection(section.id), chargerListeUtilisateurs()]);
}

async function chargerPartagesSection(sectionId) {
  const container = document.getElementById('partageListe');
  container.innerHTML = '<div class="loader-inline"><div class="spinner-small"></div></div>';

  try {
    const res = await apiFetch(`/api/sections/${sectionId}/partages`);
    if (!res.ok) throw new Error('Erreur chargement des partages');

    const partages = await res.json();
    container.innerHTML = '';

    if (partages.length === 0) {
      container.innerHTML = '<div class="empty-state-small"><p>Section non partagee</p></div>';
      return;
    }

    partages.forEach((partage) => container.appendChild(createPartageRow(sectionId, partage)));
  } catch (error) {
    console.error('Erreur chargement des partages:', error);
    container.innerHTML = '<div class="empty-state-small"><p>Erreur chargement des partages</p></div>';
  }
}

function createPartageRow(sectionId, partage) {
  const div = document.createElement('div');
  div.className = 'partage-row';

  const info = document.createElement('div');
  info.className = 'partage-info';

  const email = document.createElement('div');
  email.className = 'partage-email';
  email.textContent = partage.email;

  const role = document.createElement('div');
  role.className = 'partage-role';
  role.textContent = partage.role === 'ecriture' ? 'Lecture et ecriture' : 'Lecture seule';

  info.append(email, role);

  const btn = document.createElement('button');
  btn.className = 'btn-icon-small';
  btn.title = 'Retirer l\'acces';
  btn.setAttribute('aria-label', 'Retirer l\'acces');
  btn.innerHTML = '<svg class="icon icon-sm"><use href="#icon-trash"></use></svg>';
  btn.addEventListener('click', () => supprimerPartage(sectionId, partage.userId));

  div.append(info, btn);

  return div;
}

async function chargerListeUtilisateurs() {
  try {
    const res = await apiFetch('/api/users');
    if (!res.ok) throw new Error('Erreur chargement des utilisateurs');

    const users = await res.json();
    const datalist = document.getElementById('listeUtilisateurs');
    datalist.innerHTML = '';
    users.forEach((u) => {
      const option = document.createElement('option');
      option.value = u.email;
      datalist.appendChild(option);
    });
  } catch (error) {
    console.error('Erreur chargement des utilisateurs:', error);
  }
}

async function ajouterPartage() {
  const email = document.getElementById('inputPartageEmail').value.trim();
  const role = document.getElementById('selectPartageRole').value;

  if (!email) {
    showToast('Email requis', 'warning');
    return;
  }

  await executerAction(async () => {
    const res = await apiFetch(`/api/sections/${sectionCiblePartage.id}/partages`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur partage de la section');
    }

    document.getElementById('inputPartageEmail').value = '';
    await chargerPartagesSection(sectionCiblePartage.id);
    showToast('Section partagee', 'success');
  }, 'Erreur partage de la section');
}

async function supprimerPartage(sectionId, userId) {
  const ok = await showConfirm('Retirer l\'acces de cet utilisateur a la section ?', 'Retirer l\'acces');
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/sections/${sectionId}/partages/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression du partage');

    await chargerPartagesSection(sectionId);
    showToast('Acces retire', 'success');
  }, 'Erreur suppression du partage');
}

function marquerSortableInit(el) {
  if (el.dataset.sortableInit) return false;
  el.dataset.sortableInit = 'true';
  return true;
}

function initSortableSections(el) {
  if (!marquerSortableInit(el)) return;

  Sortable.create(el, {
    handle: '.valeurs-section-drag-handle',
    draggable: '.valeurs-section',
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: () => {
      const ordreSections = Array.from(el.querySelectorAll(':scope > .valeurs-section')).map((node) =>
        Number(node.dataset.sectionId)
      );

      const store = Alpine.store('portfolio');
      store.sections = ordreSections
        .map((id, index) => {
          const section = store.sections.find((s) => s.id === id);
          return section ? { ...section, ordre: index } : null;
        })
        .filter(Boolean);

      persisterOrdre();
    }
  });
}

// Squelette SortableJS commun aux deux listes de valeurs (proprietaire et
// partagee) : seul le groupe de glisser-depose (autorise ou non le passage
// d'une section a l'autre) et le traitement de fin de glisser different
// reellement entre les deux (voir CLAUDE.md Historique des revues, Revue
// n°3) - une section partagee ne peut jamais recevoir une valeur venue
// d'ailleurs, d'ou un groupe isole par section plutot que le groupe commun
// 'valeurs' des sections possedees.
function initSortableListeValeurs(el, { group, onReordered }) {
  if (!marquerSortableInit(el)) return;

  Sortable.create(el, {
    group,
    draggable: '.valeur-row',
    handle: '.valeur-drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: onReordered
  });
}

function initSortableValeurs(el) {
  initSortableListeValeurs(el, {
    group: 'valeurs',
    onReordered: (evt) => {
      const store = Alpine.store('portfolio');
      const valeursParId = new Map(store.valeurs.map((v) => [v.id, v]));
      const listesTouchees = evt.from === evt.to ? [evt.to] : [evt.from, evt.to];

      for (const liste of listesTouchees) {
        const sectionId = Number(liste.dataset.sectionId);
        const idsOrdonnes = Array.from(liste.querySelectorAll(':scope > .valeur-row')).map((node) =>
          Number(node.dataset.valeurId)
        );

        idsOrdonnes.forEach((id, index) => {
          const valeur = valeursParId.get(id);
          if (valeur) {
            valeur.sectionId = sectionId;
            valeur.ordre = index;
          }
        });
      }

      store.invaliderValeursParSection();
      persisterOrdre();
    }
  });
}

function initSortableValeursPartagees(el, section) {
  initSortableListeValeurs(el, {
    group: `valeurs-partagee-${section.id}`,
    onReordered: () => {
      const idsOrdonnes = Array.from(el.querySelectorAll(':scope > .valeur-row')).map((node) =>
        Number(node.dataset.valeurId)
      );
      persisterOrdreSectionPartagee(section, idsOrdonnes);
    }
  });
}

// Queue commune aux deux flux de persistance de l'ordre (memes conditions
// d'echec, meme toast) : seule differe la construction du payload `sections`
// en amont (voir persisterOrdre/persisterOrdreSectionPartagee).
async function envoyerReorder(sections, contexte = '') {
  try {
    const res = await apiFetch('/api/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ sections })
    });

    if (!res.ok) throw new Error('Erreur enregistrement ordre');
  } catch (error) {
    console.error(`Erreur enregistrement ordre${contexte}:`, error);
    showToast('Erreur lors de l\'enregistrement de l\'ordre', 'error');
  }
}

async function persisterOrdre() {
  const store = Alpine.store('portfolio');

  const sections = [...store.sections]
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    .map((section) => ({
      id: section.id,
      ordre: section.ordre,
      valeurIds: store
        .valeursDeSection(section.id)
        .map((v) => v.id)
    }));

  await envoyerReorder(sections);
}

async function persisterOrdreSectionPartagee(section, valeurIds) {
  const store = Alpine.store('portfolio');
  const cible = store.sectionsPartagees.find((s) => s.id === section.id);
  if (cible) {
    valeurIds.forEach((id, index) => {
      const valeur = cible.valeurs.find((v) => v.id === id);
      if (valeur) valeur.ordre = index;
    });
  }

  await envoyerReorder([{ id: section.id, valeurIds }], ' section partagee');
}

async function creerAlerteAPI(ticker, seuilHaut, seuilBas) {
  let succes = false;

  await executerAction(async () => {
    const res = await apiFetch('/api/alertes', {
      method: 'POST',
      body: JSON.stringify({ ticker, seuilHaut: seuilHaut || null, seuilBas: seuilBas || null })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur creation alerte');
    }

    await chargerAlertes();
    showToast(`Alerte creee pour ${ticker}`, 'success');
    succes = true;
  }, 'Erreur creation alerte');

  return succes;
}

async function creerAlerte() {
  const ticker = document.getElementById('inputTickerAlerte').value;
  const seuilHaut = parseFloat(document.getElementById('inputSeuilHaut').value);
  const seuilBas = parseFloat(document.getElementById('inputSeuilBas').value);

  if (!ticker) {
    showToast('Ticker requis', 'warning');
    return;
  }

  if (!seuilHaut && !seuilBas) {
    showToast('Au moins un seuil requis', 'warning');
    return;
  }

  const success = await creerAlerteAPI(ticker, seuilHaut, seuilBas);

  if (success) {
    closeAllModals();
    document.getElementById('inputSeuilHaut').value = '';
    document.getElementById('inputSeuilBas').value = '';
  }
}

async function supprimerAlerte(id) {
  const ok = await showConfirm('Supprimer cette alerte ?', 'Supprimer l\'alerte');
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/alertes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression alerte');

    await chargerAlertes();

    showToast('Alerte supprimee', 'success');
  }, 'Erreur suppression alerte');
}

// ========================================
// GRAPHIQUES
// ========================================

async function openGraphique(ticker, nom = null, alertable = false) {
  graphiqueState = { ticker, alertable };
  fermerPlacementAlerte();
  document.getElementById('graphiqueWrapper').classList.toggle('alertable', alertable);

  openModal('modalGraphique');
  document.getElementById('graphiqueTitre').textContent = `Graphique - ${nom || ticker}`;

  const periodeBtn = document.querySelector('[data-period="1M"]');
  await chargerGraphique(ticker, '1M');

  document.querySelectorAll('.btn-periode').forEach((btn) => btn.classList.remove('active'));
  periodeBtn.classList.add('active');

  document.querySelectorAll('.btn-periode').forEach((btn) => {
    btn.onclick = async () => {
      document.querySelectorAll('.btn-periode').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      await chargerGraphique(ticker, btn.dataset.period);
    };
  });
}

// ========================================
// ALERTE DEPUIS LE GRAPHIQUE (glisser-deposer)
// ========================================

let draggingAlerte = false;
let dragRect = null;

function positionnerLigneAlerte(valeur) {
  if (!chartInstance) return;

  const y = chartInstance.scales.y.getPixelForValue(valeur);
  document.getElementById('alerteLigne').style.top = y + 'px';

  const badge = document.getElementById('alerteBadge');
  badge.style.top = y + 'px';
  badge.textContent = formatCours(valeur);
}

function mettreAJourPlacementDepuisEvent(e) {
  if (!chartInstance || !dragRect) return;

  const brut = chartInstance.scales.y.getValueForPixel(e.clientY - dragRect.top);
  const { min, max } = chartInstance.scales.y;
  const valeur = Math.max(min, Math.min(max, brut));

  graphiqueState.valeurPlacement = valeur;
  positionnerLigneAlerte(valeur);
}

function alerteOnPointerDown(e) {
  draggingAlerte = true;
  dragRect = document.getElementById('graphiqueContainer').getBoundingClientRect();
  e.currentTarget.setPointerCapture(e.pointerId);
  mettreAJourPlacementDepuisEvent(e);
}

function alerteOnPointerMove(e) {
  if (!draggingAlerte) return;
  mettreAJourPlacementDepuisEvent(e);
}

function alerteOnPointerUp() {
  draggingAlerte = false;
  dragRect = null;
}

function ouvrirPlacementAlerte() {
  if (!chartInstance || placementAlerteActif) return;

  const valeurStore = Alpine.store('portfolio').valeurs.find((v) => v.ticker === graphiqueState.ticker);
  const { min, max } = chartInstance.scales.y;
  const depart = (valeurStore && valeurStore.cours) || (min + max) / 2;

  graphiqueState.valeurPlacement = depart;
  placementAlerteActif = true;

  // Visibilite des 5 elements du mode placement (declencheur/annuler/
  // confirmer/ligne/badge) pilotee uniquement par cette classe CSS (voir
  // public/styles.css) plutot que par cinq attributs hidden individuels
  // tenus manuellement en synchronisation - voir CLAUDE.md Historique des
  // revues, Revue n°4.
  document.getElementById('graphiqueWrapper').classList.add('placement-actif');
  positionnerLigneAlerte(depart);

  const containerEl = document.getElementById('graphiqueContainer');
  containerEl.addEventListener('pointerdown', alerteOnPointerDown);
  containerEl.addEventListener('pointermove', alerteOnPointerMove);
  containerEl.addEventListener('pointerup', alerteOnPointerUp);
  containerEl.addEventListener('pointercancel', alerteOnPointerUp);
}

function fermerPlacementAlerte() {
  placementAlerteActif = false;
  draggingAlerte = false;

  document.getElementById('graphiqueWrapper').classList.remove('placement-actif');

  const containerEl = document.getElementById('graphiqueContainer');
  containerEl.removeEventListener('pointerdown', alerteOnPointerDown);
  containerEl.removeEventListener('pointermove', alerteOnPointerMove);
  containerEl.removeEventListener('pointerup', alerteOnPointerUp);
  containerEl.removeEventListener('pointercancel', alerteOnPointerUp);
}

async function confirmerPlacementAlerte() {
  if (!placementAlerteActif) return;

  const ticker = graphiqueState.ticker;
  const valeurChoisie = graphiqueState.valeurPlacement;
  const valeurStore = Alpine.store('portfolio').valeurs.find((v) => v.ticker === ticker);
  const coursActuel = valeurStore ? valeurStore.cours : valeurChoisie;

  const seuilHaut = valeurChoisie >= coursActuel ? valeurChoisie : null;
  const seuilBas = valeurChoisie < coursActuel ? valeurChoisie : null;

  fermerPlacementAlerte();
  await creerAlerteAPI(ticker, seuilHaut, seuilBas);
}

function afficherAlertesGraphique(ticker) {
  const overlay = document.getElementById('alertesGraphiqueOverlay');
  overlay.innerHTML = '';

  if (!graphiqueState.alertable || !chartInstance) return;

  const seuils = Alpine.store('portfolio')
    .alertesActivesPour(ticker)
    .flatMap((a) => [a.seuilHaut, a.seuilBas].filter(Boolean));
  if (seuils.length === 0) return;

  const yScale = chartInstance.scales.y;
  const { min, max } = yScale;
  let indexHaut = 0;
  let indexBas = 0;

  const ajouterOverlayEl = (className, style, texte) => {
    const el = document.createElement('div');
    el.className = className;
    Object.assign(el.style, style);
    if (texte !== undefined) el.textContent = texte;
    overlay.appendChild(el);
  };

  seuils.forEach((seuil) => {
    if (seuil >= min && seuil <= max) {
      const y = yScale.getPixelForValue(seuil);
      ajouterOverlayEl('alerte-existante-ligne', { top: y + 'px' });
      ajouterOverlayEl('alerte-existante-badge', { top: y + 'px' }, formatCours(seuil));
    } else {
      const horsHaut = seuil > max;
      const style = horsHaut ? { top: 4 + indexHaut * 22 + 'px' } : { bottom: 4 + indexBas * 22 + 'px' };
      ajouterOverlayEl('alerte-hors-limite', style, `${horsHaut ? '▲' : '▼'} ${formatCours(seuil)}`);
      if (horsHaut) indexHaut += 1;
      else indexBas += 1;
    }
  });
}

function formatGraphiqueLabel(dateStr, period) {
  const date = new Date(dateStr);

  if (period === '1D') {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  if (period === '1W') {
    const jour = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${jour} ${heure}`;
  }

  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}

async function chargerGraphique(ticker, period) {
  const container = document.getElementById('graphiqueContainer');
  container.innerHTML = '<div class="loader-inline"><div class="spinner-small"></div></div>';
  document.getElementById('alertesGraphiqueOverlay').innerHTML = '';

  try {
    const res = await apiFetch(`/api/chart/${encodeURIComponent(ticker)}?period=${period}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Erreur chargement des donnees');
    }

    const result = await res.json();
    const data = result.data;

    const labels = data.map((d) => formatGraphiqueLabel(d.date, period));
    const prices = data.map((d) => d.close);

    container.innerHTML = '<canvas id="chartCanvas"></canvas>';
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');

    if (chartInstance) {
      chartInstance.destroy();
    }

    const themeSombre = getTheme() === 'dark';
    const couleurTexte = themeSombre ? '#9aa0a6' : '#5f6368';
    const couleurGrille = themeSombre ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: ticker,
            data: prices,
            borderColor: '#c9a227',
            backgroundColor: 'rgba(201, 162, 39, 0.12)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label(context) {
                return `${context.parsed.y.toFixed(2)} EUR`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { color: couleurTexte }
          },
          y: {
            display: true,
            grid: { color: couleurGrille },
            ticks: {
              color: couleurTexte,
              callback(value) {
                return value.toFixed(2) + ' EUR';
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    afficherAlertesGraphique(ticker);

    // Evenement generique plutot qu'une branche if (placementAlerteActif)
    // codee en dur ici : chargerGraphique() est le constructeur generique du
    // graphique, partage par les valeurs et les indices, et n'a pas besoin de
    // connaitre la fonctionnalite aval "alerte depuis le graphique" (voir
    // CLAUDE.md Historique des revues, Revue n°4). Le seul abonne aujourd'hui
    // est repositionnerPlacementApresChargement() (voir setupEventListeners).
    document.getElementById('graphiqueContainer').dispatchEvent(new CustomEvent('chart:loaded'));
  } catch (error) {
    console.error('Erreur chargement graphique:', error);
    container.innerHTML = `
      <div class="empty-state-small">
        <p>Erreur chargement des donnees</p>
        <small>${error.message}</small>
      </div>
    `;
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', () => {
    showToast('Actualisation...', 'info');
    chargerValeurs();
    chargerAlertes();
    chargerIndices();
  });

  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');

  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    userMenu.classList.remove('active');
  });

  document.getElementById('addValeurBtn').addEventListener('click', () => ouvrirAjoutValeur());

  document.getElementById('fab').addEventListener('click', () => ouvrirAjoutValeur());

  const inputTicker = document.getElementById('inputTicker');
  inputTicker.addEventListener('input', onInputTickerChange);
  inputTicker.addEventListener('blur', () => {
    setTimeout(() => masquerRechercheResultats(), 150);
  });

  document.getElementById('promptInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      resolvePromptOk();
    }
  });

  // #graphiqueContainer persiste entre deux chargerGraphique() (seul son
  // innerHTML est remplace), un abonnement unique ici suffit pour tous les
  // chargements a venir (ouverture, changement de periode).
  document.getElementById('graphiqueContainer').addEventListener('chart:loaded', repositionnerPlacementApresChargement);
}

// Re-clampe valeurPlacement aux nouveaux min/max de l'echelle avant de
// repositionner la ligne/pastille : changer de periode en cours de
// placement changeait l'echelle sans jamais re-clamper valeurPlacement
// (contrairement a mettreAJourPlacementDepuisEvent(), qui clampe a chaque
// geste), pouvant laisser la ligne hors du graphique visible pour la
// nouvelle periode. Bug repere en Revue n°4, corrige ici avec le passage a
// l'evenement chart:loaded.
function repositionnerPlacementApresChargement() {
  if (!placementAlerteActif || !chartInstance) return;

  const { min, max } = chartInstance.scales.y;
  graphiqueState.valeurPlacement = Math.max(min, Math.min(max, graphiqueState.valeurPlacement));
  positionnerLigneAlerte(graphiqueState.valeurPlacement);
}

// ========================================
// MODALS
// ========================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  fermerPlacementAlerte();
  masquerRechercheResultats();
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}

function openAlerteModal(ticker) {
  document.getElementById('inputTickerAlerte').value = ticker;
  openModal('modalCreateAlerte');
}

// ========================================
// PROMPT / CONFIRM (remplacent window.prompt/window.confirm,
// non stylables et incoherents avec le theme clair/sombre de l'appli)
// ========================================

// Mecanisme generique unique (voir CLAUDE.md Historique des revues, Revue
// n°2) : promptResolve/confirmResolve etaient deux resolveurs de Promise a
// emplacement unique suivant le meme patron (ouvrir la modale, stocker le
// resolveur, resoudre-et-fermer, gerer Echap). `cancelValue` porte la seule
// vraie difference entre les deux modales (Echap annule un prompt en
// renvoyant null, un confirm en renvoyant false).
let modalActive = null;

function resoudreModaleActive(valeur) {
  closeAllModals();
  if (modalActive) {
    modalActive.resolve(valeur);
    modalActive = null;
  }
}

function showPrompt(titre, valeurDefaut = '') {
  return new Promise((resolve) => {
    modalActive = { resolve, cancelValue: null };
    document.getElementById('promptTitre').textContent = titre;
    const input = document.getElementById('promptInput');
    input.value = valeurDefaut;
    openModal('modalPrompt');
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  });
}

function resolvePrompt(valeur) {
  resoudreModaleActive(valeur);
}

function resolvePromptOk() {
  resoudreModaleActive(document.getElementById('promptInput').value);
}

function showConfirm(message, titre = 'Confirmer') {
  return new Promise((resolve) => {
    modalActive = { resolve, cancelValue: false };
    document.getElementById('confirmTitre').textContent = titre;
    document.getElementById('confirmMessage').textContent = message;
    openModal('modalConfirm');
  });
}

function resolveConfirm(valeur) {
  resoudreModaleActive(valeur);
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  if (modalActive) {
    resoudreModaleActive(modalActive.cancelValue);
  } else {
    closeAllModals();
  }
});

// ========================================
// UI HELPERS
// ========================================

function showLoader(show) {
  const loader = document.getElementById('loader');
  loader.classList.toggle('hidden', !show);
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} active`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

function formatCours(cours) {
  return formatCoursDevise(cours);
}

function formatVolume(volume) {
  if (!volume) return '-';

  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  }

  return volume.toString();
}

function formatHeure(timestamp) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatVariation(variation) {
  const v = variation || 0;
  const signe = v >= 0 ? '+' : '';
  return `${signe}${v.toFixed(2)}%`;
}

function formatCoursDevise(cours, devise) {
  if (!cours) return '-';
  return cours.toFixed(2) + ' ' + (devise || 'EUR');
}

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
  if (valeursPollInterval) clearInterval(valeursPollInterval);
  if (alertesPollInterval) clearInterval(alertesPollInterval);
  if (indicesPollInterval) clearInterval(indicesPollInterval);
});
