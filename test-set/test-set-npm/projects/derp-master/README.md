# Derpjs

*A simple, bare-bones, file-based blog engine.*

#### What?
Derp is bascially a glorified markdown parser, and it wants posts in a certain way. Given the following `first-post.md`:

```markdown
url: my-first-post

# My First Post

...herpin' the derp...
```
Derp will give you an object that looks like this:
```javascript
{
  title: "My First Post",
  url: "my-first-post",
  content: "<p>...herpin' the derp...</p>"
}
```

Derp takes the first *heading 1* it finds and sets it to be the post's title. Anything before that heading is treated as a *meta* section. Simply add the `key:values` you want, and they'll come out in the `post` object:

```markdown
url: a-new-post
tags: derp, markdown, another tag
date: 15 June 2014

# A new post

...
```
```javascript
{
  title: "A new post",
  url: "a-new-post",
  tags: ['derp', 'markdown', 'another tag'],
  date: "Sun Jun 15 2014 21:05:39 GMT+0100 (BST)",
  content: "<p>...</p>"
}
```

Derp treats certain meta keys in certain ways:
- the `url` meta becomes the url slug for the post, and is the only meta which is **required**. (Posts without URLs are ignored — think of it as a primitive draft system)
- a `tags` key with a comma-delimmited list will become an array of tags
- a `date` will be parsed as a javascript date

Other than those, add whatever meta you want!

Also, it'll watch for changes in the `post` directory, making sure to keep everything updates for you.

#### Why?
I needed a blog engine for [my site](http://iestynwilliams.net), and wanted an excuse to play around with ES6 generators, node streams, and regex. I drew some heavy inspiration from [@jsantell](http://twitter.com/jsantell)'s [poet](http://jsantell.github.io/poet/).

### Basic setup

1. Install [Node](http://nodejs.com)
2. `npm install derpjs`

Here's a basic (and contrived) example:
```javascript
var express = require('express');
var app = express();
var derp = require('derpjs');

derp.setup();

app.get('/', function(req, res) {
  res.send(derp.getAllPosts()); // What, you don't like JSON?
});

app.get('/:url', function(req, res, next) {
  var post = derp.getPost(req.params.url);
  if (!post) res.send(404);
  res.send(post);
});

app.listen(3000);
```

For more real-wordl examples, see the [koa](https://github.com/iest/derp/blob/master/examples/koa.js) and [express](https://github.com/iest/derp/blob/master/examples/express.js) examples.


## API

#### `derp.setup([options])`
Parses all the posts, and sets up a watcher on the posts directory to keep track of file changes. Optionally pass in an options hash (checkout the [defaults](https://github.com/iest/derp/blob/master/lib/derp/defaults.js)).

#### `derp.getPost(path)`
Returns a post that matches the given path (where the path is a relative url defined on a post).

#### `derp.getAllPosts([sortFn])`
Returns an array containing all the posts. The array is not sorted, so this is up to you.


## Thanks to...
- [@jsantell](http://twitter.com/jsantell) for inspiration
- [Node-schools' stream-adventure](http://nodeschool.io/#stream-adventure) tutorial
- Forbes Lindsey's [excellent talk on generators](https://www.youtube.com/watch?v=qbKWsbJ76-s)
- [tagtree.tv's ES6 videos](http://tagtree.tv)
- [@tjholowaychuk](https://twitter.com/tjholowaychuk) for making awesome tools that I use every day