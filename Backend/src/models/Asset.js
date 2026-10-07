const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    assetTag: {
      type: String,
      trim: true,
      default: ''
    },
    serialNumber: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'],
      default: 'ACTIVE'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);

assetSchema.index({ companyId: 1, createdAt: -1 });
assetSchema.index({ companyId: 1, assetTag: 1 });

module.exports = mongoose.model('Asset', assetSchema);
