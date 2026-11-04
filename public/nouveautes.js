// Historique des nouveautes affiche dans la popup ouverte en touchant le
// numero de version de l'en-tete (voir DESIGN.md § Popup des nouveautes).
// Uniquement les changements visibles et parlants pour l'utilisateur, en
// quelques mots - le detail technique reste dans CHANGELOG.md. Plus recent
// en premier. Une entree par version fonctionnelle (voir CLAUDE.md).
const NOUVEAUTES = [
  { version: '1.10.23', items: ['Toucher le numero de version ouvre cette liste des nouveautes.'] },
  { version: '1.10.22', items: ['Alertes actives : le nom de la valeur s\'affiche a la place du ticker.'] },
  {
    version: '1.10.21',
    items: [
      'Alerte posable depuis le graphique d\'une position de portefeuille.',
      'Apres avoir place une alerte sur le graphique, une fenetre permet d\'ajouter une note ou le second seuil.'
    ]
  },
  { version: '1.10.20', items: ['Cloche d\'alerte de nouveau visible sur les valeurs en avant-bourse.'] },
  { version: '1.10.19', items: ['Plus de message d\'erreur parasite apres la connexion.'] },
  { version: '1.10.18', items: ['Avant-bourse : fin des cours identiques affiches avec -0.00%.'] },
  { version: '1.10.17', items: ['Les tuiles d\'indices ne debordent plus de l\'ecran en avant-bourse.'] },
  { version: '1.10.16', items: ['Graphique : message clair quand aucune donnee n\'existe pour la periode.'] },
  { version: '1.10.15', items: ['Portefeuilles : modifier une position, avec calculateur d\'achat complementaire (prix de revient moyen).'] },
  { version: '1.10.14', items: ['Emails d\'alerte : le nom de la valeur remplace le ticker dans l\'objet.'] },
  { version: '1.10.13', items: ['Portefeuilles : variation du jour du portefeuille (en euros et en %).'] },
  { version: '1.10.12', items: ['Graphique 1J : taux "Sur la periode" corrige.'] },
  { version: '1.10.10', items: ['Portefeuilles : un seul portefeuille selectionne a la fois.'] },
  { version: '1.10.9', items: ['Une alerte peut avoir une note, visible sur sa carte et dans l\'email.', 'Toucher une alerte permet de la modifier.'] },
  { version: '1.10.8', items: ['Graphique en paysage : taux "Sur la periode" plus lisible.'] },
  { version: '1.10.6', items: ['Graphique : dates de l\'axe adaptees a la periode (jour de la semaine, jj/mm...).'] },
  { version: '1.10.4', items: ['Avant-bourse : pourcentage corrige.'] },
  { version: '1.10.3', items: ['Portefeuilles : glisser-deposer pour reordonner les positions.'] },
  { version: '1.10.2', items: ['Graphique en paysage : la periode choisie est conservee a la rotation.'] },
  { version: '1.10.1', items: ['Portefeuilles : couleurs vert/rouge corrigees sur les gains et pertes.'] },
  {
    version: '1.10.0',
    items: [
      'Nouvel onglet Portefeuilles : quantites, prix de revient et plus/moins-values latentes, plusieurs portefeuilles possibles.',
      'Graphique : taux de plus/moins-value sur la periode affichee.'
    ]
  },
  { version: '1.9.20', items: ['Le bouton de partage d\'une section s\'allume quand elle est deja partagee.'] },
  { version: '1.9.19', items: ['Graphique en paysage : le pincement zoome librement sur une plage de dates.'] },
  { version: '1.9.15', items: ['Graphique en paysage : canal de regression (tendance et bandes d\'ecart).'] },
  { version: '1.9.14', items: ['Avant-bourse : le cours s\'affiche enfin pour les valeurs americaines.'] },
  { version: '1.9.13', items: ['iPhone : plus de selection de texte en touchant longuement le graphique.'] },
  { version: '1.9.12', items: ['Graphique : ligne de reference de la cloture de la veille.'] },
  { version: '1.9.10', items: ['Le graphique s\'ouvre sur la derniere periode consultee, meme apres fermeture de l\'application.'] },
  { version: '1.9.9', items: ['Cours avant-bourse sur les valeurs suivies et les indices.'] },
  { version: '1.9.8', items: ['Recherche de valeur : la liste de resultats defile correctement sur mobile.'] },
  { version: '1.9.7', items: ['Pastilles rouges pour reperer les alertes declenchees.'] },
  { version: '1.9.6', items: ['Correctif important : les alertes se declenchent de nouveau.'] },
  { version: '1.9.5', items: ['Graphique : libelles de l\'axe des cours ne sont plus tronques.'] },
  { version: '1.9.4', items: ['Chaque alerte indique quand elle s\'est declenchee ("Declenchee a hh:mm").'] },
  { version: '1.9.3', items: ['Graphique : volume echange sous la courbe.'] },
  { version: '1.9.2', items: ['Variation du jour corrigee (elle restait a +0.00%).'] },
  { version: '1.9.1', items: ['Le bouton + ne masque plus le bas de la liste.'] },
  { version: '1.8.9', items: ['Recherche de valeur : le nom propose remplace toujours le nom saisi.'] },
  { version: '1.8.8', items: ['Une meme valeur peut etre suivie dans plusieurs sections.'] },
  { version: '1.8.7', items: ['Ajout d\'une valeur : recherche par nom (ex. "Schneider") sans connaitre le ticker.'] },
  { version: '1.8.5', items: ['Le ticker est verifie a l\'ajout d\'une valeur.'] },
  { version: '1.8.4', items: ['Cartes d\'alerte plus compactes.'] },
  { version: '1.8.3', items: ['Logo de l\'application.'] },
  { version: '1.8.2', items: ['Fin du zoom involontaire de la page.'] },
  { version: '1.8.1', items: ['Liste des valeurs plus compacte : au moins 8 valeurs visibles sans defiler.'] },
  { version: '1.8.0', items: ['Les seuils d\'alerte existants sont traces sur le graphique.'] },
  { version: '1.7.0', items: ['Creer une alerte en glissant une ligne directement sur le graphique.'] },
  { version: '1.6.1', items: ['Les tuiles d\'indices ouvrent leur graphique.'] },
  { version: '1.6.0', items: ['Tuiles d\'indices en haut : SBF 120, Nasdaq-100 et S&P 500.'] },
  { version: '1.5.0', items: ['Partage d\'une section avec un autre utilisateur, en lecture seule ou en ecriture.'] },
  { version: '1.4.0', items: ['Cloche sur les valeurs qui ont une alerte active.'] },
  { version: '1.3.2', items: ['Fenetres de confirmation aux couleurs de l\'application.'] },
  { version: '1.3.1', items: ['Glisser-deposer d\'une valeur via une poignee, pour ne plus gener le defilement.'] },
  { version: '1.3.0', items: ['Nouveau look : en-tete bleu marine, accents or, icones.'] },
  { version: '1.2.0', items: ['Sections dans la liste des valeurs : creer, renommer, supprimer, reordonner par glisser-deposer.'] },
  { version: '1.1.1', items: ['Graphiques 1J et 1S : vraie courbe au lieu de deux points.'] }
];
