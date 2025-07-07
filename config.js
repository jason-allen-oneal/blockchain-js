require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  // Blockchain Configuration
  mining: {
    difficulty: parseInt(process.env.MINING_DIFFICULTY) || 4,
    reward: parseInt(process.env.MINING_REWARD) || 100,
    maxNonce: 1000000 // Prevent infinite loops
  },
  
  // Security Configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'blockchain.log'
  },
  
  // Database Configuration
  database: {
    path: process.env.DB_PATH || './data/blockchain.json'
  }
};

module.exports = config; 