#!/usr/bin/env node

const readline = require('readline');
const Blockchain = require('./chain');
const Block = require('./block');
const defaultLogger = require('./utils/logger');

class BlockchainCLI {
  constructor({ rl, logger } = {}) {
    this.blockchain = null;
    this.logger = logger || defaultLogger;
    this.rl = rl || readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    try {
      this.logger.info('Initializing blockchain CLI...');
      this.blockchain = new Blockchain();
      
      // Wait for blockchain to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.info('Blockchain CLI ready');
      this.showMenu();
    } catch (error) {
      this.logger.error('Failed to initialize blockchain CLI', { error: error.message });
      process.exit(1);
    }
  }

  showMenu() {
    console.log('\n=== Blockchain CLI ===');
    console.log('1. View blockchain status');
    console.log('2. Add transaction');
    console.log('3. Mine pending transactions');
    console.log('4. Add block');
    console.log('5. View block by index');
    console.log('6. Check address balance');
    console.log('7. Validate blockchain');
    console.log('8. View all blocks');
    console.log('9. Exit');
    console.log('=====================');
    
    this.rl.question('Select an option (1-9): ', (answer) => {
      this.handleMenuChoice(answer.trim());
    });
  }

  async handleMenuChoice(choice) {
    try {
      switch (choice) {
        case '1':
          await this.showBlockchainStatus();
          break;
        case '2':
          await this.addTransaction();
          break;
        case '3':
          await this.mineTransactions();
          break;
        case '4':
          await this.addBlock();
          break;
        case '5':
          await this.viewBlockByIndex();
          break;
        case '6':
          await this.checkBalance();
          break;
        case '7':
          await this.validateBlockchain();
          break;
        case '8':
          await this.viewAllBlocks();
          break;
        case '9':
          console.log('Goodbye!');
          this.rl.close();
          process.exit(0);
          break;
        default:
          console.log('Invalid option. Please try again.');
          this.showMenu();
      }
    } catch (error) {
      this.logger.error('CLI operation failed', { error: error.message });
      console.log(`Error: ${error.message}`);
      this.showMenu();
    }
  }

  async showBlockchainStatus() {
    console.log('\n=== Blockchain Status ===');
    console.log(`Chain Length: ${this.blockchain.chain.length}`);
    console.log(`Difficulty: ${this.blockchain.difficulty}`);
    console.log(`Mining Reward: ${this.blockchain.miningReward}`);
    console.log(`Pending Transactions: ${this.blockchain.pendingTransactions.length}`);
    console.log(`Is Valid: ${this.blockchain.isValid()}`);
    console.log('========================');
    this.showMenu();
  }

  async addTransaction() {
    this.rl.question('From address: ', (from) => {
      this.rl.question('To address: ', (to) => {
        this.rl.question('Amount: ', async (amount) => {
          try {
            const transaction = {
              from: from.trim(),
              to: to.trim(),
              amount: parseFloat(amount),
              timestamp: Date.now()
            };

            const index = this.blockchain.addTransaction(transaction);
            console.log(`Transaction added successfully! Index: ${index}`);
          } catch (error) {
            console.log(`Error adding transaction: ${error.message}`);
          }
          this.showMenu();
        });
      });
    });
  }

  async mineTransactions() {
    this.rl.question('Mining reward address: ', async (address) => {
      try {
        console.log('Mining pending transactions...');
        const block = await this.blockchain.minePendingTransactions(address.trim());
        console.log(`Block mined successfully! Block index: ${block.index}`);
        console.log(`Block hash: ${block.hash.substring(0, 10)}...`);
      } catch (error) {
        console.log(`Error mining transactions: ${error.message}`);
      }
      this.showMenu();
    });
  }

  async addBlock() {
    this.rl.question('Block data: ', async (data) => {
      try {
        const newBlock = new Block({ data: data.trim() }, this.blockchain.getLatestBlock().hash);
        const addedBlock = await this.blockchain.addBlock(newBlock);
        console.log(`Block added successfully! Block index: ${addedBlock.index}`);
        console.log(`Block hash: ${addedBlock.hash.substring(0, 10)}...`);
      } catch (error) {
        console.log(`Error adding block: ${error.message}`);
      }
      this.showMenu();
    });
  }

  async viewBlockByIndex() {
    this.rl.question('Block index: ', (index) => {
      try {
        const blockIndex = parseInt(index);
        if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= this.blockchain.chain.length) {
          console.log('Invalid block index');
        } else {
          const block = this.blockchain.chain[blockIndex];
          console.log('\n=== Block Details ===');
          console.log(`Index: ${block.index}`);
          console.log(`Timestamp: ${new Date(block.timestamp).toISOString()}`);
          console.log(`Data: ${JSON.stringify(block.data, null, 2)}`);
          console.log(`Previous Hash: ${block.previousHash}`);
          console.log(`Hash: ${block.hash}`);
          console.log(`Nonce: ${block.nonce}`);
          console.log('===================');
        }
      } catch (error) {
        console.log(`Error viewing block: ${error.message}`);
      }
      this.showMenu();
    });
  }

  async checkBalance() {
    this.rl.question('Address: ', (address) => {
      try {
        const balance = this.blockchain.getBalanceOfAddress(address.trim());
        console.log(`Balance for ${address.trim()}: ${balance}`);
      } catch (error) {
        console.log(`Error checking balance: ${error.message}`);
      }
      this.showMenu();
    });
  }

  async validateBlockchain() {
    try {
      const isValid = this.blockchain.isValid();
      console.log(`\nBlockchain validation: ${isValid ? 'PASSED' : 'FAILED'}`);
      if (!isValid) {
        console.log('Warning: Blockchain integrity has been compromised!');
      }
    } catch (error) {
      console.log(`Error validating blockchain: ${error.message}`);
    }
    this.showMenu();
  }

  async viewAllBlocks() {
    console.log('\n=== All Blocks ===');
    this.blockchain.chain.forEach((block, index) => {
      console.log(`\nBlock ${index}:`);
      console.log(`  Index: ${block.index}`);
      console.log(`  Timestamp: ${new Date(block.timestamp).toISOString()}`);
      console.log(`  Data: ${JSON.stringify(block.data).substring(0, 50)}...`);
      console.log(`  Hash: ${block.hash.substring(0, 10)}...`);
      console.log(`  Nonce: ${block.nonce}`);
    });
    console.log('==================');
    this.showMenu();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new BlockchainCLI();
  cli.initialize().catch(error => {
    defaultLogger.error('CLI initialization failed', { error: error.message });
    process.exit(1);
  });
}

module.exports = BlockchainCLI; 