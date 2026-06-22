import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Link2,
  MessageCircle,
  Share2,
  User,
} from 'lucide-react'
import axios from 'axios'
import { CATEGORIES } from '../components/CategoriesSection'
import { getApiBase, SITE_BASE_URL } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()

const getCategory = (slug) => CATEGORIES.find(category => category.slug === slug)

const getHostname = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default function ResourceDetail() {
  const { id } = useParams()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    axios
      .get(`${API}/resources/${id}`)
      .then(res => setResource(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6">
        <div className="container-width max-w-4xl">
          <div className="h-8 w-1/2 rounded bg-white/5 animate-pulse mb-4" />
          <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse mb-2" />
          <div className="h-72 rounded-2xl bg-white/5 animate-pulse mt-8" />
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Resource not found.</p>
          <Link to="/" className="btn-secondary text-sm">Back to home</Link>
        </div>
      </div>
    )
  }

  const category = getCategory(resource.category)
  const shareText = encodeURIComponent(
    `Check out this resource on CodeCircle: ${resource.title}\n${window.location.href}`
  )

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title={resource.title}
        description={resource.description}
        path={`/resources/${resource._id}`}
        image={resource.image || `${SITE_BASE_URL}/og-image.png`}
      />

      <div className="container-width max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/" className="btn-ghost text-sm mb-8 inline-flex">
            <ArrowLeft size={14} /> Resources
          </Link>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
            <article className="glass rounded-3xl overflow-hidden">
              {resource.image ? (
                <img src={resource.image} alt={resource.title} className="w-full h-72 object-cover" />
              ) : (
                <div className="w-full h-72 bg-white/5" />
              )}

              <div className="p-6 md:p-8">
                {category && (
                  <div className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: category.accent }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.accent }} />
                    {category.title}
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl font-light text-white leading-tight">
                  {resource.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {resource.submittedBy?.name || 'Contributor'}
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Link2 size={12} />
                    <span className="truncate">{getHostname(resource.link)}</span>
                  </span>
                </div>

                <div className="mt-8 rounded-2xl border border-white/8 bg-white/4 p-6">
                  <h2 className="text-sm font-medium text-white mb-3">About this resource</h2>
                  <p className="text-sm leading-7 text-neutral-300 whitespace-pre-wrap">
                    {resource.description}
                  </p>
                </div>
              </div>
            </article>

            <aside className="glass rounded-3xl p-6 space-y-5 xl:sticky xl:top-28">
              <div>
                <h2 className="text-white font-medium text-lg">Open source</h2>
                <p className="text-sm text-neutral-500 mt-2">
                  Continue to the original website when you are ready.
                </p>
              </div>

              <a
                href={resource.link}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full justify-center"
              >
                <ExternalLink size={14} /> Visit original link
              </a>

              <div className="space-y-3 border-t border-white/8 pt-5">
                <div className="text-xs uppercase tracking-widest text-neutral-600">Share this page</div>
                <button onClick={copyLink} className="btn-ghost w-full justify-center text-sm">
                  {copied ? <><Check size={14} /> Link copied</> : <><Copy size={14} /> Copy page link</>}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost w-full justify-center text-sm"
                >
                  <Share2 size={14} /> Share on X
                </a>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost w-full justify-center text-sm"
                >
                  <MessageCircle size={14} /> Share on WhatsApp
                </a>
              </div>

              {resource.submittedBy?.username && (
                <div className="border-t border-white/8 pt-5">
                  <Link to={`/u/${resource.submittedBy.username}`} className="btn-ghost w-full justify-center text-sm">
                    <User size={14} /> View contributor profile
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
