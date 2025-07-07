const request = require('supertest');
const app = require('../server');
const Blockchain = require('../chain');

// Mock the blockchain to avoid file system operations
jest.mock('../chain', () => {
  const mockBlockchain = {
    chain: [
      {
        index: 0,
        timestamp: Date.now(),
        data: 'Genesis block',
        previousHash: '0',
        hash: 'genesis-hash',
        nonce: 0
      }
    ],
    difficulty: 2,
    pendingTransactions: [],
    miningReward: 100,
    getLatestBlock: jest.fn().mockReturnValue({
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis block',
      previousHash: '0',
      hash: 'genesis-hash',
      nonce: 0
    }),
    addBlock: jest.fn().mockResolvedValue({
      index: 1,
      timestamp: Date.now(),
      data: { test: 'data' },
      previousHash: 'prevhash',
      hash: 'new-block-hash',
      nonce: 123
    }),
    addTransaction: jest.fn().mockReturnValue(1),
    minePendingTransactions: jest.fn().mockResolvedValue({
      index: 1,
      timestamp: Date.now(),
      data: [],
      previousHash: 'genesis-hash',
      hash: 'mined-block-hash',
      nonce: 456
    }),
    getBalanceOfAddress: jest.fn().mockReturnValue(100),
    isValid: jest.fn().mockReturnValue(true)
  };
  
  return jest.fn().mockImplementation(() => mockBlockchain);
});

describe('Blockchain API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('blockchain');
      expect(response.body.blockchain).toHaveProperty('length');
      expect(response.body.blockchain).toHaveProperty('isValid');
    });
  });
  
  describe('GET /blockchain', () => {
    test('should return entire blockchain', async () => {
      const response = await request(app)
        .get('/blockchain')
        .expect(200);
      
      expect(response.body).toHaveProperty('chain');
      expect(response.body).toHaveProperty('length');
      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('pendingTransactions');
    });
  });
  
  describe('GET /blockchain/latest', () => {
    test('should return latest block', async () => {
      const response = await request(app)
        .get('/blockchain/latest')
        .expect(200);
      
      expect(response.body).toHaveProperty('index', 0);
      expect(response.body).toHaveProperty('data', 'Genesis block');
      expect(response.body).toHaveProperty('hash', 'genesis-hash');
    });
  });
  
  describe('GET /blockchain/block/:index', () => {
    test('should return block by valid index', async () => {
      const response = await request(app)
        .get('/blockchain/block/0')
        .expect(200);
      
      expect(response.body).toHaveProperty('index', 0);
      expect(response.body).toHaveProperty('data', 'Genesis block');
    });
    
    test('should return 400 for invalid index', async () => {
      await request(app)
        .get('/blockchain/block/invalid')
        .expect(400);
    });
    
    test('should return 400 for out of range index', async () => {
      await request(app)
        .get('/blockchain/block/999')
        .expect(400);
    });
  });
  
  describe('POST /blockchain/block', () => {
    test('should add new block with valid data', async () => {
      const response = await request(app)
        .post('/blockchain/block')
        .send({ data: { test: 'block data' } })
        .expect(201);
      
      expect(response.body).toHaveProperty('message', 'Block added successfully');
      expect(response.body).toHaveProperty('block');
    });
    
    test('should return 400 for missing data', async () => {
      await request(app)
        .post('/blockchain/block')
        .send({})
        .expect(400);
    });
  });
  
  describe('POST /blockchain/transaction', () => {
    test('should add transaction with valid data', async () => {
      const transaction = {
        from: 'Alice',
        to: 'Bob',
        amount: 50
      };
      
      const response = await request(app)
        .post('/blockchain/transaction')
        .send(transaction)
        .expect(201);
      
      expect(response.body).toHaveProperty('message', 'Transaction added successfully');
      expect(response.body).toHaveProperty('transactionIndex', 1);
      expect(response.body).toHaveProperty('transaction');
    });
    
    test('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/blockchain/transaction')
        .send({ from: 'Alice' })
        .expect(400);
    });
  });
  
  describe('POST /blockchain/mine', () => {
    test('should mine pending transactions', async () => {
      const response = await request(app)
        .post('/blockchain/mine')
        .send({ miningRewardAddress: 'miner-address' })
        .expect(200);
      
      expect(response.body).toHaveProperty('message', 'Block mined successfully');
      expect(response.body).toHaveProperty('block');
      expect(response.body).toHaveProperty('reward', 100);
    });
    
    test('should return 400 for missing mining reward address', async () => {
      await request(app)
        .post('/blockchain/mine')
        .send({})
        .expect(400);
    });
  });
  
  describe('GET /blockchain/balance/:address', () => {
    test('should return balance for valid address', async () => {
      const response = await request(app)
        .get('/blockchain/balance/alice-address')
        .expect(200);
      
      expect(response.body).toHaveProperty('address', 'alice-address');
      expect(response.body).toHaveProperty('balance', 100);
    });
    
    test('should return 400 for missing address', async () => {
      await request(app)
        .get('/blockchain/balance/')
        .expect(404);
    });
  });
  
  describe('GET /blockchain/validate', () => {
    test('should return validation status', async () => {
      const response = await request(app)
        .get('/blockchain/validate')
        .expect(200);
      
      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('chainLength');
    });
  });
  
  describe('Error handling', () => {
    test('should return 404 for unknown endpoint', async () => {
      await request(app)
        .get('/unknown-endpoint')
        .expect(404);
    });
    
    test('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(101).fill().map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });
}); 