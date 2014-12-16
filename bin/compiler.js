#!/usr/bin/env node

var compiler = require('../src'),
    readline = require('readline'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    fs = require('fs'),
    mock = require('due').mock;

var readFile = mock(fs.readFile),
    writeFile = mock(fs.writeFile),
    compile = mock(compiler);

var shortcuts = {
  'fs.readdir': true,
  'fs.stat': true,
  'fs.readFile': true,
  'files.forEach': false,
  'lines.reduce': false
}  

function rename(name) {
  var output = name.split('.');
  output[0] += '-due';
  return output.join('.');
}

function forEach(list, callback, end) {

  function next(item, index) {
    callback(item, _next(list, index));
  }

  function _next(list, index) {
    return function () {
      if (++index < list.length)
        next(list[index], index);
      else
        end()
    }
  }

  if (list.length === 0)
    return end();

  return next(list[0], 0);
}

function filterRP(err, potentialRP, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var actualRP = [];

  forEach(potentialRP, function(item, next) {

    var callee = shortcuts[escodegen.generate(item.parent.callee)];

    if (callee !== undefined) { 
      if (callee) {
        actualRP.push(item.parent);
      }    
      return next()
    } else 
      rl.question('Is the call ' + escodegen.generate(item.parent.callee) + '  asynchronous ? [y/n]', function(answer) {

        if (answer === 'y') {
          actualRP.push(item.parent);
        }

        next();
      });
  }, function() {

    rl.close();
    callback(null, actualRP)
  })
}

if (process.argv.length < 3)
  throw 'Expects the name of the file to process as argument'

var input = process.argv[2];
var output = process.argv[3] || rename(input);

readFile(input)
.then(function(err, file) {
  if (err) throw err;

  return compile(file, filterRP);
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