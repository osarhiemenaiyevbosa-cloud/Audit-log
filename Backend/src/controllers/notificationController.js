const Notification = require('../models/Notification');

async function list(req, res, next) {
  try { 
    const data = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50); 
    res.json({ success: true, data }); 
  }
  catch (e) { next(e); }
}
async function markRead(req, res, next) {
  try { const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { status: 'READ' }, { new: true }); 
  if (!item) return res.status(404).json({ success: false, message: 'Notification not found' }); 
  res.json({ success: true, data: item }); }
  catch (e) { next(e); }
}
module.exports = { list, markRead };
