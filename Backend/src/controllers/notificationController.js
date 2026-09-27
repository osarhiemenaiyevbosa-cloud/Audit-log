const Notification = require('../models/Notification');

// GET /api/notifications  (?status=UNREAD|READ optional)
async function list(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [data, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, status: 'UNREAD' }),
    ]);

    res.json({
      success: true,
      data,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/notifications/:id/read
async function markRead(req, res, next) {
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'READ' },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, status: 'UNREAD' },
      { status: 'READ' }
    );
    res.json({ success: true, message: 'All notifications marked as read', updated: result.modifiedCount });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, markRead, markAllRead };
