import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Twitter, Linkedin, MessageCircle, ExternalLink } from 'lucide-react'
import { TIER_META } from './BadgeCard'

/**
 * ShareCard — modal that lets a user share their profile, badge, and ranking.
 *
 * Props:
 *   user           — { name, avatar }
 *   badge          — badge object from API or null
 *   resourceCount  — total resources shared this month
 *   rank           — current leaderboard rank or null
 *   profileUrl     — shareable public URL for the user's profile
 *   onClose        — callback to close the modal
 */
export default function ShareCard({ user, badge, resourceCount, rank, profileUrl, onClose }) {
  const [copied, setCopied] = useState(false)

  const meta = badge ? TIER_META[badge.tier] : null

  const shareText = [
    `🚀 I'm a CodeCircle contributor!`,
    badge   ? `🏅 Badge: ${badge.badgeName} ${meta?.icon}` : '',
    rank    ? `🏆 Leaderboard rank: #${rank}` : '',
    resourceCount ? `📚 ${resourceCount} resource${resourceCount !== 1 ? 's' : ''} shared this month` : '',
    `\nCheck it out: ${profileUrl}`,
  ].filter(Boolean).join('\n')

  const encodedText = encodeURIComponent(shareText)
  const encodedUrl  = encodeURIComponent(profileUrl)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* fallback: select text */
    }
  }

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <Twitter size={15} />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20',
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin size={15} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20',
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle size={15} />,
      href: `https://wa.me/?text=${encodedText}`,
      color: 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20',
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="glass rounded-2xl p-6 md:p-8 w-full max-w-md relative"
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-neutral-600 hover:text-white transition-colors">
            <X size={18} />
          </button>

          {/* Profile card preview */}
          <div className="flex flex-col items-center text-center mb-6 gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-white/20 shadow-lg"
            />
            <div>
              <div className="text-white font-semibold text-lg">{user.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">CodeCircle Contributor</div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-1">
              {resourceCount > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{resourceCount}</div>
                  <div className="text-xs text-neutral-600">resources</div>
                </div>
              )}
              {rank && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">#{rank}</div>
                  <div className="text-xs text-neutral-600">rank</div>
                </div>
              )}
              {badge && meta && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${meta.bg} ${meta.border} ${meta.color}`}>
                  {meta.iconUrl ? (
                    <img src={meta.iconUrl} className="w-4 h-4 object-contain" alt={badge.badgeName} />
                  ) : (
                    <span>{meta.icon}</span>
                  )}
                  <span>{badge.badgeName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile link */}
          <div className="mb-4">
            <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Your profile link</div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <ExternalLink size={13} className="text-neutral-600 shrink-0" />
              <span className="text-xs text-neutral-400 flex-1 truncate font-mono">{profileUrl}</span>
              <button
                onClick={copyToClipboard}
                className="shrink-0 flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Share on</div>
          <div className="flex flex-col gap-2">
            {shareLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${link.color}`}
              >
                {link.icon}
                {link.label}
                <ExternalLink size={12} className="ml-auto opacity-50" />
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
