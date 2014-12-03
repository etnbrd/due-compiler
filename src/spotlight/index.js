var readline = require('readline'),
    escodegen = require('escodegen');




shortcuts = {
  'fs.readdir': true,
  'fs.stat': true,
  'fs.readFile': true,
  'files.forEach': false,
  'lines.reduce': false
}


function forEach(list, callback, end) {

  function next(item, index) {
    callback(item, _next(list, index));
  }

  function _next(list, index) {
    return function () {
      if (++index < list.length)
        next(list[index], index);
      else
        end()
    }
  }
  
  next(list[0], 0);
}

module.exports = function(list, callback) {

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var rupturePoints = [];

  forEach(list, function(item, next) {

    var callee = shortcuts[escodegen.generate(item.parent.callee)];

    if (callee !== undefined) { 
      if (callee) {
        item.parent.isRupturePoint = true;
        rupturePoints.push(item.parent);
      }    
      return next()
    } else 
      rl.question('Is the call ' + escodegen.generate(item.parent.callee) + '  asynchronous ? [y/n]', function(answer) {

        if (answer === 'y') {
          item.parent.isRupturePoint = true;
          rupturePoints.push(item.parent);
        }

        next();
      });
  }, function() {

    callback(null, rupturePoints)
    rl.close();
  })
}