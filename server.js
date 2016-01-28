#!/bin/env node
var fs = require('fs'),
    express = require('express'),
    bodyParser = require('body-parser'),
    colors = require('colors');

var app = express(),
    bkup = false,
    bkupfile = '',
    addr = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
    port = (process.env.OPENSHIFT_NODEJS_PORT || 8080).toString();



var labels = {
  'fs.readFile': {sync: 0, async: 1},
  'fs.readdir':  {sync: 0, async: 1},
  'fs.stat': {sync: 0, async: 1},
  'files.forEach': {sync: 1, async: 0},
  'lines.reduce': {sync: 1, async: 0},
};

function now() {
  return new Date(Date.now()).toLocaleString().split(' GMT')[0];
}

function pre(op) {
  return '>>> '.blue + op + ' ' + now().grey + ' ';
}


//    TERMINATOR    //

function terminator(sig){
  if (typeof sig === "string") {
    console.log(pre('-'), 'Received', sig);
    process.exit(1);
  }
  console.log(pre('-'), 'Node server stopped.');
};

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

// Removed 'SIGPIPE' from the list - bugz 852598.
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM',
].forEach(function(sig) {
    process.on(sig, function() { terminator(sig); });
});

//    BACK UP    //

setInterval(function() {
  if (bkup) return;

  bkup = true;

  var filename = 'backups/backup-' + Date.now() + '.json';
  console.log(pre('§'), 'Save labels in ' + filename.bold);

  fs.writeFile(filename, JSON.stringify(labels), function(err, result) {
    if (err) console.error(pre('/!\\'.red), err)

    if (bkupfile) fs.unlink(bkupfile, function(err) {
      if (err) console.error(pre('/!\\'.red), err)
    })

    bkupfile = filename;
    bkup = false;
  })

}, 6 * 3600000); // every 6 hour


//    APP    //

app.use(express.static('pages'));
app.use(bodyParser.json());

app.get('/labels', function(req, res) {
  console.log(pre('*'.yellow));
  res.send(JSON.stringify(labels));
})

app.get('/labels/:labels', function(req, res) {


  var wanted = req.param('labels').split(',');

  console.log(pre('<'.yellow), wanted);
  // build answer
  var reply = wanted.reduce(function(reply, label) {
    if (labels[label]) reply[label] = labels[label];
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

    console.log(pre('>'.yellow), body);

    for(var label in body) {

      labels[label] = labels[label] || {
        sync: 0,
        async: 0
      }

      console.log(labels[label]);

      if (body[label].isRupturePoint)
        labels[label].async += 1;
      else
        labels[label].sync += 1;
    }
  });
})

//    LISTEN    //

// app.listen(port, addr, function() {
//   console.log(pre('-'), 'server listening on ' + addr.bold + ':' + port.bold);  
// });

app.listen(8080);

module.exports = app;