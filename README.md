
# Blockchain-JS

A robust, production-ready JavaScript blockchain implementation with enhanced features, comprehensive testing, and a REST API.

## Features

### Core Blockchain Features
- **Proof of Work Mining**: Configurable difficulty levels with SHA256 hashing
- **Transaction Management**: Add, validate, and process transactions
- **Balance Tracking**: Calculate balances for any address
- **Chain Validation**: Verify blockchain integrity and detect tampering
- **Persistent Storage**: Save and load blockchain state to/from JSON files

### Security & Robustness
- **Input Validation**: Comprehensive validation using Joi schemas
- **Error Handling**: Graceful error handling with detailed logging
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers
- **CORS Support**: Cross-origin resource sharing configuration

### API & Integration
- **REST API**: Full REST API with Express.js
- **Health Monitoring**: Health check endpoints
- **Comprehensive Logging**: Winston-based structured logging
- **Configuration Management**: Environment-based configuration

### Development & Testing
- **Unit Tests**: Comprehensive test suite with Jest
- **Integration Tests**: API endpoint testing
- **Code Quality**: ESLint configuration
- **Development Tools**: Nodemon for development

## Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockchain-js
```

2. Install dependencies:
```bash
npm install
```

3. Run the demo:
```bash
npm start
```

4. Start the API server:
```bash
npm run dev
```

## API Endpoints

### Health & Status
- `GET /health` - Health check and blockchain status

### Blockchain Operations
- `GET /blockchain` - Get entire blockchain
- `GET /blockchain/latest` - Get latest block
- `GET /blockchain/block/:index` - Get block by index
- `POST /blockchain/block` - Add new block
- `GET /blockchain/validate` - Validate blockchain integrity

### Transaction Operations
- `POST /blockchain/transaction` - Add new transaction
- `POST /blockchain/mine` - Mine pending transactions
- `GET /blockchain/balance/:address` - Get address balance

## Usage Examples

### Basic Blockchain Operations

```javascript
const Blockchain = require('./chain');
const Block = require('./block');

// Initialize blockchain
const blockchain = new Blockchain();

// Add transactions
blockchain.addTransaction({
  from: 'Alice',
  to: 'Bob',
  amount: 50
});

// Mine pending transactions
await blockchain.minePendingTransactions('miner-address');

// Add a simple block
const newBlock = new Block('Some data');
await blockchain.addBlock(newBlock);

// Check balance
const balance = blockchain.getBalanceOfAddress('Alice');

// Validate blockchain
const isValid = blockchain.isValid();
```

### API Usage

```bash
# Add a transaction
curl -X POST http://localhost:3000/blockchain/transaction \
  -H "Content-Type: application/json" \
  -d '{"from": "Alice", "to": "Bob", "amount": 50}'

# Mine pending transactions
curl -X POST http://localhost:3000/blockchain/mine \
  -H "Content-Type: application/json" \
  -d '{"miningRewardAddress": "miner-address"}'

# Get blockchain status
curl http://localhost:3000/blockchain

# Check address balance
curl http://localhost:3000/blockchain/balance/Alice
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file:

```env
# Environment
NODE_ENV=development
PORT=3000

# Mining Configuration
MINING_DIFFICULTY=4
MINING_REWARD=100

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=blockchain.log

# Database Configuration
DB_PATH=./data/blockchain.json
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/block.test.js
```

## Project Structure

```
blockchain-js/
├── app.js                 # Demo application
├── server.js              # REST API server
├── block.js               # Block class implementation
├── chain.js               # Blockchain class implementation
├── config.js              # Configuration management
├── package.json           # Dependencies and scripts
├── README.md              # This file
├── utils/
│   ├── logger.js          # Logging configuration
│   └── validation.js      # Input validation schemas
├── tests/
│   ├── block.test.js      # Block unit tests
│   ├── blockchain.test.js # Blockchain unit tests
│   └── server.test.js     # API integration tests
└── data/                  # Blockchain storage (auto-created)
    └── blockchain.json
```

## Architecture

### Block Class
- Represents individual blocks in the blockchain
- Handles mining with configurable difficulty
- Validates block data and structure
- Provides backward compatibility methods

### Blockchain Class
- Manages the chain of blocks
- Handles transaction processing and mining
- Provides persistence and validation
- Calculates address balances

### API Server
- RESTful endpoints for all operations
- Security middleware (Helmet, CORS, Rate Limiting)
- Comprehensive error handling
- Request logging and monitoring

## Security Features

- **Input Validation**: All inputs are validated using Joi schemas
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Security Headers**: Helmet.js provides security headers
- **Error Handling**: Graceful error handling without exposing internals
- **Logging**: Comprehensive logging for security monitoring

## Performance Considerations

- **Mining Limits**: Configurable maximum nonce to prevent infinite loops
- **File I/O**: Asynchronous file operations for persistence
- **Memory Management**: Efficient data structures and cleanup
- **API Optimization**: Proper HTTP status codes and response formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Peer-to-peer networking
- [ ] Wallet implementation with digital signatures
- [ ] Smart contracts support
- [ ] WebSocket real-time updates
- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Monitoring and metrics
- [ ] Web UI dashboard
