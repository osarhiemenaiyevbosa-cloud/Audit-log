const mongoose = require('mongoose');

const whistleblowerSchema = new mongoose.Schema(
    {
        referenceCode: { 
            type: String, 
            unique: true, 
            required: true, 
            index: true 
        },

        encryptedContent: { 
            type: String, 
            required: true 
        },

        category: { 
            type: String, 
            default: 'GENERAL' 
        },

        status: { 
            type: String, 
            enum: ['NEW', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'], 
            default: 'NEW' 
        },

        submittedAt: { 
            type: Date, 
            default: Date.now 
        },

        assignedTo: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            default: null 
        },

        notes: { 
            type: String, 
            default: '' 
        }
}, 
{ timestamps: true });

module.exports = mongoose.model('WhistleblowerReport', whistleblowerSchema);