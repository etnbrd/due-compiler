var spotlight = require('./spotlight'),
    printer = require('./printer'),
    parser = require('./parser'),
    esprima = require('esprima'),
    esquery = require('esquery');



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




module.exports = function(code, callback) {

  var ast = parser(String(code));

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

    var code = printer(ast);

    callback(null, code);

  });
}