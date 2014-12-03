var esprima = require('esprima'),
    estraverse = require('estraverse');

module.exports = function(code) {
  var ast = esprima.parse(String(code));

  // We build the parenting backlink needed for the next steps in the compilation.
  estraverse.traverse(ast, {
    enter: function(n, p) {
      if (n.parent) {
        console.log('WARNING !!!', n);
      }

      n.parent = p;
    }
  })

  return ast;
}