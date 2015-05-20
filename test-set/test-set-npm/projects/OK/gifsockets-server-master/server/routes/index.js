var GifsocketMiddleware = require('gifsockets-middleware');
// #GIFSOCKET-DIMENSIONS
var gifsocketMw = GifsocketMiddleware({
  width: 600,
  height: 380
});

// Expose openImage, writeJsonToImages, writeTextToImages, and closeOpenImages
Object.getOwnPropertyNames(gifsocketMw).forEach(function (key) {
  exports[key] = gifsocketMw[key];
});

// Render some jade into memory
var fs = require('fs');
var jade = require('jade');
function renderView(filepath, locals) {
  var file = fs.readFileSync(filepath, 'utf8');
  return jade.render(file, locals);
}

var indexHtml = renderView(__dirname + '/../../views/index.jade', {});
exports.index = function (req, res) {
  res.send(indexHtml);
};

var pageNotFoundHtml = renderView(__dirname + '/../../views/404.jade', {});
exports[404] = function (req, res) {
  res.status(404);
  res.send(pageNotFoundHtml);
};
