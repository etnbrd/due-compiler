var nano = require("nano");
var userView = require("./lib/user");

module.exports = init = function(couch, cb) {
  var db = nano(couch);

  require("due").mock(db.get).call(db, "_design/user").then(function(err, doc) {
    if (!doc || userView.version > doc.version) {
      if (doc) {
        userView._rev = doc._rev;
      }

      var __due = require("due").mock(db.insert).call(db, userView, "_design/user");
    }

    return __due;
  }).then(function(err, body) {
    if (err) {
      console.log(err);

      if (cb) {
        cb(err);
      }
    }

    if (!module.parent) {
      console.log(body);
    }

    if (cb) {
      cb(null);
    }
  });
};

if (!module.parent) {
  if (process.argv[2]) {
    init(process.argv[2]);
  } else {
    console.log("couchdb url required");
  }
}