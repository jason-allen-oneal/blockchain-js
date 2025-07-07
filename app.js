
const Blockchain = require('./chain');
const Block = require('./block');
const logger = require('./utils/logger');
const config = require('./config');

async function runDemo() {
  try {
    logger.info('Starting blockchain demo');
    
    // Initialize blockchain
    const blockchain = new Blockchain();
    
    // Wait for blockchain to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add some transactions
    logger.info('Adding transactions to the blockchain');
    
    blockchain.addTransaction({
      from: 'Alice',
      to: 'Bob',
      amount: 50,
      timestamp: Date.now()
    });
    
    blockchain.addTransaction({
      from: 'Bob',
      to: 'Charlie',
      amount: 30,
      timestamp: Date.now()
    });
    
    blockchain.addTransaction({
      from: 'Charlie',
      to: 'David',
      amount: 20,
      timestamp: Date.now()
    });
    
    // Mine pending transactions
    logger.info('Mining pending transactions');
    const minedBlock = await blockchain.minePendingTransactions('miner-address');
    
    // Add a simple block
    logger.info('Adding a simple block');
    const simpleBlock = new Block("This is a simple block", blockchain.getLatestBlock().hash);
    await blockchain.addBlock(simpleBlock);
    
    // Display blockchain info
    logger.info('Blockchain demo completed', {
      chainLength: blockchain.chain.length,
      isValid: blockchain.isValid(),
      difficulty: blockchain.difficulty,
      pendingTransactions: blockchain.pendingTransactions.length
    });
    
    // Show some balances
    logger.info('Sample balances', {
      'Alice': blockchain.getBalanceOfAddress('Alice'),
      'Bob': blockchain.getBalanceOfAddress('Bob'),
      'Charlie': blockchain.getBalanceOfAddress('Charlie'),
      'David': blockchain.getBalanceOfAddress('David'),
      'miner-address': blockchain.getBalanceOfAddress('miner-address')
    });
    
    // Validate blockchain
    const isValid = blockchain.isValid();
    logger.info(`Blockchain validation: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!isValid) {
      logger.error('Blockchain validation failed!');
      process.exit(1);
    }
    
    logger.info('Demo completed successfully');
    
  } catch (error) {
    logger.error('Demo failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };



