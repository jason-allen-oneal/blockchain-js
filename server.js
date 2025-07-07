const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const Blockchain = require('./chain');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize blockchain
let blockchain;
try {
  blockchain = new Blockchain();
} catch (error) {
  logger.error('Failed to initialize blockchain', { error: error.message });
  process.exit(1);
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    blockchain: {
      length: blockchain.chain.length,
      isValid: blockchain.isValid(),
      difficulty: blockchain.difficulty,
      pendingTransactions: blockchain.pendingTransactions.length
    }
  });
});

// Get entire blockchain
app.get('/blockchain', async (req, res) => {
  try {
    res.json({
      chain: blockchain.chain,
      length: blockchain.chain.length,
      isValid: blockchain.isValid(),
      difficulty: blockchain.difficulty,
      pendingTransactions: blockchain.pendingTransactions.length
    });
  } catch (error) {
    logger.error('Failed to get blockchain', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve blockchain' });
  }
});

// Get latest block
app.get('/blockchain/latest', async (req, res) => {
  try {
    const latestBlock = blockchain.getLatestBlock();
    res.json(latestBlock);
  } catch (error) {
    logger.error('Failed to get latest block', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve latest block' });
  }
});

// Get block by index
app.get('/blockchain/block/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= blockchain.chain.length) {
      return res.status(400).json({ error: 'Invalid block index' });
    }
    
    const block = blockchain.chain[index];
    res.json(block);
  } catch (error) {
    logger.error('Failed to get block by index', { error: error.message, index: req.params.index });
    res.status(500).json({ error: 'Failed to retrieve block' });
  }
});

// Add new block
app.post('/blockchain/block', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Block data is required' });
    }
    
    const Block = require('./block');
    const newBlock = new Block(data);
    
    await blockchain.addBlock(newBlock);
    
    res.status(201).json({
      message: 'Block added successfully',
      block: newBlock
    });
  } catch (error) {
    logger.error('Failed to add block', { error: error.message, data: req.body });
    res.status(500).json({ error: 'Failed to add block' });
  }
});

// Add transaction
app.post('/blockchain/transaction', async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    
    if (!from || !to || !amount) {
      return res.status(400).json({ error: 'from, to, and amount are required' });
    }
    
    const transaction = {
      from,
      to,
      amount: parseFloat(amount),
      timestamp: Date.now()
    };
    
    const transactionIndex = blockchain.addTransaction(transaction);
    
    res.status(201).json({
      message: 'Transaction added successfully',
      transactionIndex,
      transaction
    });
  } catch (error) {
    logger.error('Failed to add transaction', { error: error.message, transaction: req.body });
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Mine pending transactions
app.post('/blockchain/mine', async (req, res) => {
  try {
    const { miningRewardAddress } = req.body;
    
    if (!miningRewardAddress) {
      return res.status(400).json({ error: 'miningRewardAddress is required' });
    }
    
    const block = await blockchain.minePendingTransactions(miningRewardAddress);
    
    res.json({
      message: 'Block mined successfully',
      block,
      reward: blockchain.miningReward
    });
  } catch (error) {
    logger.error('Failed to mine pending transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to mine pending transactions' });
  }
});

// Get balance of address
app.get('/blockchain/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const balance = blockchain.getBalanceOfAddress(address);
    
    res.json({
      address,
      balance
    });
  } catch (error) {
    logger.error('Failed to get balance', { error: error.message, address: req.params.address });
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Validate blockchain
app.get('/blockchain/validate', async (req, res) => {
  try {
    const isValid = blockchain.isValid();
    
    res.json({
      isValid,
      chainLength: blockchain.chain.length
    });
  } catch (error) {
    logger.error('Failed to validate blockchain', { error: error.message });
    res.status(500).json({ error: 'Failed to validate blockchain' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info('Blockchain API server started', { 
    port: PORT,
    environment: config.env,
    difficulty: config.mining.difficulty
  });
});

module.exports = app; 