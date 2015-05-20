
var express = require('express');
var tingoRest = require('../index');
var fs = require('fs');

fs.mkdirSync(__dirname + '/data');

var app = express();

app.use('/api',tingoRest(__dirname + '/data'));

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Test app listening at http://%s:%s', host, port);

});
