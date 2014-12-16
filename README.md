# Due

## What is a due ?

A [due](https://github.com/etnbrd/due) is a simpler alternative to Promises in Javascript.
It doesn't follow the Promise/A+ specification.
Instead, it follows the *error-first* convention from Node.js.

## Compiler

This compiler translate a javascript code using callbacks, into a javascript code using Dues.

```
// parent
_1(input_1, function(err, res) { // 1
  _2(input_2, function(err, res) { // 2 
    _3(input_3, function(err, res) { // 3

    });
  });
});
```
into 

```
// parent
_1(input_1)
.then( funciton(err, res) { // 1
  return _2(input_2)
})
.then( funciton(err, res) { // 2
  return _3(input_3)
})
.then( funciton(err, res) { // 3
  
})
```

+ It doesn't replace the libraries, you have to replace the vanilla libraries with due-compatible libraries.
  You can use the `mock` method to make an asynchronous call due-compatible.

+ It doesn't spot asynchronous functions, you have to provide a method to filter asynchronous from synchronous functions.
  The console client, and the web client provide an interactive interface to do that.
  You can automate this process with your own method.

# Usage

## Console client

```
./bin/compiler <source> [<target>]
```

## Web client

The compiler is available online, as a [standalone webpage](http://etnbrd.github.io/due-compiler/compiler).


## Node.js API

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

## Browser API

It is possible to use the compiler in the browser, using Browserify.
The API is the same as for node.js.

The following command create a bundle to include in your webpage.

```
browserify pages/scripts/client.js > pages/scripts/script.js
```

```
<script src="scripts/script.js"></script>
<script type="text/javascript">
  var compiler = window.compiler;
</script>
```

---

# Internals

## Compilation steps

1 - build the trees of direct child asynchronous calls
    An asynchronous calls callback can call many asynchronous calls.

2 - Build the chains from the tree
    If a callback call many asynchronous calls, the chain can continue with no more than one of them.
    The other ones are turned into different chains.

3 - Inside a chain, find and list the shared identifiers.
    these identifiers need to be moved to a parent scope.

4 - Modify the code accordingly to these modifications