var WikipediaClient = function () {
  var self = this;
  var api = "https://en.wikipedia.org/w/api.php";

  self.query = function (titles, callback) {
    var url = api + queryString(titles);

    $.getJSON(url, function (response) {
      var articles = parseResponse(response);
      callback(articles);
    });
  };

  var queryString = function (titles) {
    var string = "?";

    string += "format=json";
    string += "&callback=?";
    string += "&action=query";
    string += "&prop=categories";
    string += "&cllimit=max";
    string += "&titles=" + sanitisedTitles(titles);

    return string;
  };

  var sanitisedTitles = function (titles) {
    return _.map(titles, function (title) {
      return encodeURI(title.split("|")[0]);
    }).join("|");
  };

  var parseResponse = function (response) {
    var query = response.query;
    var pages = query.pages;

    return _.map(pages, parsePage);
  };

  var parsePage = function (page) {
    var title = page.title;
    var categories = page.categories;

    var categoryTitles = _.map(categories, function (category) {
      return category.title;
    });

    return new Article(title, categoryTitles);
  };

  var Article = function (title, categories) {
    var self = this;
    var base = "https://en.wikipedia.org/wiki/";

    self.title = title;
    self.categories = categories;
    self.url = base + encodeURIComponent(title);
  };
};

var Randomiser = function () {
  var self = this;
  var client = new WikipediaClient();

  self.choose = function (n, callback) {
    var shuffledArticles = _.shuffle(articles);
    var chosenArticles = _.take(shuffledArticles, n);

    client.query(chosenArticles, function (articles) {
      if (wellFormed(articles)) {
        callback(articles);
      }
      else {
        callback(self.choose(n, callback));
      }
    });
  };

  var wellFormed = function (articles) {
    return _.all(articles, function (article) {
      var hasTitle = article.title !== undefined;
      var hasCategories = article.categories.length > 0;

      var isGoodArticle = _.some(article.categories, function (category) {
        return category === "Category:Good articles";
      });

      return hasTitle && hasCategories && isGoodArticle;
    });
  };
};

var randomiser = new Randomiser();

randomiser.choose(3, function (articles) {
  var listItems = _.map(articles, function (article) {
    var listItem = $("<li></li>");
    var anchor = $("<a></a>");
    var paragraph = $("<p></p>");

    anchor.attr("href", article.url);
    anchor.text(article.title);

    paragraph.html(article.categories.join("<br/> "));

    listItem.append(anchor);
    listItem.append(paragraph);

    return listItem;
  });

  $("#articles").html(listItems);
});
