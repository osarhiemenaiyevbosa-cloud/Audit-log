const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // e.g. LOGIN, ROLE_CHANGE, NOTICE_PUBLISHED
    subject: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: ['UNREAD', 'READ'], default: 'UNREAD', index: true },
    sentAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
