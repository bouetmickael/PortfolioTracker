/**
 * GESTION AUTHENTIFICATION
 */

// ========================================
// CONNEXION EMAIL / MOT DE PASSE
// ========================================

// Garde contre le double envoi (auto-remplissage iOS + appui sur le bouton,
// double tap) : sans elle, une seconde requete encore en vol au moment de la
// redirection est annulee par le navigateur et Safari la rejette avec le
// message brut "Load failed", affiche tel quel dans une alerte alors que la
// connexion a reussi.
let connexionEnCours = false;
let redirectionEnCours = false;

document.getElementById('emailSignInForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (connexionEnCours) return;
  connexionEnCours = true;

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur de connexion');
    }

    redirectionEnCours = true;
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur connexion:', error);
    connexionEnCours = false;
    // Echec reseau (TypeError : "Load failed" sur Safari) ou requete annulee
    // par la redirection en cours : pas d'alerte brute en anglais.
    if (redirectionEnCours) return;
    alert(error instanceof TypeError ? 'Erreur : serveur injoignable, reessayez.' : 'Erreur : ' + error.message);
  }
});

// ========================================
// INSCRIPTION
// ========================================

document.getElementById('showSignUp')?.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = prompt('Email :');
  if (!email) return;

  const password = prompt('Mot de passe (minimum 6 caracteres) :');
  if (!password || password.length < 6) {
    alert('Mot de passe trop court (minimum 6 caracteres)');
    return;
  }

  try {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur inscription');
    }

    alert('Compte cree avec succes');
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur inscription:', error);
    alert('Erreur : ' + error.message);
  }
});

// ========================================
// DECONNEXION
// ========================================

window.logout = async function logout() {
  if (confirm('Se deconnecter ?')) {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  }
};

// ========================================
// PROTECTION DES PAGES
// ========================================

async function checkAuthAndRedirect() {
  const isLoginPage = window.location.pathname.includes('login.html');

  let res;
  try {
    res = await apiFetch('/api/auth/me');
  } catch (error) {
    console.error('Erreur verification session:', error);
    if (!isLoginPage) {
      window.location.href = '/login.html';
    }
    return null;
  }

  if (res.ok) {
    if (isLoginPage) {
      window.location.href = '/';
      return null;
    }
    return res.json();
  }

  if (!isLoginPage) {
    window.location.href = '/login.html';
  }
  return null;
}

if (window.location.pathname.includes('login.html')) {
  checkAuthAndRedirect();
}
