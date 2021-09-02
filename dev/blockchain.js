const sha256 = require('sha256')

function Blockchain(){
    this.chain = []; //to store the blocks information
    this.pendingTransactions = [];
    this.networkNodes = [];
    this.currentNodeUrl = process.argv[3];
    this.createNewBlock('0','0','0'); //genesis
}

//to create the block
Blockchain.prototype.createNewBlock = function(nonce,previousBlockHash,hash){
    const newBlock = {
        index: this.chain.length+1,
        timestamp:Date.now(),
        transactions:this.pendingTransactions,
        nonce:nonce,
        hash:hash,
        previousBlockHash:previousBlockHash
    };
    this.pendingTransactions = [];//once the block gets created delete all the pending trs
    this.chain.push(newBlock);
    return newBlock;
}

//to create a transaction
Blockchain.prototype.createNewTransaction = function(amount,sender,recipient){
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient
    };
}
//to add trs to pending transactions
Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj){
  this.pendingTransactions.push(transactionObj);
}

Blockchain.prototype.generateHash = function(previousBlockHash,currentBlockData,nonce){
  const dataString = previousBlockHash + JSON.stringify(currentBlockData) + nonce.toString();
  const hash = sha256(dataString);
    return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash,currentBlockData){
    let nonce = 0;
    let hash = this.generateHash(previousBlockHash,currentBlockData,nonce)
    //cryptographic puzzle
    while(hash.substring(0,5) != '00000'){
        nonce++;
        hash = this.generateHash(previousBlockHash, currentBlockData, nonce);
        console.log(hash);
    }
    return nonce;
 
}


module.exports = Blockchain; //give access to other files to import the constructor Blockchain