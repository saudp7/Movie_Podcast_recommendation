const express = require("express");
const router = express.Router();
const bollymovie = require("../models/bollymovies");
const hollymovie = require("../models/hollymovies");
const bollyweb = require("../models/bollyweb");
const hollyweb = require("../models/hollyweb");
const podcast = require("../models/podcast");
const cartoonmovie = require("../models/cartoonmovie");

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const query = q.trim().toLowerCase();

  const filteredbollyMovies = await bollymovie.find({ title: { $regex: query, $options: 'i' } });
  const filteredhollyMovies = await hollymovie.find({ title: { $regex: query, $options: 'i' } });
  const filteredhollyWebSeries = await hollyweb.find({ title: { $regex: query, $options: 'i' } });
  const filteredbollyWebSeries = await bollyweb.find({ title: { $regex: query, $options: 'i' } });
  const filteredPodcasts = await podcast.find({ title: { $regex: query, $options: 'i' } });
  const filteredcartoonmovie = await cartoonmovie.find({ title: { $regex: query, $options: 'i' } });

  res.render("listings/filtered", {
    genre: q,
    bollymovies: filteredbollyMovies,
    hollymovies: filteredhollyMovies,
    bollyweb: filteredbollyWebSeries,
    hollyweb: filteredhollyWebSeries,
    podcasts: filteredPodcasts,
    cartoonmovies: filteredcartoonmovie,
  });
});

router.get("/filter", async (req, res) => {
  const { genre } = req.query;
  const target = genre?.toLowerCase().trim();

  const filteredbollyMovies = await bollymovie.find({ genre: { $regex: target, $options: "i" } });
  const filteredhollyMovies = await hollymovie.find({ genre: { $regex: target, $options: "i" } });
  const filteredhollyWebSeries = await hollyweb.find({ genre: { $regex: target, $options: "i" } });
  const filteredbollyWebSeries = await bollyweb.find({ genre: { $regex: target, $options: "i" } });
  const filteredPodcasts = await podcast.find({ genre: { $regex: target, $options: "i" } });
  const filteredcartoonmovie = await cartoonmovie.find({ genre: { $regex: target, $options: "i" } });

  res.render("listings/filtered", {
    genre,
    bollymovies: filteredbollyMovies,
    hollymovies: filteredhollyMovies,
    bollyweb: filteredbollyWebSeries,
    hollyweb: filteredhollyWebSeries,
    podcasts: filteredPodcasts,
    cartoonmovies: filteredcartoonmovie,
  });
});

module.exports = router;
