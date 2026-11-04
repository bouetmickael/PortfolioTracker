const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pkg = require('../package.json');
const source = fs.readFileSync(path.join(__dirname, '../../public/nouveautes.js'), 'utf8');
const NOUVEAUTES = vm.runInNewContext(`${source}; NOUVEAUTES`);

const num = (v) => v.split('.').map(Number);
function comparer(a, b) {
  const [x, y] = [num(a), num(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

test('nouveautes : versions valides, uniques, du plus recent au plus ancien', () => {
  assert.ok(NOUVEAUTES.length > 0);
  NOUVEAUTES.forEach((n, i) => {
    assert.match(n.version, /^\d+\.\d+\.\d+$/);
    assert.ok(n.items.length > 0 && n.items.every((t) => typeof t === 'string' && t));
    if (i > 0) assert.ok(comparer(NOUVEAUTES[i - 1].version, n.version) > 0, `ordre ${n.version}`);
  });
});

test('nouveautes : la derniere entree ne depasse pas la version du package', () => {
  assert.ok(comparer(NOUVEAUTES[0].version, pkg.version) <= 0);
});
