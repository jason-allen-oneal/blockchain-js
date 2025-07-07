const BlockchainCLI = require('../cli');
const Blockchain = require('../chain');
const Block = require('../block');

jest.mock('../chain');

function createMockReadline(inputs) {
  let inputIndex = 0;
  return {
    question: jest.fn((prompt, cb) => {
      // Simulate async readline
      setTimeout(() => cb(inputs[inputIndex++]), 0);
    }),
    close: jest.fn()
  };
}

describe('BlockchainCLI', () => {
  let cli;
  let mockRl;
  let mockLogger;
  let blockchainInstance;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    // Mock blockchain
    blockchainInstance = {
      chain: [{ index: 0, data: { data: 'Genesis block' }, previousHash: '0', hash: 'hash0', nonce: 0, timestamp: Date.now() }],
      difficulty: 2,
      miningReward: 100,
      pendingTransactions: [],
      isValid: jest.fn().mockReturnValue(true),
      addTransaction: jest.fn().mockReturnValue(1),
      minePendingTransactions: jest.fn().mockResolvedValue({ index: 1, hash: 'hash1', data: [], previousHash: 'hash0', nonce: 1, timestamp: Date.now() }),
      addBlock: jest.fn().mockResolvedValue({ index: 1, hash: 'hash1', data: { data: 'block' }, previousHash: 'hash0', nonce: 1, timestamp: Date.now() }),
      getLatestBlock: jest.fn().mockReturnValue({ index: 0, hash: 'hash0' }),
      getBalanceOfAddress: jest.fn().mockReturnValue(42)
    };
    Blockchain.mockImplementation(() => blockchainInstance);
  });

  test('should show blockchain status and exit', async () => {
    mockRl = createMockReadline(['1', '9']);
    cli = new BlockchainCLI({ rl: mockRl, logger: mockLogger });
    const showMenuSpy = jest.spyOn(cli, 'showMenu');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await cli.initialize();
    // Wait for async readline
    await new Promise(r => setTimeout(r, 50));
    expect(mockLogger.info).toHaveBeenCalledWith('Blockchain CLI ready');
    expect(showMenuSpy).toHaveBeenCalled();
    expect(blockchainInstance.isValid).toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  test('should add transaction and exit', async () => {
    mockRl = createMockReadline(['2', 'Alice', 'Bob', '50', '9']);
    cli = new BlockchainCLI({ rl: mockRl, logger: mockLogger });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await cli.initialize();
    await new Promise(r => setTimeout(r, 100));
    expect(blockchainInstance.addTransaction).toHaveBeenCalledWith(expect.objectContaining({ from: 'Alice', to: 'Bob', amount: 50 }));
    exitSpy.mockRestore();
  });

  test('should mine transactions and exit', async () => {
    mockRl = createMockReadline(['3', 'miner-address', '9']);
    cli = new BlockchainCLI({ rl: mockRl, logger: mockLogger });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await cli.initialize();
    await new Promise(r => setTimeout(r, 100));
    expect(blockchainInstance.minePendingTransactions).toHaveBeenCalledWith('miner-address');
    exitSpy.mockRestore();
  });

  test('should add block and exit', async () => {
    mockRl = createMockReadline(['4', 'block data', '9']);
    cli = new BlockchainCLI({ rl: mockRl, logger: mockLogger });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await cli.initialize();
    await new Promise(r => setTimeout(r, 100));
    expect(blockchainInstance.addBlock).toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  test('should check balance and exit', async () => {
    mockRl = createMockReadline(['6', 'Alice', '9']);
    cli = new BlockchainCLI({ rl: mockRl, logger: mockLogger });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await cli.initialize();
    await new Promise(r => setTimeout(r, 100));
    expect(blockchainInstance.getBalanceOfAddress).toHaveBeenCalledWith('Alice');
    exitSpy.mockRestore();
  });
}); 