var rpc = require("socket.io-rpc");
var _ = require("lodash");
var Promise = require("bluebird");
var MRModel = require("./mr-server-model");
var userModel;
var toCallOnCreate = [];
var logger = require("./logger/logger");
var auth = require("./authentication");
var express = require("express");

module.exports = function(mongoose, connString) {
  if (connString) {
    require("due").mock(mongoose.connect).call(mongoose, connString).then(function(err) {
      if (err) {
        throw err;
      } else {
        logger.log("DB connected succesfully");
      }
    });

    mongoose.connection.on("error", function(err) {
      logger.error("MongoDB error: %s", err);
    });
  }

  function regNewModel(name, schema, opts) {
    var model = MRModel.apply(mongoose, arguments);
    toCallOnCreate.push(model._exposeCallback);
    return model;
  }

  function registerUserModel(schemaExtend, opts) {
    if (userModel) {
      throw new Error("There can only be one user model");
    }

    var userSchema = require("./utils/user-model-base");
    _.extend(userSchema, schemaExtend);
    userModel = MRModel.call(mongoose, "user", userSchema, opts);
    toCallOnCreate.push(userModel._exposeCallback);
    return userModel;
  }

  function bootstrap(app, iop) {
    var io;

    if (!iop) {
      var server = app.listen(app.get("port"));

      server.on("listening", function() {
        logger.info(
          "Express server started on port %s at %s",
          server.address().port,
          server.address().address
        );
      });

      io = require("socket.io").listen(server);
    } else {
      io = iop;
    }

    app.use(express.static("node_modules/moonridge-client/"));
    var allQueries = [];
    var rpcInstance = rpc(io, app);

    toCallOnCreate.forEach(function(CB) {
      allQueries.push(CB(rpcInstance));
    });

    rpcInstance.masterChannel.on("connection", function(socket) {
      if (typeof MRInstance.auth === "function") {
        socket.on("auth", function(authObj) {
          MRInstance.auth(socket, authObj).then(function(user) {
            auth.authUser(socket, user);
            console.log("authentication successful", authObj);
            rpcInstance.masterChannel.emit("authSuccess", user);
          }, function(err) {
            console.log("authentication failed", authObj);
            rpcInstance.masterChannel.emit("authFailed", err);
          });
        });
      }
    });

    io.use(function(socket, next) {
      auth.authUser(socket, {
        privilige_level: 1
      });

      next();
    });

    if (app.get("env") === "development") {
      var debugChnl = {};

      debugChnl.getHealth = function() {
        var allModels = {};
        var index = allQueries.length;

        while (index--) {
          var modelQueriesForSerialization = {};
          var model = allQueries[index];

          for (var LQ in model.queries) {
            var listenerCount = Object.keys(model.queries[LQ].listeners).length;
            modelQueriesForSerialization[LQ] = listenerCount;
          }

          allModels[model.modelName] = modelQueriesForSerialization;
        }

        return {
          pid: process.pid,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          liveQueries: allModels
        };
      };

      rpcInstance.expose("Moonridge_debug", debugChnl);
    }

    return {
      rpcInstance: rpcInstance,
      io: io,
      server: server
    };
  }

  var MRInstance = {
    model: regNewModel,
    userModel: registerUserModel,
    bootstrap: bootstrap
  };

  _.extend(MRInstance, auth);
  return MRInstance;
};