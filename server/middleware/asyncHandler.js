// Express 4 ne transforme pas nativement une promesse rejetee par un
// handler async en reponse HTTP (contrairement a Express 5) : sans ce
// wrapper, une erreur levee (ex. contrainte SQL) dans un handler async
// laisse la requete sans reponse plutot que de remonter au middleware
// d'erreurs centralise (voir server/middleware/errorHandler.js).
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
