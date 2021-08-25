function Blockchain(){
    this.chain = []; //to store the blocks information
    this.pendingTransactions = [];
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


module.exports = Blockchain; //give access to other files to import the constructor Blockchain