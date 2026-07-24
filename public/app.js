/**
 * APPLICATION PRINCIPALE - PORTFOLIO TRACKER
 */

const POLL_INTERVAL_MS = 30000;

let currentUser = null;
let valeursPollInterval = null;
let alertesPollInterval = null;
let chartInstance = null;

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
  registerServiceWorker();
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
    const res = await apiFetch('/api/valeurs');
    if (!res.ok) throw new Error('Erreur chargement des valeurs');

    const valeurs = await res.json();
    displayValeurs(valeurs);
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

function displayValeurs(valeurs) {
  const container = document.getElementById('valeursListe');
  container.innerHTML = '';

  const valeursArray = Object.entries(valeurs);

  if (valeursArray.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Aucune valeur suivie</p>
        <button onclick="openModal('modalAddValeur')" class="btn btn-primary">
          Ajouter une valeur
        </button>
      </div>
    `;
    return;
  }

  valeursArray.forEach(([ticker, valeur]) => {
    const card = createValeurCard(ticker, valeur);
    container.appendChild(card);
  });
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

function createValeurCard(ticker, valeur) {
  const div = document.createElement('div');
  div.className = 'valeur-row';
  div.onclick = () => openGraphique(ticker);

  const variation = valeur.variation || 0;
  const variationClass = variation >= 0 ? 'success' : 'danger';
  const variationSign = variation >= 0 ? '+' : '';

  const derniereMaj = valeur.derniereMaj
    ? new Date(valeur.derniereMaj).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  div.innerHTML = `
    <div class="valeur-avatar" style="background: ${avatarCouleur(ticker)}">${avatarInitiales(ticker)}</div>
    <div class="valeur-main">
      <div class="valeur-ligne1">
        <span class="valeur-ticker">${ticker}</span>
        <span class="valeur-type">${valeur.type || 'Action'}</span>
      </div>
      ${valeur.nom ? `<div class="valeur-nom">${valeur.nom}</div>` : ''}
      <div class="valeur-footer">
        MAJ: ${derniereMaj}${valeur.volume ? ` &middot; Vol: ${formatVolume(valeur.volume)}` : ''}
      </div>
    </div>
    <div class="valeur-chiffres">
      <div class="valeur-cours">${formatCours(valeur.cours)}</div>
      <div class="valeur-variation ${variationClass}">${variationSign}${variation.toFixed(2)}%</div>
    </div>
    <div class="valeur-actions">
      <button class="btn-icon-small" onclick="event.stopPropagation(); openAlerteModal('${ticker}')" title="Creer alerte" aria-label="Creer alerte">A</button>
      <button class="btn-icon-small" onclick="event.stopPropagation(); supprimerValeur('${ticker}')" title="Supprimer" aria-label="Supprimer">X</button>
    </div>
  `;

  return div;
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
    <button class="btn-icon-small" onclick="supprimerAlerte('${id}')" title="Supprimer" aria-label="Supprimer">X</button>
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

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: ticker,
            data: prices,
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
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
            grid: { display: false }
          },
          y: {
            display: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
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

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
  if (valeursPollInterval) clearInterval(valeursPollInterval);
  if (alertesPollInterval) clearInterval(alertesPollInterval);
});
