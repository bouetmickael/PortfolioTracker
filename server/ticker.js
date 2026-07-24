function normalizeTicker(value) {
  return (value || '').trim().toUpperCase();
}

module.exports = { normalizeTicker };
