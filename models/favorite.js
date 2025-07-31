const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contentType: { type: String, required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate favorites
favoriteSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });

favoriteSchema.statics.isFavorited = async function(userId, contentId, contentType) {
  return await this.exists({ user: userId, contentId, contentType });
};

module.exports = mongoose.model('Favorite', favoriteSchema);
