const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const showSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String, required: true }, // Stored as comma-separated string
  year_of_release: { type: String, required: true },
  where_to_watch: { type: String, required: true },
  iconpath: { type: String, required: true },
  imdb_rating: { type: Number, required: true },
  imagepath: { type: String, required: true },
  languages: { type: [String], required: true }

});

const Show = mongoose.model('bollymovies', showSchema);
module.exports = Show;
