/**
 * HELPER D'APPELS API
 */

async function apiFetch(url, options = {}) {
  const opts = { method: 'GET', headers: {}, ...options };

  if (opts.body && typeof opts.body === 'string') {
    opts.headers['Content-Type'] = 'application/json';
  }

  return fetch(url, opts);
}
