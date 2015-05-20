/**
 * To run:
 * $ node express.js
 */

var _ = require('lodash');
var express = require('express');
var app = express();
var derp = require('../lib/derp');

// Global variables
var port = process.argv[2] || 3000;

// App setup
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.locals = {
  moment: require('moment')
};

// Middleware
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

derp.setup({
  post_directory: "../test/fixtures"
});

function sortByTitle(a,b) {
  if (a.title > b.title) return 1;
  if (a.title < b.title) return -1;
  return 0;
}

app.get('/', function(req, res) {
  res.render('list', {
    posts: derp.getAllPosts().sort(sortByTitle),
    path: req.path
  });
  console.log(derp);
});

app.get('/:url', function(req, res, next) {
  var post = derp.getPost(req.params.url);
  if (!post) return next();
  res.render('post', {
    post: post,
    path: req.path
  });
});

app.use(function(req, res, next) {
  res.status(404);
  res.render('404', {
    url: req.url
  });
});

app.listen(port);
console.log('Listening on port', port);