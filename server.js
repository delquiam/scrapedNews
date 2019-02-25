var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var path = require("path");
var bparser = require("body-parser");


// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;
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
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


// Routes

app.get("/", function (req, res) {
    db.Article.find({ saved: false })
        .then(dbArticle => res.render("index", { articles: dbArticle }));
    // res.render("index");
});
// A GET route for scraping the  website
app.post("/scrape", function (req, res) {
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
app.get("/saved", function (req, res) {
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
app.get("/articles", function (req, res) {
    db.Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(doc);
        }
    });
})

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
// Route for saving/updating an Article
app.put("/articles/saved/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});

// Delete an article
app.post("/articles/delete/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(doc);
            }
        });
});


// Route for saving/updating an Article's associated Note
app.post("/notes/saved/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        return db.Article.findOneAndUpdate({ _id: id }, { $push:{ note: dbNote._id} }, { new: true, upsert: true});
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
 
  

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
    // Use the note id to find and delete it
    db.Note.findOneAndRemove({ "_id": req.params.note_id }, function (err) {
        // Log any errors
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            db.Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
                // Execute the above query
                .exec(function (err) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    else {
                        // Or send the note to the browser
                        res.send("Note Deleted");
                    }
                });
        }
    });
});


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
