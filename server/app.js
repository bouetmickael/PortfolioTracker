const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const valeursRoutes = require('./routes/valeurs');
const alertesRoutes = require('./routes/alertes');
const chartRoutes = require('./routes/chart');

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.use(express.json());

app.use(
  session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/valeurs', valeursRoutes);
app.use('/api/alertes', alertesRoutes);
app.use('/api/chart', chartRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
