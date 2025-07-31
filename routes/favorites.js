const express = require('express');
const router = express.Router();
const Favorite = require('../models/favorite');
const { isLoggedIn } = require('../middleware');



// Import each content model
const hollymovie = require('../models/hollymovies');
const bollymovie = require('../models/bollymovies');
const hollyweb = require('../models/hollyweb');      // Hollywood series
const bollyweb = require('../models/bollyweb');      // Bollywood series
const podcast = require('../models/podcast');
const cartoon = require('../models/cartoonmovie');
// Update path accordingly

// Add to favorites


router.get('/favorites/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { contentType } = req.body;

  const existing = await Favorite.findOne({
    user: req.user._id,
    contentId: id,
    contentType: contentType
  });

  if (existing) {
    req.flash('error', 'Already in favorites!');
    return res.redirect('back');
  }

  const favorite = new Favorite({
    user: req.user._id,
    contentId: id,
    contentType: contentType
  });

  await favorite.save();
  req.flash('success', 'Added to favorites!');
  const referer = req.get("Referer") || "/movies";  
  res.redirect(referer);
});

// Add to favorites
router.post("/favorites/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { contentType } = req.body;

  const existing = await Favorite.findOne({
    user: req.user._id,
    contentType,
    contentId: id,
  });

  if (existing) {
    // ❌ Remove if already favorited
    let fav=true;
    await Favorite.findByIdAndDelete(existing._id);
    req.flash("success", "Removed from favorites.");
  } else {
    // ✅ Add if not yet favorited
    
    await Favorite.create({
      user: req.user._id,
      contentType,
      contentId: id,
    });
    req.flash("success", "Added to favorites.");
  }

  const referer = req.get("Referer") || "/movies";
  return res.redirect(referer);
});




// Remove from favorites
router.post("/favorites/remove", isLoggedIn, async (req, res) => {
  const { contentId, contentType } = req.body;

  await Favorite.findOneAndDelete({
    user: req.user._id,
    contentId,
    contentType,
  });

  req.flash("success", "Removed from favorites.");
  const referer = req.get("Referer") || "/movies";
  res.redirect(referer);
});


// View all favorites
router.get("/fav", isLoggedIn, async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id });

  const favoriteItems = await Promise.all(favorites.map(async (fav) => {
    let content = null;

    switch (fav.contentType) {
      case "hollywood_movie": content = await hollymovie.findById(fav.contentId); break;
      case "bollywood_movie": content = await bollymovie.findById(fav.contentId); break;
      case "hollywood_series": content = await hollyweb.findById(fav.contentId); break;
      case "bollywood_series": content = await bollyweb.findById(fav.contentId); break;
      case "podcast": content = await podcast.findById(fav.contentId); break;
      case "cartoon": content = await cartoon.findById(fav.contentId); break;
    }

    return content ? { content, contentType: fav.contentType } : null;
  }));

  const filteredItems = favoriteItems.filter(item => item !== null);

  res.render("favorites/index", { favoriteItems: filteredItems });
});

module.exports = router;

  


