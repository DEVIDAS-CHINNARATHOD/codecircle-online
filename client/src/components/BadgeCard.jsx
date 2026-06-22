import { motion } from 'framer-motion'

const TIER_META = {
  codespark: {
    label: 'CodeSpark',
    icon: '⚡',
    color: 'text-violet-400',
    border: 'border-violet-500/40',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    bg: 'bg-violet-500/10',
    desc: '1+ resources shared this month',
  },
  codeflame: {
    label: 'CodeFlame',
    icon: '🔥',
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    bg: 'bg-orange-500/10',
    desc: '5+ resources shared this month',
  },
  codeelite: {
    label: 'CodeElite',
    icon: '👑',
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    bg: 'bg-yellow-500/10',
    desc: '10+ resources shared this month',
  },
}

/**
 * BadgeCard — displays a single badge with animated glow.
 *
 * Props:
 *   tier      — 'codespark' | 'codeflame' | 'codeelite'
 *   month     — number (1-12)
 *   year      — number
 *   count     — resource count at award time
 *   compact   — if true render a smaller inline pill
 */
export default function BadgeCard({ tier, month, year, count, compact = false }) {
  const meta = TIER_META[tier]
  if (!meta) return null

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${meta.bg} ${meta.border} ${meta.color}`}>
        <span>{meta.icon}</span> {meta.label}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border p-5 flex flex-col items-center text-center gap-2 ${meta.bg} ${meta.border} ${meta.glow}`}
    >
      <div className="text-4xl">{meta.icon}</div>
      <div className={`text-base font-bold ${meta.color}`}>{meta.label}</div>
      <div className="text-xs text-neutral-500">{monthName} {year}</div>
      {count > 0 && (
        <div className="text-xs text-neutral-600">{count} resource{count !== 1 ? 's' : ''} shared</div>
      )}
    </motion.div>
  )
}

export { TIER_META }
