const mongoose = require('mongoose');

const Bollyweb = require('../models/bollyweb.js');
const hollyweb = require('../models/hollyweb.js');
const bollymovie=require('../models/bollymovies.js');
const bollwebData=require('./bollyweb.js');
const hollywebData=require('./hollyweb.js');
const bollymoviedata=require('./bollymovie.js');
const hollymoviedata=require('./hollymovie.js');
const podcastdata=require('./podcast.js');
const hollymovie=require('../models/hollymovies.js');
const podcast=require('../models/podcast.js');
const cartoonmovie=require('../models/cartoonmovie.js');
const cartoonmoviedata=require("./cartoonmovie.js");
async function main(){
    await mongoose.connect('mongodb://localhost:27017/cinevibes');
}

main().then(()=>{
    console.log('Connected to MongoDB');
}).catch((err)=>{
    console.log(err);
})



const initDB = async () => {
    await Bollyweb.deleteMany({});
 
    await Bollyweb.insertMany(bollwebData.data);

    // await bollymovie.deleteMany({});

    // await bollymovie.insertMany(bollymoviedata.data);

    // await hollymovie.deleteMany({});
    
    // await hollymovie.insertMany(hollymoviedata.data);

    await hollyweb.deleteMany({});
   
    await hollyweb.insertMany(hollywebData.data);

    // await podcast.deleteMany({});
  
    // await podcast.insertMany(podcastdata.data);

    // await cartoonmovie.deleteMany({});
  
    // await cartoonmovie.insertMany(cartoonmoviedata.data);

    console.log('✅ Database initialized');
};


initDB();
