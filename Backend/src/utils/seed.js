require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');

(async () => {
  try {
    await connectDB();

    const email = 'admin@audit.local';
    const password = 'Admin@12345';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Seed admin already exists');
      process.exit(0);
    }

    let company = await Company.findOne({ registrationNumber: 'SYSTEM-001' });

    if (!company) {
      company = await Company.create({
        name: 'System Administration',
        registrationNumber: 'SYSTEM-001',
        email,
        status: 'APPROVED'
      });
    } else if (company.status !== 'APPROVED') {
      company.status = 'APPROVED';
      await company.save();
    }

    const admin = await User.findOne({
      companyId: company._id,
      role: 'SYSTEM_ADMIN'
    });
    const passwordHash = await bcrypt.hash(password, 12);
    if (admin) {
      admin.name = 'System Administrator';
      admin.email = email;
      admin.passwordHash = passwordHash;
      admin.role = 'SYSTEM_ADMIN';
      admin.status = 'ACTIVE';
      admin.companyId = company._id;
      await admin.save();
    } else {
      await User.create({
        name: 'System Administrator',
        email,
        passwordHash,
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
        companyId: company._id
      });
    }

    console.log('Seed complete. Admin login: admin@audit.local');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();