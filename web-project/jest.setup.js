// Global setup that runs once before all tests
module.exports = async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  console.log('Setting up test environment...');
};
