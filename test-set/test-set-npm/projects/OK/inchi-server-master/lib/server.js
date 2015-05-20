(function () {

    var cluster = require('cluster');
      procs = require('os').cpus().length * 2;

    if (cluster.isMaster) {
        for (var i = 0; i < procs; i += 1) {
            cluster.fork();
        }

        // report exits?
    } else {
        (function () {
            var express = require('express'),
                inchi = require('./inchi.js');

            var app = express();

            app.use("/", inchi);

            app.listen(4901);
        }());
    }

}());
