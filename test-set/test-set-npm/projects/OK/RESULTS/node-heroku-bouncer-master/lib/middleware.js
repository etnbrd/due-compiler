"use strict";
var encryptor = require("simple-encryptor");
var request = require("request");

module.exports = function(options) {
  var cipher = encryptor(options.encryptionSecret);

  return function(req, res, next) {
    var userSession = getUserSession(req, options.sessionSyncNonce);

    if (!userSession && isIgnoredRoute(req.path)) {
      return next();
    }

    if (userSession) {
      var isHerokai = /@heroku\.com$/.test(userSession.user.email);

      if (options.herokaiOnlyHandler && !isHerokai) {
        return options.herokaiOnlyHandler(req, res, next);
      }

      require("due").mock(ensureValidToken).call(global, userSession).then(function(err) {
        if (err) {
          return reauthenticate(req, res);
        }

        req.session.userSession = cipher.encrypt(userSession);

        req["heroku-bouncer"] = {
          token: userSession.accessToken,
          email: userSession.user.email,
          name: userSession.user.name,
          id: userSession.user.id
        };

        next();
      });
    } else if (isOAuthPath(req.path)) {
      next();
    } else {
      reauthenticate(req, res);
    }
  };

  function ensureValidToken(userSession, cb) {
    var then = new Date(userSession.createdAt);
    var now = new Date();
    var remaining = (now - then) / 1000;
    remaining += 600;

    if (remaining > userSession.expiresIn) {
      require("due").mock(request.post).call(request, {
        url: options.oAuthServerURL + "/oauth/token",
        json: true,

        form: {
          grant_type: "refresh_token",
          refresh_token: userSession.refreshToken,
          client_secret: options.oAuthClientSecret
        }
      }).then(function(err, res, body) {
        if (err) {
          return cb(err);
        }

        if (res.statusCode === 200) {
          userSession.accessToken = body.access_token;
          userSession.refreshToken = body.refresh_token;
          userSession.createdAt = new Date().toISOString();
          userSession.expiresIn = body.expires_in;
          cb();
        } else {
          cb(new Error("Expected 200 from Heroku Identity, got " + res.statusCode));
        }
      });
    } else {
      cb();
    }
  }

  function getUserSession(req, checkNonce) {
    var session = cipher.decrypt(req.session.userSession);

    if (checkNonce) {
      return (nonceMatch(req, checkNonce) ? session : null);
    } else {
      return (session && session.user && session.user.email ? session : null);
    }
  }

  function isIgnoredRoute(route) {
    var pattern;

    for (var i = 0; i < options.ignoredRoutes.length; i++) {
      pattern = options.ignoredRoutes[i];

      if (pattern.test(route)) {
        return true;
      }
    }
  }

  function reauthenticate(req, res) {
    var isJSON = /json/.test(req.get("accept"));
    req.session.reset();

    if (req.method.toLowerCase() === "get" && !isJSON) {
      req.session.redirectPath = req.url;
      res.redirect("/auth/heroku");
    } else {
      res.statusCode = 401;

      res.json({
        id: "unauthorized",
        message: "Please authenticate."
      });
    }
  }
};

function nonceMatch(req, checkNonce) {
  return req.session.herokuBouncerSessionNonce === req.cookies[checkNonce];
}

function isOAuthPath(path) {
  return ["/auth/heroku", "/auth/heroku/callback"].indexOf(path) >= 0;
}