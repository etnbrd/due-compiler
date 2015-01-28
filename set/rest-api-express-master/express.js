var express = require("express"),
  mongoskin = require("mongoskin"),
  bodyParser = require("body-parser");
logger = require("morgan");
var app = express();
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(logger("dev"));

var db = mongoskin.db("mongodb://@localhost:27017/test", {
  safe: true
});

app.param("collectionName", function(req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  return next();
});

app.get("/", function(req, res, next) {
  res.send("please select a collection, e.g., /collections/messages");
});

app.get("/collections/:collectionName", function(req, res, next) {
  req.collection.find({}, {
    limit: 10,

    sort: {
      "_id": -1
    }
  }).toArray(function(e, results) {
    if (e)
      return next(e);

    res.send(results);
  });
});

app.post("/collections/:collectionName", function(req, res, next) {
  require("due").mock(req.collection.insert).call(req.collection, req.body, {}).then(function(e, results) {
    if (e)
      return next(e);

    res.send(results);
  });
});

app.get("/collections/:collectionName/:id", function(req, res, next) {
  require("due").mock(req.collection.findById).call(req.collection, req.params.id).then(function(e, result) {
    if (e)
      return next(e);

    res.send(result);
  });
});

app.put("/collections/:collectionName/:id", function(req, res, next) {
  require("due").mock(req.collection.updateById).call(req.collection, req.params.id, {
    $set: req.body
  }, {
    safe: true,
    multi: false
  }).then(function(e, result) {
    if (e)
      return next(e);

    res.send((result === 1 ? {
      msg: "success"
    } : {
      msg: "error"
    }));
  });
});

app.delete("/collections/:collectionName/:id", function(req, res, next) {
  require("due").mock(req.collection.removeById).call(req.collection, req.params.id).then(function(e, result) {
    if (e)
      return next(e);

    res.send((result === 1 ? {
      msg: "success"
    } : {
      msg: "error"
    }));
  });
});

app.listen(3000, function() {
  console.log("Express server listening on port 3000");
});