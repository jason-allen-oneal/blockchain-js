const Joi = require('joi');
const logger = require('./logger');

// Validation schemas
const blockDataSchema = Joi.any().required().invalid(null);

const blockSchema = Joi.object({
  index: Joi.number().integer().min(0).required(),
  timestamp: Joi.date().required(),
  data: Joi.any().required(),
  previousHash: Joi.string().required().pattern(/^(0|[a-fA-F0-9]{1,64})$/),
  hash: Joi.string().required(),
  nonce: Joi.number().integer().min(0).required()
});

const transactionSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  amount: Joi.number().positive().required(),
  timestamp: Joi.date().default(Date.now),
  signature: Joi.string().optional()
});

// Validation functions
const validateBlockData = (data) => {
  try {
    const { error, value } = blockDataSchema.validate(data);
    if (error) {
      logger.warn('Block data validation failed', { error: error.details[0].message, data });
      throw new Error(`Invalid block data: ${error.details[0].message}`);
    }
    return value;
  } catch (error) {
    logger.error('Block data validation error', { error: error.message });
    throw error;
  }
};

const validateBlock = (block) => {
  try {
    const { error, value } = blockSchema.validate(block);
    if (error) {
      logger.warn('Block validation failed', { error: error.details[0].message, blockIndex: block.index });
      throw new Error(`Invalid block: ${error.details[0].message}`);
    }
    return value;
  } catch (error) {
    logger.error('Block validation error', { error: error.message });
    throw error;
  }
};

const validateTransaction = (transaction) => {
  try {
    const { error, value } = transactionSchema.validate(transaction);
    if (error) {
      logger.warn('Transaction validation failed', { error: error.details[0].message, transaction });
      throw new Error(`Invalid transaction: ${error.details[0].message}`);
    }
    return value;
  } catch (error) {
    logger.error('Transaction validation error', { error: error.message });
    throw error;
  }
};

const validateHash = (hash) => {
  if (!hash || typeof hash !== 'string' || hash.length !== 64) {
    throw new Error('Invalid hash format');
  }
  return hash;
};

const validateDifficulty = (difficulty) => {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    throw new Error('Difficulty must be an integer between 1 and 10');
  }
  return difficulty;
};

module.exports = {
  validateBlockData,
  validateBlock,
  validateTransaction,
  validateHash,
  validateDifficulty,
  schemas: {
    blockDataSchema,
    blockSchema,
    transactionSchema
  }
}; 