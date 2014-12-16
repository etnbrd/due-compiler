var escodegen = require('escodegen'),
    esquery = require('esquery');

function findPotentialRP(ast) {
  var rps = esquery.query(ast, 'CallExpression > FunctionExpression');

  rps.forEach(function(callback) {
    callback.parent.rp = {
      callback: callback
    };
  })


  return rps
}

function makeRupturePoint(node) {
  node.isRupturePoint = true;
  node.children = [];

  return node;
}

module.exports = function(ast, filterRP, callback) {

  var potentialRP = findPotentialRP(ast); 

  // TODO externalize interface

  // var rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // });

  filterRP(null, potentialRP, function(err, actualRP) {

    actualRP.forEach(makeRupturePoint);

    callback(err, actualRP);
  })

  // var actualRP = [];

  // forEach(potentialRP, function(item, next) {

  //   var callee = shortcuts[escodegen.generate(item.parent.callee)];

  //   if (callee !== undefined) { 
  //     if (callee) {
  //       actualRP.push(makeRupturePoint(item.parent));
  //     }    
  //     return next()
  //   } //else 
  //     // rl.question('Is the call ' + escodegen.generate(item.parent.callee) + '  asynchronous ? [y/n]', function(answer) {

  //     //   if (answer === 'y') {
  //     //     actualRP.push(makeRupturePoint(item.parent));
  //     //   }

  //     //   next();
  //     // });
  // }, function() {

  //   callback(null, actualRP)
  //   // rl.close();
  // })
}