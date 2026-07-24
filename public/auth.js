/**
 * GESTION AUTHENTIFICATION
 */

// ========================================
// CONNEXION GOOGLE
// ========================================

document.getElementById('googleSignIn')?.addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    await auth.signInWithPopup(provider);
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    alert('Erreur de connexion : ' + error.message);
  }
});

// ========================================
// CONNEXION EMAIL / MOT DE PASSE
// ========================================

document.getElementById('emailSignInForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
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
    await auth.createUserWithEmailAndPassword(email, password);
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
    await auth.signOut();
    window.location.href = '/login.html';
  }
};

// ========================================
// PROTECTION DES PAGES
// ========================================

auth.onAuthStateChanged((user) => {
  const isLoginPage = window.location.pathname.includes('login.html');

  if (!user && !isLoginPage) {
    window.location.href = '/login.html';
  } else if (user && isLoginPage) {
    window.location.href = '/';
  }
});
