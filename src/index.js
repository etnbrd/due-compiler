var due = require('due'),
    parser = due.mock(require('./parser')),
    spotlight = due.mock(require('./spotlight')),
    treeBuilder = due.mock(require('./tree')),
    chainBuilder = due.mock(require('./chain')),
    findIdentifiers = require('./findIdentifiers'),
    declarationRelocator = require('./relocator'),
    flattenDescendance = require('./flatten'),
    printer = due.mock(require('./printer'));

module.exports = function compiler(code, callback) {

  var ast;

  parser(String(code))
  .then(function(err, _ast) {
    if (err) throw err;
    ast = _ast;
    return spotlight(ast);
  })
  .then(meet(treeBuilder))
  .then(meet(chainBuilder))
  .then(function(err, chains) {
    chains.forEach(function(chain) {

      // Find the identifiers
      var identifiers = findIdentifiers(chain);

      // Find the BlockStatement of the upper scope
      var block = returnBlockStatement(chain.rp.callback.scope.upper.block);

      declarationRelocator(block, identifiers);

    });

    chains.forEach(flattenDescendance);


    return printer(ast);
  })
  .then(callback);
}

function meet(fn) {
  return function(err, res) {
    if (err) throw err;
    else return fn(res);
  }
}


// TODO move this out of the way, it clutters my source.

function returnBlockStatement(block) {
  if (block.type === 'Program')
    return block

  if (block.type === 'FunctionExpression'
  ||  block.type === 'FunctionDeclaration')
    return block.body

  // TODO what about the try / catch stuffs : they declare a new scope
}