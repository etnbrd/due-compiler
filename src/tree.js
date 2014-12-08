function treesBuilder(rps, callback) {
  /*
   *  For each rupture point, it finds the parent and links to it.
   *  If there is no parent, then the rupture point is the root of a tree.
   */


  function returnParent(node) {

    // We got to the root of the AST
    if (!node) {
      return null;
    }

    // Break the chain if we enter a new *stuff* that can return something -> we wouldn't be able to return the due.
    if (node.type === 'FunctionExpression' && !node.parent.isRupturePoint
    ||  node.type === 'FuncitionDeclaration') {
      return null;
    }

    // We found a rupture point
    if (node.isRupturePoint) {
      return node;
    }

    // Recurse
    return returnParent(node.parent);
  }


  callback(null, rps.reduceRight(function(trees, rp) {

    // Find the next rupture point parent until it breaks. 
    var parent = returnParent(rp.parent);

    if (parent === null) { // the current rupture point is a root
      trees.push(rp);
    } else { // the current rupture point belongs to a chain
      parent.children.push(rp)
    }

    return trees

  }, []))
}

module.exports = treesBuilder;