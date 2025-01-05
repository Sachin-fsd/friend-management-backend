const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Reference to User model
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Reference to User model
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending', // Default status is 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const FriendModel = mongoose.model('friends', friendSchema);

module.exports = {FriendModel};
