const { ROLE_PERMISSIONS } = require('../utils/constants');
function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!permissions.includes(permission)) return res.status(403).json({ success: false, message: 'Permission denied' });
    next();
  };
}
module.exports = { requirePermission };