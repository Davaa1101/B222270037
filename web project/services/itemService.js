/**
 * Барааны статистик тооцоолох
 * @param {Array} items - Барааны жагсаалт
 * @returns {Object} - Статистик
 */
function calculateItemStats(items) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  return {
    total: items.length,
    active: items.filter(item => item.status === 'available').length,
    traded: items.filter(item => item.status === 'traded').length
  };
}

/**
 * Категориор барааг шүүх
 * @param {Array} items - Барааны жагсаалт
 * @param {string} category - Категори
 * @returns {Array} - Шүүгдсэн жагсаалт
 */
function filterItemsByCategory(items, category) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  if (!category || category === 'all') {
    return items;
  }

  return items.filter(item => item.category === category);
}

module.exports = {
  calculateItemStats,
  filterItemsByCategory
};