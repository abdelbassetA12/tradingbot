const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  username: String,
  password: String,
  bio: String,
  avatar: String,
  theme: { type: String, default: 'theme1' },
  socialIcons: [
    {
      platform: String,  // مثال: 'facebook', 'twitter'
      url: String,
      active: { type: Boolean, default: true }
    }
  ]
});