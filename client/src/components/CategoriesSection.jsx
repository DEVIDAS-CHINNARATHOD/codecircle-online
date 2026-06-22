import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export const CATEGORIES = [
  {
    slug: 'trending-tech',
    title: 'Trending Tech',
    description: 'Stay updated with the latest technological trends and innovations shaping the industry.',
    accent: '#38bdf8',
  },
  {
    slug: 'internships',
    title: 'Internships',
    description: 'Discover internship opportunities from top companies worldwide, curated for students.',
    accent: '#f59e0b',
  },
  {
    slug: 'ai-ml',
    title: 'AI / ML',
    description: 'Dive into artificial intelligence and machine learning — resources, papers, and projects.',
    accent: '#93c5fd',
  },
  {
    slug: 'linux',
    title: 'Linux',
    description: 'Master Linux systems, commands, shell scripting, and administration skills from scratch.',
    accent: '#22c55e',
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Learn security practices, ethical hacking, CTF writeups, and system protection strategies.',
    accent: '#fca5a5',
  },
  {
    slug: 'open-source',
    title: 'Open Source',
    description: 'Contribute to open source projects, find good first issues, and collaborate globally.',
    accent: '#86efac',
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    description: 'Build modern websites and applications with the latest frameworks, tools, and techniques.',
    accent: '#c4b5fd',
  },
  {
    slug: 'projects-hackathons',
    title: 'Projects & Hackathons',
    description: 'Participate in exciting projects and competitive hackathons to grow your portfolio.',
    accent: '#fb7185',
  },
]

export default function CategoriesSection() {
  return (
    <section id="topics" className="section-padding">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="label-text mb-4">Topics</p>
          <h2 className="heading-lg text-white">What We Share</h2>
          <p className="body-muted mt-4 max-w-lg">
            Explore the diverse range of topics we cover to keep you ahead in the tech world.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group flex flex-col h-full p-6 bg-surface-0 hover:bg-surface-1 transition-colors duration-200"
              >
                {/* Accent bar */}
                <div
                  className="w-6 h-0.5 mb-6 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-10 transition-all duration-300"
                  style={{ backgroundColor: cat.accent }}
                />
                <h3 className="font-medium text-white text-base mb-2 group-hover:text-white transition-colors">
                  {cat.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed flex-1 group-hover:text-neutral-400 transition-colors">
                  {cat.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
                  Explore
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
