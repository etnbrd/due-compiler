var spotlight = require('./spotlight'),
    estraverse = require('estraverse'),
    esquery = require('esquery'),
    esprima = require('esprima'),
    beautify = require('js-beautify').js_beautify;



function then(fn) {

  var code = [
    'fn()',
    '.then(callback)'
  ].join('\n');

  var ast = esprima.parse(code);
  var cll = ast.body[0].expression;
  var clb = fn.arguments[fn.arguments.length-1];

  fn.arguments = fn.arguments.filter(function(arg) {
    return arg !== clb
  })

  cll.callee.object = fn;
  cll.arguments[0] = clb;

  return cll;
}




module.exports = function(ast, callback) {

  // We build the parenting backlink needed for the next steps in the compilation.
  estraverse.traverse(ast, {
    enter: function(n, p) {
      if (n.parent) {
        console.log('WARNING !!!', n);
      }

      n.parent = p;
    }
  })

  results = esquery.query(ast, 'CallExpression > FunctionExpression');
  spotlight(results, function(err, res) {
    console.log(res.length + ' rupture points found');




    res.forEach(function(call) {

      stuff = then(call)

      // console.log(stuff)

      // console.log(require('escodegen').generate(stuff));


      call.parent.expression = stuff;

      // console.log(call.parent)



    })

    console.log(' --- ');

    console.log(beautify(require('escodegen').generate(ast), { indent_size: 2 }));

    console.log(' --- ');

  });
}