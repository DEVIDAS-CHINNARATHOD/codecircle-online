const mongoose = require('mongoose')

/**
 * Badge — awarded when a user hits a resource-share milestone in a calendar month.
 *
 * Tiers:
 *   codespark  — 1+ resources shared in a month
 *   codeflame  — 5+ resources shared in a month
 *   codeelite  — 10+ resources shared in a month
 */
const badgeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tier: {
      type: String,
      enum: ['codespark', 'codeflame', 'codeelite'],
      required: true,
    },
    /** Display name for the badge */
    badgeName: { type: String, required: true }, // e.g. "CodeSpark"
    /** Calendar month (1–12) */
    month: { type: Number, required: true },
    /** Calendar year */
    year: { type: Number, required: true },
    /** How many resources the user shared that month (snapshot at award time) */
    resourceCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// One badge per user per tier per month — prevent duplicates
badgeSchema.index({ userId: 1, tier: 1, month: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('Badge', badgeSchema)
