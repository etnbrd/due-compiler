var http = require('http'),
    git = require('git-node'),
    compiler = require('../src'),
    readline = require('readline'),
    estraverse = require('estraverse'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    esquery = require('esquery'),
    fs = require('fs'),
    zip = require('zip'),
    tar = require ('tar');

var shortcuts = {
  'fs.readdir': true,
  'fs.stat': true,
  'fs.readFile': true,
  'files.forEach': false,
  'lines.reduce': false
}  

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////


function rename(name) {
  var output = name.split('.');
  output[0] += '-due';
  return output.join('.');
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

  if (list.length === 0)
    return end();

  return next(list[0], 0);
}

function filterRP(err, potentialRP, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var actualRP = [];

  forEach(potentialRP, function(item, next) {

    var callee = shortcuts[escodegen.generate(item.parent.callee)];

    if (callee !== undefined) { 
      if (callee) {
        actualRP.push(item.parent);
      }    
      return next()
    } else 
      rl.question('Is the call ' + escodegen.generate(item.parent.callee) + '  asynchronous ? [y/n]', function(answer) {

        if (answer === 'y') {
          actualRP.push(item.parent);
        }

        next();
      });
  }, function() {

    rl.close();
    callback(null, actualRP)
  })
}

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

var reader = zip.Reader(fs.readFileSync('master.zip'));
var project = reader.toObject();

function usedModules(file) {
  var ast = esprima.parse(file);

  // Build the parenting backlink needed for the next steps in the compilation.
  estraverse.traverse(ast, {
    enter: function(n, p) {
      n.parent = p;
    }
  })

  var res = esquery.query(ast, 'CallExpression > [name="require"]' );

  var modules = res.reduce(function(modules, elm) {
    if (elm.parent.arguments[0].type === 'Literal') {
      modules.push(elm.parent.arguments[0].value)
    }
    return modules;
  }, []);

  return modules;
}


forEach(Object.keys(project), function(filename, callback) {

  // console.log(filename);
  // console.log(project[filename].toString());
  // callback();

  if (filename.split('.').pop() === 'js') {
    // compiler(project[filename].toString(), filterRP, callback);

    usedModules(project[filename].toString());
  } else {
    callback();
  }

}, function () {
  console.log('end');
})

for(var filename in project) { var data = project[filename];



// }


// http.get(url, function(res) {
//   var zipball = '';

//   console.log(res.headers);

//   // res.pipe(tar.Parse().on('entry', function() {
//   //   console.log(arguments);
//   // })).on('error', function(e) {
//   //   console.log('Error ' + e)
//   // })

//   res.on('data', function(chunk) {

//     console.log('>>> ', chunk);

//     zipball += chunk;
//   }).on('end', function() {

//     console.log(zipball);

//     // console.log(zip.Reader(new Buffer(zipball)).toObject());
//   })
// });

// $.ajax({
//     url: readme_uri,
//     dataType: 'jsonp',
//     success: function(results)
//     {
//         var content = results.data.content;
//     });