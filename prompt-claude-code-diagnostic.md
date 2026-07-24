Contexte : PWA "Portfolio Tracker" (Firebase Hosting + Cloud Functions + Realtime
Database). Lis d'abord README.md puis TROUBLESHOOTING.md a la racine du depot
avant toute action : ils documentent l'architecture, l'historique des problemes
de deploiement deja rencontres (versions Node/firebase-functions, plan Blaze,
service account, cle VAPID), et une premiere liste d'hypotheses pour le bug
actuel.

Bug a diagnostiquer : les cours des valeurs suivies ne s'affichent plus dans
l'application, et une erreur apparait lors du rafraichissement.

Demarche attendue :
1. Recupere les logs des Cloud Functions planifiees (`firebase functions:log
   --only updatePrices` et `--only checkAlerts`) et identifie si elles
   s'executent et si elles remontent des erreurs.
2. Verifie si le probleme vient de la source de donnees (Yahoo Finance, non
   officielle) : erreurs HTTP, changement de format de reponse, blocage IP
   datacenter — voir TROUBLESHOOTING.md section 3.
3. Verifie les regles Realtime Database (database.rules.json) et les
   listeners cote frontend (public/app.js, fonctions setupRealtimeListeners,
   displayValeurs) au cas ou l'erreur serait cote client plutot que backend.
4. Ne modifie pas le code avant d'avoir identifie la cause reelle avec les
   logs. Une fois la cause confirmee, propose un correctif minimal et
   explique pourquoi.
5. Si la cause est effectivement Yahoo Finance qui ne repond plus de maniere
   fiable, ne patche pas au hasard : propose une migration vers une source de
   donnees stable et contractuelle (Alpha Vantage, Financial Modeling Prep,
   IEX Cloud, Twelve Data...) avec un plan clair (cle API, quotas gratuits,
   changements de code necessaires dans functions/index.js).
6. Contrainte de style a respecter dans tout code modifie ou ajoute : aucun
   emoji ni symbole special, y compris dans les commentaires, les chaines de
   caracteres, les labels et le HTML (voir le code existant pour le style a
   suivre).

Donne-moi ton diagnostic (cause identifiee, preuve dans les logs) avant
d'appliquer un correctif, sauf si le correctif est trivial et sans risque
(ex. erreur de configuration evidente).
