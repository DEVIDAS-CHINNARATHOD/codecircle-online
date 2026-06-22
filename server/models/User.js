const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    googleId:  { type: String, required: true, unique: true },
    name:      { type: String, required: true },
    username:  { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email:     { type: String, required: true, unique: true },
    avatar:    String,
    isAdmin:   { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
