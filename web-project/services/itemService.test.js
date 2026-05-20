const itemService = require('./itemService');

describe('Item Service Tests', () => {
  describe('calculateItemStats', () => {
    test('Хоосон жагсаалт', () => {
      const stats = itemService.calculateItemStats([]);
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.traded).toBe(0);
    });

    test('Идэвхтэй барааны тоо', () => {
      const items = [
        { status: 'available' },
        { status: 'available' },
        { status: 'traded' }
      ];
      const stats = itemService.calculateItemStats(items);
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.traded).toBe(1);
    });
  });

  describe('filterItemsByCategory', () => {
    const items = [
      { category: 'electronics', title: 'Phone' },
      { category: 'clothing', title: 'Shirt' },
      { category: 'electronics', title: 'Laptop' }
    ];

    test('Категориор шүүх', () => {
      const electronics = itemService.filterItemsByCategory(items, 'electronics');
      expect(electronics).toHaveLength(2);
      expect(electronics[0].category).toBe('electronics');
    });

    test('Олдохгүй категори', () => {
      const books = itemService.filterItemsByCategory(items, 'books');
      expect(books).toHaveLength(0);
    });

    test('Бүх барааг буцаах (all)', () => {
      const all = itemService.filterItemsByCategory(items, 'all');
      expect(all).toHaveLength(3);
    });
  });
});