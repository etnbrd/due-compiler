var express = require('express');
var Gifsocket = require('gifsockets');
var bodyParser = require('./utils/body-parser');
var routes = require('./routes');

function GifServer(port) {
  // Create a new gifsocket for the app
  var gifsocket = new Gifsocket({
    // #GIFSOCKET-DIMENSIONS
    width: 600,
    height: 380
  });

  // Start a server that runs on jade
  var app = express();

  // Host static files
  app.use('/public', express['static'](__dirname + '/../public'));

  // Set up gifsocket for server logic
  app.use(function saveConnections (req, res, next) {
    req.gifsocket = gifsocket;
    next();
  });

  // Host homepage
  app.get('/', routes.index);

  // Server logic
  app.get('/image.gif', routes.openImage);

  app.post('/image/text', bodyParser(1 * 1024 * 1024), // 1 mb
    routes.writeTextToImages);
  app.post('/image/json', bodyParser(10 * 1024 * 1024), // 10 mb
    routes.writeJsonToImages);
  // TODO: Somehow assign each page an id and allow for closing via /close:id. See #5 comments
  // TODO: On server close, write out finish to all connections
  // TODO: On process close, close server
  app.post('/image/close', routes.closeOpenImages);

  // Host 404 page
  app.all('*', routes[404]);

  // Save app for later
  this.app = app;
}
GifServer.prototype = {
  listen: function (port) {
    // Listen and notify the outside world
    this._app = this.app.listen(port);
  },
  destroy: function (cb) {
    this._app.close(cb || function () {});
  }
};

module.exports = GifServer;
