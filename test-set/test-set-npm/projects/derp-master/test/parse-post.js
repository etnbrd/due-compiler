var should = require("should");
var parse = require('../lib/derp/parse-post');

describe("parse post", function() {

  it("should ignore posts without a H1", function(done) {
    parse("test/fixtures/no title.md").then(null, function(err) {
      err.should.be.ok;
      done();
    });
  });

  it("should ignore posts without a URL", function(done) {
    parse("test/fixtures/no url.md").then(null, function(err) {
      err.should.be.ok;
      done();
    });
  });

  it("should create a post with a title", function(done) {
    parse("test/fixtures/Derp.md").then(function(post) {
      post.title.should.be.exactly("Derpy derp");
      done();
    });
  });

  it("should create a post with a path", function(done) {
    parse("test/fixtures/Derp.md").then(function(post) {
      post.path.should.be.exactly("test/fixtures/Derp.md");
      done();
    });
  });

  it("should create a post with a URL", function(done) {
    parse("test/fixtures/Derp.md").then(function(post) {
      post.url.should.be.exactly("derp");
      done();
    });
  });

});