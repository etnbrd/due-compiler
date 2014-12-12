function chainBuilder(trees, callback) {
  /*
   *  We walk each tree to find node with more than one child.
   *  If there is more than one child, we try to find a legitimate child to continue the chain.
   *  A legitimate child is a child with at least one child.
   *  If there is more than one legitimate child, then there is none.
   *  The non legitimate child - the bastards - are considered as new chain that wa walk the same way than a tree.
   */

  function breakChildren(node) {

    function findLegitimates(children, child) {
      /*
       *  A legitimate child have at least one child itself.
       *  A non legitimate child doesn't have any children.
       */
      if (child.children.length > 0)
        children.push(child);
      return children;
    }


    switch (node.children.length) {
      case 0:
        return [];

      case 1:
        node.child = node.children[0];
        return breakChildren(node.child);

      default: // > 1
        legitimateChild = node.children.reduce(findLegitimates, [])

        if ( legitimateChild.length === 1) {
          node.child = legitimateChild[0]

          var bastards = node.children.filter(function(child) {
            return (child === node.child)
          })

          return bastards.reduce(function (children, child) {
            return children.concat(breakChildren(child))
          }, []);
        } else { // There is no legitimate Children, because there is too many
          node.child = null;
          return node.children.reduce(function (children, child) {
            return children.concat(breakChildren(child))
          }, []);
        }

    }
  }

  callback(null, trees.reduce(function(chains, root) {
    return chains.concat(root).concat(breakChildren(root));
  }, []));
}

module.exports = chainBuilder;