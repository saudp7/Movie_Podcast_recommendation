const express = require("express");
const router = express.Router();
const { isLoggedIn, wrapAsync } = require("../middleware");
const podcast = require("../models/podcast");

router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
  const poddata = await podcast.find({});
  res.render("listings/podcast", { poddata });
}));

router.get("/new", isLoggedIn, (req, res) => {
  res.render("admin/newpodcast");
});

router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
  const pod = new podcast(req.body);
  await pod.save();
  req.flash("success", "Podcast added!");
  res.redirect("/podcasts");
}));

router.get("/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const pod = await podcast.findById(id);
  if (!pod) {
    req.flash("error", "Podcast not found");
    return res.redirect("/podcasts");
  }
  const contentType = "podcast";
  const isFavorited = req.user.favorites.some(fav =>
    fav.contentId.equals(pod._id) && fav.contentType === contentType
  );
  res.render("listings/showpodcast", {
    pod,
    contentType,
    isAdmin: req.user.isAdmin,
    isFavorited
  });
}));

router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
  const pod = await podcast.findById(req.params.id);
  res.render("admin/editpodcast", { pod });
}));

router.put("/:id", wrapAsync(async (req, res) => {
  const updated = await podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.flash("success", "Podcast updated!");
  res.redirect(`/podcasts/${updated._id}`);
}));

router.delete("/:id", wrapAsync(async (req, res) => {
  await podcast.findByIdAndDelete(req.params.id);
  req.flash("success", "Podcast deleted!");
  res.redirect("/podcasts");
}));

router.get("/title/:title", isLoggedIn, wrapAsync(async (req, res) => {
  const pod = await podcast.findOne({ title: req.params.title });
  if (!pod) return res.status(404).send("Podcast not found");

  const contentType = "podcast";
  let isFavorited = false;
  if (req.user) {
    isFavorited = req.user.favorites.some(fav =>
      fav.contentId.equals(pod._id) && fav.contentType === contentType
    );
  }

  res.render("listings/showpodcast", { pod, contentType, isFavorited });
}));

module.exports = router;
