const SHA256 = require("crypto-js/sha256");

class Block{
	constructor(data, last = ""){
		this.index = 0;
		this.time = Date.now();
		this.data = data;
		this.last = last;
		this.hash = this.getHash();
		this.nonce = 0;
	}
	
	getHash(){
		return SHA256(this.index+this.last+this.time+JSON.stringify(this.data)+this.nonce).toString();
	}
	
	mineBlock(difficulty) {
		while(this.hash.substring(0, difficulty) !== Array(difficulty+1).join("0")){
			this.nonce++;
			this.hash = this.getHash();
		}
		console.log("Block mined: "+this.hash);
	}
}
	
module.exports = Block;