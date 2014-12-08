var escodegen = require('escodegen'),
    beautify = require('js-beautify').js_beautify;

module.exports = function(ast, callback) {
  callback(null, beautify(escodegen.generate(ast), { indent_size: 2 }));
}