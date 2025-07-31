if(process.env.NODE_ENV != "production"){

  require('dotenv').config();
}
console.log(process.env.secret);



const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Models
const bollymovie = require("./models/bollymovies.js");
const hollymovie = require("./models/hollymovies.js");
const cartoonmovie = require("./models/cartoonmovie.js");
const Review = require("./models/reviews.js");
const bollyweb = require("./models/bollyweb.js");
const hollyweb = require("./models/hollyweb.js");
const podcast = require("./models/podcast.js");
const User = require("./models/user.js");
const adminRoutes = require('./routes/admin');
const moodroutes=require('./routes/mood.js'); 
const reviewRoutes=require('./routes/reviews.js');

// Middleware
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const wrapAsync = require("./utils/wrapAsync.js");
const {isAdmin,isLoggedIn, saveRedirectUrl}=require("./middleware.js");
const reviews = require("./models/reviews.js");
const favoritesRoutes = require("./routes/favorites");

// Express and EJS setup
app.set("view engine", "ejs");
app.engine("ejs", ejsmate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/cinevibes")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Session & Flash config
const sessionOptions = {
  secret: "cinevibesSecretKey",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
};
app.use(session(sessionOptions));
app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Locals for flash & current user
// ✅ Must come BEFORE your locals setup
app.use(session({ secret: 'keyboardcat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Your middleware should come AFTER
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.isAdmin = req.user?.isAdmin || false;
  res.locals.adminId = req.user?.isAdmin ? req.user._id : null;
  console.log("Locals Middleware -> isAdmin:", res.locals.isAdmin);
  next();
});



// ------------------------ ROUTES ------------------------

// Home and Auth Routes
app.get("/", (req, res) => res.render("listings/main.ejs"));
app.get("/auth",(req, res) => res.render("user/auth"));
app.get("/chatbot",isLoggedIn,(req,res)=>res.render("includes/chatbot.es"));
app.get("/login", (req, res) => {
  res.render("user/auth.ejs"); // make sure this file exists
});
app.use(moodroutes);
app.use(adminRoutes);
app.use(reviewRoutes);
app.use(favoritesRoutes);


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


// ------------------- 🎬 MOVIES -------------------

// Show all movies
app.get("/movie", isLoggedIn,wrapAsync(async (req, res) => {
  const allbollymovies = await bollymovie.find({});
  const allhollymovies = await hollymovie.find({});
  res.render("listings/movie", { allbollymovies, allhollymovies });
}));

// Create new movie form
app.get("/movies/new",isLoggedIn, (req, res) => {
  res.render("admin/newmovie");
});

// Insert movie
app.post("/movies",isLoggedIn, wrapAsync(async (req, res) => {
  const newMovie = new bollymovie(req.body); // or hollymovie based on logic
  await newMovie.save();
  req.flash("success", "Movie added!");
  res.redirect("/movie");
}));

// Show single movie
const Favorite = require('./models/favorite'); // Adjust path if needed

app.get("/movies/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;

  let movie = await bollymovie.findById(id);
  let contentType = "bollywood_movie"; // Default to Bollywood movie

  // If not a Bollywood movie, check for Hollywood movie
  if (!movie) {
    movie = await hollymovie.findById(id);
    contentType = "hollywood_movie";
  }

  if (!movie) {
    req.flash("error", "Movie not found");
    return res.redirect("/movies");
  }

  // If the user is logged in, check if the movie is already favorited
  let isFavorited = false;
  if (req.user) {
    isFavorited = req.user.favorites.some(fav =>
      fav.contentId.equals(movie._id) && fav.contentType === contentType
    );
  }

  // Render the showmovie page with the movie details and favorite status
  res.render("listings/showmovie", {
    movie,
    contentType,  // Pass contentType to the view
    isAdmin: req.user.isAdmin,
    isFavorited
  });
}));

app.get("/series/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;

  let series = await bollyweb.findById(id);
  let contentType = "bollywood_series"; // Default to Bollywood series

  // If not a Bollywood series, check for Hollywood series
  if (!series) {
    series = await hollyweb.findById(id);
    contentType = "hollywood_series";
  }

  if (!series) {
    req.flash("error", "Series not found");
    return res.redirect("/series");
  }

  // Check if the series is already favorited
  let isFavorited = false;
  if (req.user) {
    isFavorited = req.user.favorites.some(fav =>
      fav.contentId.equals(series._id) && fav.contentType === contentType
    );
  }

  // Render the showseries page with series details and favorite status
  res.render("listings/showseries", {
    series,
    contentType,
    isAdmin: req.user.isAdmin,
    isFavorited
  });
}));















app.get("/podcasts/:id", isLoggedIn, wrapAsync(async (req, res) => {
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




// Edit form
app.get("/movies/:id/edit",isLoggedIn, wrapAsync(async (req, res) => {
  let movie = await bollymovie.findById(req.params.id);
  let source = "bollywood";

  if (!movie) {
    movie = await hollymovie.findById(req.params.id);
    source = "hollywood";
  }

  res.render("admin/editmovie", { movie, source });
}));


// Update movie
app.put("/movies/:id",isLoggedIn, wrapAsync(async (req, res) => {
  const { source, ...data } = req.body;

  const Model = source === "bollywood" ? bollymovie : hollymovie;
  await Model.findByIdAndUpdate(req.params.id, data);

  res.redirect(`/movies/${req.params.id}`);
}));

// Delete movie
app.delete("/movies/:id", wrapAsync(async (req, res) => {
  await bollymovie.findByIdAndDelete(req.params.id) || await hollymovie.findByIdAndDelete(req.params.id);
  req.flash("success", "Movie deleted!");
  res.redirect("/movie");
}));
app.get("/movies/title/:title", isLoggedIn, wrapAsync(async (req, res) => {
  const bolly = await bollymovie.findOne({ title: req.params.title });
  const holly = await hollymovie.findOne({ title: req.params.title });

  const movie = bolly || holly;
  if (!movie) return res.status(404).send("Movie not found");

  // Determine the content type
  const contentType = bolly ? "bollywood_movie" : "hollywood_movie";

  // Check if the movie is already favorited
  let isFavorited = false;
  if (req.user) {
    isFavorited = req.user.favorites.some(fav =>
      fav.contentId.equals(movie._id) && fav.contentType === contentType
    );
  }

  res.render("listings/showmovie", { movie, contentType, isFavorited });
}));



// ------------------- 🎧 PODCASTS -------------------

// Show all podcasts
app.get("/podcasts",isLoggedIn, wrapAsync(async (req, res) => {
  const poddata = await podcast.find({});
  res.render("listings/podcast", { poddata });
}));

// Create new podcast form
app.get("/podcasts/new",isLoggedIn, (req, res) => {
  res.render("admin/newpodcast");
});

// Insert podcast
app.post("/podcasts",isLoggedIn, wrapAsync(async (req, res) => {
  const pod = new podcast(req.body);
  await pod.save();
  req.flash("success", "Podcast added!");
  res.redirect("/podcasts");
}));

// Show single podcast
// app.get("/podcasts/:id",isLoggedIn, wrapAsync(async (req, res) => {
//   const pod = await podcast.findById(req.params.id);
//   res.render("listings/showpodcast", { pod });
// }));

// Edit form
app.get("/podcasts/:id/edit",isLoggedIn, wrapAsync(async (req, res) => {
  const pod = await podcast.findById(req.params.id);
  res.render("admin/editpodcast", { pod });
}));

// Update podcast
app.put("/podcasts/:id", wrapAsync(async (req, res) => {
  const updated = await podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.flash("success", "Podcast updated!");
  res.redirect(`/podcasts/${updated._id}`);
}));

// Delete podcast
app.delete("/podcasts/:id", wrapAsync(async (req, res) => {
  await podcast.findByIdAndDelete(req.params.id);
  req.flash("success", "Podcast deleted!");
  res.redirect("/podcasts");
}));

app.get("/podcasts/title/:title", wrapAsync(async (req, res) => {
  const pod = await podcast.findOne({ title: req.params.title });
  if (!pod) return res.status(404).send("Podcast not found");
  res.render("listings/showpodcast", { pod });
}));



// ------------------- 📺 WEB SERIES -------------------

// Show all web series
app.get("/webseries",isLoggedIn, wrapAsync(async (req, res) => {
  const allbollyweb = await bollyweb.find({});
  const allhollyweb = await hollyweb.find({});
  res.render("listings/webseries", { allbollyweb, allhollyweb });
}));

// Create new series form
app.get("/series/new",isLoggedIn, (req, res) => {
  res.render("admin/newseries");
});

// Insert series
app.post("/series",isLoggedIn, wrapAsync(async (req, res) => {
  const series = new bollyweb(req.body); // or hollyweb based on logic
  await series.save();
  req.flash("success", "Series added!");
  res.redirect("/webseries");
}));

// Show single series
app.get("/series/:id", wrapAsync(async (req, res) => {
  const series = await bollyweb.findById(req.params.id) || await hollyweb.findById(req.params.id);
  res.render("listings/showseries", { series });
}));

app.get("/series/:id/edit", wrapAsync(async (req, res) => {
  let series = await bollyweb.findById(req.params.id);
  let source = "bollywood";

  if (!series) {
    series = await hollyweb.findById(req.params.id);
    source = "hollywood";
  }

  res.render("admin/editseries", { series, source });
}));

// 🔁 Update Series
app.put("/series/:id", wrapAsync(async (req, res) => {
  const { source, ...data } = req.body;
  const Model = source === "bollywood" ? bollyweb : hollyweb;
  await Model.findByIdAndUpdate(req.params.id, data);
  res.redirect(`/series/${req.params.id}`);
}));


app.get("/series/title/:title", wrapAsync(async (req, res) => {
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


// Delete series
app.delete("/series/:id", wrapAsync(async (req, res) => {
  await bollyweb.findByIdAndDelete(req.params.id) || await hollyweb.findByIdAndDelete(req.params.id);
  req.flash("success", "Series deleted!");
  res.redirect("/webseries");
}));


// ------------------- 🧒 CARTOONS -------------------

// Show all cartoons
app.get("/cartoons", wrapAsync(async (req, res) => {
  const allcartoonmovies = await cartoonmovie.find({});
  res.render("listings/cartoon", { allcartoonmovies });
}));

// Create new cartoon form
app.get("/cartoonmovies/new", (req, res) => {
  res.render("admin/newcartoon");
});


// Insert cartoon
app.post("/cartoonmovies", wrapAsync(async (req, res) => {
  const cartoon = new cartoonmovie(req.body);
  await cartoon.save();
  req.flash("success", "Cartoon added!");
  res.redirect("/cartoons");
}));

// Show single cartoon
app.get("/cartoonmovies/id/:id", wrapAsync(async (req, res) => {
  const cartoon = await cartoonmovie.findById(req.params.id);
  res.render("listings/showcartoon", { cartoon });
}));

// Edit form
app.get("/cartoonmovies/:id/edit", wrapAsync(async (req, res) => {
  const car = await cartoonmovie.findById(req.params.id);
  res.render("admin/editcartoon", { car });
}));

// Update cartoon
app.put("/cartoonmovies/:id", wrapAsync(async (req, res) => {
  const updated = await cartoonmovie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.flash("success", "Cartoon updated!");
  res.redirect(`/cartoonmovies/${updated._id}`);
}));

// Delete cartoon
app.delete("/cartoonmovies/:id", wrapAsync(async (req, res) => {
  await cartoonmovie.findByIdAndDelete(req.params.id);
  req.flash("success", "Cartoon deleted!");
  res.redirect("/cartoons");
}));
app.get("/cartoonmovies/title/:title", wrapAsync(async (req, res) => {
  const cartoon = await cartoonmovie.findOne({ title: req.params.title });
  if (!cartoon) return res.status(404).send("Cartoon movie not found");
  let contentType = "cartoon"; 
  res.render("listings/showcartoon", { cartoon });
}));

// app.get("/cartoons/:id", isLoggedIn, wrapAsync(async (req, res) => {
//   const { id } = req.params;
//   const contentType = "cartoon"; // ✅ This defines the content type

//   const cartoonMovie = await cartoonmovie.findById(id);


//   let isFavorited = false;
//   if (!cartoonMovie) {
//     req.flash("error", "Cartoon not found");
//     return res.redirect("/cartoons");
//   }


//   if (req.user) {
//     isFavorited = req.user.favorites.some(fav =>
//       fav.contentId.equals(cartoonMovie._id) && fav.contentType === contentType
//     );
//   }

//   res.render("listings/showcartoon", {
//     cartoon: cartoonMovie,
//     contentType,            // ✅ This makes it available in EJS
//     isAdmin: req.user.isAdmin,
//     isFavorited
//   });
// }));



app.get('/userpanel', isLoggedIn, async (req, res) => {
  try {
      const user = await User.findById(res.locals.currUser); // Fetch the logged-in user data
      if (user.isAdmin) {
          // If user is an admin, render the admin panel
          res.render('user/user', { user });
      } else {
          // If user is not an admin, render the user panel
          res.render('user/user', { user });
      }
  } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
  }
});
// Review Routes
// app.get("/home", wrapAsync(async (req, res) => {
//   const reviews = await Review.find({});

//   res.render("listings/home", {
//     newReview: reviews
//   });
// }));

app.delete('/listings/:listingId/reviews/:reviewId', wrapAsync(async (req, res) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  req.flash("success", "Review deleted.");
  res.redirect("/home");
}));

app.post("/signup", wrapAsync(async (req, res) => {
  try {
    let { username, email, phoneNum, gender, age, country, password, adminCode } = req.body;

    const isAdmin = adminCode === "secretadmin121"; 

    const newuser = new User({ username, email, phoneNum, gender, age, country, isAdmin });

    const registeruser = await User.register(newuser, password);
    req.login(registeruser, (err) => {
      if (err) return next(err);
      req.flash("success", "Registered successfully");
      res.redirect("/movie");
      res.set
    });
  } catch (e) {
    console.error("Signup error:", e.message);
    req.flash("error", e.message);
    res.redirect("/auth");
  }
}));

// app.get("/admin/dashboard",isAdmin,isLoggedIn, (req, res) => {
//   res.render("admin/admin.ejs");
// });

app.get('/user/:id/edit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('user/editProfile', { user });
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    res.redirect('/');
  }
});

// Update user profile
app.put('/user/:id', async (req, res) => {
  try {
    const { username, email, age, gender, country } = req.body.user;
    await User.findByIdAndUpdate(req.params.id, { username, email, age, gender, country });
    req.flash('success', 'Profile updated successfully!');
    res.redirect(`/userpanel`);
  } catch (err) {
    req.flash('error', 'Failed to update profile');
    res.redirect('/');
  }
});

app.post(
  "/login",saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
   
    req.flash("success","welcome back to CineVibes! you are logged in!");
    let redirectUrl=res.locals.redirectUrl || "/movie";
    res.set('Cache-Control', 'no-store');
   res.redirect(redirectUrl);

  }
);



app.get("/forgot-password", (req, res) => {
  res.render("auth/forgot"); 
});
app.post("/forgot-password", async (req, res) => {
try {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "No account with that email found.");
    return res.redirect("/forgot-password");
  }

  const token = crypto.randomBytes(20).toString("hex");
  const expireTime = Date.now() + 3600000; // 1 hour

 
  user.resetPasswordToken = token;
user.resetPasswordExpires = expireTime;

  await user.save();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "cinevibess19@gmail.com",
      pass: "dmsm uzvc kaje dtzz"
    }
  });

  const mailOptions = {
    to: user.email,
    from: "CineVibes <cinevibess19@gmail.com>",
    subject: "Password Reset - CineVibes",
    html: `<p>Click below to reset your password:</p>
    <a href="http://localhost:8080/reset-password/${token}">Reset Password</a>`

  };

  await transporter.sendMail(mailOptions);
  req.flash("success", "Reset link sent! Check your email.");
  res.redirect("/auth");
} catch (error) {
  console.log(error.message);
  
  
}
});

app.get("/reset-password/:token", async (req, res) => {

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash("error", "Token invalid or expired.");
    return res.redirect("/forgot-password");
  }

  res.render("auth/reset", { token: req.params.token });
});


app.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    req.flash("error", "Token invalid or expired.");
    return res.redirect("/forgot-password");
  }

  user.setPassword(req.body.password, async (err) => {
    if (err) {
      req.flash("error", "Error setting password.");
      return res.redirect("/forgot-password");
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    req.flash("success", "Password updated! Please log in.");
    res.redirect("/auth");
  });
});





app.post("/logout",(req,res,next)=>{
  req.logout((err)=>{
    if(err){
      return next(err);
    }
    req.flash("success","you are logged out!");
    res.redirect("/home");
  })
})
app.get("/logout",(req,res,next)=>{
  req.logout((err)=>{
    if(err){
      return next(err);
    }
    req.flash("success","you are logged out!");
    res.redirect("/home");
  })
})

app.post('/items/reviews', wrapAsync(async (req, res) => {
  const { rating, comment } = req.body.review;
  const newReview = new Review({ rating, comment });
  await newReview.save();
  req.flash("success", "Review added!");
  res.redirect("/home");
}));

app.delete('/listings/:listingId/reviews/:reviewId', wrapAsync(async (req, res) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  req.flash("success", "Review deleted.");
  res.redirect("/home");
}));

// Search Route
app.get("/search", async (req, res) => {
  const { q } = req.query;
  const query = q.trim().toLowerCase();  // Ensure the query is trimmed and in lowercase

  console.log("Search Query:", query);  // Log the search query to see what we're searching for

  try {
    // Query the database for Bollywood movies with title that matches the search query
    const filteredbollyMovies = await bollymovie.find({
      title: { $regex: query, $options: 'i' }  // Case-insensitive search for title
    });

    // Similarly, query for other categories if you have separate collections for each
    const filteredhollyMovies = await hollymovie.find({
      title: { $regex: query, $options: 'i' }
    });
    const filteredhollyWebSeries = await hollyweb.find({
      title: { $regex: query, $options: 'i' }
    });
    const filteredbollyWebSeries = await bollyweb.find({
      title: { $regex: query, $options: 'i' }
    });
    const filteredPodcasts = await podcast.find({
      title: { $regex: query, $options: 'i' }
    });
    const filteredcartoonmovie = await cartoonmovie.find({
      title: { $regex: query, $options: 'i' }
    });

    console.log("Filtered Bollywood Movies:", filteredbollyMovies);  // Log filtered results to debug

    // Send the filtered results to the view
    res.render("listings/filtered", {
      genre: q,
      bollymovies: filteredbollyMovies,
      hollymovies: filteredhollyMovies,
      bollyweb: filteredbollyWebSeries,
      hollyweb: filteredhollyWebSeries,
      podcasts: filteredPodcasts,
      cartoonmovies: filteredcartoonmovie,
    });
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).send("Server Error");
  }
});

// Filter & Search Routes
app.get("/filter", async (req, res) => {
  const { genre } = req.query;
  const target = genre?.toLowerCase().trim();

  try {
    const filteredbollyMovies = await bollymovie.find({
      genre: { $regex: target, $options: "i" },
    });

    const filteredhollyMovies = await hollymovie.find({
      genre: { $regex: target, $options: "i" },
    });

    const filteredhollyWebSeries = await hollyweb.find({
      genre: { $regex: target, $options: "i" },
    });

    const filteredbollyWebSeries = await bollyweb.find({
      genre: { $regex: target, $options: "i" },
    });

    const filteredPodcasts = await podcast.find({
      genre: { $regex: target, $options: "i" },
    });

    const filteredcartoonmovie = await cartoonmovie.find({
      genre: { $regex: target, $options: "i" },
    });

    res.render("listings/filtered", {
      genre,
      bollymovies: filteredbollyMovies,
      hollymovies: filteredhollyMovies,
      bollyweb: filteredbollyWebSeries,
      hollyweb: filteredhollyWebSeries,
      podcasts: filteredPodcasts,
      cartoonmovies: filteredcartoonmovie,
    });
  } catch (err) {
    console.error("Error filtering content:", err);
    res.status(500).send("Server Error");
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err });
  console.log(err);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log("Server running on http://192.168.0.104:8080");
});