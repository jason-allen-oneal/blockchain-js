const Block = require('../block');
const logger = require('../utils/logger');

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Block', () => {
  let block;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    block = new Block({ test: 'data' }, 'prevhash');
  });
  
  describe('constructor', () => {
    test('should create a block with valid properties', () => {
      expect(block).toHaveProperty('index', 0);
      expect(block).toHaveProperty('timestamp');
      expect(block).toHaveProperty('data');
      expect(block).toHaveProperty('previousHash', 'prevhash');
      expect(block).toHaveProperty('hash');
      expect(block).toHaveProperty('nonce', 0);
    });
    
    test('should validate input data', () => {
      expect(() => new Block(null, 'prevhash')).toThrow('Invalid block data');
      expect(() => new Block(undefined, 'prevhash')).toThrow('Invalid block data');
    });
    
    test('should log block creation', () => {
      expect(logger.info).toHaveBeenCalledWith('Block created', expect.any(Object));
    });
  });
  
  describe('calculateHash', () => {
    test('should return a valid SHA256 hash', () => {
      const hash = block.calculateHash();
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    test('should return consistent hash for same data', () => {
      const hash1 = block.calculateHash();
      const hash2 = block.calculateHash();
      expect(hash1).toBe(hash2);
    });
    
    test('should return different hash when data changes', () => {
      const originalHash = block.calculateHash();
      block.data = 'different data';
      const newHash = block.calculateHash();
      expect(newHash).not.toBe(originalHash);
    });
  });
  
  describe('mine', () => {
    test('should mine block with difficulty 1', () => {
      const originalHash = block.hash;
      block.mine(1);
      expect(block.hash).toMatch(/^0/);
      expect(block.nonce).toBeGreaterThan(0);
    });
    
    test('should mine block with difficulty 2', () => {
      const originalHash = block.hash;
      block.mine(2);
      expect(block.hash).toMatch(/^00/);
      expect(block.nonce).toBeGreaterThan(0);
    });
    
    test('should throw error for invalid difficulty', () => {
      expect(() => block.mine(0)).toThrow('Difficulty must be an integer between 1 and 10');
      expect(() => block.mine(11)).toThrow('Difficulty must be an integer between 1 and 10');
      expect(() => block.mine('invalid')).toThrow('Difficulty must be an integer between 1 and 10');
    });
    
    test('should log mining progress', () => {
      block.mine(1);
      expect(logger.info).toHaveBeenCalledWith('Starting mining process', expect.any(Object));
      expect(logger.info).toHaveBeenCalledWith('Block mined successfully', expect.any(Object));
    });
  });
  
  describe('backward compatibility', () => {
    test('should support time property', () => {
      const timestamp = Date.now();
      block.time = timestamp;
      expect(block.timestamp).toBe(timestamp);
      expect(block.time).toBe(timestamp);
    });
    
    test('should support last property', () => {
      const hash = 'test-hash';
      block.last = hash;
      expect(block.previousHash).toBe(hash);
      expect(block.last).toBe(hash);
    });
    
    test('should support getHash method', () => {
      const hash = block.getHash();
      expect(hash).toBe(block.calculateHash());
    });
  });
}); 