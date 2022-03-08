const Block = require('./block');

class Blockchain{
	constructor(){
		this.chain = [this.genesis()];
		this.difficulty = 2;
	}
	
	genesis(){
		return new Block("Genesis block", "0");
	}
	
	latest(){
		return this.chain[this.chain.length - 1];
	}
	
	add(newBlock){
		newBlock.previousHash = this.latest().hash;
		newBlock.index = this.latest().index + 1;
		newBlock.mine(this.difficulty);
		this.chain.push(newBlock);
	}
	
	isValid(){
		for(let i = 1; i < this.chain.length; i++){
			const currentBlock = this.chain[i];
			const previousBlock = this.chain[i - 1];
			
			if(currentBlock.hash !== currentBlock.getHash()){
				return false;
			}
			if(currentBlock.previousHash !== previousBlock.hash){
				return false;
			}
		}
		return true;
	}
}

module.exports = Blockchain;


