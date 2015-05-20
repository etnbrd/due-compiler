var timbits = require("../../lib/timbits");
var timbit = module.exports = new timbits.Timbit();
timbit.about = "    Example of a timbit which re-uses another timbits views    This timbit will query Wordpress API and display the results    This timbit re-uses the views from the chocolate timbit    ";

timbit.examples = [{
  href: "/dutchie/?site=news.nationalpost.com",
  caption: "Latest news from The National Post"
}, {
  href: "/dutchie/alternate-view?site=news.nationalpost.com&tag=Apple&number=5",
  caption: "Latest five news posts on Apple from The National Post"
}];

timbit.params = {
  site: {
    description: "The Wordpress site to query",
    required: true,
    strict: false,
    values: ["news.nationalpost.com", "o.canada.com"]
  },

  tag: {
    description: "Tag to filter by",
    required: false,
    strict: false,
    values: ["Apple", "Canada"]
  },

  "number": {
    description: "The number of posts to display",
    alias: "rpp",
    "default": 10,
    strict: false,
    values: [3, 5, 10]
  }
};

timbit.viewBase = "chocolate";
timbit.maxAge = 300;

timbit.eat = function(req, res, context) {
  var src = {
    uri: "http://public-api.wordpress.com/rest/v1/sites/" + context.site + "/posts?number=" + context.number
  };

  if (context.tag) {
    src.uri += "&tag=" + context.tag;
  }

  require("due").mock(timbits.pantry.fetch).call(timbits.pantry, src).then(function(error, results) {
    context.wordpress = results;
    timbit.render(req, res, context);
  });
};