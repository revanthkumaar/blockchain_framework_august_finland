const Blockchain = require('./blockchain')
const landRec = new Blockchain()

const blockInfo = landRec.createNewBlock(3234234,'asdasdasd','adasdasdasd');

console.log(blockInfo)
