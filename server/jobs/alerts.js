const db = require('../db');
const { sendMail } = require('../mailer');

async function checkAlerts() {
  console.log('Demarrage verification alertes');

  // Sous-requete correlee plutot qu'une jointure sur valeurs + GROUP BY : une
  // meme valeur peut desormais etre suivie dans plusieurs sections (voir
  // BUSINESS_RULES.md § Valeurs suivies), donc une jointure sur le ticker
  // matcherait plusieurs lignes valeurs pour une seule alerte. Un GROUP BY
  // les regrouperait en un seul resultat, mais reposerait alors sur un
  // invariant non garanti par la requete elle-meme (que toutes les
  // occurrences d'un ticker partagent le meme cours) ; la sous-requete
  // exprime directement "un cours par ticker" sans en dependre.
  const rows = db
    .prepare(
      `SELECT alertes.*, users.email AS user_email,
         (SELECT valeurs.cours FROM valeurs
          WHERE valeurs.user_id = alertes.user_id AND valeurs.ticker = alertes.ticker
          LIMIT 1) AS cours
       FROM alertes
       JOIN users ON users.id = alertes.user_id
       WHERE alertes.active = 1
         AND EXISTS(SELECT 1 FROM valeurs WHERE valeurs.user_id = alertes.user_id AND valeurs.ticker = alertes.ticker)`
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
