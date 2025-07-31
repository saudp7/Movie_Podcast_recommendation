const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNum: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  age: { type: Number, required: true },
  country: { type: String, required: true },
  isAdmin: {
    type: Boolean,
    default: false
  },
  favorites: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentType: { type: String, enum: ['hollywood_movie', 'bollywood_movie', 'hollywood_series', 'bollywood_series', 'podcast', 'cartoon'], required: true }
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
userSchema.post("findOneAndDelete", async function (user) {
  if (user) {
    await Review.deleteMany({ owner: user._id });
  }
});
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
