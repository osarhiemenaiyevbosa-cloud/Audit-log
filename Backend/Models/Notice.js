const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Filter used everywhere a "what should ordinary users see right now" list is needed.
noticeSchema.statics.activeFilter = function () {
  const now = new Date();
  return {
    status: 'PUBLISHED',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
};

module.exports = mongoose.model('Notice', noticeSchema);
