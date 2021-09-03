const express = require("express");
const landRecBackend = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const landRec = new Blockchain();
landRecBackend.use(bodyParser.json());
landRecBackend.use(bodyParser.urlencoded({ extended: false }));
const rp = require('request-promise')

const port = process.argv[2];

landRecBackend.get("/home", function (req, res) {
  res.send("this is home page");
});

landRecBackend.get("/blockchain", function (req, res) {
  res.send(landRec);
});

landRecBackend.post("/transaction", function (req, res) {
  const sellerName = req.body.seller;
  const receiverName = req.body.receiver;
  const assetValue = req.body.assetValue;
  const transaction = {
    sellerName: sellerName,
    receiverName: receiverName,
    assetValue: assetValue,
  };
  console.log(transaction);
  res.json({ message: "transaction is created" });
});

landRecBackend.post('register-broadcast-node',function(req,res){
  //STEP-1 register the new node address at the node where it pings first
  const newNodeUrl = req.body.newNodeurl;
  if(landRec.networkNodes.indexOf(newNodeUrl) == -1) {
    landRec.networkNodes.push(newNodeUrl);
  }

  //STEP-2 let 3002 broadcast the new node info to all the others in the network
    const regNodesPromises = [];
    landRec.networkNodes.forEach(networkNodeUrl => {
      const requestOptions = {
        url: networkNodeUrl + '/register-node',
        method:'POST',
        body:{newNodeUrl: newNodeUrl},
        json: true
      }
      regNodesPromises.push(rp(requestOptions)); //call gets triggered

    });

    //STEP-3 BULK REGISTRY OF OTHER NODES AT 3004

    Promise.all(regNodesPromises)
    .then(data => {
        const bulkRegisterOptions = {
          url: newNodeUrl + '/register-nodes-bulk',
          method:'POST',
          body: {allNetworkNodes: [...landRec.networkNodes,landRec.currentNodeUrl]},
          json: true
        };
        return rp(bulkRegisterOptions);
    })
    .then(data => {
      res.json({note: 'new node registered successfully'})
    });
})

landRecBackend.post("/register-node", function (req, res) {
  const newNodeAddress = req.body.nodeAddress;
  const nodeNotAlreadyPresent =
    landRec.networkNodes.indexOf(newNodeAddress) == -1;
  const notCurrentNode = landRec.currentNodeUrl !== newNodeAddress;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    landRec.networkNodes.push(newNodeAddress);
    res.json({ note: "new node registered successfully" });
  }
});

landRecBackend.post("/register-nodes-bulk", function (req, res) {
  const newNodeAddresses = req.body.nodeAddresses;

  newNodeAddresses.forEach((oneNodeUrl) => {
    const nodeNotAlreadyPresent =
      landRec.networkNodes.indexOf(oneNodeUrl) == -1;
    const notCurrentNode = landRec.currentNodeUrl !== oneNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
      landRec.networkNodes.push(oneNodeUrl);
    }
  });
});

landRecBackend.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
