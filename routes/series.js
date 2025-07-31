const express = require("express");
const router = express.Router();
const { isLoggedIn, wrapAsync } = require("../middleware");
const bollyweb = require("../models/bollyweb");
const hollyweb = require("../models/hollyweb");
const Favorite = require("../models/favorite");

router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
  const allbollyweb = await bollyweb.find({});
  const allhollyweb = await hollyweb.find({});
  res.render("listings/webseries", { allbollyweb, allhollyweb });
}));

router.get("/new", isLoggedIn, (req, res) => {
  res.render("admin/newseries");
});

router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
  const series = new bollyweb(req.body); // or hollyweb based on logic
  await series.save();
  req.flash("success", "Series added!");
  res.redirect("/webseries");
}));

router.get("/:id", wrapAsync(async (req, res) => {
  const series = await bollyweb.findById(req.params.id) || await hollyweb.findById(req.params.id);
  res.render("listings/showseries", { series });
}));

router.get("/:id/edit", wrapAsync(async (req, res) => {
  let series = await bollyweb.findById(req.params.id);
  let source = "bollywood";

  if (!series) {
    series = await hollyweb.findById(req.params.id);
    source = "hollywood";
  }

  res.render("admin/editseries", { series, source });
}));

router.put("/:id", wrapAsync(async (req, res) => {
  const { source, ...data } = req.body;
  const Model = source === "bollywood" ? bollyweb : hollyweb;
  await Model.findByIdAndUpdate(req.params.id, data);
  res.redirect(`/series/${req.params.id}`);
}));

router.get("/title/:title", wrapAsync(async (req, res) => {
  const bolly = await bollyweb.findOne({ title: req.params.title });
  const holly = await hollyweb.findOne({ title: req.params.title });

  const series = bolly || holly;
  if (!series) return res.status(404).send("Series not found");

  const contentType = bolly ? "bollywood_series" : "hollywood_series";
  let isFavorited = false;
  if (req.user) {
    isFavorited = await Favorite.isFavorited(req.user._id, series._id, contentType);
  }

  res.render("listings/showseries", { series, isFavorited, contentType });
}));

router.delete("/:id", wrapAsync(async (req, res) => {
  await bollyweb.findByIdAndDelete(req.params.id) || await hollyweb.findByIdAndDelete(req.params.id);
  req.flash("success", "Series deleted!");
  res.redirect("/webseries");
}));

module.exports = router;
