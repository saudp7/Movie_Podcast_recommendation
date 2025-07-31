const express = require('express');
const router = express.Router();

const bollymovie = require("../models/bollymovies.js");
const hollymovie = require("../models/hollymovies.js");
const cartoonmovie = require("../models/cartoonmovie.js");
const bollyweb = require("../models/bollyweb.js");
const hollyweb = require("../models/hollyweb.js");
const podcast = require("../models/podcast.js");
const { isLoggedIn } = require('../middleware.js');

router.get('/moodbased',isLoggedIn,(req, res) => {
  res.render("./includes/mood.ejs");
});



const moodToGenres = {
    happy: ['action', 'drama', 'horror'],
    confusing: ['thriller', 'horror'],
    mindblow: ['thriller', 'action'],
    sad: ['comedy', 'wellness', 'health']
  };
  
  // Route: GET /mood/:mood
  router.get('/mood/:mood',isLoggedIn,async (req, res) => {
    const mood = req.params.mood.toLowerCase();
    const genres = moodToGenres[mood];
  
    if (!genres) {
      return res.status(404).send('Mood not found');
    }
  
    // Create a genre query based on the mood's genres
    const genreRegexQuery = genres.map(g => ({
      genre: { $regex: new RegExp(`\\b${g}\\b`, 'i') }
    }));
  
    try {
      // Filter by genre using the previous genre filtering logic
      const filteredBollyMovies = await bollymovie.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      const filteredHollyMovies = await hollymovie.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      const filteredBollyWebSeries = await bollyweb.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      const filteredHollyWebSeries = await hollyweb.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      const filteredPodcasts = await podcast.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      const filteredCartoonMovies = await cartoonmovie.find({
        genre: { $in: genres.map(g => new RegExp(`\\b${g}\\b`, 'i')) }
      });
  
      // Render the filtered results
      res.render('listings/filtered', {
        genre: mood.charAt(0).toUpperCase() + mood.slice(1), // Capitalizing first letter of mood
        bollymovies: filteredBollyMovies,
        hollymovies: filteredHollyMovies,
        bollyweb: filteredBollyWebSeries,
        hollyweb: filteredHollyWebSeries,
        podcasts: filteredPodcasts,
        cartoonmovies: filteredCartoonMovies,
      });
    } catch (err) {
      console.error("Error filtering content:", err);
      res.status(500).send("Server Error");
    }
  });
  
module.exports = router;
