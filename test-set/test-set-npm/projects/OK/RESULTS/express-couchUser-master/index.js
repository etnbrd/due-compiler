var express = require("express");
var nano = require("nano");
var uuid = require("uuid");
var emailTemplates = require("email-templates");
var nodemailer = require("nodemailer");
var _ = require("underscore");
var only = require("only");

module.exports = function(config) {
  var app = express(),
    safeUserFields = (config.safeUserFields ? config.safeUserFields : "name email roles"),
    db;

  function configureNano(cookie) {
    return nano({
      url: config.users,
      request_defaults: config.request_defaults,
      cookie: cookie
    });
  }

  db = configureNano();
  var transport;

  try {
    transport = nodemailer.createTransport(config.email.service, config.email[config.email.service]);
  } catch (err) {
    console.log("*** Email Service is not configured ***");
  }

  if (!config.validateUser) {
    config.validateUser = function(input, cb) {
      cb();
    };
  }

  app.post("/api/user/signup", function(req, res) {
    if (!req.body || !req.body.name || !req.body.password || !req.body.email) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "A name, password, and email address are required."
      }));
    }

    if (req.body.confirm_password)
      delete req.body.confirm_password;

    req.body.type = "user";

    require("due").mock(db.view).call(db, "user", "all", {
      key: req.body.email
    }).then(function(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (body.rows && body.rows.length > 0) {
        return res.send(400, {
          ok: false,
          message: "A user with this email address already exists.  Try resetting your password instead."
        });
      }

      db.insert(req.body, "org.couchdb.user:" + req.body.name, done);
    });

    function done(err, body) {
      if (err) {
        return res.send(err.status_code, err);
      }

      if (config.verify) {
        try {
          validateUserByEmail(req.body.email);

          require("due").mock(db.get).call(db, body._id).then(function(err, user) {
            if (err) {
              return res.send(err.status_code, err);
            }

            res.send(200, JSON.stringify({
              ok: true,
              user: strip(user)
            }));
          });
        } catch (email_err) {
          res.send(err.status_code, email_err);
        }
      } else {
        res.send(200, JSON.stringify(_.extend(req.body, {
          _rev: body.rev,
          ok: true
        })));
      }
    }
  });

  app.post("/api/user/signin", function(req, res) {
    if (!req.body || !req.body.name || !req.body.password) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "A name, and password are required."
      }));
    }

    db.auth(
      req.body.name,
      req.body.password,
      populateSessionWithUser(function(err, user) {
        if (err) {
          return res.send((err.statusCode ? err.statusCode : 500), {
            ok: false,
            message: err.message,
            error: err.error
          });
        }

        res.end(JSON.stringify({
          ok: true,
          user: strip(user)
        }));
      })
    );

    function populateSessionWithUser(cb) {
      return function(err, body, headers) {
        var _user;

        if (err) {
          return cb(err);
        }

        require("due").mock(getUserName).call(global, body.name, headers["set-cookie"]).then(function(err, name) {
          if (err) {
            return cb(err);
          }

          var __due = require("due").mock(lookupUser).call(global, name);
          return __due;
        }).then(function(err, _user) {
          user = _user;

          if (err) {
            return cb(err);
          }

          if (config.verify && !user.verified) {
            return cb({
              statusCode: 401,
              ok: false,
              message: "You must verify your account before you can log in.  Please check your email (including spam folder) for more details."
            });
          }

          if (user.enabled === false) {
            return cb({
              statusCode: 403,
              ok: false,
              message: "Your account is no longer enabled.  Please contact an Administrator to enable your account."
            });
          }

          var __due = require("due").mock(config.validateUser).call(config, {
            req: req,
            user: user,
            headers: headers
          });

          return __due;
        }).then(function(err, data) {
          if (err) {
            err.statusCode = err.statusCode || 401;
            err.message = err.message || "Invalid User Login";
            err.error = err.error || "unauthorized";
            return cb(err);
          }

          var __due = require("due").mock(createSession).call(global, user, data);
          return __due;
        }).then(function() {
          cb(null, user);
        });
      };
    }

    function getUserName(name, authCookie, cb) {
      if (name) {
        cb(null, name);
      } else {
        configureNano(authCookie).session(function(err, session) {
          cb(err, session.userCtx.name);
        });
      }
    }

    function lookupUser(name, cb) {
      db.get("org.couchdb.user:" + name, cb);
    }

    function createSession(user, data, cb) {
      req.session.regenerate(function() {
        req.session.user = user;

        if (data) {
          _.each(data, function(val, key) {
            req.session[key] = val;
          });
        }

        cb();
      });
    }
  });

  app.post("/api/user/signout", function(req, res) {
    require("due").mock(req.session.destroy).call(req.session).then(function(err) {
      if (err) {
        console.log("Error destroying session during logout" + err);
      }

      res.send(200, JSON.stringify({
        ok: true,
        message: "You have successfully logged out."
      }));
    });
  });

  app.post("/api/user/forgot", function(req, res) {
    if (!req.body || !req.body.email) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "An email address is required."
      }));
    }

    var user;

    db.view("user", "all", {
      key: req.body.email
    }, saveUser);

    function saveUser(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (body.rows && body.rows.length === 0) {
        return res.send(500, JSON.stringify({
          ok: false,
          message: "No user found with that email."
        }));
      }

      user = body.rows[0].value;

      if (user.enabled === false) {
        return res.send(403, JSON.stringify({
          ok: false,
          message: "Your account is no longer enabled.  Please contact an Administrator to enable your account."
        }));
      }

      user.code = uuid.v1();
      db.insert(user, user._id, createEmail);
    }

    function createEmail(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      emailTemplates(config.email.templateDir, renderForgotTemplate);
    }

    function renderForgotTemplate(err, template) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      config.app.url = "http://" + req.headers.host;

      template("forgot", {
        user: user,
        app: config.app
      }, sendEmail);
    }

    function sendEmail(err, html, text) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (!transport) {
        return res.send(500, {
          error: "transport is not configured!"
        });
      }

      transport.sendMail({
        from: config.email.from,
        to: user.email,
        subject: config.app.name + ": Reset Password Request",
        html: html,
        text: text
      }, done);
    }

    function done(err, status) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      res.send(200, JSON.stringify({
        ok: true,
        message: "forgot password link sent..."
      }));
    }
  });

  app.get("/api/user/code/:code", function(req, res) {
    if (!req.params.code) {
      return res.send(500, JSON.stringify({
        ok: false,
        message: "You must provide a code parameter."
      }));
    }

    require("due").mock(db.view).call(db, "user", "code", {
      key: req.params.code
    }).then(function(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (body.rows.length > 1) {
        return res.send(500, JSON.stringify({
          ok: false,
          message: "More than one user found."
        }));
      } else if (body.rows.length === 0) {
        return res.send(500, JSON.stringify({
          ok: false,
          message: "Reset code is not valid."
        }));
      } else {
        var user = body.rows[0].value;
        var name = user.name;

        if (user.fname && user.lname) {
          name = user.fname + " " + user.lname;
        }

        return res.send(200, JSON.stringify({
          ok: true,
          user: strip(user)
        }));
      }
    });
  });

  app.post("/api/user/reset", function(req, res) {
    if (!req.body || !req.body.code || !req.body.password) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "A password and valid password reset code are required."
      }));
    }

    db.view("user", "code", {
      key: req.body.code
    }, checkCode);

    function checkCode(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (body.rows && body.rows.length === 0) {
        return res.send(500, JSON.stringify({
          ok: false,
          message: "Not Found"
        }));
      }

      var user = body.rows[0].value;
      user.password = req.body.password;
      delete user.code;

      require("due").mock(db.insert).call(db, user, user._id).then(function(err, user) {
        if (err) {
          return res.send((err.status_code ? err.status_code : 500), err);
        }

        return res.send(200, JSON.stringify({
          ok: true,
          user: strip(user)
        }));
      });
    }
  });

  app.post("/api/user/verify", function(req, res) {
    if (!req.body || !req.body.email) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "An email address must be passed as part of the query string before a verification code can be sent."
      }));
    }

    try {
      validateUserByEmail(req.body.email);

      res.send(200, JSON.stringify({
        ok: true,
        message: "Verification code sent..."
      }));
    } catch (validate_err) {
      res.send(validate_err.status_code, validate_err);
    }
  });

  app.get("/api/user/verify/:code", function(req, res) {
    if (!req.params.code) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "A verification code is required."
      }));
    }

    var user;

    db.view("user", "verification_code", {
      key: req.params.code
    }, saveUser);

    function saveUser(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      if (body.rows && body.rows.length === 0) {
        return res.send(400, JSON.stringify({
          ok: false,
          message: "Invalid verification code."
        }));
      }

      user = body.rows[0].value;

      if (!user.verification_code || user.verification_code !== req.params.code) {
        return res.send(400, JSON.stringify({
          ok: false,
          message: "The verification code you attempted to use does not match our records."
        }));
      }

      delete user.verification_code;
      user.verified = new Date();

      require("due").mock(db.insert).call(db, user, user._id).then(function(err, body) {
        if (err) {
          return res.send((err.status_code ? err.status_code : 500), err);
        }

        return res.send(200, JSON.stringify({
          ok: true,
          message: "Account verified."
        }));
      });
    }
  });

  app.get("/api/user/current", function(req, res) {
    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "Not currently logged in."
      }));
    }

    res.send(200, JSON.stringify({
      ok: true,
      user: strip(req.session.user)
    }));
  });

  app.get("/api/user/:name", function(req, res) {
    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "You must be logged in to use this function."
      }));
    }

    require("due").mock(db.get).call(db, "org.couchdb.user:" + req.params.name).then(function(err, user) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      return res.send(200, JSON.stringify({
        ok: true,
        user: strip(user)
      }));
    });
  });

  app.put("/api/user/:name", function(req, res) {
    var _user;

    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "You must be logged in to use this function"
      }));
    } else if (config.adminRoles && !hasAdminPermission(req.session.user) && req.session.user.name !== req.params.name) {
      return res.send(403, JSON.stringify({
        ok: false,
        message: "You do not have permission to use this function."
      }));
    }

    require("due").mock(db.get).call(db, "org.couchdb.user:" + req.params.name).then(function(err, _user) {
      user = _user;

      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      var updates = strip(req.body);
      var keys = Object.keys(updates);

      for (var i in keys) {
        var key = keys[i];

        if (key === "roles" && !hasAdminPermission(req.session.user)) {
          console.log(
            "Stripped updated role information, non-admin users are not allowed to change roles."
          );
        } else {
          user[key] = updates[key];
        }
      }

      var __due = require("due").mock(db.insert).call(db, user, "org.couchdb.user:" + req.params.name);
      return __due;
    }).then(function(err, data) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      user._rev = data.rev;

      if (req.session.user.name === req.params.name) {
        req.session.user = strip(user);
      }

      return res.send(200, JSON.stringify({
        ok: true,
        user: strip(user)
      }));
    });
  });

  app.del("/api/user/:name", function(req, res) {
    var respondUserDeleted;

    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "You must be logged in to use this function"
      }));
    } else if (config.adminRoles && !hasAdminPermission(req.session.user)) {
      return res.send(403, JSON.stringify({
        ok: false,
        message: "You do not have permission to use this function."
      }));
    }

    require("due").mock(db.get).call(db, "org.couchdb.user:" + req.params.name).then(function(err, user) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      var __due = require("due").mock(db.destroy).call(db, user._id, user._rev);
      return __due;
    }).then(function(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      respondUserDeleted = function respondUserDeleted() {
        res.send(200, JSON.stringify({
          ok: true,
          message: "User " + req.params.name + " deleted."
        }));
      };

      if (req.session.user.name === req.params.name) {
        var __due = require("due").mock(req.session.destroy).call(req.session);
      } else {
        respondUserDeleted();
      }

      return __due;
    }).then(function(err) {
      if (err) {
        console.log("Error destroying session for " + req.params.name + " " + err);
      }

      respondUserDeleted();
    });
  });

  app.post("/api/user", function(req, res) {
    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "You must be logged in to use this function"
      }));
    } else if (config.adminRoles && !hasAdminPermission(req.session.user)) {
      return res.send(403, JSON.stringify({
        ok: false,
        message: "You do not have permission to use this function."
      }));
    }

    req.body.type = "user";

    require("due").mock(db.insert).call(db, req.body, "org.couchdb.user:" + req.body.name).then(function(err, data) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      res.send(200, JSON.stringify({
        ok: true,
        data: data
      }));
    });
  });

  app.get("/api/user", function(req, res) {
    if (!req.session || !req.session.user) {
      return res.send(401, JSON.stringify({
        ok: false,
        message: "You must be logged in to use this function"
      }));
    }

    if (!req.query.roles) {
      return res.send(400, JSON.stringify({
        ok: false,
        message: "Roles are required!"
      }));
    }

    var keys = req.query.roles.split(",");

    require("due").mock(db.view).call(db, "user", "role", {
      keys: keys
    }).then(function(err, body) {
      if (err) {
        return res.send((err.status_code ? err.status_code : 500), err);
      }

      var users = _(body.rows).pluck("value");

      res.send(200, JSON.stringify({
        ok: true,
        users: stripArray(users)
      }));
    });
  });

  function strip(value) {
    return only(value, safeUserFields);
  }

  function stripArray(array) {
    var returnArray = [];

    array.forEach(function(value) {
      returnArray.push(only(value, safeUserFields));
    });

    return returnArray;
  }

  function hasAdminPermission(user) {
    if (!config.adminRoles) {
      return true;
    }

    if (user.roles) {
      for (var i in user.roles) {
        var role = user.roles[i];

        if (config.adminRoles instanceof String) {
          if (config.adminRoles === role) {
            return true;
          }
        } else if (config.adminRoles instanceof Array) {
          if (config.adminRoles.indexOf(role) >= 0) {
            return true;
          }
        } else {
          console.log(
            "config.adminRoles must be a String or Array.  Admin checks are disabled until this is fixed."
          );

          return true;
        }
      }
    }

    return false;
  }

  function validateUserByEmail(email) {
    var user;

    db.view("user", "all", {
      key: email
    }, saveUserVerificationDetails);

    function saveUserVerificationDetails(err, body) {
      if (err) {
        throw err;
      }

      if (body.rows && body.rows.length === 0) {
        var error = new Error("No user found with the specified email address.");
        error.status_code = 404;
        throw error;
      }

      user = body.rows[0].value;
      user.verification_code = uuid.v1();
      db.insert(user, user._id, verificationEmail);
    }

    function verificationEmail(err, body) {
      if (err) {
        throw err;
      }

      emailTemplates(config.email.templateDir, renderVerificationTemplate);
    }

    function renderVerificationTemplate(err, template) {
      if (err) {
        throw err;
      }

      template("verify", {
        user: user,
        app: config.app
      }, sendVerificationEmail);
    }

    function sendVerificationEmail(err, html, text) {
      if (err) {
        throw err;
      }

      if (!transport) {
        var error = new Error("Mail transport is not configured!");
        error.status_code = 500;
        throw error;
      }

      transport.sendMail({
        from: config.email.from,
        to: user.email,
        subject: config.app.name + ": Please Verify Your Account",
        html: html,
        text: text
      }, done);
    }

    function done(err, status) {
      if (err) {
        throw err;
      }
    }
  }

  return app;
};