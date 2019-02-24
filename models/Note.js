var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Create the Note schema
var NoteSchema = new Schema({
  text: {
      type: String
  },
  article: {
      type: Schema.Types.ObjectId,
      ref: "Article"
  }
});

// Create the Note model with the NoteSchema
var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;