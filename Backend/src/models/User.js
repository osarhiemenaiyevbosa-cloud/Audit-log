const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    default: null 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['SYSTEM_ADMIN', 'COMPANY_ADMIN', 'AUDITOR', 'USER', 'VIEWER'], 
    default: 'USER' 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE'], 
    default: 'ACTIVE' 
  },
  lastLoginAt: Date
}, { timestamps: true });
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};
module.exports = mongoose.model('User', userSchema);