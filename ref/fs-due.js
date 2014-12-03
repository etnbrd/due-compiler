var fs = require('fs'),
    mock = require('due').mock;

module.exports = {
  readdir:       mock(fs.readdir),
  stat:         mock(fs.stat),
  readFile:     mock(fs.readFile)
}