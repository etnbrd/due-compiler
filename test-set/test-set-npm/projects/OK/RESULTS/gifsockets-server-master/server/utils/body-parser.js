var getRawBody = require("raw-body");

module.exports = function getRawBodyFn(limit) {
  return function saveBody(req, res, next) {
    require("due").mock(getRawBody).call(global, req, {
      expected: req.headers["content-length"],
      limit: limit
    }).then(function(err, buffer) {
      if (err) {
        res.writeHead(500, {
          "content-type": "text/plain"
        });

        return res.end("Content was too long");
      }

      req.body = buffer;
      next();
    });
  };
};