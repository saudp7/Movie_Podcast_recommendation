const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const User = require("../models/user");

router.get("/userpanel", isLoggedIn, async (req, res) => {
  const user = await User.findById(res.locals.currUser);
  res.render("user/user", { user });
});

router.get("/:id/edit", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render("user/editProfile", { user });
});

router.put("/:id", async (req, res) => {
  const { username, email, age, gender, country } = req.body.user;
  await User.findByIdAndUpdate(req.params.id, { username, email, age, gender, country });
  req.flash("success", "Profile updated successfully!");
  res.redirect("/userpanel");
});

module.exports = router;
