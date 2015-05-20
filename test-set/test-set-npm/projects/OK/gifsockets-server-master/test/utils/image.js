var getPixels = require('get-pixels');

exports.load = function (filepath) {
  before(function loadImage (done) {
    var that = this;
    getPixels(filepath, function (err, pixels) {
      if (err) {
        return done(err);
      }
      that.pixels = pixels;
      done();
    });
  });
};