# gifsockets-server [![Build status](https://travis-ci.org/twolfson/gifsockets-server.png?branch=master)](https://travis-ci.org/twolfson/gifsockets-server)


GIFSockets are never-ending animated [GIFs][GIF] for sending text and images between people.

Demo: http://gifsockets.twolfson.com/

`gifsockets-server` is a reimplementation of [videlalvaro/gifsockets][]. It was written in [Clojure][] and not trivial to set up, especially without any [Clojure][] experience.

This project is written in [JavaScript][] and use [gif-encoder][] for encoding and [PhantomJS][] for [canvas][] preparation.

[videlalvaro/gifsockets]: https://github.com/videlalvaro/gifsockets
[Clojure]: http://en.wikipedia.org/wiki/Clojure
[GIF]: http://en.wikipedia.org/wiki/Graphics_Interchange_Format
[JavaScript]: http://en.wikipedia.org/wiki/ECMAScript
[gif-encoder]: https://github.com/twolfson/gif-encoder
[gif.js]: http://jnordberg.github.io/gif.js/
[PhantomJS]: http://phantomjs.org/
[canvas]: https://developer.mozilla.org/en-US/docs/HTML/Canvas

To run this website locally:

```bash
npm install -g gifsockets-server phantomjs-pixel-server
phantomjs-pixel-server &
gifsockets-server
# Website will be available at http://localhost:8000/
```

## Documentation
This code was written during [Node Knockout 2013][], a 48 hour hackathon, but it is slowly being organized.

[Node Knockout 2013]: http://2013.nodeknockout.com/

The server you are running is at `server/app.js` and the `gif` logic is inside of `lib`.

Modules which are part of this project include:

- [`gifsockets`][] The heart of the `gifsockets project`, a mediator for subscribing any writable stream to newly written [GIF][] frames
- [`gifsockets-middleware`][] Plug and play middlewares to set up a server with `gifsockets`
- [`gif-encoder`][] A fork of [gif.js][] with stream support and is optimized for [node.js][] performance
- [`phantomjs-pixel-server`][] A [PhantomJS][] server which takes text and converts it to an `rgba` array of pixels

[node.js]: http://nodejs.org/
[`gifsockets`]: https://github.com/twolfson/gifsockets
[`gifsockets-middleware`]: https://github.com/twolfson/gifsockets-middleware
[`gif-encoder`]: https://github.com/twolfson/gif-encoder
[`phantomjs-pixel-server`]: https://github.com/twolfson/phantomjs-pixel-server

## Development
### Dependencies
Server-side dependencies are managed with [npm][] and client-side dependencies are managed with [grunt][]. To install the latest dependencies

```bash
npm install
# npm http GET https://registry.npmjs.org/marked
# npm http GET https://registry.npmjs.org/express
# ...

grunt install
# Running "curl-dir:public/js/" (curl-dir) task
# Files "public/js/filereader.js", "public/js/filereader.min.js", "public/js/jquery.js" created.
# ...
# Done, without errors.
```

If you never used [grunt][] before, install the [CLI tool][grunt-cli] via

```bash
npm install -g grunt-cli
```

[npm]: https://npmjs.org/
[grunt]: http://gruntjs.com/
[grunt-cli]: https://github.com/gruntjs/grunt-cli

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via [grunt](https://github.com/gruntjs/grunt) and test via `npm test`.

## Donating
Support this project and [others by twolfson][gittip] via [gittip][].

[![Support via Gittip][gittip-badge]][gittip]

[gittip-badge]: https://rawgithub.com/twolfson/gittip-badge/master/dist/gittip.png
[gittip]: https://www.gittip.com/twolfson/

## Unlicense
As of Nov 10 2013, Todd Wolfson has released this repository and its contents to the public domain.

It has been released under the [UNLICENSE][].

[UNLICENSE]: UNLICENSE
