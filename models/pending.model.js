const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema(
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
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Reference to User model
      required: true,
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

const PendingModel = mongoose.model('pending', pendingSchema);

module.exports = {PendingModel};
