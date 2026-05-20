/**
 * И-мэйл хаяг шалгах
 * @param {string} email - И-мэйл хаяг
 * @returns {boolean} - Зөв эсэх
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Утасны дугаар шалгах (Монголын формат: 8 орон)
 * @param {string} phone - Утасны дугаар
 * @returns {boolean} - Зөв эсэх
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Нууц үг шалгах (8+ тэмдэгт)
 * @param {string} password - Нууц үг
 * @returns {boolean} - Зөв эсэх
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  return password.length >= 8;
}

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword
};