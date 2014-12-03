var escodegen = require('escodegen'),
    beautify = require('js-beautify').js_beautify;

module.exports = function(ast) {
  return beautify(escodegen.generate(ast), { indent_size: 2 })
}