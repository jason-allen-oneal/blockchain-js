const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

class BlockchainAPIExample {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async runExample() {
    try {
      console.log('🚀 Starting Blockchain API Example\n');

      // 1. Check health
      console.log('1. Checking API health...');
      const health = await this.client.get('/health');
      console.log(`   Status: ${health.data.status}`);
      console.log(`   Blockchain Length: ${health.data.blockchain.length}\n`);

      // 2. Add transactions
      console.log('2. Adding transactions...');
      const transactions = [
        { from: 'Alice', to: 'Bob', amount: 50 },
        { from: 'Bob', to: 'Charlie', amount: 30 },
        { from: 'Charlie', to: 'David', amount: 20 }
      ];

      for (const transaction of transactions) {
        const response = await this.client.post('/blockchain/transaction', transaction);
        console.log(`   Transaction ${response.data.transactionIndex}: ${transaction.from} → ${transaction.to} (${transaction.amount})`);
      }
      console.log('');

      // 3. Mine pending transactions
      console.log('3. Mining pending transactions...');
      const miningResponse = await this.client.post('/blockchain/mine', {
        miningRewardAddress: 'miner-address'
      });
      console.log(`   Block mined: ${miningResponse.data.block.hash.substring(0, 10)}...`);
      console.log(`   Mining reward: ${miningResponse.data.reward}\n`);

      // 4. Add a simple block
      console.log('4. Adding a simple block...');
      const blockResponse = await this.client.post('/blockchain/block', {
        data: 'This is a simple block with some data'
      });
      console.log(`   Block added: ${blockResponse.data.block.hash.substring(0, 10)}...\n`);

      // 5. Check balances
      console.log('5. Checking balances...');
      const addresses = ['Alice', 'Bob', 'Charlie', 'David', 'miner-address'];
      for (const address of addresses) {
        const balanceResponse = await this.client.get(`/blockchain/balance/${address}`);
        console.log(`   ${address}: ${balanceResponse.data.balance}`);
      }
      console.log('');

      // 6. Validate blockchain
      console.log('6. Validating blockchain...');
      const validationResponse = await this.client.get('/blockchain/validate');
      console.log(`   Is Valid: ${validationResponse.data.isValid}`);
      console.log(`   Chain Length: ${validationResponse.data.chainLength}\n`);

      // 7. Get latest block
      console.log('7. Getting latest block...');
      const latestResponse = await this.client.get('/blockchain/latest');
      console.log(`   Latest Block Index: ${latestResponse.data.index}`);
      console.log(`   Latest Block Hash: ${latestResponse.data.hash.substring(0, 10)}...\n`);

      // 8. Get block by index
      console.log('8. Getting block by index...');
      const blockByIndexResponse = await this.client.get('/blockchain/block/1');
      console.log(`   Block 1 Data: ${JSON.stringify(blockByIndexResponse.data.data).substring(0, 50)}...\n`);

      // 9. Get full blockchain
      console.log('9. Getting full blockchain...');
      const blockchainResponse = await this.client.get('/blockchain');
      console.log(`   Total Blocks: ${blockchainResponse.data.length}`);
      console.log(`   Pending Transactions: ${blockchainResponse.data.pendingTransactions}\n`);

      console.log('✅ API Example completed successfully!');

    } catch (error) {
      console.error('❌ API Example failed:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.data);
      }
      process.exit(1);
    }
  }

  async testErrorHandling() {
    console.log('\n🧪 Testing error handling...\n');

    try {
      // Test invalid transaction
      console.log('1. Testing invalid transaction...');
      await this.client.post('/blockchain/transaction', {
        from: 'Alice'
        // Missing 'to' and 'amount'
      });
    } catch (error) {
      console.log(`   Expected error: ${error.response.status} - ${error.response.data.error}`);
    }

    try {
      // Test invalid block index
      console.log('2. Testing invalid block index...');
      await this.client.get('/blockchain/block/999');
    } catch (error) {
      console.log(`   Expected error: ${error.response.status} - ${error.response.data.error}`);
    }

    try {
      // Test missing mining reward address
      console.log('3. Testing missing mining reward address...');
      await this.client.post('/blockchain/mine', {});
    } catch (error) {
      console.log(`   Expected error: ${error.response.status} - ${error.response.data.error}`);
    }

    console.log('\n✅ Error handling tests completed!');
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  const example = new BlockchainAPIExample();
  
  // Check if server is running
  example.client.get('/health')
    .then(() => {
      console.log('🌐 Blockchain API server is running\n');
      return example.runExample();
    })
    .then(() => {
      return example.testErrorHandling();
    })
    .catch((error) => {
      console.error('❌ Cannot connect to blockchain API server');
      console.error('   Make sure the server is running with: npm run server');
      console.error('   Error:', error.message);
      process.exit(1);
    });
}

module.exports = BlockchainAPIExample; 