const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const generateToken = require('../utils/generateToken');
const { createAuditEvent } = require('../services/auditService');
const { sendEmail } = require('../services/emailService');

async function register(req, res, next) {
  try {
    const { companyName, registrationNumber, companyEmail, name, email, password } = req.body;
    if (await User.findOne({ email })) 
      return res.status(409).json({ success: false, message: 'Email already exists' });
    if (await Company.findOne({ registrationNumber })) 
      return res.status(409).json({ success: false, message: 'Registration number already exists' });
    const company = await Company.create({ 
      name: companyName, 
      registrationNumber, 
      email: companyEmail });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      companyId: company._id, 
      name, 
      email, 
      passwordHash, 
      role: 'COMPANY_ADMIN', 
      status: 'ACTIVE' });
    await createAuditEvent({ req, action: 'COMPANY_REGISTER', resourceType: 'Company', resourceId: company._id.toString(), companyId: company._id, actorId: user._id, description: 'Company registration submitted' });
    await sendEmail({ 
      to: email, 
      subject: 'Audit Log registration received', 
      text: `Your company registration for ${company.name} was received and is pending approval.` });

    res.status(201).json({ success: true, message: 'Registration submitted. Company is pending approval.', company, user: user.toSafeJSON() });
  } catch (e) { next(e); }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) 
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (user.status !== 'ACTIVE') 
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    if (user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company || company.status !== 'APPROVED') 
        return res.status(403).json({ success: false, message: 'Company is not approved' });
    }
    user.lastLoginAt = new Date(); await user.save();
    await createAuditEvent({ req, 
      action: 'LOGIN', 
      resourceType: 'User', 
      resourceId: user._id.toString(), 
      companyId: user.companyId, 
      actorId: user._id, 
      description: 'User logged in' });
    await sendEmail({ 
      to: user.email, 
      subject: 'New login to Central Audit Log', 
      text: `A login was recorded for your account at ${new Date().toISOString()}.` });
    res.json({ success: true, token: generateToken(user), user: user.toSafeJSON() });
  } catch (e) { next(e); }
}
async function me(req, res) { 
  res.json({ success: true, user: req.user }); }
async function logout(req, res, next) {
  try { await createAuditEvent({ req, action: 'LOGOUT', resourceType: 'User', resourceId: req.user._id.toString(), description: 'User logged out' }); res.json({ success: true, message: 'Logged out successfully. Remove the token on the client.' }); }
  catch (e) { next(e); }
}
module.exports = { register, login, me, logout };