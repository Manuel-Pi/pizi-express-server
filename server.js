var express = require('express');
var app = express();


app.use(express.static('Apps'));

var server = app.listen(8989, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server started!', host, port);
});