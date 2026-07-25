const path = require('path');
const os = require('os');
const fs = require('fs');

function demarrerServeurDeTest(nomFichier) {
  const dbFile = path.join(os.tmpdir(), `portfolio-test-${nomFichier}-${Date.now()}-${process.pid}.db`);
  process.env.DB_PATH = dbFile;
  process.env.SESSION_SECRET = 'test-secret';

  // eslint-disable-next-line global-require
  const app = require('../../app');

  let server;
  let baseUrl;

  async function start() {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  }

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    for (const suffix of ['', '-wal', '-shm']) {
      fs.rmSync(dbFile + suffix, { force: true });
    }
  }

  function getBaseUrl() {
    return baseUrl;
  }

  return { start, stop, getBaseUrl };
}

function extraireCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  return setCookie ? setCookie.split(';')[0] : null;
}

async function creerUtilisateur(baseUrl, email, password = 'password123') {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const cookie = extraireCookie(res);
  return { res, cookie };
}

module.exports = { demarrerServeurDeTest, extraireCookie, creerUtilisateur };
