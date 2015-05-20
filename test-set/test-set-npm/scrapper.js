var http = require('http'),
    colors = require('colors'),
    fs = require('fs');



function Aligator(callback) {
  var body = '';

  return {
    onData: function (chunk) {
      body += chunk;
    },

    onEnd: function() {
      callback(null, JSON.parse(body));
    }
  }

}


function getDependants(pkgName, callback) {
  var url = 'http://registry.npmjs.org/-/_view/dependedUpon?group_level=3&startkey=%5B%22' + pkgName + '%22%5D&endkey=%5B%22' + pkgName + '%22%2C{}%5D&skip=0&limit=10000000',
      ali = Aligator(callback);

  http.get(url, function(res) {
    res.on('data', ali.onData);
    res.on('end', ali.onEnd);
  });
}

function getPackage(pkgName, callback) {
  var url = 'http://registry.npmjs.org/' + pkgName + '/latest',
      ali = Aligator(callback);

  http.get(url, function(res) {
    res.on('data', ali.onData);
    res.on('end', ali.onEnd);
  });
}

var filters = [
  'async',
  'q'
]

function store(pkgs, callback) {
  fs.writeFile('pkgs.json', JSON.stringify(pkgs), function() {
    callback(pkgs);
  });
}


function load(callback) {
  // getDependants('express', function(err, res) {

  //   var deps = res.rows.reduce(function(deps, row) {
  //     deps[row.key[1]] = {
  //       desc: row.key[2],
  //     }
  //     return deps;
  //   }, {})

  //   console.log('>> '.yellow, Object.keys(deps).length, ' packages dependants on express');

  //   var counter = 0;


  //   Object.keys(deps)
  //   // .slice(0, 10)
  //   .forEach(function(dep) {
  //     counter++;
  //     getPackage(dep, function(err, res) {
  //       deps[dep] = res;

  //       console.log('>> '.yellow + 'got ' + dep);

  //       if (--counter === 0) _start(deps);
  //     })
  //   })
  // })

  fs.readFile('pkgs.json', function(err, res) {
    callback(JSON.parse(res));
  })
}

function _start() {


  load(start);

  // store(pkgs, function() {
  //   console.log('>> '.yellow, 'done');
  // });

  // fs.readFile('pkgs.json', function(err, res) {
  //   start(JSON.parse(res));
  // })
}

function start(pkgs) {

  // Filter by dependencies

  var pkgs = Object.keys(pkgs).reduce(function(_pkgs, pkg) {

    if (filters.every(function(filter) {
      return !pkgs[pkg].dependencies[filter]
    })) {
      _pkgs[pkg] = pkgs[pkg];
    }

    return _pkgs;
  }, {})

  // Filter by test framework

  var pkgs = Object.keys(pkgs).reduce(function(_pkgs, pkg) {

    if ( pkgs[pkg].scripts && pkgs[pkg].scripts.test && pkgs[pkg].scripts.test === 'mocha') {
      _pkgs[pkg] = pkgs[pkg];
    }

    return _pkgs;
  }, {});


  // Filter by github repository

  var pkgs = Object.keys(pkgs).reduce(function(_pkgs, pkg) {

    if ( pkgs[pkg].repository && pkgs[pkg].repository.type && pkgs[pkg].repository.type === 'git') {
      _pkgs[pkg] = pkgs[pkg];
    }

    return _pkgs;
  }, {});


  console.log('>> '.yellow + Object.keys(pkgs).length);

  var counter = 0;

  Object.keys(pkgs).forEach(function(pkgName) {


    console.log(pkgName + ' ' + pkgs[pkgName].version);

      // function getZipball(src, filename, callback) {
      //   http.get(src, function(res) {
      //     // var filename = res.req.path.split('/archive/master.zip').pop();



      //     res.pipe(fs.createWriteStream('npm/' + filename)).on('close', function(err, res) {
      //       if (err) console.log('>>> '.red, err.message);
      //       else console.log('  >> '.yellow, filename + '\t\t✓'.green);
      //       callback(err, filename);
      //     });
      //   }).on('error', function(e) {
      //     console.log('>>> '.red, e.message);
      //   });
      // }

      // counter++;

      // var url = pkgs[pkgName].repository.url
      //           .replace(/^https/, 'http')
      //           .replace(/^git@/, 'http://')
      //           .replace(/.github.com:/, 'github.com/')
      //           .replace(/^git/, 'http')
      //           .replace(/.git$/, '')
      //           + '/archive/master.zip';

      // var Download = require('download');

      // var download = new Download({ strip: 1, mode: '755' })
      //     .get(url)
      //     .rename(pkgName + '.zip')
      //     .dest('npm');

      // download.run(function (err, files) {
      //     if (err) console.log('>>> '.red, err.message);
      //     console.log('File downloaded successfully!');
      // });


      // getZipball(url + '/archive/master.zip', pkgName + '.zip', function() {
      //   if (--counter === 0) {
      //     console.log('>> '.yellow + 'All done.');
      //   }
      // })

    // console.log(url);
  })




  // Group by test script

  // var testedPkgs = Object.keys(pkgs).reduce(function(tests, pkgName) {

  //   var pkg = pkgs[pkgName];

  //   if (pkg.scripts && pkg.scripts.test) {
  //     tests[pkg.scripts.test] = tests[pkg.scripts.test] || 0;
  //     tests[pkg.scripts.test]++;
  //   }

  //   return tests;

  // }, {})


  // var sortedPkgs = Object.keys(testedPkgs).reduce(function(_tests, test) {
  //   _tests.push([test, testedPkgs[test]]);
  //   return _tests
  // }, [])
  // .sort(function(a, b) {
  //   return a[1] - b[1];
  // })

  // console.log(sortedPkgs);

  // fs.writeFile('sortedDeps.json', JSON.stringify(sortedDeps), function() {
  //   console.log('>> '.yellow, 'done');
  // })

  // console.log(sortedDeps);
}



function getMostDep(pkgs) {

  var deps = Object.keys(pkgs).reduce(function(deps, pkgName) {

    var pkg = pkgs[pkgName];

    if (pkg.dependencies) Object.keys(pkg.dependencies).forEach(function(depName) {
      deps[depName] = deps[depName] || 0;
      deps[depName]++;
    })

    return deps;
  }, {})

  var sortedDeps = Object.keys(deps).reduce(function(_deps, dep) {
    _deps.push([dep, deps[dep]]);
    return _deps
  }, [])
  .sort(function(a, b) {
    return a[1] - b[1];
  })

  return sortedDeps;
}

_start();