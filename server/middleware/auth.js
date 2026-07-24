function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  next();
}

module.exports = { requireAuth };
