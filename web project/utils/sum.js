// АЛХАМ 2: НОГООН - Дараа нь функцийг бичнэ
// АЛХАМ 5: РЕФАКТОР - Кодыг сайжруулна

/**
 * Хоёр тоог нэмнэ
 * @param {number} a - Эхний тоо
 * @param {number} b - Хоёрдугаар тоо
 * @returns {number} - Нийлбэр
 * @throws {Error} - Тоо биш өгөгдөл өгвөл
 */
function sum(a, b) {
  // Параметр шалгах
  if (arguments.length !== 2) {
    throw new Error('Хоёр параметр шаардлагатай!');
  }

  // Төрөл шалгах
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Тоо оруулах шаардлагатай!');
  }

  // NaN шалгах
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Тоо оруулах шаардлагатай!');
  }

  return a + b;
}

module.exports = sum;