const express = require("express");
const router = express.Router();
const { wrapAsync } = require("../middleware");
const cartoonmovie = require("../models/cartoonmovie");

router.get("/", wrapAsync(async (req, res) => {
  const allcartoonmovies = await cartoonmovie.find({});
  res.render("listings/cartoon", { allcartoonmovies });
}));

router.get("/new", (req, res) => {
  res.render("admin/newcartoon");
});

router.post("/", wrapAsync(async (req, res) => {
  const cartoon = new cartoonmovie(req.body);
  await cartoon.save();
  req.flash("success", "Cartoon added!");
  res.redirect("/cartoons");
}));

router.get("/id/:id", wrapAsync(async (req, res) => {
  const cartoon = await cartoonmovie.findById(req.params.id);
  res.render("listings/showcartoon", { cartoon });
}));

router.get("/:id/edit", wrapAsync(async (req, res) => {
  const car = await cartoonmovie.findById(req.params.id);
  res.render("admin/editcartoon", { car });
}));

router.put("/:id", wrapAsync(async (req, res) => {
  const updated = await cartoonmovie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.flash("success", "Cartoon updated!");
  res.redirect(`/cartoonmovies/${updated._id}`);
}));

router.delete("/:id", wrapAsync(async (req, res) => {
  await cartoonmovie.findByIdAndDelete(req.params.id);
  req.flash("success", "Cartoon deleted!");
  res.redirect("/cartoons");
}));

router.get("/title/:title", wrapAsync(async (req, res) => {
  const cartoon = await cartoonmovie.findOne({ title: req.params.title });
  if (!cartoon) return res.status(404).send("Cartoon movie not found");
  let contentType = "cartoon";
  res.render("listings/showcartoon", { cartoon });
}));

module.exports = router;
