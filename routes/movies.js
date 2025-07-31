const express = require("express");
const router = express.Router();
const { isLoggedIn, wrapAsync } = require("../middleware");
const bollymovie = require("../models/bollymovies");
const hollymovie = require("../models/hollymovies");

router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
  let movie = await bollymovie.findById(req.params.id);
  let source = "bollywood";

  if (!movie) {
    movie = await hollymovie.findById(req.params.id);
    source = "hollywood";
  }

  res.render("admin/editmovie", { movie, source });
}));

router.put("/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { source, ...data } = req.body;
  const Model = source === "bollywood" ? bollymovie : hollymovie;
  await Model.findByIdAndUpdate(req.params.id, data);
  res.redirect(`/movies/${req.params.id}`);
}));

router.delete("/:id", wrapAsync(async (req, res) => {
  await bollymovie.findByIdAndDelete(req.params.id) || await hollymovie.findByIdAndDelete(req.params.id);
  req.flash("success", "Movie deleted!");
  res.redirect("/movie");
}));

router.get("/title/:title", isLoggedIn, wrapAsync(async (req, res) => {
  const bolly = await bollymovie.findOne({ title: req.params.title });
  const holly = await hollymovie.findOne({ title: req.params.title });

  const movie = bolly || holly;
  if (!movie) return res.status(404).send("Movie not found");

  const contentType = bolly ? "bollywood_movie" : "hollywood_movie";
  let isFavorited = false;
  if (req.user) {
    isFavorited = req.user.favorites.some(fav =>
      fav.contentId.equals(movie._id) && fav.contentType === contentType
    );
  }

  res.render("listings/showmovie", { movie, contentType, isFavorited });
}));

module.exports = router;
