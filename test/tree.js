var due = require('due'),
    readFile = due.mock(require('fs').readFile),

    parser = due.mock(require('../src/parser')),
    spotlight = due.mock(require('../src/spotlight')),
    treeBuilder = due.mock(require('../src/tree'));

var rps;

before(function(done) {
  readFile('ref/ref1.js')
  .then(function(err, file) {
    return parser(String(file))
  })
  .then(function(err, ast) {
    return spotlight(ast)
  })
  .then(function(err, _rps) {
    rps = _rps;
    done();
  });  
});

describe('Tree builder : ', function () {
  it('should build a tree', function (done) {
    treeBuilder(rps)
    .then(done)
  });

  it('should build the correct tree', function (done) {
    treeBuilder(rps)
    .then(function(err, res) {
      if (res.length === 2
      &&  res[0].children.length === 2
      &&  res[1].children.length === 0)
        done()
    })
  });
});