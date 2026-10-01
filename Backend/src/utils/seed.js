require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');

(async () => {
  try {
    await connectDB();

    const existing = await User.findOne({
      email: 'admin@audit.local'
    });

    if (existing) {
      console.log('Seed admin already exists');
      process.exit(0);
    }

    const company = await Company.create({
      name: 'System Administration',
      registrationNumber: 'SYSTEM-001',
      email: 'admin@audit.local',
      status: 'APPROVED'
    });

    const passwordHash = await bcrypt.hash(
      'Admin@12345',
      12
    );

    await User.create({
      name: 'System Administrator',
      email: 'admin@audit.local',
      passwordHash,
      role: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
      companyId: company._id
    });

    console.log(
      'Seed complete: admin@audit.local / Admin@12345'
    );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();