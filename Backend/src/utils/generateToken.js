const jwt = require('jsonwebtoken');
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, companyId: user.companyId ? user.companyId.toString() : null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}
module.exports = generateToken;