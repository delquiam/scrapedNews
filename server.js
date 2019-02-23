var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var path = require('path');


// Require all models
var db = require("./models");

var PORT = 3001;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Handlebars
app.engine("handlebars", exphbs({
    defaultLayout: "main"
})
);
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI);

// Routes

app.get("/", function (req, res) {
    db.Article.find({ saved: false })
        .then(dbArticle => res.render("index", { articles: dbArticle }));
    // res.render("index");
});

// A GET route for scraping the  website
app.get("/scrape", function (req, res) {
    const newsLink = "https://www.thelily.com";
    axios.get(newsLink).then(function (response) {
        var $ = cheerio.load(response.data);
        $("a.unstyled-link").each(function (i, element) {
            var entry = {};
            entry.title = $(element).text();
            entry.link = $(element).attr("href");
            // console.log(newsLink);
            // console.log(entry.link.substring(0, 23));
            if (entry.link.substring(0, 23) != newsLink) {
                entry.link = newsLink + entry.link;
            }
            entry.summary = $(element).parent().next().text();

            // console.log(entry);
            entry.saved = false;
            db.Article.create(entry)
                .then(function (dbArticle) {
                    // View the added result in the console
                    // console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });
        // Send a message to the client
        res.send("Scrape Complete");
    });
});


// // Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({ saved: true })
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.render("saved", { articles: dbArticle });
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// // Route for grabbing a specific Article by id, populate it with it's note
// app.get("/articles/:id", function(req, res) {
//   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Article.findOne({ _id: req.params.id })
//     // ..and populate all of the notes associated with it
//     .populate("note")
//     .then(function(dbArticle) {
//       // If we were able to successfully find an Article with the given id, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });

// // Route for saving/updating an Article's associated Note
// app.post("/articles/:id", function(req, res) {
//   // Create a new note and pass the req.body to the entry
//   db.Note.create(req.body)
//     .then(function(dbNote) {
//       // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
//     })
//     .then(function(dbArticle) {
//       // If we were able to successfully update an Article, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
