const express = require("express");
const landRecBackend = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const uuid = require("uuid/v1");
const port = process.argv[2];
const rp = require("request-promise");

const nodeAddress = uuid().split("-").join("");

const landRec = new Blockchain();

landRecBackend.use(bodyParser.json());
landRecBackend.use(bodyParser.urlencoded({ extended: false }));

// get entire blockchain
landRecBackend.get("/blockchain", function (req, res) {
  res.send(landRec);
});

// create a new transaction - only for single node
landRecBackend.post("/transaction", function (req, res) {
  const newTransaction = req.body;
  const blockIndex =
    landRec.addTransactionToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

// broadcast transaction
landRecBackend.post("/transaction/broadcast", function (req, res) {
  const newTransaction = landRec.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  landRec.addTransactionToPendingTransactions(newTransaction);

  const requestPromises = [];
  landRec.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((data) => {
    res.json({ note: "Transaction created and broadcast successfully." });
  });
});

// mine a block
landRecBackend.get("/mine", function (req, res) {
  const lastBlock = landRec.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: landRec.pendingTransactions,
    index: lastBlock["index"] + 1,
  };
  const nonce = landRec.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = landRec.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );
  const newBlock = landRec.createNewBlock(nonce, previousBlockHash, blockHash);

  const requestPromises = [];
  landRec.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: { newBlock: newBlock },
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then((data) => {
      const requestOptions = {
        uri: landRec.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          recipient: nodeAddress,
        },
        json: true,
      };

      return rp(requestOptions);
    })
    .then((data) => {
      res.json({
        note: "New block mined & broadcast successfully",
        block: newBlock,
      });
    });
});

// receive new block
landRecBackend.post("/receive-new-block", function (req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = landRec.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];

  if (correctHash && correctIndex) {
    landRec.chain.push(newBlock);
    landRec.pendingTransactions = [];
    res.json({
      note: "New block received and accepted.",
      newBlock: newBlock,
    });
  } else {
    res.json({
      note: "New block rejected.",
      newBlock: newBlock,
    });
  }
});

// register a node and broadcast it the network
landRecBackend.post("/register-and-broadcast-node", function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (landRec.networkNodes.indexOf(newNodeUrl) == -1)
    landRec.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  landRec.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };

    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
    .then((data) => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...landRec.networkNodes, landRec.currentNodeUrl],
        },
        json: true,
      };

      return rp(bulkRegisterOptions);
    })
    .then((data) => {
      res.json({ note: "New node registered with network successfully." });
    });
});

// register a node with the network
landRecBackend.post("/register-node", function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = landRec.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = landRec.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode)
    landRec.networkNodes.push(newNodeUrl);
  res.json({ note: "New node registered successfully." });
});

// register multiple nodes at once
landRecBackend.post("/register-nodes-bulk", function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent =
      landRec.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = landRec.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      landRec.networkNodes.push(networkNodeUrl);
  });

  res.json({ note: "Bulk registration successful." });
});

// consensus
landRecBackend.get("/consensus", function (req, res) {
  const requestPromises = [];
  landRec.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((blockchains) => {
    const currentChainLength = landRec.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchains.forEach((blockchain) => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !landRec.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "Current chain has not been replaced.",
        chain: landRec.chain,
      });
    } else {
      landRec.chain = newLongestChain;
      landRec.pendingTransactions = newPendingTransactions;
      res.json({
        note: "This chain has been replaced.",
        chain: landRec.chain,
      });
    }
  });
});

// get block by blockHash
landRecBackend.get("/block/:blockHash", function (req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = landRec.getBlock(blockHash);
  res.json({
    block: correctBlock,
  });
});

// get transaction by transactionId
landRecBackend.get("/transaction/:transactionId", function (req, res) {
  const transactionId = req.params.transactionId;
  const trasactionData = landRec.getTransaction(transactionId);
  res.json({
    transaction: trasactionData.transaction,
    block: trasactionData.block,
  });
});

// get address by address
landRecBackend.get("/address/:address", function (req, res) {
  const address = req.params.address;
  const addressData = landRec.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

// block explorer
landRecBackend.get("/block-explorer", function (req, res) {
  res.sendFile("./block-explorer/index.html", { root: __dirname });
});

landRecBackend.listen(port, function () {
  console.log(`Listening on port ${port}...`);
});
