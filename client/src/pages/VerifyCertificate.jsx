import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, ArrowLeft, Calendar, Award, ExternalLink, Globe, MessageSquare, Linkedin, Share2 } from 'lucide-react'
import { getApiBase } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()

const TIER_META = {
  codespark:  { label: 'Spark',     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',  icon: '⚡', iconUrl: '/assets/badge_spark.png' },
  codeflame:  { label: 'Catalyst',  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',  icon: '🔥', iconUrl: '/assets/badge_catalyst.png' },
  codeelite:  { label: 'Titan',     color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',  icon: '👑', iconUrl: '/assets/badge_titan.png' },
  custom:     { label: 'Custom',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',      icon: '✨' },
}

export default function VerifyCertificate() {
  const { certId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${API}/certificates/${certId}/verify`)
      .then(res => {
        setData(res.data.cert)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Certificate could not be verified.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [certId])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monthLabel = (m, y) =>
    new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white animate-spin mb-4" />
        <div className="text-neutral-500 text-sm">Verifying certificate authenticity...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex flex-col items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-red-400 mb-4" size={40} />
          <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-sm text-neutral-400 mb-6">{error || 'This certificate record is invalid or does not exist.'}</p>
          <Link to="/" className="btn-secondary w-full justify-center">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const meta = TIER_META[data.tier] || TIER_META.custom

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: data.themeColor || '#5B8CFF' }}
      />

      <Seo
        title={`Verified Achievement: ${data.userName}`}
        description={`CodeCircle Verified Certificate of Achievement for ${data.userName} - ${data.badgeName}`}
        path={`/verify/${certId}`}
      />

      <div className="container-width max-w-2xl relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={12} /> Back to CodeCircle
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-6 md:p-10 border-white/10"
        >
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-400 shrink-0" size={24} />
              <div>
                <h1 className="text-sm font-semibold tracking-wider text-green-400 uppercase">Verified Achievement</h1>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">ID: {data._id}</p>
              </div>
            </div>
            <button
              onClick={copyLink}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Share2 size={12} /> {copied ? 'Copied Link!' : 'Share Verification'}
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-4 mb-8">
            {data.userAvatar ? (
              <img src={data.userAvatar} alt={data.userName} className="w-14 h-14 rounded-full border-2 border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-lg font-medium text-white border-2 border-white/10">
                {data.userName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{data.userName}</h2>
              {data.username ? (
                <Link to={`/u/${data.username}`} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 mt-0.5 transition-colors">
                  @{data.username} <ExternalLink size={10} />
                </Link>
              ) : (
                <span className="text-xs text-neutral-500">CodeCircle Contributor</span>
              )}
            </div>
          </div>

          {/* Achievement Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Awarded Badge</div>
                <div className="flex items-center gap-2 mt-2">
                  {meta.iconUrl ? (
                    <img src={meta.iconUrl} className="w-6 h-6 object-contain" alt={data.badgeName} />
                  ) : (
                    <span className="text-xl">{meta.icon}</span>
                  )}
                  <span className="font-bold text-white text-base">{data.badgeName}</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Issue Date</div>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar size={16} className="text-neutral-400" />
                  <span className="font-semibold text-neutral-200 text-sm">{monthLabel(data.month, data.year)}</span>
                </div>
              </div>
            </div>

            {/* Message / Achievement Description */}
            <div className="glass rounded-xl p-6 border-white/8 space-y-4">
              <div className="flex items-start gap-3">
                <Award className="text-neutral-400 mt-1 shrink-0" size={18} />
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono mb-2">Contribution Details</div>
                  {data.isCustom ? (
                    <div className="space-y-3">
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        Presented to {data.userName} for outstanding contributions to the CodeCircle community.
                      </p>
                      {data.platforms && data.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {data.platforms.map(p => (
                            <span key={p} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-neutral-300 flex items-center gap-1">
                              {p === 'Website' && <Globe size={10} />}
                              {p === 'WhatsApp' && <MessageSquare size={10} />}
                              {p === 'Discord' && <MessageSquare size={10} />}
                              {p === 'LinkedIn' && <Linkedin size={10} />}
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      {data.contribution && (
                        <p className="text-xs text-neutral-400 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed font-mono">
                          {data.contribution}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Successfully shared resources with the community to support peer learning, collaborative sharing, and mutual growth within CodeCircle.
                    </p>
                  )}
                </div>
              </div>

              {data.customMessage && (
                <div className="pt-2 border-t border-white/6">
                  <p className="text-xs italic text-neutral-400">
                    "{data.customMessage}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between text-xs text-neutral-500">
            <span>Verified by CodeCircle Admin</span>
            <span>Founder: DEVIDAS CHINNARATHOD</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
