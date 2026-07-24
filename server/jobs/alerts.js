const db = require('../db');
const { sendMail } = require('../mailer');

async function checkAlerts() {
  console.log('Demarrage verification alertes');

  const rows = db
    .prepare(
      `SELECT alertes.*, users.email AS user_email, valeurs.cours AS cours
       FROM alertes
       JOIN users ON users.id = alertes.user_id
       JOIN valeurs ON valeurs.user_id = alertes.user_id AND valeurs.ticker = alertes.ticker
       WHERE alertes.active = 1`
    )
    .all();

  const updateAlerte = db.prepare(
    'UPDATE alertes SET dernier_cours_alerte = ?, derniere_alerte = ? WHERE id = ?'
  );

  let alertesEnvoyees = 0;

  for (const alerte of rows) {
    const cours = alerte.cours;
    let alerteDeclenchee = false;
    let typeAlerte = '';
    let seuil = 0;

    if (alerte.seuil_haut && cours >= alerte.seuil_haut) {
      if (!alerte.dernier_cours_alerte || alerte.dernier_cours_alerte < alerte.seuil_haut) {
        alerteDeclenchee = true;
        typeAlerte = 'HAUTE';
        seuil = alerte.seuil_haut;
      }
    }

    if (alerte.seuil_bas && cours <= alerte.seuil_bas) {
      if (!alerte.dernier_cours_alerte || alerte.dernier_cours_alerte > alerte.seuil_bas) {
        alerteDeclenchee = true;
        typeAlerte = 'BASSE';
        seuil = alerte.seuil_bas;
      }
    }

    if (alerteDeclenchee) {
      try {
        await sendMail(
          alerte.user_email,
          `Alerte ${typeAlerte} : ${alerte.ticker}`,
          `Cours actuel : ${cours.toFixed(2)} EUR (seuil : ${seuil} EUR)`
        );

        updateAlerte.run(cours, Date.now(), alerte.id);
        alertesEnvoyees++;
        console.log(`Alerte envoyee : ${alerte.ticker} ${typeAlerte} pour ${alerte.user_email}`);
      } catch (error) {
        console.error(`Erreur envoi alerte pour ${alerte.user_email}:`, error.message);
      }
    }
  }

  console.log(`Verification terminee : ${alertesEnvoyees} alertes envoyees`);
}

module.exports = { checkAlerts };
