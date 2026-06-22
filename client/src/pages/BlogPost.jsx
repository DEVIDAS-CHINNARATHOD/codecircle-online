import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react'
import axios from 'axios'
import { getApiBase, SITE_BASE_URL } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()

export default function BlogPost() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios
      .get(`${API}/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6">
        <div className="container-width max-w-2xl">
          <div className="h-8 bg-white/5 rounded animate-pulse mb-4 w-3/4" />
          <div className="h-4 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-4 bg-white/5 rounded animate-pulse mb-2 w-5/6" />
          <div className="h-64 bg-white/5 rounded animate-pulse mt-8" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Post not found.</p>
          <Link to="/blog" className="btn-secondary text-sm">Back to Blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title={post.title}
        description={post.excerpt || post.content?.slice(0, 155) || 'Read this CodeCircle blog post.'}
        path={`/blog/${id}`}
        image={post.image || `${SITE_BASE_URL}/og-image.png`}
        type="article"
      />
      <div className="container-width max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Back */}
          <Link to="/blog" className="btn-ghost text-sm mb-8 inline-flex">
            <ArrowLeft size={14} /> Blog
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-neutral-600">
            {post.category && (
              <span className="flex items-center gap-1 label-text">
                <Tag size={10} /> {post.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <User size={10} />
              {post.author?.name || 'Admin'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-light text-white leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Image */}
          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full rounded-xl mb-8 object-cover max-h-80"
            />
          )}

          {/* Content */}
          <div
            className="prose-custom"
            style={{
              color: '#a3a3a3',
              lineHeight: '1.8',
              fontSize: '0.95rem',
            }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
          />

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-white/8 flex items-center justify-between">
            <Link to="/blog" className="btn-ghost text-sm">
              <ArrowLeft size={14} /> All posts
            </Link>
            {post.link && (
              <a href={post.link} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                View Resource
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
