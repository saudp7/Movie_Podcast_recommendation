const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const podcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  platform: {
    type: [String],
    required: true
  },
  imagepath: {
    type: String,
    required: true
  },
  iconpath: {
    type: [String],
    required: true
  },
  ratings: {
    type: Number,
    min: 0,
    max: 5
  },
  genre: {
    type: String,
    required: true
  },
  host: {
    type: [String],
    required: true
  },
  languages: {
    type: [String],
    required: true
  }

});

const Podcast = mongoose.model('Podcast', podcastSchema);

module.exports = Podcast;
