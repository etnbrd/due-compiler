/**
 * parse-post.js
 *
 * This module will parse a post at a given `path`, asynchronously.
 * It'll read the file at the given path line-by-line using a stream interface
 * which not only keeps memory usage low, but also means we don't have to do
 * splitting and other silly string manipulation hacks to create our post model.
 *
 * It will handle a post as two sections: a meta portion at the top before the
 * first H1 tag, and a content portion below.
 *
 * The whole thing is wrapped in a promise, making it super easy to handle.
 */

var fs = require('fs');
var split = require('split');
var Promise = require('rsvp').Promise;
var md = require('marked');

module.exports = function(path) {
  return new Promise(function(resolve, reject) {

    // We'll assume we're reading the meta portion of our post at the start
    var isMeta = true;

    // Our basic post model
    var post = {
      content: "",
      path: path
    };

    // We'll keep the previous line just in case
    var previousLine = '';

    // Begin reading the file at the path, splitting on newlines
    fs.createReadStream(path)
      .pipe(split())
      .on('data', function(line) {

        if (isMeta) {

          // If we hit a line with `=` underneath, our previous line is the title
          if (/^=/.test(line)) {
            isMeta = false;
            post.title = previousLine.trim();
            return;
          }

          // If we hit a #h1
          if (/^#[^#]/.test(line)) {
            isMeta = false;
            post.title = line.slice(1).trim();
            return;
          }

          // If the line has a `key:value` and no whitespace
          if (/^.*:./.test(line)) {

            // Pull out the keys & values and trim whitespace
            var key = line.split(':')[0].trim();
            var value = line.split(':')[1].trim();

            // Check it's a valid key
            if (/\s/.test(key) || key === "title") {
              return;
            }

            // If there's a date meta, create a Date object
            if (/date/i.test(key)) {
              value = new Date(value);

              // Now check it was a valid date
              if (!value.valueOf()) {
                console.log("'" + path + "' has an invalid date.");
              }
            }

            // If there's `tags` meta, split the values into an array
            if (/^tags/i.test(key)) {
              value = value.split(',');
              value.forEach(function(val) {
                val = val.trim();
              });
            }

            // Now set the value on the post model
            post[key] = value;
          }
        } else {

          // If we're not reading the meta portion, just append the content
          // Don't forget the newline that was stripped
          post.content += line + '\n';
        }

        previousLine = line;

      })
      .on('error', function(err) {

        // Now with each line...
        reject(err);
      })
      .on('end', function() {

        // If we still think we're looking at meta, there was no
        // h1 in the post
        if (isMeta) {
          return reject("The post '" + path + "' did not contain a h1, which is required. Ignoring...");
        }

        if (!post.url) {
          return reject("The post '" + path + "' did not specify a URL, which is required. Ignoring...");
        }

        // Once we're done, parse the markdown and resolve the promise
        post.content = md(post.content);
        resolve(post);
      });
  });
};