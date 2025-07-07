
const logger = require('./utils/logger');
const { validateBlock, validateHash } = require('./utils/validation');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

class Blockchain {
	constructor() {
		try {
			this.chain = [];
			this.difficulty = config.mining.difficulty;
			this.pendingTransactions = [];
			this.miningReward = config.mining.reward;
			
			// Initialize blockchain
			this.initializeChain();
			
			logger.info('Blockchain initialized', { 
				difficulty: this.difficulty,
				miningReward: this.miningReward 
			});
		} catch (error) {
			logger.error('Failed to initialize blockchain', { error: error.message });
			throw error;
		}
	}
	
	async initializeChain() {
		try {
			// Try to load existing blockchain from file
			await this.loadFromFile();
			logger.info('Blockchain loaded from file', { chainLength: this.chain.length });
		} catch (error) {
			// If loading fails, create genesis block
			logger.info('Creating new blockchain with genesis block');
			this.chain = [this.createGenesisBlock()];
			await this.saveToFile();
		}
	}
	
	createGenesisBlock() {
		try {
			const genesisBlock = new Block("Genesis block", "0");
			genesisBlock.index = 0;
			genesisBlock.timestamp = Date.now();
			genesisBlock.hash = genesisBlock.calculateHash();
			
			logger.info('Genesis block created', { 
				hash: genesisBlock.hash.substring(0, 10) + '...' 
			});
			
			return genesisBlock;
		} catch (error) {
			logger.error('Failed to create genesis block', { error: error.message });
			throw error;
		}
	}
	
	getLatestBlock() {
		if (this.chain.length === 0) {
			throw new Error('Blockchain is empty');
		}
		return this.chain[this.chain.length - 1];
	}
	
	async addBlock(newBlock) {
		try {
			// Validate the new block
			validateBlock(newBlock);
			
			// Set block properties
			newBlock.previousHash = this.getLatestBlock().hash;
			newBlock.index = this.getLatestBlock().index + 1;
			
			// Mine the block
			logger.info('Mining new block', { 
				index: newBlock.index,
				difficulty: this.difficulty 
			});
			
			newBlock.mine(this.difficulty);
			
			// Add block to chain
			this.chain.push(newBlock);
			
			// Save to file
			await this.saveToFile();
			
			logger.info('Block added to blockchain', { 
				index: newBlock.index,
				hash: newBlock.hash.substring(0, 10) + '...',
				chainLength: this.chain.length 
			});
			
			return newBlock;
		} catch (error) {
			logger.error('Failed to add block', { 
				error: error.message,
				blockIndex: newBlock?.index 
			});
			throw error;
		}
	}
	
	addTransaction(transaction) {
		try {
			// Validate transaction
			const { validateTransaction } = require('./utils/validation');
			validateTransaction(transaction);
			
			this.pendingTransactions.push(transaction);
			
			logger.info('Transaction added to pending pool', { 
				from: transaction.from,
				to: transaction.to,
				amount: transaction.amount,
				pendingCount: this.pendingTransactions.length 
			});
			
			return this.pendingTransactions.length;
		} catch (error) {
			logger.error('Failed to add transaction', { error: error.message, transaction });
			throw error;
		}
	}
	
	minePendingTransactions(miningRewardAddress) {
		try {
			// Create a new block with all pending transactions
			const previousBlock = this.getLatestBlock();
			const block = new Block([...this.pendingTransactions], previousBlock.hash);
			block.index = previousBlock.index + 1;
			block.previousHash = previousBlock.hash;
			
			// Add mining reward transaction
			block.data.push({
				from: 'Blockchain System',
				to: miningRewardAddress,
				amount: this.miningReward,
				timestamp: Date.now()
			});
			
			// Add the block to the blockchain
			this.addBlock(block);
			
			// Reset pending transactions
			this.pendingTransactions = [];
			
			logger.info('Pending transactions mined', { 
				blockIndex: block.index,
				transactionsCount: block.data.length 
			});
			
			return block;
		} catch (error) {
			logger.error('Failed to mine pending transactions', { error: error.message });
			throw error;
		}
	}
	
	getBalanceOfAddress(address) {
		try {
			let balance = 0;
			
			for (const block of this.chain) {
				for (const transaction of block.data) {
					if (transaction.from === address) {
						balance -= transaction.amount;
					}
					if (transaction.to === address) {
						balance += transaction.amount;
					}
				}
			}
			
			logger.debug('Balance calculated', { address, balance });
			return balance;
		} catch (error) {
			logger.error('Failed to calculate balance', { error: error.message, address });
			throw error;
		}
	}
	
	isValid() {
		try {
			for (let i = 1; i < this.chain.length; i++) {
				const currentBlock = this.chain[i];
				const previousBlock = this.chain[i - 1];
				
				// Validate current block hash
				if (currentBlock.hash !== currentBlock.calculateHash()) {
					logger.warn('Invalid block hash detected', { 
						blockIndex: currentBlock.index,
						expectedHash: currentBlock.calculateHash(),
						actualHash: currentBlock.hash 
					});
					return false;
				}
				
				// Validate chain linkage
				if (currentBlock.previousHash !== previousBlock.hash) {
					logger.warn('Invalid chain linkage detected', { 
						blockIndex: currentBlock.index,
						expectedPreviousHash: previousBlock.hash,
						actualPreviousHash: currentBlock.previousHash 
					});
					return false;
				}
			}
			
			logger.info('Blockchain validation successful', { chainLength: this.chain.length });
			return true;
		} catch (error) {
			logger.error('Blockchain validation failed', { error: error.message });
			return false;
		}
	}
	
	async saveToFile() {
		try {
			const dataDir = path.dirname(config.database.path);
			await fs.mkdir(dataDir, { recursive: true });
			
			const blockchainData = {
				chain: this.chain,
				difficulty: this.difficulty,
				miningReward: this.miningReward,
				pendingTransactions: this.pendingTransactions,
				lastSaved: Date.now()
			};
			
			await fs.writeFile(config.database.path, JSON.stringify(blockchainData, null, 2));
			
			logger.debug('Blockchain saved to file', { 
				path: config.database.path,
				chainLength: this.chain.length 
			});
		} catch (error) {
			logger.error('Failed to save blockchain to file', { error: error.message });
			throw error;
		}
	}
	
	async loadFromFile() {
		try {
			const data = await fs.readFile(config.database.path, 'utf8');
			const blockchainData = JSON.parse(data);
			
			this.chain = blockchainData.chain;
			this.difficulty = blockchainData.difficulty || config.mining.difficulty;
			this.miningReward = blockchainData.miningReward || config.mining.reward;
			this.pendingTransactions = blockchainData.pendingTransactions || [];
			
			logger.info('Blockchain loaded from file', { 
				chainLength: this.chain.length,
				lastSaved: blockchainData.lastSaved 
			});
		} catch (error) {
			logger.warn('Failed to load blockchain from file', { error: error.message });
			throw error;
		}
	}
	
	// Backward compatibility methods
	latest() {
		return this.getLatestBlock();
	}
	
	add(newBlock) {
		return this.addBlock(newBlock);
	}
}

module.exports = Blockchain;


