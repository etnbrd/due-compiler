/**
 * To run this example you need node version 0.11.9 or higher, then:
 * $ node --harmony koa.js
 */

var _ = require('lodash');
var koa = require('koa');
var app = koa();
var route = require('koa-route');
var views = require('co-views');
var logger = require('koa-logger');
var derp = require('../lib/derp');

// Global variables
var port = process.argv[2] || 3000;

// Middleware
app.use(logger());

// Setup derp
derp.setup({
  post_directory: "../test/fixtures"
});
var config = derp.config;

var render = views(__dirname + '/views', {
  default: config.template_extension
});

// Middleware
app.use(function * pageNotFound(next) {
  yield next;
  if (this.body) return;
  this.status = 404;
  this.body = yield render('404');
});

app.use(function * locals(next) {
  this.locals = {
    moment: require('moment'),
    path: this.request.path
  };
  yield next;
});

// Routes
app.use(route.get('/', function * list() {
  this.body = yield render('list', _.extend(this.locals, {
    posts: derp.getAllPosts()
  }));
}));

app.use(route.get('/:url', function * show(url) {
  var post = derp.getPost(url);
  if (!post) return;
  this.body = yield render('post', _.extend(this.locals, {
    post: post
  }));
}));

// Now do the work and run the server
app.listen(port);
console.log('Listening on port', port);