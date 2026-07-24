/**
 * APPLICATION PRINCIPALE - PORTFOLIO TRACKER
 */

let currentUser = null;
let valeursListener = null;
let alertesListener = null;
let chartInstance = null;

// ========================================
// INITIALISATION
// ========================================

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    initApp();
  } else {
    window.location.href = '/login.html';
  }
});

async function initApp() {
  console.log('Utilisateur connecte:', currentUser.email);

  document.getElementById('userName').textContent =
    currentUser.displayName || currentUser.email.split('@')[0];
  document.getElementById('userEmail').textContent = currentUser.email;

  await setupNotifications();
  setupRealtimeListeners();
  setupEventListeners();
  registerServiceWorker();
}

// ========================================
// NOTIFICATIONS PUSH
// ========================================

async function setupNotifications() {
  if (!messaging) {
    console.log('Notifications push non supportees sur ce navigateur');
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Permission notifications accordee');

      const token = await messaging.getToken();
      console.log('Token FCM:', token);

      await database.ref(`users/${currentUser.uid}/fcmToken`).set(token);

      messaging.onMessage((payload) => {
        console.log('Message recu:', payload);

        const { title, body } = payload.notification;
        showToast(`${title}: ${body}`, 'info');

        new Notification(title, {
          body: body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        });
      });
    } else {
      console.log('Permission notifications refusee');
    }
  } catch (error) {
    console.error('Erreur setup notifications:', error);
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
// LISTENERS TEMPS REEL FIREBASE
// ========================================

function setupRealtimeListeners() {
  const uid = currentUser.uid;

  valeursListener = database.ref(`users/${uid}/valeurs`).on('value', (snapshot) => {
    const valeurs = snapshot.val() || {};
    displayValeurs(valeurs);
    updateStats(valeurs);
  });

  alertesListener = database.ref(`users/${uid}/alertes`).on('value', (snapshot) => {
    const alertes = snapshot.val() || {};
    displayAlertes(alertes);
  });
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

function createValeurCard(ticker, valeur) {
  const div = document.createElement('div');
  div.className = 'valeur-card';

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
    <div class="valeur-header">
      <div class="valeur-info">
        <div class="valeur-ticker">${ticker}</div>
        <div class="valeur-type">${valeur.type || 'Action'}</div>
        ${valeur.nom ? `<div class="valeur-nom">${valeur.nom}</div>` : ''}
      </div>
      <div class="valeur-actions">
        <button class="btn-icon-small" onclick="openGraphique('${ticker}')" title="Graphique" aria-label="Graphique">G</button>
        <button class="btn-icon-small" onclick="openAlerteModal('${ticker}')" title="Creer alerte" aria-label="Creer alerte">A</button>
        <button class="btn-icon-small" onclick="supprimerValeur('${ticker}')" title="Supprimer" aria-label="Supprimer">X</button>
      </div>
    </div>
    <div class="valeur-body">
      <div class="valeur-cours">${formatCours(valeur.cours)}</div>
      <div class="valeur-variation ${variationClass}">
        ${variationSign}${variation.toFixed(2)}%
      </div>
    </div>
    <div class="valeur-footer">
      <small>MAJ: ${derniereMaj}</small>
      ${valeur.volume ? `<small>Vol: ${formatVolume(valeur.volume)}</small>` : ''}
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
    const uid = currentUser.uid;
    const valeurRef = database.ref(`users/${uid}/valeurs/${ticker}`);

    const snapshot = await valeurRef.once('value');
    if (snapshot.exists()) {
      showToast('Cette valeur est deja suivie', 'warning');
      showLoader(false);
      return;
    }

    await valeurRef.set({
      type: type,
      nom: nom || '',
      cours: 0,
      variation: 0,
      volume: 0,
      ajouteLe: firebase.database.ServerValue.TIMESTAMP,
      derniereMaj: null
    });

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
    const uid = currentUser.uid;
    await database.ref(`users/${uid}/valeurs/${ticker}`).remove();

    const alertesSnapshot = await database.ref(`users/${uid}/alertes`).once('value');
    const alertes = alertesSnapshot.val() || {};

    for (const [id, alerte] of Object.entries(alertes)) {
      if (alerte.ticker === ticker) {
        await database.ref(`users/${uid}/alertes/${id}`).remove();
      }
    }

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
    const uid = currentUser.uid;
    const alerteRef = database.ref(`users/${uid}/alertes`).push();

    await alerteRef.set({
      ticker: ticker,
      seuilHaut: seuilHaut || null,
      seuilBas: seuilBas || null,
      active: true,
      creeLe: firebase.database.ServerValue.TIMESTAMP,
      dernierCoursAlerte: null,
      derniereAlerte: null
    });

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
    const uid = currentUser.uid;
    await database.ref(`users/${uid}/alertes/${id}`).remove();
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

async function chargerGraphique(ticker, period) {
  const container = document.getElementById('graphiqueContainer');
  container.innerHTML = '<div class="loader-inline"><div class="spinner-small"></div></div>';

  try {
    const functionsInstance = firebase.functions();
    const getChartData = functionsInstance.httpsCallable('getChartData');

    const result = await getChartData({ ticker, period });
    const data = result.data.data;

    const labels = data.map((d) =>
      new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    );
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
  if (valeursListener) {
    database.ref(`users/${currentUser.uid}/valeurs`).off('value', valeursListener);
  }
  if (alertesListener) {
    database.ref(`users/${currentUser.uid}/alertes`).off('value', alertesListener);
  }
});
