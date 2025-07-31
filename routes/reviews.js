const express = require('express');
const router = express.Router();
const Review = require('../models/reviews.js');
const { isLoggedIn,wrapAsync } = require('../middleware.js');

router.get('/home', async (req, res) => {
  try {
    const reviews = await Review.find({}).populate('owner');
    res.render('listings/home', { reviews });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading homepage.');
  }
});

router.get('/new/review',isLoggedIn,(req, res) => {
    res.render('reviews/new');
  });
  
  // Create review
  router.post('/reviews',isLoggedIn, async (req, res) => {
    try {
    
      let newReview = new Review(req.body.review);
      newReview.owner=res.locals.currUser;
      await newReview.save();
      req.flash('success', 'Review submitted successfully!');
      res.redirect('/home');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Something went wrong');
      res.redirect('/reviews/new');
    }
  });

  router.post("/items/reviews", wrapAsync(async (req, res) => {
    const { rating, comment } = req.body.review;
    const newReview = new Review({ rating, comment });
    await newReview.save();
    req.flash("success", "Review added!");
    res.redirect("/home");
  }));
  
  router.delete("/listings/:listingId/reviews/:reviewId", wrapAsync(async (req, res) => {
    await Review.findByIdAndDelete(req.params.reviewId);
    req.flash("success", "Review deleted.");
    res.redirect("/home");
  }));

  
module.exports = router;
