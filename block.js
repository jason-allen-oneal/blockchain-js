const SHA256 = require("crypto-js/sha256");
const logger = require('./utils/logger');
const { validateBlockData, validateDifficulty } = require('./utils/validation');
const config = require('./config');

class Block {
	constructor(data, previousHash = "") {
		try {
			// Validate input data
			this.data = validateBlockData(data);
			
			this.index = 0;
			this.timestamp = Date.now();
			this.previousHash = previousHash;
			this.nonce = 0;
			this.hash = this.calculateHash();
			
			logger.info('Block created', { 
				index: this.index, 
				timestamp: this.timestamp,
				dataType: typeof this.data 
			});
		} catch (error) {
			logger.error('Failed to create block', { error: error.message, data });
			throw error;
		}
	}
	
	calculateHash() {
		try {
			const hashData = this.index + 
				this.previousHash + 
				this.timestamp + 
				JSON.stringify(this.data) + 
				this.nonce;
			return SHA256(hashData).toString();
		} catch (error) {
			logger.error('Failed to calculate hash', { error: error.message, blockIndex: this.index });
			throw error;
		}
	}
	
	mine(difficulty) {
		try {
			// Validate difficulty
			difficulty = validateDifficulty(difficulty);
			
			const target = Array(difficulty + 1).join("0");
			let attempts = 0;
			const maxAttempts = config.mining.maxNonce;
			
			logger.info('Starting mining process', { 
				difficulty, 
				target, 
				blockIndex: this.index 
			});
			
			while (this.hash.substring(0, difficulty) !== target) {
				this.nonce++;
				this.hash = this.calculateHash();
				attempts++;
				
				// Prevent infinite loops
				if (attempts > maxAttempts) {
					throw new Error(`Mining failed: exceeded maximum attempts (${maxAttempts})`);
				}
				
				// Log progress every 10000 attempts
				if (attempts % 10000 === 0) {
					logger.debug('Mining progress', { 
						attempts, 
						currentHash: this.hash.substring(0, 10) + '...',
						blockIndex: this.index 
					});
				}
			}
			
			logger.info('Block mined successfully', { 
				hash: this.hash, 
				attempts, 
				blockIndex: this.index,
				nonce: this.nonce 
			});
			
			return this.hash;
		} catch (error) {
			logger.error('Mining failed', { 
				error: error.message, 
				blockIndex: this.index,
				difficulty 
			});
			throw error;
		}
	}
	
	// Getter for backward compatibility
	get time() {
		return this.timestamp;
	}
	
	// Setter for backward compatibility
	set time(value) {
		this.timestamp = value;
	}
	
	// Getter for backward compatibility
	get last() {
		return this.previousHash;
	}
	
	// Setter for backward compatibility
	set last(value) {
		this.previousHash = value;
	}
	
	// Getter for backward compatibility
	get getHash() {
		return this.calculateHash.bind(this);
	}
}

module.exports = Block;