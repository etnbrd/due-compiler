
function findIdentifiers(node) {
  /*
   *  We need to find the identifiers declared and used in the chain.
   *  Verify that the declared identifier are not used in a child rupture point
   *  If threre is no child, there is no need of moving the declarations
   *  Because there is no scope in between links in the chain, if an identifier is referenced outside of the current node, it is referenced a descendant.
   *  Descendant which will be moved outside of the current node scope.
   */

   if (! node)
     return []

   return node.rp.callback.scope.variables
     .reduce(function(shared, variable) {
       if (node.child
       &&  variable.references.some(function(ref) {
        return (ref.from !== node.rp.callback.scope)
       })) {
         shared.push(variable)
       }
       return shared
     }, [])
     .concat(findIdentifiers(node.child)) // Recursion
}


module.exports = findIdentifiers;