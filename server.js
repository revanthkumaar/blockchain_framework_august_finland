const express = require('express')
const landRecBackend = express()

landRecBackend.get('/home',function(req,res){
    res.send('this is home page');
})

landRecBackend.get("/blockchain", function (req, res) {
  res.send("blockchain end point");
});

landRecBackend.listen(3000)