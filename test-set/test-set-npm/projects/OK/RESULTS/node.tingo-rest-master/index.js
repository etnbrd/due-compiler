var express = require("express");
var bodyParser = require("body-parser");
var tingoEngine = require("tingodb")();

module.exports = function(dataDir) {
  if (typeof dataDir === "undefined") {
    throw new Error("Missing data directory");
  }

  var app = express();
  app.use(bodyParser.json());
  var db = new tingoEngine.Db(dataDir, {});

  app.param("resourceName", function(req, res, next, resourceName) {
    req.collection = db.collection(resourceName);
    return next();
  });

  app.get("/:resourceName", function(req, res, next) {
    req.collection.find({}).toArray(function(err, results) {
      if (err) {
        return next(err);
      }

      res.send(results);
    });
  });

  app.get("/:resourceName/:id", function(req, res, next) {
    require("due").mock(req.collection.findOne).call(req.collection, {
      _id: req.params.id
    }).then(function(err, result) {
      if (err) {
        return next(err);
      }

      if (result) {
        res.send(result);
      } else {
        res.sendStatus(404);
      }
    });
  });

  app.post("/:resourceName", function(req, res, next) {
    require("due").mock(req.collection.insert).call(req.collection, req.body, {}).then(function(err, result) {
      if (err) {
        return next(err);
      }

      res.send(result);
    });
  });

  app.put("/:resourceName/:id", function(req, res, next) {
    require("due").mock(req.collection.update).call(req.collection, {
      _id: req.params.id
    }, req.body).then(function(err, count) {
      if (err) {
        return next(err);
      }

      res.send((count === 1 ? {
        msg: "success"
      } : {
        msg: "error"
      }));
    });
  });

  app.delete("/:resourceName/:id", function(req, res, next) {
    require("due").mock(req.collection.remove).call(req.collection, {
      _id: req.params.id
    }).then(function(err, count) {
      if (err) {
        return next(err);
      }

      res.send((count === 1 ? {
        msg: "success"
      } : {
        msg: "error"
      }));
    });
  });

  return app;
};