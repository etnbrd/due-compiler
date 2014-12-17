var escodegen = require('escodegen'),
    recast = require('recast'),
    beautify = require('js-beautify').js_beautify;

function print(ast) {
  return recast.print(ast).code;
  return escodegen.generate(ast);
}

module.exports = function(ast, callback) {
  callback(null, beautify(print(ast), { indent_size: 2 }));
}