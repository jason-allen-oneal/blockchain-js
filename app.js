var Blockchain = require('./chain');
var Block = require('./block');

let testChain = new Blockchain();

console.log("Mining block...");
testChain.add(new Block("This is block 1"));

console.log("Mining block...");
testChain.add(new Block("This is block 2"));

console.log(JSON.stringify(testChain, null, 4));

console.log("Is blockchain valid? " + testChain.isValid().toString());



