/**
 * APPLICATION PRINCIPALE - PORTFOLIO TRACKER
 */

const POLL_INTERVAL_MS = 30000;

let currentUser = null;
let valeursPollInterval = null;
let alertesPollInterval = null;
let chartInstance = null;

document.addEventListener('alpine:init', () => {
  Alpine.store('portfolio', {
    valeurs: [],
    sections: [],
    chargee: false,

    valeursDeSection(sectionId) {
      return this.valeurs
        .filter((v) => v.sectionId === sectionId)
        .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
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

function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  const iconMoon = document.getElementById('themeIconMoon');
  const iconSun = document.getElementById('themeIconSun');

  function appliquerIcone() {
    const theme = document.documentElement.getAttribute('data-theme');
    iconMoon.style.display = theme === 'dark' ? 'none' : 'block';
    iconSun.style.display = theme === 'dark' ? 'block' : 'none';
  }

  appliquerIcone();

  btn.addEventListener('click', () => {
    const actuel = document.documentElement.getAttribute('data-theme');
    const nouveau = actuel === 'dark' ? 'light' : 'dark';
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

  valeursPollInterval = setInterval(chargerValeurs, POLL_INTERVAL_MS);
  alertesPollInterval = setInterval(chargerAlertes, POLL_INTERVAL_MS);
}

async function chargerValeurs() {
  try {
    const [resValeurs, resSections] = await Promise.all([apiFetch('/api/valeurs'), apiFetch('/api/sections')]);
    if (!resValeurs.ok) throw new Error('Erreur chargement des valeurs');
    if (!resSections.ok) throw new Error('Erreur chargement des sections');

    const valeurs = await resValeurs.json();
    const sections = await resSections.json();

    displayValeurs(valeurs, sections);
    updateStats(valeurs);
  } catch (error) {
    console.error('Erreur chargement valeurs:', error);
  }
}

async function chargerAlertes() {
  try {
    const res = await apiFetch('/api/alertes');
    if (!res.ok) throw new Error('Erreur chargement des alertes');

    const alertes = await res.json();
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
  store.valeurs = Object.entries(valeurs).map(([ticker, valeur]) => ({ ticker, ...valeur }));
  store.sections = sections;
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

  const alertesArray = Object.entries(alertes).filter(([, a]) => a.active);

  if (alertesArray.length === 0) {
    container.innerHTML = `
      <div class="empty-state-small">
        <p>Aucune alerte active</p>
      </div>
    `;
    return;
  }

  alertesArray.forEach(([id, alerte]) => {
    const card = createAlerteCard(id, alerte);
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
    <button class="btn-icon-small" onclick="supprimerAlerte('${id}')" title="Supprimer" aria-label="Supprimer">
      <svg class="icon icon-sm"><use href="#icon-trash"></use></svg>
    </button>
  `;

  return div;
}

function updateStats(valeurs) {
  const valeursArray = Object.values(valeurs);

  const total = valeursArray.length;
  const hausse = valeursArray.filter((v) => (v.variation || 0) > 0).length;
  const baisse = valeursArray.filter((v) => (v.variation || 0) < 0).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statHausse').textContent = hausse;
  document.getElementById('statBaisse').textContent = baisse;
}

// ========================================
// ACTIONS CRUD
// ========================================

async function ajouterValeur() {
  const ticker = document.getElementById('inputTicker').value.trim().toUpperCase();
  const type = document.getElementById('selectType').value;
  const nom = document.getElementById('inputNom').value.trim();

  if (!ticker) {
    showToast('Ticker requis', 'warning');
    return;
  }

  showLoader(true);

  try {
    const res = await apiFetch('/api/valeurs', {
      method: 'POST',
      body: JSON.stringify({ ticker, type, nom })
    });

    if (res.status === 409) {
      showToast('Cette valeur est deja suivie', 'warning');
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
  } catch (error) {
    console.error('Erreur ajout valeur:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

async function supprimerValeur(ticker) {
  if (!confirm(`Supprimer ${ticker} de vos valeurs suivies ?`)) return;

  showLoader(true);

  try {
    const res = await apiFetch(`/api/valeurs/${ticker}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression valeur');

    await chargerValeurs();
    await chargerAlertes();

    showToast(`${ticker} supprime`, 'success');
  } catch (error) {
    console.error('Erreur suppression valeur:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// ========================================
// SECTIONS ET GLISSER-DEPOSER
// ========================================

async function ajouterSection() {
  const nom = prompt('Nom de la nouvelle section :');
  if (!nom || !nom.trim()) return;

  showLoader(true);

  try {
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
  } catch (error) {
    console.error('Erreur creation section:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

async function renommerSection(section) {
  const nom = prompt('Nouveau nom de la section :', section.nom);
  if (!nom || !nom.trim() || nom.trim() === section.nom) return;

  showLoader(true);

  try {
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
  } catch (error) {
    console.error('Erreur renommage section:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

async function supprimerSection(section) {
  if (!confirm(`Supprimer la section "${section.nom}" ? Les valeurs qu'elle contient seront deplacees vers une autre section.`)) return;

  showLoader(true);

  try {
    const res = await apiFetch(`/api/sections/${section.id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur suppression section');
    }

    await chargerValeurs();
    showToast('Section supprimee', 'success');
  } catch (error) {
    console.error('Erreur suppression section:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

function initSortableSections(el) {
  if (el.dataset.sortableInit) return;
  el.dataset.sortableInit = 'true';

  Sortable.create(el, {
    handle: '.valeurs-section-nom',
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

function initSortableValeurs(el) {
  if (el.dataset.sortableInit) return;
  el.dataset.sortableInit = 'true';

  Sortable.create(el, {
    group: 'valeurs',
    draggable: '.valeur-row',
    handle: '.valeur-drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      const store = Alpine.store('portfolio');
      const listesTouchees = evt.from === evt.to ? [evt.to] : [evt.from, evt.to];

      for (const liste of listesTouchees) {
        const sectionId = Number(liste.dataset.sectionId);
        const tickersOrdonnes = Array.from(liste.querySelectorAll(':scope > .valeur-row')).map(
          (node) => node.dataset.ticker
        );

        tickersOrdonnes.forEach((ticker, index) => {
          const valeur = store.valeurs.find((v) => v.ticker === ticker);
          if (valeur) {
            valeur.sectionId = sectionId;
            valeur.ordre = index;
          }
        });
      }

      persisterOrdre();
    }
  });
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
        .map((v) => v.ticker)
    }));

  try {
    const res = await apiFetch('/api/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ sections })
    });

    if (!res.ok) throw new Error('Erreur enregistrement ordre');
  } catch (error) {
    console.error('Erreur enregistrement ordre:', error);
    showToast('Erreur lors de l\'enregistrement de l\'ordre', 'error');
  }
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

  showLoader(true);

  try {
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
    closeAllModals();

    document.getElementById('inputSeuilHaut').value = '';
    document.getElementById('inputSeuilBas').value = '';
  } catch (error) {
    console.error('Erreur creation alerte:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

async function supprimerAlerte(id) {
  if (!confirm('Supprimer cette alerte ?')) return;

  showLoader(true);

  try {
    const res = await apiFetch(`/api/alertes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression alerte');

    await chargerAlertes();

    showToast('Alerte supprimee', 'success');
  } catch (error) {
    console.error('Erreur suppression alerte:', error);
    showToast('Erreur: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// ========================================
// GRAPHIQUES
// ========================================

async function openGraphique(ticker) {
  openModal('modalGraphique');
  document.getElementById('graphiqueTitre').textContent = `Graphique - ${ticker}`;

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

  try {
    const res = await apiFetch(`/api/chart/${ticker}?period=${period}`);
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

    const themeSombre = document.documentElement.getAttribute('data-theme') === 'dark';
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

  document.getElementById('addValeurBtn').addEventListener('click', () => {
    openModal('modalAddValeur');
  });

  document.getElementById('fab').addEventListener('click', () => {
    openModal('modalAddValeur');
  });
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
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}

function openAlerteModal(ticker) {
  document.getElementById('inputTickerAlerte').value = ticker;
  openModal('modalCreateAlerte');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
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
  if (!cours) return '-';
  return cours.toFixed(2) + ' EUR';
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

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
  if (valeursPollInterval) clearInterval(valeursPollInterval);
  if (alertesPollInterval) clearInterval(alertesPollInterval);
});
