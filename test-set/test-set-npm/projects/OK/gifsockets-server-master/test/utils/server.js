var spawn = require('child_process').spawn;
var pixelServerPath = require.resolve('phantomjs-pixel-server');
var GifsocketsServer = require('../../');

exports.runPixelServer = function () {
  before(function startPhantomPixelServer (done) {
    this._phantomServer = spawn('phantomjs', [pixelServerPath], {stdio: [0, 1, 2]});
    setTimeout(done, 1000);
  });
  after(function (done) {
    this._phantomServer.kill();
    this._phantomServer.on('exit', function (code, signal) {
      done();
    });
  });
};

exports.runGifsocketsServer = function () {
  before(function (done) {
    this.server = new GifsocketsServer();
    this.server.listen(7050);
    setTimeout(function () {
      done();
    }, 100);
  });
  after(function (done) {
    this.server.destroy(function (err) {
      done();
    });
  });
};