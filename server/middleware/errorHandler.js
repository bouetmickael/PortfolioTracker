// Filet de securite pour les erreurs non anticipees (ex. contrainte SQL
// levee dans un handler async, voir asyncHandler.js) : les erreurs
// metier attendues (ticker invalide, permissions...) restent gerees
// explicitement route par route avec leur propre code de statut, ce
// middleware ne les voit jamais. Remplace la page d'erreur HTML par
// defaut d'Express par une reponse JSON coherente avec le reste de l'API.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Erreur non geree:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Erreur interne du serveur' });
}

module.exports = { errorHandler };
