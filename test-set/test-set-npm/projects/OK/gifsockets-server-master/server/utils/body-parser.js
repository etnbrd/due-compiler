var getRawBody = require('raw-body');
module.exports = function getRawBodyFn (limit) {
  return function saveBody (req, res, next) {
    getRawBody(req, {
      expected: req.headers['content-length'],
      limit: limit
    }, function (err, buffer) {
      // If there was an error (e.g. bad length, over length), respond poorly
      if (err) {
        res.writeHead(500, {
          'content-type': 'text/plain'
        });
        return res.end('Content was too long');
      }
      req.body = buffer;
      next();
    });
  };
};
