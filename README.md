# Due compiler

## What is a due ?

A [due](https://github.com/etnbrd/due) is a simpler alternative to Promises in Javascript.
It doesn't follow the Promise/A+ specification.
Instead, it follows the *error-first* convention from Node.js.

## Compiler

This compiler translate a javascript code using callbacks, into a javascript code using Dues.

+ It doesn't replace the libraries, you have to replace the vanilla libraries with due-compatible libraries.
  You can use the `mock` method to make an asynchronous call due-compatible.

+ It doesn't spot asynchronous functions, you have to provide a method to filter asynchronous from synchronous functions.
  The console client, and the web client provide an interactive interface to do that.
  You can automate this process with your own method.

## Console client

```
./bin/compiler <source> [<target>]
```

## Web client

The compiler is available online, as a [standalone webpage](http://etnbrd.github.io/due-compiler/compiler).


## node.js API

It is possible to use the compiler as a node.js library.

```
var due_compiler = require('due-compiler');

due_compiler(code, filterRP, callback);

```

`filterRP` must be a function to filter synchronous from asynchronous function calls.
The asynchronous function calls are called rupture points, because they allow the transformation.

```
function filterRP(err, potentialRP, callback) {

  var actualRP = potentialRP.filter(function(rp) {
    // ... return rp.isAsynchronous
  })

  callback(null, actualRP);

}
```

## 

We need to make the hierarchical tree of application parts.
The goal is to be able to find cascading application parts.
A cascading of application part, is an application part that contain another application part.
This second application part could be appent to the first application part.

// parent
1 {
  2 { // 2 
    3 { // 3

    }
  }
}

into 

// parent
1.then { // 1
  2
}
.then { // 2
  3
}
.then { // 3
  
}


What are the rules that allow or prevent the composition of due.
- 2 needs to returns the due.
  -> 3 needs to be direct child of 2 
- identifiers shared between 2 and 3 needs to be moved to the parent
  -> remove the declarations from 2 and 3
  -> declare the variables into parent.


# A chain is :
- a root :
  - a variable declarator
  - a root rupture point
- one or more links :
  - an application part, direct child of the previous application part

# Direct child means :
The chain between the root and a rupture point needs to be consisting solely of rupture points
(CallExpression > FunctionExression > Body > CallExpression > FunctionExpression > ...)

If a parent has more than one child : break the chain.
(Or, if only one child got children, then continue the chain for this child)

**.ChainBuilder**
It builds the chain of application parts.

**.ControlFlowPredictor**
The CallExpressions needs to return the due.
So it needs to happen, and there needs to be no other return value (shounldn't though).
The ControlFlowPredictor analyses the control flow and say if the asynchronous call is eventually going to happen, or if it is uncertain due to some control flow.
If there is any kind of control flow BEFORE the rupture point -> break the chain.
For example, if the return happen before the asynchronous call.


Remove the declaration of shared identifiers from the child, and move them into the parent.



## Compilation steps

1 - build the trees of direct child application parts
    A node can have many children.

2 - Build the chains from the tree
    If a node has many children, if only one has children, continue the chain with him.
    The other ones are turned into small chains.

3 - Inside a chain, find and list the shared identifiers.

4 - Modify the code accordingly to these modifications