var esprima = require('esprima'),
    recast = require('recast'),
    escope = require('escope'),
    esquery = require('esquery'),
    estraverse = require('estraverse');

function populate(variable) {

  function local(scope, variable) {
    scope.references.forEach(function(reference) {
      if (reference.identifier.name === variable.name) {
        variable.references.push(reference);
        reference.resolved = variable;
      }
    });
  }

  // populate the references array of `variable` with all references from all nested child scope
  function global(scopes, variable) {
    scopes.forEach(function(scope) {
      // Break when another variable of the same name is declared
      if (scope.variables.some(function(_variable) {
            return _variable.name === variable.name;
          })) {
        return;
      }

      // Push matching references
      local(scope, variable);

      // Recurse
      global(scope.childScopes, variable);
    });
  }

  // Push local matching references
  if (variable.references.length === 0) {
    local(variable.scope, variable);
  }

  // Start scope lookup recursion
  global(variable.scope.childScopes, variable);

  return variable;
}

function parse(code, callback) {

  // Esprima doesn't like the #! in the beginning of node script files, so we remove the first line.
  if (code[0] === '#') {
    code = code.slice(code.indexOf('\n'));
  }

  // var ast = recast.parse(code);

  console.log(code);

  var ast = esprima.parse(String(code), {
    // Parser Options
    loc: true
  });

  // Verify the absence of With or Eval
  if (esquery.query(ast, ':matches(WithStatement, Identifier[name = "eval"])').length > 0)
    throw 'Compilation impossible because of the presence of With or eval'

  // Build the parenting backlink needed for the next steps in the compilation.
  estraverse.traverse(ast, {
    enter: function(n, p) {
      n.parent = p;
    }
  })

  // Populate scopes and link the scopes with the AST
  escope.analyze(ast).scopes.forEach(function(scope) {
    scope.block.scope = scope;
    scope.variables.forEach(function(variable) {
      populate(variable);
    })
  })

  return callback(null, ast);
}

module.exports = parse;