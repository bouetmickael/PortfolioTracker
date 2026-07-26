// Controle d'acces aux sections partagees (section_shares) : une section est
// visible par son proprietaire (role 'proprietaire', acces total) ou par un
// utilisateur avec qui elle a ete explicitement partagee (role 'lecture' ou
// 'ecriture', voir BUSINESS_RULES.md § Partage de section).

const ROLES_VALIDES = ['lecture', 'ecriture'];

// Retourne une Map<sectionId, { role, proprietaireId }> de toutes les
// sections visibles par userId : les siennes (role 'proprietaire') et celles
// partagees avec lui. Une section deja possedee prime toujours sur un
// partage eventuel du meme id (ne devrait pas arriver, un proprietaire ne se
// partage pas sa propre section, mais reste protecteur).
function rolesSection(db, userId) {
  const acces = new Map();

  const propres = db.prepare('SELECT id, user_id FROM sections WHERE user_id = ?').all(userId);
  for (const section of propres) {
    acces.set(section.id, { role: 'proprietaire', proprietaireId: section.user_id });
  }

  const partagees = db
    .prepare(
      `SELECT s.id as id, s.user_id as proprietaireId, ss.role as role
       FROM section_shares ss
       JOIN sections s ON s.id = ss.section_id
       WHERE ss.user_id = ?`
    )
    .all(userId);
  for (const section of partagees) {
    if (!acces.has(section.id)) {
      acces.set(section.id, { role: section.role, proprietaireId: section.proprietaireId });
    }
  }

  return acces;
}

// Equivalent cible d'un seul id a rolesSection(db, userId).get(sectionId) :
// les routes /api/sections/:id/valeurs (GET/POST/DELETE) n'ont besoin que
// de l'acces a CETTE section precise, pas de la carte complete de toutes
// les sections visibles par l'utilisateur (voir CLAUDE.md Historique des
// revues, Revue n°3).
function roleSection(db, userId, sectionId) {
  const propre = db.prepare('SELECT id, user_id FROM sections WHERE id = ? AND user_id = ?').get(sectionId, userId);
  if (propre) {
    return { role: 'proprietaire', proprietaireId: propre.user_id };
  }

  const partagee = db
    .prepare(
      `SELECT s.user_id as proprietaireId, ss.role as role
       FROM section_shares ss
       JOIN sections s ON s.id = ss.section_id
       WHERE ss.section_id = ? AND ss.user_id = ?`
    )
    .get(sectionId, userId);

  return partagee ? { role: partagee.role, proprietaireId: partagee.proprietaireId } : null;
}

function peutEcrire(acces) {
  return !!acces && (acces.role === 'proprietaire' || acces.role === 'ecriture');
}

module.exports = { ROLES_VALIDES, rolesSection, roleSection, peutEcrire };
