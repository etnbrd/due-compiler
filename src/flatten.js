var esprima = require('esprima');

function thenify(callExpression, callback) {
  var code = [
    'fn()',
    '.then(callback)'
  ].join('\n');

  var newCallExpression = esprima.parse(code).body[0].expression;

  newCallExpression.callee.object = callExpression;
  newCallExpression.arguments[0] = callback;

  return newCallExpression;
}

function flattenDescendance(root, node) {
  if (!node)
    return []

  // Remove the callback
  node.arguments.splice(node.arguments.indexOf(node.rp.callback), 1);

  // If there is a child, place the return value
  if (node.child) {
    
    var block = node.child.parent

    if (block.type !== 'ExpressionStatement')
      throw 'WARNING : not prepared for this, block is of type ' + block.type;

    var due

    // TODO, if the call is the last statement, then, merge the return statement and the call.

    // if (node.child.rp.callback.body.indexOf(block) !== node.child.rp.callback.body.length -1) {


    block.type = 'VariableDeclaration';
    block.declarations = [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: '__due'
        },
        init: node.child
      }]
    block.kind = 'var';

    due = {
      type: 'Identifier',
      name: '__due'
    }
    // } else {
    //   due = node.child
    // }

    console.log(node.rp.callback.body.body)

    node.rp.callback.body.body.push({
      type: 'ReturnStatement',
      argument: due
    })
  }

  // Replace the old callExpression by the new
  newCallExpression = thenify(root, node.rp.callback);
  newCallExpression.parent = root.parent;
  root.parent.expression = newCallExpression;

  return flattenDescendance(newCallExpression, node.child);
}

function flattenInterface(root) {
  return flattenDescendance(root, root);
}

module.exports = flattenInterface;