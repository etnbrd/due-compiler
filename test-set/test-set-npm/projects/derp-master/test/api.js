var should = require("should");
var derp = require("..");
var parse = require("../lib/derp/parse-post");

// Set up dummy data
var dummyPost = {
  title: "dummy title",
  url: "dummy url",
  path: "dummy path",
  content: "dummy content"
};
var dummyPost_renamed = {
  title: "dummy title",
  url: "dummy url",
  path: "different dummy path",
  content: "dummy content"
};
var dummyPost_modifiedUrl = {
  title: "dummy title",
  url: "different dummy url",
  path: "dummy path",
  content: "dummy content"
};
var dummyPost_modifiedContent = {
  title: "dummy title",
  url: "dummy url",
  path: "dummy path",
  content: "different dummy content"
};
var differentPost = {
  title: "different dummy title",
  url: "different dummy url",
  path: "different dummy path",
  content: "different dummy content"
};

describe('private API function', function() {

  describe('parse-post', function() {

    it('should correctly parse a post', function(done) {
      parse("test/fixtures/Derp.md")
        .then(function(post) {
          post.should.have.keys('title', 'url', 'content', 'path');
          done();
        });
    });
  });

  describe('addPost', function() {

    it('should add a post to postsArr, and update postsMap and postsMapByPath', function(done) {
      derp.addPost(dummyPost);
      derp.postsArr.should.have.a.lengthOf(1);
      derp.postsArr[0].should.eql(dummyPost);

      derp.postsMap.should.have.key("dummy url");
      derp.postsMap["dummy url"].should.be.exactly(0);

      derp.postsMapByPath.should.have.key("dummy path");
      derp.postsMapByPath["dummy path"].should.be.exactly("dummy url");

      done();
    });
  });

  describe('updatePost', function() {

    beforeEach(function() {
      derp.postsArr = [];
      derp.postsMap = {};
      derp.postsMapByPath = {};
      
      derp.addPost(dummyPost);
    });

    it("should update the post if it's renamed", function(done) {
      derp.updatePost(dummyPost, dummyPost_renamed);
      derp.postsArr[0].should.equal(dummyPost_renamed);
      done();
    });

    it("should update the post if it's URL is modifed", function(done) {
      derp.updatePost(dummyPost, dummyPost_modifiedUrl);
      derp.postsArr[0].should.equal(dummyPost_modifiedUrl);
      done();
    });

    it("should update the post if it's content is modifed", function(done) {
      derp.updatePost(dummyPost, dummyPost_modifiedContent);
      derp.postsArr[0].should.equal(dummyPost_modifiedContent);
      done();
    });
  });

  describe('removePost', function() {
    
    beforeEach(function() {
      derp.postsArr = [];
      derp.postsMap = {};
      derp.postsMapByPath = {};
      
      derp.addPost(differentPost);
      derp.addPost(dummyPost);
    });

    it('should delete the post at the given path', function(done) {
      derp.removePost(differentPost.path);
      derp.postsArr[0].should.equal(dummyPost);
      derp.postsMap[dummyPost.url].should.equal(0);
      derp.postsMapByPath[dummyPost.path].should.equal(dummyPost.url);
      done();
    });

  });

});

describe('public API function', function() {

  describe('getPost', function() {
    beforeEach(function(done) {
      derp.setup({
        post_directory: "test/fixtures"
      })
        .then(function() {
          done();
        });
    });

    it("should return the specified post", function(done) {
      derp.getPost("derp")
        .url.should.be.exactly("derp");
      done();
    });

    it("should return undefined if the post doesn't exist", function(done) {
      should.not.exist(derp.getPost('HERP'));
      done();
    });

  });

  describe('getAllPosts', function() {
    beforeEach(function(done) {
      derp.setup({
        post_directory: "test/fixtures"
      })
        .then(function() {
          done();
        });
    });

    it('should by default return an array of posts', function(done) {
      derp.getAllPosts()
        .length.should.be.ok;
      done();
    });
  });

  describe("setup", function() {
    it("should return a resolved promise", function(done) {
      derp.setup({
        post_directory: "test/fixtures"
      })
        .then(function(stuff) {
          stuff.should.be.ok;
          done();
        });
    });
  });

});