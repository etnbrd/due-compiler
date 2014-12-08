var fs = require('fs');
var source = __dirname;
fs.readdir(source).then(function(err, files) {
  if (err)
    throw 'Error finding files: ' + err;
  var total = 0,
    pending = files.length;
  files.forEach(function(filename, fileIndex) {
    var control;
    fs.stat(source + '/' + filename).then(function(err, stat) {
      if (err)
        throw 'Error looking for file: ' + err;
      control = 0;
      if (stat.isFile())
        var __due = fs.readFile(source + '/' + filename);
      else
        pending--;
      return __due;
    }).then(function(err, file) {
      if (err)
        throw 'Error opening file: ' + err;
      control++;
      var lines = String(file).split('\n'),
        number = lines.reduce(function(n, line) {
          return n + (line.length > 0 ? 1 : 0);
        }, 0);
      console.log(filename, ' : \t\t', number);
      total += number;
      pending--;
      if (pending === 0)
        console.log('TOTAL : \t\t', total);
    });
  });
});