function chainBuilder(trees, callback) {


  function breakChildren(node) {

    function findLegitimates(children, child) {
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