const { validateEmail, validatePhone, validatePassword } = require('./validators');

describe('Email Validation Tests', () => {
  test('Зөв и-мэйл хаяг', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.mn')).toBe(true);
  });

  test('Буруу и-мэйл хаяг', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('Null эсвэл undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe('Phone Validation Tests', () => {
  test('Зөв утасны дугаар (8 орон)', () => {
    expect(validatePhone('99112233')).toBe(true);
    expect(validatePhone('88445566')).toBe(true);
  });

  test('Буруу утасны дугаар', () => {
    expect(validatePhone('1234')).toBe(false);
    expect(validatePhone('abcd1234')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('Password Validation Tests', () => {
  test('Зөв нууц үг (8+ тэмдэгт)', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('SecurePass!@#')).toBe(true);
  });

  test('Богино нууц үг', () => {
    expect(validatePassword('Pass1')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
  });

  test('Хоосон нууц үг', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(null)).toBe(false);
  });
});