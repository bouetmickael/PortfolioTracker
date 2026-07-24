/**
 * GESTION AUTHENTIFICATION
 */

// ========================================
// CONNEXION EMAIL / MOT DE PASSE
// ========================================

document.getElementById('emailSignInForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

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

    window.location.href = '/';
  } catch (error) {
    console.error('Erreur connexion:', error);
    alert('Erreur : ' + error.message);
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
