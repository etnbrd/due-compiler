#!/usr/bin/env node

var compiler = require('../src'),
    esprima = require('esprima'),
    fs = require('fs');


if (process.argv.length < 3)
  throw 'Expects the name of the file to process as argument'
  
var filename = process.argv[2];

fs.readFile(filename, function(err, file) {
  if (err) throw err;

  var ast = esprima.parse(String(file));

  compiler(ast);
})