var assert = require('assert');
var fs = require('fs');
var request = require('request');
var serverUtils = require('./utils/server');
var imageUtils = require('./utils/image');

serverUtils.runPixelServer();
serverUtils.runGifsocketsServer();

function openImage() {
  before(function (done) {
    var that = this;
    this.gifData = '';
    var req = request({
      url: 'http://localhost:7050/image.gif',
      encoding: 'binary'
    });
    req.on('error', function (err) {
      done(err);
    });
    req.on('response', function (res) {
      res.on('data', function (buff) {
        that.gifData += buff;
      });
      that.gifRes = res;
      done();
    });
  });
}

function drawJsonFrame() {
  before(function writeNewFrame (done) {
    this.timeout(5000);
    request({
      url: 'http://localhost:7050/image/json',
      method: 'POST',
      body: JSON.stringify([].slice.call(this.pixels.data))
    }, done);
  });
}

function closeImage() {
  before(function (done) {
    this.gifRes.on('end', done);
    request({
      url: 'http://localhost:7050/image/close',
      method: 'POST'
    });
  });
}

describe('A request to a gifsockets-server', function () {
  describe('writing a text frame', function () {
    openImage();
    before(function saveGifData () {
      this._beforeFrameData = this.gifData;
    });
    before(function writeNewFrame (done) {
      this.timeout(5000);
      request({
        url: 'http://localhost:7050/image/text',
        method: 'POST',
        form: {
          text: 'Hello',
          'font-family': 'Arial'
        }
      }, done);
    });

    it('receives a new frame', function () {
      assert.notEqual(this._beforeFrameData, this.gifData);
    });

    describe('and closing the image', function () {
      closeImage();

      if (process.env.DEBUG_TEST) {
        before(function saveDebugImage () {
          try { fs.mkdirSync(__dirname + '/actual-files/'); } catch (e) {}
          fs.writeFileSync(__dirname + '/actual-files/text.gif', this.gifData, 'binary');
        });
      }

      it('creates a GIF image', function () {
        // TODO: We might be able to use image magick for a fuzzy match
        var expectedImages = ['text.gif', 'text2.gif'];
        var matchedAnImage = false;
        var i = expectedImages.length;
        while (i--) {
          var expectedImg = fs.readFileSync(__dirname + '/expected-files/' + expectedImages[i], 'binary');
          if (expectedImg === this.gifData) {
            matchedAnImage = true;
            break;
          }
        }
        assert(matchedAnImage);
      });
    });
  });

  describe('writing a JSON pixel frame', function () {
    openImage();
    imageUtils.load(__dirname + '/test-files/checkerboard.png');
    drawJsonFrame();
    closeImage();

    if (process.env.DEBUG_TEST) {
      before(function saveDebugImage () {
        try { fs.mkdirSync(__dirname + '/actual-files/'); } catch (e) {}
        fs.writeFileSync(__dirname + '/actual-files/json.gif', this.gifData, 'binary');
      });
    }

    it('creates the image as a GIF', function () {
      var expectedImg = fs.readFileSync(__dirname + '/expected-files/json.gif', 'binary');
      assert.strictEqual(this.gifData, expectedImg);
    });
  });
});

describe('A request to a gifsockets-server', function () {
  openImage();
  describe('writing a first frame', function () {
    imageUtils.load(__dirname + '/test-files/checkerboard.png');
    drawJsonFrame();

    describe('and a second frame', function () {
      imageUtils.load(__dirname + '/test-files/checkerboard-inverse.png');
      drawJsonFrame();
      closeImage();

      if (process.env.DEBUG_TEST) {
        before(function saveDebugImage () {
          try { fs.mkdirSync(__dirname + '/actual-files/'); } catch (e) {}
          fs.writeFileSync(__dirname + '/actual-files/multiple.gif', this.gifData, 'binary');
        });
      }

      it('receives both frames', function () {
        var expectedImg = fs.readFileSync(__dirname + '/expected-files/multiple.gif', 'binary');
        assert.strictEqual(this.gifData, expectedImg);
      });
    });
  });
});
