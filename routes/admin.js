const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
//const {storage}=require("../cloudConfig.js");
// Models
const Movie = require('../models/bollymovies');
const Series = require('../models/hollyweb');
const Podcast = require('../models/podcast');
const Cartoon = require('../models/cartoonmovie');
const User = require('../models/user');
const { isAdmin, isLoggedIn } = require('../middleware');

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/movieimages'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });
//const upload = multer({ storage1 });

// Helper: Create image and icon paths
const getMediaPaths = (req) => ({
  imagepath: '/movieimages/' + req.files['imagepath'][0].filename,
  iconpath: '/movieimages/' + req.files['iconpath'][0].filename
});

// Admin Dashboard
router.get("/admin/dashboard",isAdmin,isLoggedIn,async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/admin", { users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// DELETE user
router.delete('/admin/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'User deleted successfully!');
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting user.');
    res.redirect('/admin/dashboard');
  }
});
router.get('admin/users/:id/edit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/editUser', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
});
// Update user
router.put('/admin/users/:id', async (req, res) => {
  try {
    const { username, email, phoneNum, gender, country } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      username,
      email,
      phoneNum,
      gender,
      country
    });
    req.flash('success', 'User updated successfully!');
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update user.');
    res.redirect('/admin/dashboard');
  }
});
// Show edit form
router.get('/admin/users/:id/edit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/editUser', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
});


// Movies CRUD
router.post('/admin/movies', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const { title, genre, year_of_release, where_to_watch, imdb_rating, languages } = req.body;
    const { imagepath, iconpath } = getMediaPaths(req);

    const newMovie = new Movie({
      title,
      genre: genre.trim(),
      year_of_release,
      where_to_watch,
      imdb_rating,
      imagepath,
      iconpath,
      languages: languages.split(',').map(l => l.trim())
    });
    await newMovie.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/movies/update/:id', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const update = req.body;
    if (req.files['imagepath']) update.imagepath = '/movieimages/' + req.files['imagepath'][0].filename;
    if (req.files['iconpath']) update.iconpath = '/movieimages/' + req.files['iconpath'][0].filename;
    update.genre = update.genre.split(',').map(g => g.trim());
    update.languages = update.languages.split(',').map(l => l.trim());
    await Movie.findByIdAndUpdate(req.params.id, update);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/movies/delete/:id', async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Series CRUD
router.post('/admin/series', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const { title, genre, year_of_release, seasons, where_to_watch, imdb_rating, languages } = req.body;
    const { imagepath, iconpath } = getMediaPaths(req);

    const newSeries = new Series({
      title,
      genre: genre.split(',').map(g => g.trim()),
      year_of_release,
      seasons,
      where_to_watch,
      imdb_rating,
      imagepath,
      iconpath,
      languages: languages.split(',').map(l => l.trim())
    });
    await newSeries.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/series/update/:id', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const update = req.body;
    if (req.files['imagepath']) update.imagepath = '/movieimages/' + req.files['imagepath'][0].filename;
    if (req.files['iconpath']) update.iconpath = '/movieimages/' + req.files['iconpath'][0].filename;
    update.genre = update.genre.split(',').map(g => g.trim());
    update.languages = update.languages.split(',').map(l => l.trim());
    await Series.findByIdAndUpdate(req.params.id, update);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/series/delete/:id', async (req, res) => {
  try {
    await Series.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Podcast CRUD
router.post('/admin/podcasts', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const { title, duration, platform, ratings, genre, host, languages } = req.body;
    const imagepath = '/movieimages/' + req.files['imagepath'][0].filename;
    const iconpath = req.files['iconpath'].map(f => '/movieimages/' + f.filename);

    const newPodcast = new Podcast({
      title,
      duration,
      platform: platform.split(',').map(p => p.trim()),
      ratings,
      genre: genre.split(',').map(g => g.trim()),
      host: host.split(',').map(h => h.trim()),
      languages: languages.split(',').map(l => l.trim()),
      imagepath,
      iconpath
    });
    await newPodcast.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/podcasts/update/:id', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const update = req.body;
    if (req.files['imagepath']) update.imagepath = '/movieimages/' + req.files['imagepath'][0].filename;
    if (req.files['iconpath']) update.iconpath = req.files['iconpath'].map(f => '/movieimages/' + f.filename);
    update.platform = update.platform.split(',').map(p => p.trim());
    update.genre = update.genre.split(',').map(g => g.trim());
    update.host = update.host.split(',').map(h => h.trim());
    update.languages = update.languages.split(',').map(l => l.trim());
    await Podcast.findByIdAndUpdate(req.params.id, update);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/podcasts/delete/:id', async (req, res) => {
  try {
    await Podcast.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Cartoon CRUD
router.post('/admin/cartoons', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const { title, genre, year_of_release, where_to_watch, imdb_rating, languages } = req.body;
    const { imagepath, iconpath } = getMediaPaths(req);

    const newCartoon = new Cartoon({
      title,
      genre: genre.split(',').map(g => g.trim()),
      year_of_release,
      where_to_watch,
      imdb_rating,
      imagepath,
      iconpath,
      languages: languages.split(',').map(l => l.trim())
    });
    await newCartoon.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/cartoons/update/:id', upload.fields([{ name: 'imagepath' }, { name: 'iconpath' }]), async (req, res) => {
  try {
    const update = req.body;
    if (req.files['imagepath']) update.imagepath = '/movieimages/' + req.files['imagepath'][0].filename;
    if (req.files['iconpath']) update.iconpath = '/movieimages/' + req.files['iconpath'][0].filename;
    update.genre = update.genre.split(',').map(g => g.trim());
    update.languages = update.languages.split(',').map(l => l.trim());
    await Cartoon.findByIdAndUpdate(req.params.id, update);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/cartoons/delete/:id', async (req, res) => {
  try {
    await Cartoon.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
