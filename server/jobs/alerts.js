const db = require('../db');
// Reference au module (pas de destructuration de sendMail) : permet de
// remplacer mailer.sendMail par un mock en test sans dependre de l'ordre de
// chargement des modules (voir server/test/alerts-job.test.js).
const mailer = require('../mailer');
const { traiterEnParallele } = require('./parallel');

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

  const alertesEnvoyees = await traiterEnParallele(
    rows,
    async (alerte) => {
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

      if (!alerteDeclenchee) return 0;

      // Le declenchement est enregistre AVANT la tentative d'envoi d'email,
      // jamais apres : sinon un email qui echoue (SMTP mal configure, port
      // bloque, etc.) empeche indefiniment dernier_cours_alerte/
      // derniere_alerte d'etre ecrits, et donc l'alerte de jamais apparaitre
      // comme declenchee - ni dans l'app (voir DESIGN.md § Carte alerte),
      // ni par email au prochain cycle (l'ecriture n'ayant jamais eu lieu,
      // rien ne distingue plus ce cas d'un seuil non franchi). Bug reel
      // observe en production (retour utilisateur du 2026-07-27) : SMTP
      // configure mais en echec, aucune des deux notifications ne
      // s'affichait plus jamais. Voir BUSINESS_RULES.md § Alertes de seuil.
      updateAlerte.run(cours, Date.now(), alerte.id);
      console.log(`Alerte declenchee : ${alerte.ticker} ${typeAlerte} pour ${alerte.user_email}`);

      try {
        await mailer.sendMail(
          alerte.user_email,
          `Alerte ${typeAlerte} : ${alerte.ticker}`,
          `Cours actuel : ${cours.toFixed(2)} EUR (seuil : ${seuil} EUR)`
        );
      } catch (error) {
        console.error(`Erreur envoi email alerte pour ${alerte.user_email}:`, error.message);
      }

      return 1;
    },
    (alerte) => `Erreur verification alerte pour ${alerte.user_email}`
  );

  console.log(`Verification terminee : ${alertesEnvoyees} alertes declenchees`);
}

module.exports = { checkAlerts };
