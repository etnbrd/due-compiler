(function () {
    'use strict';

    var inchi = require('inchi');

    module.exports = function handler(req, res) {
        var p = req.path.slice(1),
            m;

        res.set('Cache-Control', 'public, max-age=345600');
        res.set('ETag', '"' + p + '"');

        inchi.inchilib.GetStructFromINCHI(p, function (err, m) {
            res.send(err ? err : m);
        });
    };

}());
