var fs = require("fs"),
  path = require("path"),
  querystring = require("querystring"),
  url = require("url"),
  winston = require("winston"),
  express = require("express"),
  hogan = require("hogan.js"),
  request = require("request");

var config = {
  appName: "Timbits",
  base: "",
  port: 5678,
  home: process.cwd(),
  maxAge: 60,
  engine: "hjs",
  discovery: true,
  help: true,
  test: true,
  json: true,
  jsonp: true
};

function filteredFiles(folder, pattern) {
  var files = [];

  if (fs.existsSync(folder)) {
    fs.readdirSync(folder).forEach(function(file) {
      if (file.match(pattern) != null)
        files.push(file);
    });
  }

  return files;
}

function loadTimbits(callback) {
  var folder = path.join(config.home, "/timbits");
  var files = filteredFiles(folder, /\.(coffee|js)$/);
  var pending = files.length;

  files.forEach(function(file) {
    var name = file.substring(0, file.lastIndexOf("."));

    timbits.add(name, require(path.join(folder, file)), function() {
      pending--;

      if (pending === 0)
        callback();
    });
  });
}

function loadViews(timbit) {
  timbit.views = [];
  var pattern = new RegExp("." + timbits.app.settings["view engine"] + "$"),
    folder = path.join(config.home, "views", timbit.viewBase);

  if (fs.existsSync(folder)) {
    var files = fs.readdirSync(folder);

    files.forEach(function(file) {
      timbit.views.push(file.replace(pattern, ""));
    });
  }

  if (timbit.views.length === 0)
    timbit.views.push(timbit.defaultView);
}

function getTestValues(values, alltests) {
  if (values != null && values.length != null && values.length !== 0) {
    if (alltests)
      return values;
    else
      return values.slice(0, 1);
  } else {
    return [];
  }
}

function compileTemplate(name) {
  var filename = path.join(__dirname, "templates", name + ".hjs");
  var contents = fs.readFileSync(filename);
  return hogan.compile(contents.toString());
}

function allowedMethods(methods) {
  var methodsAllowed = {
    "GET": true,
    "POST": false,
    "PUT": false,
    "HEAD": false,
    "DELETE": false
  };

  for (var key in methods) {
    var newKey = key.toUpperCase();

    if (methodsAllowed[newKey] != undefined) {
      methodsAllowed[newKey] = Boolean(methods[key]);
    }
  }

  return methodsAllowed;
}

var timbits = this;
this.box = {};
this.pantry = require("pantry");

this.templates = {
  help: compileTemplate("help"),
  timbitHelp: compileTemplate("timbit-help"),
  test: compileTemplate("test")
};

this.getLogLevel = function() {
  switch (process.env.NODE_ENV) {
    case "production":
      return "info";
    case "test":
      return "error";
    default:
      return "silly";
  }
};

this.log = new winston.Logger({
  transports: [new winston.transports.Console({
    colorize: true,
    timestamp: true,
    level: this.getLogLevel()
  })]
});

this.serve = function(options) {
  for (var key in options) {
    value = options[key];
    config[key] = value;
  }

  var app = timbits.app = express();
  app.set("views", "" + config.home + "/views");
  app.set("view engine", config.engine);
  app.set("jsonp callback", config.jsonp);
  app.use(express.favicon());

  if (app.get("env") === "development")
    app.use(express.logger("dev"));

  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.static(path.join(config.home, "public")));
  app.use(express.static(path.join(__dirname, "../resources")));
  app.use(express.errorHandler());

  if (config.help) {
    app.all(config.base + "/", function(req, res) {
      res.redirect(config.base + "/timbits/help");
    });
  }

  app.get(config.base + "/timbits/json", function(req, res) {
    if (config.discovery) {
      res.json(timbits.box);
    } else {
      res.send(404, "Automatic Discovery has been disabled");
    }
  });

  app.get(config.base + "/timbits/help", function(req, res) {
    if (config.help) {
      var context = {
        title: "Timbits Help",
        timbits: []
      };

      for (var key in timbits.box) {
        context.timbits.push(key);
      }

      res.send(timbits.templates.help.render(context));
    } else {
      res.send(404, "Automatic Help has been disabled");
    }
  });

  app.get(config.base + "/timbits/test/:which?", function(req, res) {
    if (config.test) {
      var alltests = req.params.which === "all",
        all_results = [],
        pending = Object.keys(timbits.box).length;

      if (pending) {
        for (name in timbits.box) {
          var timbit = timbits.box[name];

          require("due").mock(timbit.test).call(timbit, "http://" + req.headers.host, alltests).then(function(results) {
            results.forEach(function(result) {
              all_results.push(result);
            });

            if (--pending === 0) {
              var passed = 0,
                failed = 0;

              all_results.forEach(function(result) {
                if (result.passed)
                  passed++;
                else
                  failed++;
              });

              res.send(timbits.templates.test.render({
                title: "Testing Summary: all timbits",
                passed: passed,
                failed: failed,
                results: all_results
              }));
            }
          });
        }
      } else {
        res.send(ck.render(views.test, {}));
      }
    } else {
      res.send(404, "Automatic Test has been disabled");
    }
  });

  require("due").mock(loadTimbits).call(global).then(function() {
    try {
      timbits.server = app.listen(process.env.PORT || process.env.C9_PORT || config.port);

      timbits.log.info(
        "Timbits server listening on port " + timbits.server.address().port + " in " + app.settings.env + " mode"
      );
    } catch (err) {
      timbits.log.error(
        "Server could not start on port " + (process.env.PORT || process.env.C9_PORT || config.port) + ". (" + err + ")"
      );

      console.log("\nPress Ctrl+C to Exit");
      process.exit(1);
    }
  });

  return app;
};

this.add = function(name, timbit, callback) {
  timbits.log.info("Placing " + name + " in the box");
  timbits.box[name] = timbit;
  timbit.name = name;

  if (timbit.viewBase == null)
    timbit.viewBase = name;

  if (timbit.defaultView == null)
    timbit.defaultView = "default";

  if (timbit.maxAge == null)
    timbit.maxAge = config.maxAge;

  timbit.methods = allowedMethods((timbit.methods == null ? {} : timbit.methods));
  loadViews(timbit);

  timbits.app.get(config.base + "/" + name + "/help", function(req, res) {
    if (config.help)
      res.send(timbits.templates.timbitHelp.render(timbit));
    else
      res.send(404, "Automatic Help has been disabled");
  });

  timbits.app.get(config.base + "/" + name + "/test/:which?", function(req, res) {
    var alltests;

    if (config.test) {
      alltests = req.params.which === "all";

      require("due").mock(timbit.test).call(timbit, "http://" + req.headers.host, alltests).then(function(results) {
        var passed = 0,
          failed = 0;

        results.forEach(function(result) {
          if (result.passed)
            passed++;
          else
            failed++;
        });

        res.send(timbits.templates.test.render({
          title: "Testing Summary: " + timbit.name,
          passed: passed,
          failed: failed,
          results: results
        }));
      });
    } else {
      res.send(404, "Automatic Test has been disabled");
    }
  });

  timbits.app.all(config.base + "/" + name + "/:view?", function(req, res) {
    if (timbit.methods[req.method] == undefined || timbit.methods[req.method] == false) {
      res.send(405, "Method Not Allowed");
      return;
    }

    if (req.params.view == null)
      req.params.view = timbit.defaultView;

    var context = {
      name: timbit.name,
      view: timbit.viewBase + "/" + req.params.view,
      maxAge: timbit.maxAge
    };

    for (var key in req.query) {
      var has_alias = false;

      if (context[key] == null && req.query[key] != null && req.query[key] !== "") {
        for (var p in timbit.params) {
          if (timbit.params[p] === key) {
            has_alias = true;
            context[p] = req.query[key];
          }
        }

        if (!has_alias)
          context[key] = req.query[key];
      }
    }

    for (var key in timbit.params) {
      var param = timbit.params[key];

      if (context[key] == null)
        context[key] = param.default;

      var value = context[key];

      if (value != null) {
        if (param.type == null)
          param.type = "String";

        switch (param.type.toLowerCase()) {
          case "number":
            context[key] = Number(value);

            if (isNaN(context[key]))
              throw value + " is not a valid Number for " + key;

            break;
          case "boolean":
            switch (value.toLowerCase()) {
              case "true":
                context[key] = true;
                break;
              case "false":
                context[key] = false;
                break;
              default:
                throw value + " is not a valid value for " + key + ".  Must be true of false";
            }

            break;
          case "date":
            context[key] = Date.parse(value);

            if (isNaN(context[key]))
              throw value + " is not a valid date for " + key;

            break;
        }
      }

      if (param.required && value == null) {
        throw key + " is a required parameter";
      }

      if (value != null && param.strict && param.values.indexOf(value) === -1) {
        throw value + " is not a valid value for " + key + ".  Must be one of [" + param.values.join() + "]";
      }

      if (value instanceof Array && !param.multiple) {
        throw key + " must be a single value";
      }
    }

    timbit.eat(req, res, context);
  });

  if (config.base != null && timbit.examples != null) {
    timbit.examples.forEach(function(example) {
      example.href = config.base + example.href;
    });
  }

  callback();
};

var Timbit = this.Timbit = function() {};

Timbit.prototype.render = function(req, res, context) {
  res.setHeader("Cache-Control", "max-age=" + context.maxAge);
  res.setHeader("Edge-Control", "!no-store, max-age=" + context.maxAge);

  if (/^(\w+|(\w+-)+\w+)\/json$/.test(context.view)) {
    if (config.json)
      res.json(context);
    else
      res.send(404, "JSON view has been disabled");
  } else {
    require("due").mock(res.render).call(res, context.view, context).then(function(err, str) {
      if (err) {
        timbits.log.error("Error rendering view " + context.view);
        req.next(err);
      } else {
        if (context.callback != null)
          res.json(str);
        else
          res.send(str);
      }
    });
  }
};

Timbit.prototype.fetch = function(req, res, context, options, callback) {
  if (callback == null)
    callback = this.render;

  var name = options.name || "data";

  require("due").mock(timbits.pantry.fetch).call(timbits.pantry, options).then(function(error, results) {
    if (error) {
      timbits.log.error("Error fetching resource '" + options.uri);
      req.next(error);
    } else {
      if (context[name] != null) {
        if (Object.prototype.toString.call(context[name][0]) === "[object Array]")
          context[name].push(results);
        else
          context[name] = [context[name], results];
      } else {
        context[name] = results;
      }

      callback(req, res, context);
    }
  });
};

Timbit.prototype.eat = function(req, res, context) {
  this.render(req, res, context);
};

Timbit.prototype.generateTests = function(alltests) {
  var required = [];

  for (var name in this.params) {
    var param = this.params[name];

    if (param.required) {
      var temp = [];

      getTestValues(param.values, alltests).forEach(function(value) {
        if (required.length === 0)
          temp.push(name + "=" + value);
        else required.forEach(function(item) {
          temp.push(item + "&" + name + "=" + value);
        });
      });

      required = temp;
    }
  }

  var queries = [];

  required.forEach(function(item) {
    queries.push(item);
  });

  if (alltests) {
    for (var name in this.params) {
      var param = this.params[name];

      if (!param.required) {
        getTestValues(param.values, alltests).forEach(function(value) {
          if (required.length === 0)
            queries.push(name + "=" + value);
          else required.forEach(function(item) {
            queries.push(item + "&" + name + "=" + value);
          });
        });
      }
    }
  }

  var hrefs = [];
  var name = this.name;

  this.views.forEach(function(view) {
    if (queries.length) queries.forEach(function(query) {
      hrefs.push("/" + name + "/" + view + "?" + query);
    });
    else
      hrefs.push("/" + name + "/" + view);
  });

  return hrefs;
};

Timbit.prototype.test = function(host, alltests, callback) {
  var tests = this.generateTests(alltests);
  var testsLength = 1;
  var getMethod = this.methods["GET"];
  var postMethod = this.methods["POST"];

  if (getMethod && postMethod)
    testsLength = 2;

  if (this.examples) {
    this.examples.forEach(function(example) {
      tests.push(example.href);
    });
  }

  var results = [];
  var name = this.name;

  tests.forEach(function(href) {
    if (getMethod) {
      require("due").mock(request).call(global, host + href).then(function(error, response, body) {
        error = error || ((response.statusCode === 200 ? "" : body));

        results.push({
          timbit: name,
          href: href,
          error: error,
          status: response.statusCode,
          passed: response.statusCode === 200,
          failed: response.statusCode !== 200
        });

        if (results.length === tests.length * testsLength)
          return callback(results);
      });
    }

    if (postMethod) {
      require("due").mock(request.post).call(request, host + href).then(function(error, response, body) {
        error = error || ((response.statusCode === 200 ? "" : body));

        results.push({
          timbit: name,
          href: href,
          error: error,
          status: response.statusCode,
          passed: response.statusCode === 200,
          failed: response.statusCode !== 200
        });

        if (results.length === tests.length * testsLength)
          return callback(results);
      });
    }
  });
};

Timbit.prototype.paramsAsArray = function() {
  var array = [];

  for (var key in this.params) {
    array.push({
      key: key,
      value: this.params[key]
    });
  }

  return array;
};