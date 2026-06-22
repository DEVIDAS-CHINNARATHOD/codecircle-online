import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Check, ImagePlus, Link2, UploadCloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../components/CategoriesSection'
import { fileToDataUrl, getApiBase } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()

export default function SubmitResource() {
  const { user, loading, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '', link: '', image: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const selectedCategory = CATEGORIES.find(c => c.slug === form.category)

  useEffect(() => {
    if (!loading && !user) {
      loginWithGoogle('/submit-resource')
    }
  }, [loading, user, loginWithGoogle])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      await axios.post(`${API}/resources`, form)
      setMessage('Resource submitted successfully.')
      setForm({ title: '', description: '', category: '', link: '', image: '' })
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch (err) {
      if (!err.response) {
        setMessage('Could not reach server. Please check backend status.')
      } else {
        setMessage(err.response?.data?.error || 'Could not submit resource.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setForm(f => ({ ...f, image: dataUrl }))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Redirecting to Google sign in...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title="Submit Resource"
        description="Share a useful resource, tutorial, tool, or opportunity with the CodeCircle community."
        path="/submit-resource"
        noindex
      />
      <div className="container-width">
        <div className="mb-8 max-w-3xl">
          <p className="label-text mb-3">Submit Resource</p>
          <h1 className="heading-lg text-white">Share a resource with the community</h1>
          <p className="body-muted mt-3 max-w-2xl">
            Add a useful link, tutorial, event, or tool for other students.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="glass rounded-2xl p-6 md:p-8 flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Resource title"
                className="input-base md:col-span-2"
              />
              <input
                required
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://example.com"
                className="input-base md:col-span-2"
              />
            </div>

            <textarea
              required
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Why is this useful?"
              rows={5}
              className="input-base"
            />

            <div className="flex flex-col gap-3">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-600">Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map(category => {
                  const active = form.category === category.slug
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: category.slug }))}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? 'bg-white/10 border-white/25' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: category.accent }} />
                      <span className="text-sm text-white flex-1">{category.title}</span>
                      {active && <Check size={14} className="text-green-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-600">Image upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input-base file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-black hover:file:bg-neutral-100"
              />
              {form.image && <p className="text-xs text-neutral-500">Image selected.</p>}
            </div>

            {message && <div className="text-sm text-neutral-300">{message}</div>}

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                <UploadCloud size={14} /> {submitting ? 'Submitting...' : 'Submit Resource'}
              </button>
              <button type="button" onClick={() => navigate('/')} className="btn-ghost">
                Back to Home
              </button>
            </div>
          </motion.form>

          <aside className="glass rounded-2xl overflow-hidden lg:sticky lg:top-28">
            {form.image ? (
              <img src={form.image} alt={form.title || 'Resource preview'} className="h-44 w-full object-cover" />
            ) : (
              <div className="h-44 w-full bg-white/5 flex items-center justify-center text-neutral-600">
                <ImagePlus size={28} />
              </div>
            )}
            <div className="p-5">
              {selectedCategory && (
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: selectedCategory.accent }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedCategory.accent }} />
                  {selectedCategory.title}
                </div>
              )}
              <h2 className="text-white font-semibold text-base line-clamp-2">
                {form.title || 'Resource preview'}
              </h2>
              <p className="mt-2 text-sm text-neutral-500 line-clamp-4">
                {form.description || 'Your description will appear here before publishing.'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600 min-w-0">
                <Link2 size={12} className="shrink-0" />
                <span className="truncate">{form.link || 'Resource link'}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
