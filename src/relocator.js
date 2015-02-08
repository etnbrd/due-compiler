function declarationRelocator(block, identifiers) {

  // THIS NEEDS HEAVY TESTING
  // so much corner cases, and possible screw ups
  // particularly with multiple declarations

  if (identifiers.length > 0) {

    // Create the new declarations

    var declaration = (block.body[0].type === 'VariableDeclaration') ? block.body : {
      type: 'VariableDeclaration',
      kind: 'var',
      declarations: [],
      parent: block
    };

    var declarators = identifiers.map(function(id) {
      if (id.identifiers.length > 1)
        throw 'WARNING : Multiple identifiers : ' + id.identifiers;

      return   {
        type: 'VariableDeclarator',
        id: id.identifiers[0],
        init: null,
        parent: declaration
      }
    })

    declaration.declarations = declaration.declarations.concat(declarators);

    block.body.unshift(declaration)

    // Remove the old declarations, and move the definition

    identifiers.forEach(function(id) {
      if (id.defs.length > 1) throw 'WARNING : Multiple declarations : ' + id.defs;

      var definition = id.defs[0].node,
          declaration = definition.parent,
          block = declaration.parent;

      if (definition.type === 'FunctionExpression') {

        var oldName = id.defs[0].name.name,
            newName = '_' + oldName;

        // Before anything else, update the parent identifier with the parameter value
        definition.body.body.unshift({
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: {
              type: 'Identifier',
              name: oldName
            },
            right: {
              type: 'Identifier',
              name: newName
            },
          }
        });

        // Rename the parameter (prepend an underscore)
        definition.params.forEach(function(param) {
          if (param.name === oldName) param.name = newName;
        })


      } else if (definition.type === 'FunctionDeclaration') {

        console.log(definition);
        console.log(block);

        // Replace the declaration with an assignation of the declaration (might need to change declaration into expression)
        var declarationIndex = block.body.body.indexOf(definition);
        block.body.body.splice(declarationIndex, 1, {
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: {
              type: 'Identifier',
              name: id.defs[0].name.name
            },
            right: definition
          }
        })


      } else {
        var definitionIndex = declaration.declarations.indexOf(definition),
            declarationIndex = block.body.indexOf(declaration);

        // Remove the old declaration
        if (declaration.declarations.length === 1)
          block.body.splice(declarationIndex, 1)
        else
          declaration.declarations.splice(definitionIndex, 1);

        initialization = {
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: definition.id,
            right: definition.init
          }
        }

        // Place the initialization
        // If the initialiation was at the beginning or at the end of the VariableDeclarations, place it before, or after the VariableDeclarations
        // Else split the VariableDecalaration in two, and place the initialiation in the middle to conserve the semantic.
        if (definitionIndex === 0)
          block.body.splice(declarationIndex, 0, initialization)
        else if (definitionIndex !== declaration.declarations.length - 1)
          block.body.splice(declarationIndex+1, 0, initialization)
        else {
          var declaration1 = {
            type: 'VariableDeclaration',
            kind: 'var',
            declarations: declaration.declarations.slice(0, declarationIndex),
            parent: block
          }

          var declaration2 = {
            type: 'VariableDeclaration',
            kind: 'var',
            declarations: declaration.declarations.slice(declarationIndex),
            parent: block
          }

          block.body.splice(declarationIndex, 1, declaration1, initialization, declaration2);
        }
      }

    })
  }
}

module.exports = declarationRelocator;