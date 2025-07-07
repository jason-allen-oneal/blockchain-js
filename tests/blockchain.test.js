const Blockchain = require('../chain');
const Block = require('../block');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('fs').promises;
jest.mock('../config', () => ({
  mining: {
    difficulty: 2,
    reward: 100,
    maxNonce: 1000000
  },
  database: {
    path: './data/blockchain.json'
  }
}));

describe('Blockchain', () => {
  let blockchain;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock fs.promises methods
    fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));
    fs.writeFile = jest.fn().mockResolvedValue();
    fs.mkdir = jest.fn().mockResolvedValue();
    
    blockchain = new Blockchain();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  describe('constructor', () => {
    test('should initialize blockchain with default values', () => {
      expect(blockchain.chain).toHaveLength(1); // Genesis block
      expect(blockchain.difficulty).toBe(2);
      expect(blockchain.miningReward).toBe(100);
      expect(blockchain.pendingTransactions).toEqual([]);
    });
    
    test('should create genesis block', () => {
      const genesisBlock = blockchain.chain[0];
      expect(genesisBlock.index).toBe(0);
      expect(genesisBlock.data).toBe('Genesis block');
      expect(genesisBlock.previousHash).toBe('0');
    });
  });
  
  describe('addBlock', () => {
    test('should add valid block to chain', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      const addedBlock = await blockchain.addBlock(newBlock);
      
      expect(blockchain.chain).toHaveLength(2);
      expect(addedBlock.index).toBe(1);
      expect(addedBlock.previousHash).toBe(blockchain.chain[0].hash);
      expect(addedBlock.hash).toMatch(/^00/); // Difficulty 2
    });
    
    test('should throw error for invalid block', async () => {
      const invalidBlock = { data: 'invalid' };
      await expect(blockchain.addBlock(invalidBlock)).rejects.toThrow();
    });
    
    test('should save to file after adding block', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      await blockchain.addBlock(newBlock);
      
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
  
  describe('addTransaction', () => {
    test('should add valid transaction', () => {
      const transaction = {
        from: 'Alice',
        to: 'Bob',
        amount: 50
      };
      
      const index = blockchain.addTransaction(transaction);
      expect(blockchain.pendingTransactions).toHaveLength(1);
      expect(index).toBe(1);
    });
    
    test('should throw error for invalid transaction', () => {
      const invalidTransaction = {
        from: 'Alice',
        // Missing 'to' and 'amount'
      };
      
      expect(() => blockchain.addTransaction(invalidTransaction)).toThrow();
    });
  });
  
  describe('minePendingTransactions', () => {
    test('should mine pending transactions', async () => {
      // Add some transactions
      blockchain.addTransaction({
        from: 'Alice',
        to: 'Bob',
        amount: 50
      });
      
      blockchain.addTransaction({
        from: 'Bob',
        to: 'Charlie',
        amount: 30
      });
      
      const minedBlock = await blockchain.minePendingTransactions('miner');
      
      expect(minedBlock.data).toHaveLength(3); // 2 transactions + mining reward
      expect(blockchain.pendingTransactions).toHaveLength(0);
      expect(blockchain.chain).toHaveLength(2);
    });
    
    test('should add mining reward transaction', async () => {
      blockchain.addTransaction({
        from: 'Alice',
        to: 'Bob',
        amount: 50
      });
      
      const minedBlock = await blockchain.minePendingTransactions('miner');
      const rewardTransaction = minedBlock.data.find(t => t.from === 'Blockchain System');
      
      expect(rewardTransaction).toBeDefined();
      expect(rewardTransaction.to).toBe('miner');
      expect(rewardTransaction.amount).toBe(100);
    });
  });
  
  describe('getBalanceOfAddress', () => {
    test('should calculate correct balance', async () => {
      // Add transactions
      blockchain.addTransaction({
        from: 'Alice',
        to: 'Bob',
        amount: 50
      });
      
      blockchain.addTransaction({
        from: 'Bob',
        to: 'Charlie',
        amount: 30
      });
      
      await blockchain.minePendingTransactions('miner');
      
      // Check balances
      expect(blockchain.getBalanceOfAddress('Alice')).toBe(-50);
      expect(blockchain.getBalanceOfAddress('Bob')).toBe(20); // 50 - 30
      expect(blockchain.getBalanceOfAddress('Charlie')).toBe(30);
      expect(blockchain.getBalanceOfAddress('miner')).toBe(100); // Mining reward
    });
    
    test('should return 0 for unknown address', () => {
      expect(blockchain.getBalanceOfAddress('unknown')).toBe(0);
    });
  });
  
  describe('isValid', () => {
    test('should return true for valid blockchain', () => {
      expect(blockchain.isValid()).toBe(true);
    });
    
    test('should return false for tampered blockchain', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      await blockchain.addBlock(newBlock);
      // Tamper with the block
      blockchain.chain[1].previousHash = 'invalidhash';
      expect(blockchain.isValid()).toBe(false);
    });
    
    test('should return false for broken chain', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      await blockchain.addBlock(newBlock);
      // Break the chain
      blockchain.chain[1].previousHash = 'invalidhash';
      expect(blockchain.isValid()).toBe(false);
    });
  });
  
  describe('persistence', () => {
    test('should load from file if exists', async () => {
      const mockData = {
        chain: [{ index: 0, data: 'Genesis', hash: 'hash1' }],
        difficulty: 3,
        miningReward: 150,
        pendingTransactions: [],
        lastSaved: Date.now()
      };
      
      fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockData));
      
      const newBlockchain = new Blockchain();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(newBlockchain.difficulty).toBe(3);
      expect(newBlockchain.miningReward).toBe(150);
    });
    
    test('should save to file', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      await blockchain.addBlock(newBlock);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"chain"')
      );
    });
  });
  
  describe('backward compatibility', () => {
    test('should support latest() method', () => {
      const latest = blockchain.latest();
      expect(latest).toBe(blockchain.getLatestBlock());
    });
    
    test('should support add() method', async () => {
      const newBlock = new Block({ test: 'data' }, blockchain.chain[blockchain.chain.length - 1].hash);
      await blockchain.add(newBlock);
      expect(blockchain.chain).toHaveLength(2);
    });
  });
}); 