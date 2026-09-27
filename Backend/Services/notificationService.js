const Notification = require('../Models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Creates an in-app notification for a user, and optionally emails them too.
 * This is the one function the rest of the team should call whenever something
 * notification-worthy happens (login, role change, company approval, etc.)
 * instead of touching the Notification model directly.
 *
 * Usage:
 *   const { notifyUser } = require('../Services/notificationService');
 *   await notifyUser({
 *     userId: user._id,
 *     type: 'ROLE_CHANGE',
 *     subject: 'Your role has changed',
 *     message: `Your role is now ${user.role}`,
 *     email: user.email,
 *     sendEmailToo: true,
 *   });
 */
async function notifyUser({ userId, type, subject, message, email, metadata = {}, sendEmailToo = false }) {
  const notification = await Notification.create({
    userId,
    type,
    subject,
    message,
    metadata,
  });

  if (sendEmailToo && email) {
    await sendEmail({ to: email, subject: subject || type, text: message });
  }

  return notification;
}

module.exports = { notifyUser };
