const express = require('express')
const landRecBackend = express()

const Blockchain = require("./blockchain");
const landRec = new Blockchain();


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


});

landRecBackend.listen(3000)