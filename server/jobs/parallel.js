// Execute fn(item) pour chaque item en parallele (Promise.allSettled)
// plutot qu'en boucle sequentielle for...await : les jobs planifies
// (mise a jour des cours/indices, verification des alertes) traitaient
// jusqu'ici chaque ticker/alerte un par un, ce qui multiplie le temps
// total par le nombre d'items sans necessite - chaque item est
// independant. Voir CLAUDE.md Historique des revues (Revue n°1/n°3,
// ecarte jusqu'ici par prudence face a un eventuel rate-limiting Yahoo
// Finance, mais sans limite connue et sans impact reel pour le nombre
// reduit de tickers d'un projet personnel). fn doit renvoyer un nombre
// (compte comme "traite avec succes", ex. le nombre de lignes modifiees) ;
// une erreur individuelle est loguee sans interrompre les autres items.
async function traiterEnParallele(items, fn, erreurLabel) {
  const resultats = await Promise.allSettled(items.map((item) => fn(item)));

  let total = 0;
  resultats.forEach((resultat, index) => {
    if (resultat.status === 'fulfilled') {
      total += resultat.value || 0;
    } else {
      console.error(`${erreurLabel(items[index])}:`, resultat.reason.message);
    }
  });

  return total;
}

module.exports = { traiterEnParallele };
