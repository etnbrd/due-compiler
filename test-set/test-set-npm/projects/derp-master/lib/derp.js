var _ = require('lodash');
var fs = require('fs');
var rsvp = require('rsvp'),
  Promise = rsvp.Promise;

var parse = require('./derp/parse-post');
var defaults = require('./derp/defaults');

var config;
var allowedExtensions;
var _this = module.exports;

/**
 * Statics
 */
// An array to store our posts in
_this.postsArr = [];

// A map of `post_url: postsArr_index`
_this.postsMap = {};

// A map of `post_path: post_url`
_this.postsMapByPath = {};

/**
 * Setup derp.
 * @param  {Object} config    Options for derp (see `defaults.js` for defaults)
 * @public
 */
_this.setup = function(opts) {

  if (opts) {
    this.config = _.extend(defaults, opts);
  } else {
    this.config = defaults;
  }

  config = this.config;

  // Create a regex from the array of allowed file extensions
  allowedExtensions = new RegExp(
    config.post_extensions.map(function(ext) {
      return "\\." + ext + "$";
    })
    .join('|')
  );

  return new rsvp.Promise(function(resolve, reject) {
    // Read the posts directory, parsing posts found within
    fs.readdir(config.post_directory, function(err, filePaths) {

      if (err) {
        return console.log(err);
      }
      if (!filePaths) {
        console.log('No posts exist in "%s"', config.post_directory);
        return;
      }

      // Filter out valid paths
      filePaths = filePaths.filter(function(path) {
        return allowedExtensions.test(path);
      });

      // Set up a promise for the parsing of each path
      var promises = filePaths.map(function(filePath) {
        return parse(config.post_directory + '/' + filePath);
      });

      // Execute the parse promises
      rsvp.allSettled(promises).then(function(parsed) {
        parsed.forEach(function(item) {

          // Only pull out fulfilled promises
          if (item.value) {
            _this.addPost(item.value);
          } else {
            console.log(item.reason);
          }
        });
        resolve(_this);
      }).catch(function(reason) {
        console.log(reason);
      });
    });

    // Now setup the watcher
    fs.watch(config.post_directory, handleFileChanges);
  });
};

/**
 * Listener callback for the watcher.
 * @param  {Event} event
 * @param  {String} filename
 */
function handleFileChanges(event, filename) {

  // If the file isn't a post we care about, forget anything happened
  if (!allowedExtensions.test(filename)) {
    return;
  }

  // Try and read the file at `filename`
  var path = config.post_directory + '/' + filename;
  fs.stat(path, function(err, stats) {
    if (err && err.code === "ENOENT") {

      // The watched file was deleted, delete the post if there was one
      if (_this.postsMapByPath[path]) {
        removePost(path);
      }

    } else if (err) {
      console.log(err);
    } else {

      // Otherwise it's either new or was changed
      parse(path)
        .then(function(newPost) {

          var oldPost;

          // If you can find it by path, content was changed
          if (_this.postsMapByPath[newPost.path]) {
            oldPost = _this.getPost(_this.postsMapByPath[newPost.path]);
            _this.updatePost(oldPost, newPost);
            return;
          }

          // If you can find it by URL, post was renamed
          if (_this.getPost(newPost.url)) {
            oldPost = _this.getPost(newPost.url);
            _this.updatePost(oldPost, newPost);
            return;
          }

          // Else it's a new post, just add it
          _this.addPost(newPost);

        }, function(err) {
          console.log(err);
        });

    }
  });
}

/**
 * Check if the given post has a unique URL compared to the posts we already
 * have.
 * @param  {Object} post
 * @return {Boolean} If the post is valid or not
 * @private
 */
function checkValidUrl(post) {
  if (_this.postsMap[post.url] !== undefined) {
    console.log('"%s" has the same URL as "%s". Ignoring...', post.path, _this.postsArr[_this.postsMap[post.url]].path);
    return false;
  } else {
    return true;
  }
}

/**
 * Add a post to `postsArr`.
 * Update `_this.postsMap`
 * Update `_this.postsMapByPath`
 * @param {Object} post
 * @private
 */
_this.addPost = function(post) {
  if (checkValidUrl(post)) {
    _this.postsArr.push(post);
    _this.postsMap[post.url] = _this.postsArr.indexOf(post);
    _this.postsMapByPath[post.path] = post.url;
  }
};

/**
 * Update a post inside derp. Checks url, path, anything
 * else, in that order to determine what's changed about
 * the post. Fails silently — nothing happens if there's
 * no difference between the arguments.
 * @param  {Object} oldPost The post to update
 * @param  {Object} newPost The post to update the oldpost with
 */
_this.updatePost = function(oldPost, newPost) {

  var postIndex,
    postPath;

  // If the url has changed we need to update postsMap
  // and postsMapByPath
  if (oldPost.url !== newPost.url) {
    postIndex = _this.postsMap[oldPost.url];
    _this.postsMapByPath[oldPost.path] = newPost.url;
    _this.postsMap[newPost.url] = postIndex;
    delete _this.postsMap[oldPost.url];
    _this.postsArr[postIndex] = newPost;
    return;
  }

  // If the path has changed we need to update postsMapByPath
  if (oldPost.path !== newPost.path) {
    postIndex = _this.postsMap[oldPost.url];
    delete _this.postsMapByPath[oldPost.path];
    _this.postsMapByPath[newPost.path] = newPost.url;
    _this.postsArr[postIndex] = newPost;
    return;
  }

  // If it's anything else, find the post and overwrite
  if (oldPost !== newPost) {
    postIndex = _this.postsMap[oldPost.url];
    _this.postsArr[postIndex] = newPost;
    return;
  }
};

/**
 * Find a post in `postsArr` by the given path.
 * Delete it out of `postsArr`.
 * Delete references from `postsMap` and `_this.postsMapByPath`
 * @param {String} path
 */
_this.removePost = function(path) {
  var url = _this.postsMapByPath[path];
  delete _this.postsMapByPath[path];
  var index = _this.postsMap[url];
  delete _this.postsMap[url];
  _this.postsArr.splice(index, 1);
  _this.postsArr.forEach(function(post, newIndex) {
    _this.postsMap[post.url] = newIndex;
  });
};

/**
 * Return the post with the given url
 * @param  {String} url
 * @public
 */
_this.getPost = function(url) {
  var post = _this.postsArr[_this.postsMap[url]];
  if (post) {
    return post;
  } else {
    console.log("No post exists at", url);
    return;
  }
};

/**
 * @return {Array} All the posts (unsorted)
 * @public
 */
_this.getAllPosts = function() {
  return _this.postsArr;
};
