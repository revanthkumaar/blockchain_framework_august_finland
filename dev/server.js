const express = require("express");
const landRecBackend = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const landRec = new Blockchain();
landRecBackend.use(bodyParser.json());
landRecBackend.use(bodyParser.urlencoded({ extended: false }));

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
