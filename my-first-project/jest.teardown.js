const mongoose = require('mongoose');

// Global teardown that runs once after all tests
module.exports = async () => {
  // Close all mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('Test environment cleanup complete.');
};
