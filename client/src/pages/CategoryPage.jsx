import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { CATEGORIES } from '../components/CategoriesSection'
import { getApiBase } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()
const getHostname = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default function CategoryPage() {
  const { slug } = useParams()
  const category = CATEGORIES.find(c => c.slug === slug)
  const [posts, setPosts] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/posts?category=${slug}&limit=12`).then(r => r.data.posts || []).catch(() => []),
      axios.get(`${API}/resources?category=${slug}&limit=12`).then(r => r.data.resources || []).catch(() => []),
    ]).then(([p, r]) => { setPosts(p); setResources(r) }).finally(() => setLoading(false))
  }, [slug])

  if (!category) {
    return (
      <div className="min-h-screen pt-28 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Category not found.</p>
          <Link to="/" className="btn-secondary text-sm">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title={`${category.title} Resources`}
        description={category.description}
        path={`/category/${slug}`}
      />
      <div className="container-width">
        {/* Back */}
        <Link to="/#topics" className="btn-ghost text-sm mb-8 inline-flex">
          <ArrowLeft size={14} /> Topics
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="w-8 h-0.5 rounded-full mb-5" style={{ backgroundColor: category.accent }} />
          <p className="label-text mb-3">{category.title}</p>
          <h1 className="heading-xl text-white">{category.title}</h1>
          <p className="body-muted mt-4 max-w-xl">{category.description}</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-xl h-48 animate-pulse" />)}
          </div>
        ) : posts.length === 0 && resources.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-neutral-500 mb-2">No content yet in this category.</p>
            <p className="text-xs text-neutral-700">Check back soon or contribute on our Discord.</p>
          </div>
        ) : (
          <>
            {posts.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-neutral-400 mb-5">Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                  {posts.map((post, i) => (
                    <motion.div key={post._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/blog/${post._id}`} className="group flex flex-col h-full glass rounded-xl overflow-hidden hover:border-white/20 transition-all">
                        {post.image && <img src={post.image} alt={post.title} className="w-full h-36 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-medium text-white text-sm leading-snug mb-2 line-clamp-2">{post.title}</h3>
                          <p className="text-xs text-neutral-500 line-clamp-2 flex-1">{post.excerpt}</p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-700">
                            <span className="flex items-center gap-1"><Calendar size={9} />{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><User size={9} />{post.author?.name || 'Admin'}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {resources.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-neutral-400 mb-5">Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((res, i) => (
                    <motion.div key={res._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/resources/${res._id}`} className="group glass rounded-xl p-5 flex gap-4 hover:border-white/20 transition-all">
                        {res.image && <img src={res.image} alt={res.title} className="w-16 h-16 rounded-lg object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />}
                        <div className="min-w-0">
                          <span className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: category.accent }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.accent }} />
                            {category.title}
                          </span>
                          <h3 className="font-medium text-white text-sm mb-1 truncate">{res.title}</h3>
                          <p className="text-xs text-neutral-500 line-clamp-2">{res.description}</p>
                          <span className="mt-2 inline-block text-xs text-neutral-700 font-mono">{res.link ? getHostname(res.link) : ''}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
