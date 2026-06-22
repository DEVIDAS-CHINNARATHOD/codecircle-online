const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    tier:        { type: String, enum: ['codespark', 'codeflame', 'codeelite', 'custom'], required: true },
    badgeName:   { type: String, required: true },
    month:       { type: Number, required: true },
    year:        { type: Number, required: true },
    resourceCount: { type: Number, default: 0 },
    issuedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageData:   { type: String, required: true },    // base64 PNG
    downloaded:  { type: Boolean, default: false },

    // Certificate appearance overrides (editable by admin)
    themeColor:  { type: String, default: null },     // hex color override
    customMessage: { type: String, default: null },   // extra message line

    // For custom platform certificates
    isCustom:    { type: Boolean, default: false },
    platforms:   [{ type: String }],                  // ['website', 'whatsapp', 'discord', 'linkedin']
    contribution: { type: String, default: null },    // free-text description
  },
  { timestamps: true }
)

// One certificate per user per tier per month (custom certs bypass this via isCustom)
certificateSchema.index({ userId: 1, tier: 1, month: 1, year: 1 }, {
  unique: true,
  partialFilterExpression: { isCustom: { $ne: true } },
})

module.exports = mongoose.model('Certificate', certificateSchema)
