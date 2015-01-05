var express = require('express'),
    bodyParser = require('body-parser');

var app = express();



var labels = {
  'fs.readFile': {sync: 0, async: 1},
  'fs.readdir':  {sync: 0, async: 1},
  'fs.stat': {sync: 0, async: 1},
  'files.forEach': {sync: 1, async: 0},
  'lines.reduce': {sync: 1, async: 0},
};


app.use(express.static(__dirname + '/../pages'));
app.use(bodyParser.json());

app.get('/labels/*', function(req, res) {
  console.log('>>> * ');
  res.send(JSON.stringify(labels));
})

app.get('/labels/:labels', function(req, res) {


  var wanted = req.param('labels').split(',');

  console.log('>>> ? ' + wanted);
  // build answer
  var reply = wanted.reduce(function(reply, label) {
    reply[label] = labels[label];
    return reply;
  }, {});

  res.send(JSON.stringify(reply));
})

app.post('/labels/', function(req, res) {
  var bodyStr = '';
  req.on("data",function(chunk){
      bodyStr += chunk.toString();
  });
  req.on("end",function(){

    var body = JSON.parse(bodyStr);

    console.log('>>> ! ', body);

    for(var label in body) {
      if (body[label].isRupturePoint)
        labels[label].async += 1;
      else
        labels[label].sync += 1;
    }
  });
})






app.listen(8080);
console.log('server listening at 8080');

module.exports = app;