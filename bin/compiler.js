#!/usr/bin/env node

var compiler = require('../src'),
    esprima = require('esprima'),
    fs = require('fs'),
    mock = require('due').mock;

var readFile = mock(fs.readFile),
    writeFile = mock(fs.writeFile),
    compile = mock(compiler);


if (process.argv.length < 3)
  throw 'Expects the name of the file to process as argument'
  

function rename(name) {
  var output = name.split('.');
  output[0] += '-due';
  return output.join('.');
}

var input = process.argv[2];
var output = process.argv[3] || rename(input);

readFile(input)
.then(function(err, file) {
  if (err) throw err;

  return compile(file);
})
.then(function(err, code) {
  if (err) throw err;

  console.log(' -------- ');
  console.log(code);
  console.log(' -------- ');
  return writeFile(output, code)
})
.then(function(err) {
  if (err) throw err;

  console.log('done');
})