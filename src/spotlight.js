var readline = require('readline'),
    escodegen = require('escodegen'),
    esquery = require('esquery');




shortcuts = {
  'fs.readdir': true,
  'fs.stat': true,
  'fs.readFile': true,
  'files.forEach': false,
  'lines.reduce': false
}


function findPotentialRP(ast) {
  var rps = esquery.query(ast, 'CallExpression > FunctionExpression');

  rps.forEach(function(callback) {
    callback.parent.rp = {
      callback: callback
    };
  })


  return rps
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
  
  next(list[0], 0);
}

function makeRupturePoint(node) {
  node.isRupturePoint = true;
  node.children = [];

  return node;
}

module.exports = function(ast, callback) {

  var potentialRP = findPotentialRP(ast); 

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var actualRP = [];

  forEach(potentialRP, function(item, next) {

    var callee = shortcuts[escodegen.generate(item.parent.callee)];

    if (callee !== undefined) { 
      if (callee) {
        actualRP.push(makeRupturePoint(item.parent));
      }    
      return next()
    } else 
      rl.question('Is the call ' + escodegen.generate(item.parent.callee) + '  asynchronous ? [y/n]', function(answer) {

        if (answer === 'y') {
          actualRP.push(makeRupturePoint(item.parent));
        }

        next();
      });
  }, function() {

    callback(null, actualRP)
    rl.close();
  })
}