/**
 * APPLICATION PRINCIPALE - PORTFOLIO TRACKER
 */

const POLL_INTERVAL_MS = 30000;

let currentUser = null;
let valeursPollInterval = null;
let alertesPollInterval = null;
let indicesPollInterval = null;
let portefeuillesPollInterval = null;
// Instances creerRechercheTicker() (voir § RECHERCHE DE VALEUR), assignees
// par setupEventListeners() une fois le DOM pret.
let rechercheTickerValeur = null;
let rechercheTickerPosition = null;
let chartInstance = null;
let volumeChartInstance = null;
// Largeur (px) de l'axe Y partagee entre le graphique de cours et le
// graphique de volume (deux instances Chart.js separees, voir
// chargerGraphique/chargerGraphiqueVolume), recalculee a chaque chargement
// (alignerLargeurAxeY). PAS une constante fixe : une largeur figee en dur
// (ex. 50px) s'est averee trop etroite pour des libelles de prix a 3
// chiffres et tronquait les premiers caracteres hors du canvas (bug
// corrige, retour utilisateur du 2026-07-27) - la largeur reellement
// necessaire depend du nombre de chiffres du cours ET de la police/taille
// de rendu du navigateur, donc pas d'une valeur devinable a l'avance.
let largeurAxeYGraphique = 0;

// Callback afterFit partage par les deux axes Y (cours et volume) : chacun
// impose sa propre largeur naturelle (calculee par Chart.js a partir de ses
// propres libelles) comme largeur minimale commune, jamais moins que ce
// dont CHAQUE graphique a besoin pour ne pas tronquer ses libelles.
function alignerLargeurAxeY(scale) {
  largeurAxeYGraphique = Math.max(largeurAxeYGraphique, scale.width);
  scale.width = largeurAxeYGraphique;
}

let graphiqueState = { ticker: null, alertable: false };
let placementAlerteActif = false;

// Periode du dernier graphique consulte (n'importe quelle valeur ou indice) :
// reutilisee comme periode par defaut a la prochaine ouverture, plutot que de
// revenir systematiquement sur '1M' - demande explicite utilisateur. Persistee
// dans localStorage (meme mecanisme que le theme clair/sombre, voir
// initTheme()) pour survivre a un rafraichissement de page ou une fermeture de
// la PWA - demande explicite utilisateur (la premiere version, en memoire
// uniquement, ne survivait pas a un rechargement).
const PERIODES_GRAPHIQUE_VALIDES = ['1D', '1W', '1M', '1Y', 'MAX'];
const periodeStockee = localStorage.getItem('graphique_periode');
let dernierePeriodeGraphique = PERIODES_GRAPHIQUE_VALIDES.includes(periodeStockee) ? periodeStockee : '1M';

// Canal de regression en orientation paysage (voir DESIGN.md § Canal de
// regression en orientation paysage) : mql plutot qu'un resize/orientation
// event classique, pour un evenement fiable independant des dimensions
// exactes du viewport (ex. barre d'adresse qui apparait/disparait).
const mqPaysage = window.matchMedia('(orientation: landscape)');

document.addEventListener('alpine:init', () => {
  Alpine.store('portfolio', {
    valeurs: [],
    sections: [],
    sectionsPartagees: [],
    indices: [],
    alertes: [],
    portefeuilles: [],
    portefeuilleSelectionneId: null,
    portefeuillePositions: [],
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
    },

    // Pastilles de notification (session 2026-07-27, demande explicite
    // utilisateur : le texte "Declenchee a hh:mm" sur la carte d'alerte,
    // seul ajout de la Session 34, restait trop discret pour remarquer
    // qu'un seuil avait ete franchi). Un declenchement reste visible tant
    // que l'anti-repetition ne l'a pas efface (derniereAlerte n'est jamais
    // remis a null - voir server/jobs/alerts.js), donc jusqu'a suppression/
    // ajustement de l'alerte par l'utilisateur : pas une notification
    // "lue/non lue" avec etat separe a maintenir, mais un signal "ce seuil
    // a ete franchi et merite votre attention".
    alertesDeclenchees() {
      return this.alertes.filter((a) => a.active && a.derniereAlerte);
    },

    aUneAlerteDeclenchee(ticker) {
      return this.alertesActivesPour(ticker).some((a) => a.derniereAlerte);
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
  chargerPortefeuilles();

  valeursPollInterval = setInterval(chargerValeurs, POLL_INTERVAL_MS);
  alertesPollInterval = setInterval(chargerAlertes, POLL_INTERVAL_MS);
  indicesPollInterval = setInterval(chargerIndices, POLL_INTERVAL_MS);
  portefeuillesPollInterval = setInterval(chargerPortefeuilles, POLL_INTERVAL_MS);
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

// derniereAlerte (session 2026-07-27, retour utilisateur explicite : deux
// seuils franchis un matin sans aucune notification visible nulle part, SMTP
// non configure). derniereAlerte est ecrite par checkAlerts() des qu'un
// seuil est franchi, que l'envoi d'email reussisse, echoue ou soit
// desactive (voir server/jobs/alerts.js/BUSINESS_RULES.md § Alertes de
// seuil) : seul moyen de verifier dans l'app qu'une alerte s'est bien
// declenchee, independamment de l'email.
function texteDerniereAlerte(alerte) {
  return alerte.derniereAlerte ? `Declenchee a ${formatHeure(alerte.derniereAlerte)}` : 'Jamais declenchee';
}

function libellePartage(section) {
  return section.partagee ? 'Section partagee' : 'Partager la section';
}

function createAlerteCard(id, alerte) {
  const div = document.createElement('div');
  div.className = 'alerte-card';

  const seuils = [];
  if (alerte.seuilHaut) seuils.push(`Haut: ${formatCours(alerte.seuilHaut)}`);
  if (alerte.seuilBas) seuils.push(`Bas: ${formatCours(alerte.seuilBas)}`);

  // Pastille rouge devant le ticker si declenchee (voir $store.portfolio.
  // alertesDeclenchees, meme demande utilisateur) : permet de reperer en un
  // coup d'oeil les cartes declenchees dans une longue liste, sans avoir a
  // lire le texte "Declenchee a hh:mm"/"Jamais declenchee" de chacune.
  const pastille = alerte.derniereAlerte ? '<span class="badge-notif-dot" title="Alerte declenchee"></span>' : '';

  div.innerHTML = `
    <div class="alerte-info">
      <div class="alerte-ticker">${pastille}${alerte.ticker}</div>
      <div class="alerte-seuils">${seuils.join(' - ')}</div>
      <div class="alerte-derniere">${texteDerniereAlerte(alerte)}</div>
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
// ouvrirAjoutValeur). POST /api/valeurs determine lui-meme l'autorisation
// d'ecriture sur la section ciblee (voir CLAUDE.md Historique des revues,
// Revue n°6, correctif reporte) : le client n'a plus besoin de choisir la
// route selon le role de la section.
let sectionCibleAjout = null;

// Squelette showLoader/try/catch/finally/toast partage par les actions CRUD
// ci-dessous (ajout/suppression de valeur, section, partage, alerte) : une
// meme forme repetee depuis l'origine du projet (voir CLAUDE.md Historique
// des revues, Revue n°2). `fn` porte la logique propre a chaque action (son
// propre appel reseau, son propre toast de succes, ses propres effets de
// bord) ; seul l'affichage du loader et le toast d'erreur generique sont
// factorises ici. La valeur resolue par `fn` est propagee (undefined en cas
// d'erreur), pour les rares appelants qui en ont besoin (ex. creerAlerteAPI).
async function executerAction(fn, libelleErreur) {
  showLoader(true);

  try {
    return await fn();
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
  rechercheTickerValeur.masquer();
  openModal('modalAddValeur');
}

// ========================================
// RECHERCHE DE VALEUR (ajouter par nom, ex. "Schneider" -> SU.PA)
// ========================================

// Fabrique un gestionnaire de recherche-a-la-saisie independant (debounce,
// affichage/fermeture du menu deroulant, selection d'un resultat), lie a un
// couple champ/conteneur precis - factorise le mecanisme partage par
// #modalAddValeur (#inputTicker/#rechercheResultats) et #modalAddPosition
// (#inputTickerPosition/#rechercheResultatsPosition, voir § PORTEFEUILLES),
// seule la cible du remplissage (`onSelectionner`) differe entre les deux.
function creerRechercheTicker(inputId, resultatsId, onSelectionner) {
  let timeout = null;

  function masquer() {
    const conteneur = document.getElementById(resultatsId);
    conteneur.hidden = true;
    conteneur.innerHTML = '';
  }

  function afficher(resultats) {
    const conteneur = document.getElementById(resultatsId);

    if (resultats.length === 0) {
      masquer();
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
      // click (pas pointerdown) : un click natif ne se declenche pas apres
      // un glisser (scroll tactile dans la liste), contrairement a
      // pointerdown - appeler preventDefault() sur pointerdown supprimait
      // aussi le geste de scroll tactile natif pour tout le conteneur
      // (chaque item couvrant presque toute sa hauteur, plus aucun scroll
      // n'etait possible dans les resultats - bug reel, retour utilisateur
      // du 2026-07-27). La fermeture sur clic exterieur (voir plus bas)
      // remplace l'ancien mecanisme base sur blur + delai de 150ms.
      item.addEventListener('click', () => {
        onSelectionner(resultat);
        masquer();
      });
      conteneur.appendChild(item);
    }
    conteneur.hidden = false;
  }

  async function rechercher(query) {
    try {
      const res = await apiFetch(`/api/valeurs/recherche?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;

      afficher(await res.json());
    } catch (error) {
      console.error('Erreur recherche valeur:', error);
    }
  }

  const inputEl = document.getElementById(inputId);
  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();

    clearTimeout(timeout);
    if (query.length < 2) {
      masquer();
      return;
    }

    timeout = setTimeout(() => rechercher(query), 300);
  });

  document.addEventListener('click', (e) => {
    const conteneur = document.getElementById(resultatsId);
    if (!conteneur.hidden && e.target !== inputEl && !conteneur.contains(e.target)) {
      masquer();
    }
  });

  return { masquer };
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
    const body = { ticker, type, nom };
    if (section) {
      body.sectionId = section.id;
    }

    const res = await apiFetch('/api/valeurs', {
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

    if (sectionCiblePartage && sectionCiblePartage.id === sectionId) {
      sectionCiblePartage.partagee = partages.length > 0;
    }

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

// ========================================
// PORTEFEUILLES (reconstitution du portefeuille reel : quantite detenue +
// prix de revient par valeur, distinct de la liste "Valeurs suivies" qui ne
// suit qu'un cours sans quantite/cout). Onglet separe (voir tab-bar), un
// seul portefeuille "actif" affiche a la fois (portefeuilleSelectionneId).
// ========================================

function portefeuilleActif() {
  const store = Alpine.store('portfolio');
  return store.portefeuilles.find((p) => p.id === store.portefeuilleSelectionneId) || null;
}

function latenteEur(position) {
  return (position.cours - position.prixRevient) * position.quantite;
}

function latentePct(position) {
  return position.prixRevient ? ((position.cours - position.prixRevient) / position.prixRevient) * 100 : 0;
}

function totalValeurPortefeuille() {
  return Alpine.store('portfolio').portefeuillePositions.reduce((acc, p) => acc + p.cours * p.quantite, 0);
}

function totalCoutPortefeuille() {
  return Alpine.store('portfolio').portefeuillePositions.reduce((acc, p) => acc + p.prixRevient * p.quantite, 0);
}

function totalLatenteEur() {
  return totalValeurPortefeuille() - totalCoutPortefeuille();
}

function totalLatentePct() {
  const cout = totalCoutPortefeuille();
  return cout ? (totalLatenteEur() / cout) * 100 : 0;
}

async function chargerPortefeuilles() {
  try {
    const res = await apiFetch('/api/portefeuilles');
    if (!res.ok) throw new Error('Erreur chargement des portefeuilles');

    const portefeuilles = await res.json();
    const store = Alpine.store('portfolio');
    store.portefeuilles = portefeuilles;

    if (!portefeuilles.some((p) => p.id === store.portefeuilleSelectionneId)) {
      store.portefeuilleSelectionneId = portefeuilles.length > 0 ? portefeuilles[0].id : null;
    }

    await chargerPositionsPortefeuille();
  } catch (error) {
    console.error('Erreur chargement portefeuilles:', error);
  }
}

async function chargerPositionsPortefeuille() {
  const store = Alpine.store('portfolio');

  if (!store.portefeuilleSelectionneId) {
    store.portefeuillePositions = [];
    return;
  }

  try {
    const res = await apiFetch(`/api/portefeuilles/${store.portefeuilleSelectionneId}/positions`);
    if (!res.ok) throw new Error('Erreur chargement des positions');

    store.portefeuillePositions = await res.json();
  } catch (error) {
    console.error('Erreur chargement positions portefeuille:', error);
  }
}

async function selectionnerPortefeuille(id) {
  Alpine.store('portfolio').portefeuilleSelectionneId = id;
  await chargerPositionsPortefeuille();
}

async function ajouterPortefeuille() {
  const nom = await showPrompt('Nom du nouveau portefeuille :');
  if (!nom || !nom.trim()) return;

  await executerAction(async () => {
    const res = await apiFetch('/api/portefeuilles', {
      method: 'POST',
      body: JSON.stringify({ nom: nom.trim() })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur creation portefeuille');
    }

    const { id } = await res.json();
    Alpine.store('portfolio').portefeuilleSelectionneId = id;
    await chargerPortefeuilles();
    showToast('Portefeuille cree', 'success');
  }, 'Erreur creation portefeuille');
}

async function renommerPortefeuille(portefeuille) {
  const nom = await showPrompt('Nouveau nom du portefeuille :', portefeuille.nom);
  if (!nom || !nom.trim() || nom.trim() === portefeuille.nom) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/portefeuilles/${portefeuille.id}`, {
      method: 'PUT',
      body: JSON.stringify({ nom: nom.trim() })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur renommage portefeuille');
    }

    await chargerPortefeuilles();
    showToast('Portefeuille renomme', 'success');
  }, 'Erreur renommage portefeuille');
}

async function supprimerPortefeuille(portefeuille) {
  const ok = await showConfirm(
    `Supprimer le portefeuille "${portefeuille.nom}" et toutes ses valeurs ?`,
    'Supprimer le portefeuille'
  );
  if (!ok) return;

  await executerAction(async () => {
    const res = await apiFetch(`/api/portefeuilles/${portefeuille.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression portefeuille');

    const store = Alpine.store('portfolio');
    if (store.portefeuilleSelectionneId === portefeuille.id) {
      store.portefeuilleSelectionneId = null;
    }
    await chargerPortefeuilles();
    showToast('Portefeuille supprime', 'success');
  }, 'Erreur suppression portefeuille');
}

function ouvrirAjoutPosition() {
  if (!Alpine.store('portfolio').portefeuilleSelectionneId) return;

  document.getElementById('inputTickerPosition').value = '';
  document.getElementById('inputNomPosition').value = '';
  document.getElementById('inputQuantitePosition').value = '';
  document.getElementById('inputPrixRevientPosition').value = '';
  rechercheTickerPosition.masquer();
  openModal('modalAddPosition');
}

async function ajouterPosition() {
  const ticker = document.getElementById('inputTickerPosition').value.trim().toUpperCase();
  const type = document.getElementById('selectTypePosition').value;
  const nom = document.getElementById('inputNomPosition').value.trim();
  const quantite = parseFloat(document.getElementById('inputQuantitePosition').value);
  const prixRevient = parseFloat(document.getElementById('inputPrixRevientPosition').value);

  if (!ticker) {
    showToast('Ticker requis', 'warning');
    return;
  }
  if (!(quantite > 0)) {
    showToast('Quantite requise', 'warning');
    return;
  }
  if (!(prixRevient >= 0)) {
    showToast('Prix de revient requis', 'warning');
    return;
  }

  await executerAction(async () => {
    const portefeuilleId = Alpine.store('portfolio').portefeuilleSelectionneId;

    const res = await apiFetch(`/api/portefeuilles/${portefeuilleId}/positions`, {
      method: 'POST',
      body: JSON.stringify({ ticker, type, nom, quantite, prixRevient })
    });

    if (res.status === 409) {
      const data = await res.json();
      showToast(data.error || 'Cette valeur est deja dans ce portefeuille', 'warning');
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur ajout de la valeur');
    }

    await chargerPositionsPortefeuille();
    showToast(`${ticker} ajoute au portefeuille`, 'success');
    closeAllModals();
  }, 'Erreur ajout de la valeur');
}

async function supprimerPosition(position) {
  const ok = await showConfirm(`Supprimer ${position.ticker} de ce portefeuille ?`, 'Supprimer la valeur');
  if (!ok) return;

  await executerAction(async () => {
    const portefeuilleId = Alpine.store('portfolio').portefeuilleSelectionneId;
    const res = await apiFetch(`/api/portefeuilles/${portefeuilleId}/positions/${position.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression valeur');

    await chargerPositionsPortefeuille();
    showToast(`${position.ticker} supprime`, 'success');
  }, 'Erreur suppression valeur');
}

// Glisser-depose des positions d'un portefeuille (reordonnancement au sein
// du seul portefeuille actif, meme demande utilisateur que pour les
// valeurs suivies - voir DESIGN.md § Portefeuilles). Contrairement aux
// valeurs suivies, il n'y a jamais deux listes de positions visibles en
// meme temps (un seul portefeuille actif a la fois, voir § selecteur de
// portefeuilles) : pas de glisser-depose entre portefeuilles, seulement un
// reordonnancement au sein de la liste affichee - initSortableListeValeurs()
// (groupe cross-listes) n'est donc pas reutilisable ici, meme squelette
// simple que initSortableSections().
function initSortablePositions(el) {
  if (!marquerSortableInit(el)) return;

  Sortable.create(el, {
    handle: '.portefeuille-position-drag-handle',
    draggable: '.portefeuille-position-card',
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: () => {
      const idsOrdonnes = Array.from(el.querySelectorAll(':scope > .portefeuille-position-card')).map((node) =>
        Number(node.dataset.positionId)
      );

      const positionsParId = new Map(Alpine.store('portfolio').portefeuillePositions.map((p) => [p.id, p]));
      idsOrdonnes.forEach((id, index) => {
        const position = positionsParId.get(id);
        if (position) position.ordre = index;
      });

      persisterOrdrePositions(idsOrdonnes);
    }
  });
}

async function persisterOrdrePositions(positionIds) {
  try {
    const portefeuilleId = Alpine.store('portfolio').portefeuilleSelectionneId;
    const res = await apiFetch(`/api/portefeuilles/${portefeuilleId}/positions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ positionIds })
    });

    if (!res.ok) throw new Error('Erreur enregistrement ordre');
  } catch (error) {
    console.error('Erreur enregistrement ordre positions:', error);
    showToast('Erreur lors de l\'enregistrement de l\'ordre', 'error');
  }
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
  return executerAction(async () => {
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
    return true;
  }, 'Erreur creation alerte');
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
  pincementPointers.clear();
  pincementDistancePrecedente = null;
  if (pincementRafId !== null) {
    cancelAnimationFrame(pincementRafId);
    pincementRafId = null;
  }
  document.getElementById('graphiqueWrapper').classList.toggle('alertable', alertable);

  openModal('modalGraphique');
  document.getElementById('graphiqueTitre').textContent = `Graphique - ${nom || ticker}`;

  // Toujours la periode memorisee, quelle que soit l'orientation (retour
  // utilisateur explicite : la periode ne doit plus jamais etre forcee sur
  // Max en paysage, voir onOrientationChange/DESIGN.md § Canal de
  // regression en orientation paysage - l'ancien comportement forcait Max
  // a chaque rotation et obligeait a re-choisir sa periode au retour en
  // portrait).
  await selectionnerPeriode(ticker, dernierePeriodeGraphique, false);

  document.querySelectorAll('.btn-periode').forEach((btn) => {
    btn.onclick = () => selectionnerPeriode(ticker, btn.dataset.period, true);
  });
}

// `persister` controle si ce choix devient la nouvelle periode par defaut a
// la prochaine ouverture (clic manuel sur un bouton, voir setupEventListeners
// via openGraphique) ou reste un rechargement ponctuel qui ne doit pas
// ecraser la preference deja memorisee dans localStorage (rechargement sur
// rotation d'ecran - voir onOrientationChange, qui recharge toujours la
// meme periode que celle deja affichee).
async function selectionnerPeriode(ticker, period, persister) {
  document.querySelectorAll('.btn-periode').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  if (persister) {
    dernierePeriodeGraphique = period;
    localStorage.setItem('graphique_periode', period);
  }
  await chargerGraphique(ticker, period);
}

// Recharge le graphique a chaque rotation d'ecran (meme periode qu'avant,
// jamais forcee sur Max - voir openGraphique/DESIGN.md § Canal de
// regression en orientation paysage) : necessaire pour faire apparaitre/
// disparaitre le canal de regression (calcule uniquement en paysage, voir
// chargerGraphique) et pour que Chart.js redimensionne ses canvas apres le
// reflow CSS de la rotation. Ne s'applique que si le graphique est
// actuellement ouvert.
function onOrientationChange() {
  if (!graphiqueState.ticker || !document.getElementById('modalGraphique').classList.contains('active')) return;
  selectionnerPeriode(graphiqueState.ticker, dernierePeriodeGraphique, false);
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

// ========================================
// ZOOM PAR PINCEMENT SUR LE GRAPHIQUE (mode paysage)
// ========================================

// Pincement a deux doigts sur le graphique, uniquement en orientation
// paysage (demande explicite utilisateur) : contrairement a un premier
// essai qui ne faisait que sauter d'une periode preetablie a l'autre
// (1J/1S/1M/1A/Max), ce mecanisme decoupe la periode actuellement
// chargee (`graphiqueDonneesCompletes`) a une fenetre continue et
// arbitraire de points (`plageVisible`) - ex. "aujourd'hui a 17 jours en
// arriere" a l'interieur d'un mois charge, sans alignement sur un preset
// (demande explicite utilisateur, correctif suite a une premiere
// interpretation erronee). Le zoom reste borne aux points deja recuperes
// pour la periode courante (jamais de nouvel appel reseau pendant le
// geste) : voir un point plus loin dans le temps que la periode chargee
// necessite de choisir un bouton de periode plus large, qui est aussi le
// seul moyen de "reinitialiser" une plage obtenue par pincement (demande
// explicite utilisateur) - un clic sur un bouton de periode recharge
// toujours l'integralite de cette periode (`chargerGraphique()`) et
// reinitialise `plageVisible` en consequence. N'intervient jamais
// pendant le mode placement d'une alerte (glisser-deposer a un seul
// doigt deja actif sur le meme conteneur) ni pendant un tap/glisser a un
// seul doigt normal (infobulle du graphique, geree nativement par
// Chart.js) - seul un geste a deux pointeurs simultanes declenche ce
// mecanisme.
const MIN_POINTS_VISIBLE = 5;

let pincementPointers = new Map();
let pincementDistancePrecedente = null;
let pincementRafId = null;
// Rectangle du canvas, capture une seule fois au debut du geste (quand le
// deuxieme pointeur rejoint) plutot que recalcule a chaque pointermove -
// meme raisonnement que `dragRect` (mode placement d'une alerte,
// `alerteOnPointerDown`) : `getBoundingClientRect()` force un recalcul de
// layout, couteux repete sur tout un geste de pincement.
let pincementRect = null;

function pointsPincement() {
  return [...pincementPointers.values()];
}

function distancePincement() {
  const [p1, p2] = pointsPincement();
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function centreXPincement() {
  const [p1, p2] = pointsPincement();
  return (p1.x + p2.x) / 2;
}

function pincementOnPointerDown(e) {
  if (!mqPaysage.matches || placementAlerteActif) return;

  pincementPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pincementPointers.size === 2) {
    pincementDistancePrecedente = distancePincement();
    const canvas = document.getElementById('chartCanvas');
    pincementRect = canvas ? canvas.getBoundingClientRect() : null;
  }
}

function pincementOnPointerMove(e) {
  if (!pincementPointers.has(e.pointerId)) return;
  pincementPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pincementPointers.size !== 2 || !pincementDistancePrecedente) return;

  const distance = distancePincement();
  const ratio = distance / pincementDistancePrecedente;
  pincementDistancePrecedente = distance;

  appliquerPincement(centreXPincement(), ratio);
}

function pincementOnPointerFin(e) {
  pincementPointers.delete(e.pointerId);
  if (pincementPointers.size < 2) {
    pincementDistancePrecedente = null;
    pincementRect = null;
  }
}

// Deplace/retrecit-elargit `plageVisible` (indices dans
// `graphiqueDonneesCompletes`) autour du point du graphique situe sous le
// centre du pincement, pour que ce point reste visuellement stable
// pendant le geste (meme principe qu'un pincement sur une carte/image).
// `ratio` > 1 (doigts qui s'ecartent) = zoom avant = moins de points
// visibles ; `ratio` < 1 (doigts qui se rapprochent) = zoom arriere =
// plus de points visibles, jusqu'a la totalite de la periode chargee.
function appliquerPincement(centreClientX, ratio) {
  if (!graphiqueDonneesCompletes || !chartInstance || !chartInstance.chartArea) return;
  if (!Number.isFinite(ratio) || ratio <= 0) return;

  const total = graphiqueDonneesCompletes.labels.length;
  const { debut, fin } = plageVisible;
  const nombreVisibleActuel = fin - debut + 1;

  if (!pincementRect) return;
  const { left, right } = chartInstance.chartArea;
  const positionRelative = Math.max(0, Math.min(1, (centreClientX - pincementRect.left - left) / (right - left)));

  const ancre = debut + positionRelative * (nombreVisibleActuel - 1);

  let nouveauNombreVisible = Math.round(nombreVisibleActuel / ratio);
  nouveauNombreVisible = Math.max(MIN_POINTS_VISIBLE, Math.min(total, nouveauNombreVisible));

  let nouveauDebut = Math.round(ancre - positionRelative * (nouveauNombreVisible - 1));
  nouveauDebut = Math.max(0, Math.min(total - nouveauNombreVisible, nouveauDebut));
  const nouveauFin = nouveauDebut + nouveauNombreVisible - 1;

  if (nouveauDebut === debut && nouveauFin === fin) return;

  plageVisible = { debut: nouveauDebut, fin: nouveauFin };
  demanderRedessinZoom();
}

// requestAnimationFrame plutot qu'un redessin synchrone a chaque
// pointermove : un pincement peut declencher plus d'evenements que de
// frames rendues, `redessinerPlageVisible()` ne prend donc en compte que
// la derniere `plageVisible` calculee par frame plutot que de redessiner
// (destroy/update Chart.js) une fois par evenement.
function demanderRedessinZoom() {
  if (pincementRafId !== null) return;
  pincementRafId = requestAnimationFrame(() => {
    pincementRafId = null;
    redessinerPlageVisible();
  });
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

// Format court jj/mm/aa (demande explicite utilisateur : moins encombrant
// sur l'axe des abscisses du graphique que le nom du mois, qui reste ecrit
// en toutes lettres pour la plupart des mois avec le style 'short' de
// l'Intl francais, ex. "3 janvier"/"15 septembre").
const JOURS_SEMAINE_ABREGES = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function formatDateCourte(date) {
  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const annee = String(date.getFullYear()).slice(-2);
  return `${jour}/${mois}/${annee}`;
}

function formatDateJourMois(date) {
  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  return `${jour}/${mois}`;
}

function formatDateJourSemaine(date) {
  const jour = String(date.getDate()).padStart(2, '0');
  return `${JOURS_SEMAINE_ABREGES[date.getDay()]} ${jour}`;
}

function formatGraphiqueLabel(dateStr, period) {
  const date = new Date(dateStr);

  if (period === '1D') {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  if (period === '1W') {
    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${formatDateJourSemaine(date)} ${heure}`;
  }

  if (period === '1M') {
    return formatDateJourMois(date);
  }

  return formatDateCourte(date);
}

// Canal de regression lineaire (droite des moindres carres + bandes a 1 et
// 2 ecarts-types de ses residus), voir DESIGN.md § Canal de regression en
// orientation paysage. `prices` indexes servent d'axe X (espacement
// temporel irregulier ignore, comme le reste du graphique qui affiche deja
// des points a intervalle regulier sur l'axe des labels) - ecart-type de
// population (division par n, pas n-2) : usage descriptif/visuel, pas une
// inference statistique necessitant un correctif de degres de liberte.
function calculerCanalRegression(prices) {
  const n = prices.length;
  if (n < 2) return null;

  let sommeX = 0;
  let sommeY = 0;
  let sommeXY = 0;
  let sommeXX = 0;
  for (let i = 0; i < n; i++) {
    sommeX += i;
    sommeY += prices[i];
    sommeXY += i * prices[i];
    sommeXX += i * i;
  }

  const pente = (n * sommeXY - sommeX * sommeY) / (n * sommeXX - sommeX * sommeX);
  const origine = (sommeY - pente * sommeX) / n;

  const moyenne = prices.map((_, i) => pente * i + origine);
  const variance = prices.reduce((acc, prix, i) => acc + (prix - moyenne[i]) ** 2, 0) / n;
  const ecartType = Math.sqrt(variance);

  return {
    moyenne,
    plus1: moyenne.map((v) => v + ecartType),
    plus2: moyenne.map((v) => v + 2 * ecartType),
    moins1: moyenne.map((v) => v - ecartType),
    moins2: moyenne.map((v) => v - 2 * ecartType)
  };
}

// Donnees completes de la periode actuellement chargee (toute la reponse
// de GET /api/chart/:ticker, avant tout pincement) et fenetre actuellement
// affichee (indices dans ces tableaux) - voir la section ZOOM PAR
// PINCEMENT ci-dessus. Reinitialisees a chaque chargerGraphique() (donc a
// chaque clic sur un bouton de periode, chaque ouverture, chaque
// basculement d'orientation), jamais mutees par le pincement lui-meme (qui
// ne fait que faire varier `plageVisible`).
let graphiqueDonneesCompletes = null;
let plageVisible = { debut: 0, fin: 0 };

// Taux de plus/moins-value sur la periode de graphique actuellement chargee
// (bouton 1J/1S/1M/1A/Max), du premier au dernier point exploitable de
// `prices` - jamais recalcule pendant un pincement (voir § ZOOM PAR
// PINCEMENT ci-dessus) : reste rattache a la periode selectionnee, pas a la
// fenetre visible momentanement obtenue par zoom, coherent avec le fait que
// les boutons de periode restent le seul moyen de "reinitialiser" un zoom.
function calculerVariationPeriode(prices) {
  const valeursValides = prices.filter((p) => p !== null && p !== undefined);
  if (valeursValides.length < 2) return null;

  const depart = valeursValides[0];
  const arrivee = valeursValides[valeursValides.length - 1];
  const eur = arrivee - depart;
  const pct = depart ? (eur / depart) * 100 : 0;

  return { eur, pct };
}

function afficherVariationPeriode(prices) {
  const el = document.getElementById('graphiquePeriodeVariation');
  const variation = calculerVariationPeriode(prices);

  if (!variation) {
    el.hidden = true;
    return;
  }

  el.hidden = false;
  el.className = 'graphique-periode-variation ' + (variation.eur >= 0 ? 'success' : 'danger');
  el.textContent = `Sur la periode : ${formatSigneCours(variation.eur)} (${formatVariation(variation.pct)})`;
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
    const volumes = data.map((d) => d.volume || 0);
    const previousClose = result.previousClose;

    afficherVariationPeriode(prices);

    const themeSombre = getTheme() === 'dark';
    const couleurTexte = themeSombre ? '#9aa0a6' : '#5f6368';
    const couleurGrille = themeSombre ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    // Canal de regression en orientation paysage (session 2026-08-04,
    // demande explicite utilisateur, voir DESIGN.md § Canal de regression
    // en orientation paysage). Calcule une seule fois sur l'integralite de
    // la periode chargee : un pincement ne fait ensuite que fenetrer
    // (`trancheGraphique()`) ce resultat deja calcule, jamais le
    // recalculer sur la seule plage visible - la droite/les bandes
    // restent donc stables pendant le geste de zoom, comme sur un
    // graphique TradingView.
    const canal = mqPaysage.matches ? calculerCanalRegression(prices) : null;

    graphiqueDonneesCompletes = {
      ticker,
      labels,
      prices,
      volumes,
      volumeColors: calculerCouleursVolume(prices, themeSombre),
      previousClose,
      canal,
      themeSombre,
      couleurTexte,
      couleurGrille
    };
    plageVisible = { debut: 0, fin: labels.length - 1 };

    construireGraphiques();
  } catch (error) {
    console.error('Erreur chargement graphique:', error);
    graphiqueDonneesCompletes = null;
    plageVisible = { debut: 0, fin: 0 };
    document.getElementById('graphiquePeriodeVariation').hidden = true;
    container.innerHTML = `
      <div class="empty-state-small">
        <p>Erreur chargement des donnees</p>
        <small>${error.message}</small>
      </div>
    `;
    if (volumeChartInstance) {
      volumeChartInstance.destroy();
      volumeChartInstance = null;
    }
    reinitialiserCanvasVolume();
  }
}

// Extrait de `graphiqueDonneesCompletes` la fenetre actuellement designee
// par `plageVisible` (integralite de la periode chargee au premier
// affichage, sous-plage arbitraire apres un pincement) - memes tableaux
// alignes par indice, tronques ensemble.
function trancheGraphique() {
  const { debut, fin } = plageVisible;
  const c = graphiqueDonneesCompletes;
  const tranche = (tab) => tab.slice(debut, fin + 1);

  return {
    labels: tranche(c.labels),
    prices: tranche(c.prices),
    volumes: tranche(c.volumes),
    volumeColors: tranche(c.volumeColors),
    previousClose: c.previousClose,
    canal: c.canal && {
      plus2: tranche(c.canal.plus2),
      plus1: tranche(c.canal.plus1),
      moyenne: tranche(c.canal.moyenne),
      moins1: tranche(c.canal.moins1),
      moins2: tranche(c.canal.moins2)
    }
  };
}

// Datasets Chart.js du graphique de cours a partir d'une tranche deja
// decoupee (`trancheGraphique()`) - utilise a la fois par
// `construireGraphiques()` (chargement initial/changement de periode) et
// `redessinerPlageVisible()` (pincement), pour ne jamais dupliquer l'ordre
// des datasets (prix, cloture veille optionnelle, canal optionnel) entre
// les deux.
function construireDatasetsPrix(ticker, tranche, themeSombre, couleurTexte) {
  const datasets = [
    {
      label: ticker,
      data: tranche.prices,
      borderColor: '#c9a227',
      backgroundColor: 'rgba(201, 162, 39, 0.12)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.1
    }
  ];

  // Ligne de reference "cloture veille" (session 2026-07-28, demande
  // explicite utilisateur) : simple dataset Chart.js horizontal plutot
  // qu'un overlay DOM positionne manuellement (comme .alerte-existante-ligne)
  // - une valeur constante sur toute la periode n'a pas besoin de gestion de
  // hors-limite, Chart.js elargit deja l'echelle Y pour l'inclure. Absente
  // (previousClose null) si Yahoo Finance ne fournit aucune cloture
  // precedente (ex. valeur recemment cotee) - pas de valeur inventee, voir
  // BUSINESS_RULES.md § Integrite des cours.
  if (tranche.previousClose) {
    datasets.push({
      label: 'Cloture veille',
      reference: true,
      data: tranche.prices.map(() => tranche.previousClose),
      borderColor: couleurTexte,
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0
    });
  }

  if (tranche.canal) {
    const couleurHaute = themeSombre ? '#5fbb7a' : '#34a853';
    const couleurBasse = themeSombre ? '#f2685c' : '#ea4335';
    const datasetCanal = (valeurs, libelle, couleur, pointille) => ({
      label: libelle,
      canalLibelle: libelle,
      data: valeurs,
      borderColor: couleur,
      borderWidth: pointille ? 1 : 1.5,
      borderDash: pointille ? [6, 3] : [],
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0
    });
    datasets.push(
      datasetCanal(tranche.canal.plus2, '+2 ecarts-type', couleurHaute, true),
      datasetCanal(tranche.canal.plus1, '+1 ecart-type', couleurHaute, true),
      datasetCanal(tranche.canal.moyenne, 'Moyenne', couleurTexte, false),
      datasetCanal(tranche.canal.moins1, '-1 ecart-type', couleurBasse, true),
      datasetCanal(tranche.canal.moins2, '-2 ecarts-type', couleurBasse, true)
    );
  }

  return datasets;
}

// (Re)construit entierement les deux instances Chart.js (destroy + new
// Chart) a partir de `graphiqueDonneesCompletes`/`plageVisible` - appele
// au chargement initial et a chaque changement de periode
// (`chargerGraphique()`). Le pincement n'appelle jamais cette fonction
// (voir `redessinerPlageVisible()` plus bas) : reconstruire les deux
// graphiques a chaque evenement pointermove serait couteux et saccade,
// alors qu'un simple changement des donnees d'un dataset existant
// (`chartInstance.update()`) suffit a faire varier la fenetre affichee.
function construireGraphiques() {
  const container = document.getElementById('graphiqueContainer');
  const { ticker, themeSombre, couleurTexte, couleurGrille } = graphiqueDonneesCompletes;
  const tranche = trancheGraphique();

  container.innerHTML = '<canvas id="chartCanvas"></canvas>';
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Remise a zero avant chaque chargement : une valeur a 4 chiffres ne doit
  // pas laisser une largeur d'axe surdimensionnee a la prochaine ouverture
  // d'une valeur a 2 chiffres (voir alignerLargeurAxeY).
  largeurAxeYGraphique = 0;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: tranche.labels,
      datasets: construireDatasetsPrix(ticker, tranche, themeSombre, couleurTexte)
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
              const valeur = `${context.parsed.y.toFixed(2)} EUR`;
              if (context.dataset.reference) return `Cloture veille: ${valeur}`;
              if (context.dataset.canalLibelle) return `${context.dataset.canalLibelle}: ${valeur}`;
              return valeur;
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
          },
          // Largeur partagee avec le graphique de volume (chargerGraphiqueVolume,
          // Chart.js separe avec ses propres libelles) plutot que la largeur
          // auto-calculee a partir des seuls libelles de CET axe, sinon les deux
          // graphiques desalignent leurs barres/courbe (voir alignerLargeurAxeY).
          afterFit: alignerLargeurAxeY
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  chargerGraphiqueVolume(tranche.labels, tranche.volumes, tranche.volumeColors, couleurTexte);

  // Deuxieme passe de layout sur les DEUX graphiques : la largeur d'axe Y
  // partagee (largeurAxeYGraphique) n'est connue definitivement qu'une fois
  // les deux graphiques construits (le plus large des deux impose sa
  // largeur a l'autre, voir alignerLargeurAxeY) - sans cette deuxieme
  // passe, celui construit en premier resterait sur sa propre largeur
  // naturelle si le second s'avere plus large (ex. libelles de volume
  // "12.3M" plus larges que des libelles de prix courts).
  chartInstance.update('none');
  volumeChartInstance.update('none');

  afficherAlertesGraphique(ticker);

  // Evenement generique plutot qu'une branche if (placementAlerteActif)
  // codee en dur ici : construireGraphiques() est le constructeur
  // generique du graphique, partage par les valeurs et les indices, et
  // n'a pas besoin de connaitre la fonctionnalite aval "alerte depuis le
  // graphique" (voir CLAUDE.md Historique des revues, Revue n°4). Le seul
  // abonne aujourd'hui est repositionnerPlacementApresChargement() (voir
  // setupEventListeners). Pas emis par redessinerPlageVisible() (zoom) :
  // le pincement est desactive pendant le mode placement (voir
  // pincementOnPointerDown), ce reevenement ne le concerne donc jamais.
  document.getElementById('graphiqueContainer').dispatchEvent(new CustomEvent('chart:loaded'));
}

// Fait varier la fenetre affichee (`plageVisible`) sans reconstruire les
// instances Chart.js : mutation des donnees des datasets existants puis
// `update('none')`, appele par `demanderRedessinZoom()` (pincement,
// throttle par requestAnimationFrame). Beaucoup plus fluide qu'un
// destroy/new Chart a chaque frame, seul le nombre de points affiches
// change (jamais la composition des datasets - presence de la cloture
// veille/du canal deja fixee par construireGraphiques()).
function redessinerPlageVisible() {
  if (!chartInstance || !volumeChartInstance || !graphiqueDonneesCompletes) return;

  const { ticker, themeSombre, couleurTexte } = graphiqueDonneesCompletes;
  const tranche = trancheGraphique();

  chartInstance.data.labels = tranche.labels;
  chartInstance.data.datasets = construireDatasetsPrix(ticker, tranche, themeSombre, couleurTexte);
  chartInstance.update('none');

  volumeChartInstance.data.labels = tranche.labels;
  volumeChartInstance.data.datasets[0].data = tranche.volumes;
  volumeChartInstance.data.datasets[0].backgroundColor = tranche.volumeColors;
  volumeChartInstance.update('none');

  afficherAlertesGraphique(ticker);
}

function reinitialiserCanvasVolume() {
  document.getElementById('graphiqueVolumeContainer').innerHTML = '<canvas id="volumeCanvas"></canvas>';
}

// Couleur de chaque barre de volume (--success/--danger selon que le cours
// du point est en hausse ou en baisse par rapport au point precedent,
// meme convention que .valeur-variation/.stat-variation ; premier point
// sans reference en gris neutre). Calculee une seule fois sur
// l'integralite des prix de la periode chargee (jamais recalculee sur la
// seule plage visible) : sinon, le premier point visible d'une fenetre
// obtenue par pincement redeviendrait a tort gris neutre a chaque zoom,
// alors qu'il a bien un point precedent reel dans la periode chargee -
// seulement hors de la fenetre actuellement affichee.
function calculerCouleursVolume(prices, themeSombre) {
  const couleurNeutre = themeSombre ? 'rgba(154, 160, 166, 0.5)' : 'rgba(95, 99, 104, 0.4)';
  const couleurHausse = themeSombre ? 'rgba(95, 187, 122, 0.6)' : 'rgba(52, 168, 83, 0.6)';
  const couleurBaisse = themeSombre ? 'rgba(242, 104, 92, 0.6)' : 'rgba(234, 67, 53, 0.6)';

  return prices.map((prix, i) => {
    if (i === 0) return couleurNeutre;
    return prix >= prices[i - 1] ? couleurHausse : couleurBaisse;
  });
}

// Graphique en barres du volume echange, sous le graphique de cours
// (session 2026-07-27, demande explicite utilisateur). Un graphique
// Chart.js separe (pas un axe secondaire du graphique de cours) pour
// rester independant de son echelle Y, avec ses propres ticks compacts
// (formatVolume). `couleurs` deja calculees par `calculerCouleursVolume()`
// (voir ci-dessus pour la raison de ne pas les recalculer ici a partir des
// seuls prix visibles).
function chargerGraphiqueVolume(labels, volumes, couleurs, couleurTexte) {
  reinitialiserCanvasVolume();
  const ctx = document.getElementById('volumeCanvas').getContext('2d');

  if (volumeChartInstance) {
    volumeChartInstance.destroy();
  }

  volumeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Volume',
          data: volumes,
          backgroundColor: couleurs,
          categoryPercentage: 0.9,
          barPercentage: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `Volume: ${formatVolume(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: { display: false },
        y: {
          display: true,
          grid: { display: false },
          ticks: {
            color: couleurTexte,
            maxTicksLimit: 3,
            callback(value) {
              return formatVolume(value);
            }
          },
          afterFit: alignerLargeurAxeY
        }
      }
    }
  });
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
    chargerPortefeuilles();
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

  // redefinit toujours #inputNom(Position) avec le nom complet de la
  // valeur selectionnee (ecrase une eventuelle saisie manuelle prealable,
  // voir DESIGN.md § Recherche de valeur a l'ajout).
  rechercheTickerValeur = creerRechercheTicker('inputTicker', 'rechercheResultats', (resultat) => {
    document.getElementById('inputTicker').value = resultat.ticker;
    document.getElementById('inputNom').value = resultat.nom;
  });
  rechercheTickerPosition = creerRechercheTicker('inputTickerPosition', 'rechercheResultatsPosition', (resultat) => {
    document.getElementById('inputTickerPosition').value = resultat.ticker;
    document.getElementById('inputNomPosition').value = resultat.nom;
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

  // #graphiqueWrapper (pas #graphiqueContainer seul) pour couvrir aussi le
  // graphique de volume en dessous : abonnement permanent, contrairement
  // aux ecouteurs du mode placement d'alerte qui ne sont attaches que
  // pendant ce mode - le pincement doit rester utilisable des le premier
  // geste sur un graphique fraichement ouvert.
  const graphiqueWrapperEl = document.getElementById('graphiqueWrapper');
  graphiqueWrapperEl.addEventListener('pointerdown', pincementOnPointerDown);
  graphiqueWrapperEl.addEventListener('pointermove', pincementOnPointerMove);
  graphiqueWrapperEl.addEventListener('pointerup', pincementOnPointerFin);
  graphiqueWrapperEl.addEventListener('pointercancel', pincementOnPointerFin);

  mqPaysage.addEventListener('change', onOrientationChange);
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
  if (rechercheTickerValeur) rechercheTickerValeur.masquer();
  if (rechercheTickerPosition) rechercheTickerPosition.masquer();
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

// Comme formatCoursDevise(), mais garde le signe (+/-) et n'affiche jamais
// "-" pour une valeur nulle : utilise pour un ecart (+/- value latente,
// variation sur une periode), jamais pour un cours absolu.
function formatSigneCours(valeur, devise) {
  const v = valeur || 0;
  const signe = v >= 0 ? '+' : '';
  return `${signe}${v.toFixed(2)} ${devise || 'EUR'}`;
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
  if (portefeuillesPollInterval) clearInterval(portefeuillesPollInterval);
});
