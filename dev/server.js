const express = require('express')
const landRecBackend = express()
const bodyParser = require('body-parser');
const Blockchain = require("./blockchain");
const landRec = new Blockchain();
landRecBackend.use(bodyParser.json());
landRecBackend.use(bodyParser.urlencoded({ extended: false }));

const port = process.argv[2]


landRecBackend.get('/home',function(req,res){
    res.send('this is home page');
})

landRecBackend.get("/blockchain", function (req, res) {
  res.send(landRec);
});

landRecBackend.post('/transaction',function(req,res){

   const sellerName = req.body.seller;
   const receiverName = req.body.receiver;
   const assetValue = req.body.assetValue;
   const transaction = {
       sellerName: sellerName,
       receiverName: receiverName,
       assetValue: assetValue
   }
   console.log(transaction);
   res.json({"message":"transaction is created"})

});


landRecBackend.listen(port, function() {
	console.log(`Listening on port ${port}`);
});