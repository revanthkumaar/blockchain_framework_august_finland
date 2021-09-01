const Blockchain = require('./blockchain')
const landRec = new Blockchain()

//const blockInfo = landRec.createNewBlock(3234234,'asdasdasd','adasdasdasd');


const previousBlockHash = 'asdae32addf2radasda';
const currentBlockData = {
    "sender":"revanth",
    "receipeint":"kumar",
    "amount": 13e123
}

const nonce = landRec.proofOfWork(previousBlockHash, currentBlockData);
console.log(nonce)
