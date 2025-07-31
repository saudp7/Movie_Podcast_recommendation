const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { wrapAsync, saveRedirectUrl } = require("../middleware");
const User = require("../models/user");

router.post("/signup", async (req, res, next) => {
  const { username, email, phoneNum, gender, age, country, password, adminCode } = req.body;

  try {
    
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      req.flash("error", "Email is already registered.");
      return res.redirect("/signup");
    }

    const isAdmin = adminCode === "secretadmin121";
    const newUser = new User({ username, email, phoneNum, gender, age, country, isAdmin });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Registered successfully");
      res.redirect("/movie");
    });

  } catch (err) {
    // ✅ Handle username duplicate from passport-local-mongoose
    if (err.name === "UserExistsError" || err.message.includes("username_1 dup key")) {
      req.flash("error", "Username already exists.");
      return res.redirect("/signup");
    }

    console.error("Unexpected signup error:", err);
    next(err);
  }
});



router.post("/login", saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/auth", // this works now!
    failureFlash: "Invalid username or password",
  }),
  (req, res) => {
    req.flash("success", "Welcome back to CineVibes! You are logged in!");
    const redirectUrl = res.locals.redirectUrl || "/movie";
    res.set("Cache-Control", "no-store");
    res.redirect(redirectUrl);
  } 
);

// Login form
router.get("/auth", (req, res) => {
  res.render("user/auth.ejs"); // make sure this file exists
});


// Show login form
// router.get("/auth", (req, res) => {
//   res.render("user/auth.ejs"); // adjust path to your actual login.ejs file
// });


router.get("/forgot-password", (req, res) => {
  res.render("auth/forgot");
});

router.post("/forgot-password", wrapAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash("error", "No account with that email found.");
    return res.redirect("/forgot-password");
  }

  const token = crypto.randomBytes(20).toString("hex");
  const expireTime = Date.now() + 3600000;

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
    html: `<p>Click below to reset your password:</p><a href="http://localhost:8080/reset-password/${token}">Reset Password</a>`
  };

  await transporter.sendMail(mailOptions);
  req.flash("success", "Reset link sent! Check your email.");
  res.redirect("/auth");
}));

router.get("/reset-password/:token", wrapAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash("error", "Token invalid or expired.");
    return res.redirect("/forgot-password");
  }

  res.render("auth/reset", { token: req.params.token });
}));

router.post("/reset-password/:token", wrapAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Token invalid or expired.");
    return res.redirect("/forgot-password");
  }

  user.setPassword(req.body.password, async err => {
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
}));

router.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/home");
  });
});

router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/home");
  });
});

module.exports = router;
