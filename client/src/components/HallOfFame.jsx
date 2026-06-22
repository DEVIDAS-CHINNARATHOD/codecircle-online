import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Github, Link2, Sparkles, Trophy, Upload, X } from 'lucide-react'
import axios from 'axios'
import { getApiBase } from '../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

const API = getApiBase()
const REPO = import.meta.env.VITE_GITHUB_REPO || 'codecircle-online/codecircle-online'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'CC'
}

function AvatarStack({ items, getName, getImage, ringClassName = 'ring-black/70' }) {
  return (
    <div className="flex -space-x-2">
      {items.map((item, index) => (
        <Avatar
          key={`${getName(item)}-${index}`}
          className="h-8 w-8 ring-2 ring-offset-0 bg-neutral-900"
          style={{ zIndex: items.length - index }}
        >
          <AvatarImage src={getImage(item)} alt={getName(item)} className={`ring-2 ${ringClassName}`} />
          <AvatarFallback>{initials(getName(item))}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}

function FameModal({ open, onClose, title, subtitle, items, type }) {
  useEffect(() => {
    if (!open) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm px-4 py-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-3xl glass-strong rounded-3xl border border-white/10 max-h-full overflow-hidden"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
              <div>
                <p className="label-text mb-2">{title}</p>
                <h3 className="text-2xl font-semibold text-white">{subtitle}</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-neutral-400 transition-colors hover:text-white hover:border-white/20"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id || item.login}
                    className="glass rounded-2xl px-4 py-4 border border-white/8"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={item.avatar || item.avatar_url} alt={item.name || item.login} />
                        <AvatarFallback>{initials(item.name || item.login)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {item.name || item.login}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              #{index + 1}
                            </p>
                          </div>

                          {type === 'contributors' ? (
                            <a
                              href={item.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-ghost text-xs shrink-0"
                            >
                              <Github size={12} />
                              Profile
                            </a>
                          ) : (
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300">
                              {item.count} resource{item.count === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>

                        {type === 'contributors' ? (
                          <p className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
                            <Sparkles size={13} className="text-amber-300" />
                            {item.contributions} contribution{item.contributions === 1 ? '' : 's'}
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {item.resources.map((resource, resourceIndex) => (
                              <Link
                                key={`${resource.id}-${resourceIndex}`}
                                to={`/resources/${resource.id}`}
                                className="flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
                              >
                                <Link2 size={13} className="shrink-0" />
                                <span className="truncate">{resource.title}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function HallOfFame() {
  const [contributors, setContributors] = useState([])
  const [uploaders, setUploaders] = useState([])
  const [contributorsLoading, setContributorsLoading] = useState(true)
  const [uploadersLoading, setUploadersLoading] = useState(true)
  const [contributorsError, setContributorsError] = useState(false)
  const [uploadersError, setUploadersError] = useState(false)
  const [openPanel, setOpenPanel] = useState(null)

  useEffect(() => {
    axios
      .get(`https://api.github.com/repos/${REPO}/contributors?per_page=24`)
      .then(res => setContributors(res.data || []))
      .catch(() => setContributorsError(true))
      .finally(() => setContributorsLoading(false))
  }, [])

  useEffect(() => {
    axios
      .get(`${API}/resources?limit=200`)
      .then(res => {
        const grouped = new Map()

        for (const resource of res.data.resources || []) {
          const submitter = resource.submittedBy
          if (!submitter?._id) continue

          const existing = grouped.get(submitter._id) || {
            id: submitter._id,
            name: submitter.name,
            avatar: submitter.avatar,
            count: 0,
            resources: [],
          }

          existing.count += 1
          existing.resources.push({
            id: resource._id,
            title: resource.title,
            link: resource.link,
          })
          grouped.set(submitter._id, existing)
        }

        setUploaders(Array.from(grouped.values()).sort((a, b) => b.count - a.count))
      })
      .catch(() => setUploadersError(true))
      .finally(() => setUploadersLoading(false))
  }, [])

  const featuredResourceCount = useMemo(
    () => uploaders.reduce((total, uploader) => total + uploader.count, 0),
    [uploaders]
  )

  const contributorPreview = contributors.slice(0, 6)
  const uploaderPreview = uploaders.slice(0, 6)

  return (
    <>
      <section id="hall-of-fame" className="section-padding border-t border-white/8">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="label-text mb-4">Community Hall of Fame</p>
            <h2 className="heading-lg text-white">Small wins. Real people.</h2>
            <p className="body-muted mt-4 max-w-2xl">
              The builders behind the repo and the people sharing the best resources are featured here.
              Open each group to see everyone.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              onClick={() => contributors.length && setOpenPanel('contributors')}
              className="glass rounded-3xl p-6 text-left transition-all hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">GitHub contributors</p>
                    <p className="mt-2 text-sm text-neutral-400">
                      {contributorsLoading
                        ? 'Loading contributors...'
                        : contributorsError
                          ? 'Could not load contributors.'
                          : `${contributors.length} people building the repo.`}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
                  Tap to view all
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                {contributorPreview.length ? (
                  <AvatarStack
                    items={contributorPreview}
                    getName={item => item.login}
                    getImage={item => item.avatar_url}
                  />
                ) : (
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <Github size={14} />
                  <span>
                    {contributorsLoading || contributorsError
                      ? 'No data'
                      : `${contributors.reduce((total, item) => total + item.contributions, 0)} commits`}
                  </span>
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.4 }}
              onClick={() => uploaders.length && setOpenPanel('uploaders')}
              className="glass rounded-3xl p-6 text-left transition-all hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Resource uploaders</p>
                    <p className="mt-2 text-sm text-neutral-400">
                      {uploadersLoading
                        ? 'Loading uploaders...'
                        : uploadersError
                          ? 'Could not load resource uploaders.'
                          : `${uploaders.length} people shared ${featuredResourceCount} resources.`}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
                  Tap to view all
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                {uploaderPreview.length ? (
                  <AvatarStack
                    items={uploaderPreview}
                    getName={item => item.name}
                    getImage={item => item.avatar}
                    ringClassName="ring-slate-950"
                  />
                ) : (
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <Sparkles size={14} />
                  <span>
                    {uploadersLoading || uploadersError ? 'No data' : `${featuredResourceCount} shared`}
                  </span>
                </div>
              </div>
            </motion.button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/submit-resource" className="btn-ghost text-sm">
              <Link2 size={14} />
              Upload a resource
            </a>
            <a
              href={`https://github.com/${REPO}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-sm"
            >
              <Github size={14} />
              View repository
            </a>
          </div>
        </div>
      </section>

      <FameModal
        open={openPanel === 'contributors'}
        onClose={() => setOpenPanel(null)}
        title="Hall of Fame"
        subtitle="All contributors"
        items={contributors}
        type="contributors"
      />

      <FameModal
        open={openPanel === 'uploaders'}
        onClose={() => setOpenPanel(null)}
        title="Hall of Fame"
        subtitle="All resource uploaders"
        items={uploaders}
        type="uploaders"
      />
    </>
  )
}
