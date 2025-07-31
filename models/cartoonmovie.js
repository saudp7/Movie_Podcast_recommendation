const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cartoonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  genre: { type: String, required: true },
  year_of_release: {
    type: Number,
    required: true
  },
  where_to_watch: {
    type: String,
    required: true
  },
  iconpath: {
    type: String,
    required: true
  },
  imdb_rating: {
    type: Number,
    required: true
  },
  imagepath: {
    type: String,
    required: true
  },
  languages: {
    type: [String],
    required: true
  }

});

const Cartoon = mongoose.model('Cartoon', cartoonSchema);
module.exports = Cartoon;
