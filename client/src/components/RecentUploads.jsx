import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Link2, User, Grid } from 'lucide-react'
import axios from 'axios'
import { getApiBase } from '../lib/utils'
import { CATEGORIES } from './CategoriesSection'

const API = getApiBase()
const getCategory = (slug) => CATEGORIES.find(category => category.slug === slug)

export default function RecentUploads() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit]       = useState(6)
  const [total, setTotal]       = useState(0)

  useEffect(() => {
    setLoading(true)
    axios
      .get(`${API}/resources?limit=${limit}`)
      .then(res => {
        setResources(res.data.resources || [])
        setTotal(res.data.total || 0)
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }, [limit])

  return (
    <section className="section-padding border-t border-white/8">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4"
        >
          <div>
            <p className="label-text mb-4">Resources Hub</p>
            <h2 className="heading-lg text-white">Latest resources shared</h2>
          </div>
          <div className="flex items-center gap-3">
            {limit !== 'all' && total > 0 && (
              <button
                onClick={() => setLimit('all')}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Grid size={14} /> View All ({total})
              </button>
            )}
            <a href="/submit-resource" className="btn-ghost text-sm flex items-center gap-2">
              Upload resource <ArrowRight size={14} />
            </a>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="glass rounded-xl p-8 text-sm text-neutral-500">
            No resources uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource, i) => {
              const category = getCategory(resource.category)
              return (
              <motion.a
                key={resource._id}
                href={resource.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                className="group glass rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  {resource.image ? (
                    <img src={resource.image} alt={resource.title} className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-40 bg-white/5" />
                  )}
                  <div className="p-5">
                    {category && (
                      <span className="mb-2 flex items-center gap-2 font-semibold tracking-wider uppercase text-[10px]" style={{ color: category.accent }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.accent }} />
                        {category.title}
                      </span>
                    )}
                    <h3 className="font-medium text-white text-base mb-2 line-clamp-2">{resource.title}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-2">{resource.description}</p>
                  </div>
                </div>
                <div className="p-5 pt-0 mt-auto">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 min-w-0">
                      <User size={10} />
                      <span className="truncate">{resource.submittedBy?.name || 'Contributor'}</span>
                    </span>
                    <span className="flex items-center gap-1 truncate text-violet-400/80 group-hover:text-violet-400">
                      <Link2 size={10} />
                      Link
                    </span>
                  </div>
                </div>
              </motion.a>
              )
            })}
          </div>
        )}

        {limit !== 'all' && total > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <button
              onClick={() => setLimit('all')}
              className="btn-primary text-sm w-full py-3"
            >
              View All Resources ({total})
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
