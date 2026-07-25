const path = require('path');
const express = require('express');
const session = require('express-session');

const { version } = require('./package.json');
const authRoutes = require('./routes/auth');
const valeursRoutes = require('./routes/valeurs');
const alertesRoutes = require('./routes/alertes');
const chartRoutes = require('./routes/chart');
const sectionsRoutes = require('./routes/sections');
const usersRoutes = require('./routes/users');
const indicesRoutes = require('./routes/indices');

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.use(express.json());

// 'auto' : le cookie est marque secure uniquement quand la requete est
// arrivee via le listener HTTPS (voir server/index.js, qui peut demarrer un
// serveur HTTP et un serveur HTTPS en parallele sur le meme port respectif).
// COOKIE_SECURE permet de forcer explicitement true/false si necessaire
// (ex. derriere un reverse proxy externe qui termine le TLS lui-meme).
let secureCookie = 'auto';
if (process.env.COOKIE_SECURE === 'true') secureCookie = true;
if (process.env.COOKIE_SECURE === 'false') secureCookie = false;

app.use(
  session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookie,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  })
);

app.get('/api/version', (req, res) => res.json({ version }));

app.use('/api/auth', authRoutes);
app.use('/api/valeurs', valeursRoutes);
app.use('/api/alertes', alertesRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/indices', indicesRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
