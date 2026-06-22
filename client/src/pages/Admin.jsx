import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, X, Check, Award, Download, Users, FileText, BookOpen, RefreshCw, ChevronRight, Globe, MessageSquare, Linkedin } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../components/CategoriesSection'
import { fileToDataUrl, getApiBase } from '../lib/utils'
import Seo from '../components/Seo'

const API = getApiBase()

const TABS = ['Posts', 'Resources', 'Users', 'Certificates']

const TIER_META = {
  codespark:  { label: 'Spark',     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',  icon: '⚡', iconUrl: '/assets/badge_spark.jpg' },
  codeflame:  { label: 'Catalyst',  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',  icon: '🔥', iconUrl: '/assets/badge_catalyst.jpg' },
  codeelite:  { label: 'Titan',     color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',  icon: '👑', iconUrl: '/assets/badge_titan.jpg' },
  custom:     { label: 'Custom',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',      icon: '✨' },
}

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('Posts')
  const [posts, setPosts]       = useState([])
  const [resources, setResources] = useState([])
  const [users, setUsers]       = useState([])
  const [form, setForm]         = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]           = useState('')

  // Certificate tab state
  const [candidates, setCandidates]       = useState([])
  const [certificates, setCertificates]   = useState([])
  const [certLoading, setCertLoading]     = useState(false)
  const [generating, setGenerating]       = useState(null) // userId being generated
  const [rerenderingCertId, setRerenderingCertId] = useState(null)
  const [allUsers, setAllUsers]           = useState([])

  // Modals state
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)

  // Modals forms
  const [customForm, setCustomForm] = useState({
    userId: '',
    badgeName: 'Community Champion',
    platforms: [],
    contribution: '',
    themeColor: '#5B8CFF',
    customMessage: 'Thank you for your multi-platform contributions!',
  })

  const [editForm, setEditForm] = useState({
    _id: '',
    badgeName: '',
    themeColor: '',
    customMessage: '',
  })

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) navigate('/')
  }, [user, loading])

  useEffect(() => { fetchData() }, [tab])

  const fetchData = useCallback(() => {
    if (tab === 'Posts') {
      axios.get(`${API}/posts?limit=50`).then(r => setPosts(r.data.posts || [])).catch(() => {})
    } else if (tab === 'Resources') {
      axios.get(`${API}/resources?limit=50`).then(r => setResources(r.data.resources || [])).catch(() => {})
    } else if (tab === 'Users') {
      axios.get(`${API}/admin/users`).then(r => setUsers(r.data || [])).catch(() => {})
    } else if (tab === 'Certificates') {
      setCertLoading(true)
      Promise.all([
        axios.get(`${API}/admin/badge-candidates`),
        axios.get(`${API}/admin/certificates`),
        axios.get(`${API}/admin/all-users`),
      ]).then(([candidatesRes, certsRes, usersRes]) => {
        setCandidates(candidatesRes.data.candidates || [])
        setCertificates(certsRes.data || [])
        setAllUsers(usersRes.data || [])
      }).catch(() => {})
        .finally(() => setCertLoading(false))
    }
  }, [tab])

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return
    await axios.delete(`${API}/posts/${id}`)
    fetchData()
  }

  const deleteResource = async (id) => {
    if (!confirm('Delete this resource?')) return
    await axios.delete(`${API}/resources/${id}`)
    fetchData()
  }

  const submitPost = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (form._id) await axios.put(`${API}/posts/${form._id}`, form)
      else          await axios.post(`${API}/posts`, form)
      setMsg('Saved.')
      setForm(null)
      fetchData()
    } catch { setMsg('Error saving.') }
    setSubmitting(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const submitResource = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (form._id) await axios.put(`${API}/resources/${form._id}`, form)
      else          await axios.post(`${API}/resources`, form)
      setMsg('Saved.')
      setForm(null)
      fetchData()
    } catch { setMsg('Error saving.') }
    setSubmitting(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setForm(f => ({ ...f, image: dataUrl }))
  }

  const generateCertificate = async (userId, tier) => {
    setGenerating(userId)
    try {
      await axios.post(`${API}/admin/certificates/generate`, { userId, tier })
      setMsg(`Certificate generated!`)
      setTimeout(() => setMsg(''), 3000)
      fetchData()
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to generate certificate.')
    } finally {
      setGenerating(null)
    }
  }

  const submitCustomCertificate = async (e) => {
    e.preventDefault()
    if (!customForm.userId) return alert('Please select a user.')
    setSubmitting(true)
    try {
      await axios.post(`${API}/admin/certificates/custom`, customForm)
      setMsg('Custom certificate generated successfully!')
      setShowCustomModal(false)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate custom certificate.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const submitEditCertificate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.put(`${API}/admin/certificates/${editForm._id}/edit`, editForm)
      setMsg('Certificate updated and re-rendered successfully!')
      setShowEditModal(false)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update certificate.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const rerenderCertificate = async (certificateId) => {
    setRerenderingCertId(certificateId)
    try {
      await axios.post(`${API}/admin/certificates/${certificateId}/rerender`)
      setMsg('Certificate design refreshed successfully!')
      fetchData()
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to refresh certificate design.')
    } finally {
      setRerenderingCertId(null)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const togglePlatform = (plat) => {
    setCustomForm(f => {
      const platforms = f.platforms.includes(plat)
        ? f.platforms.filter(p => p !== plat)
        : [...f.platforms, plat]
      return { ...f, platforms }
    })
  }

  const monthLabel = (m, y) =>
    new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) return null

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <Seo
        title="Admin Dashboard"
        description="Manage posts, resources, users, and certificates for CodeCircle."
        path="/admin"
        noindex
      />
      <div className="container-width">
        <div className="mb-10">
          <p className="label-text mb-3">Admin</p>
          <h1 className="heading-lg text-white">Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 glass rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setForm(null) }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${tab === t ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              {t === 'Posts'        && <BookOpen  size={13} />}
              {t === 'Resources'    && <FileText  size={13} />}
              {t === 'Users'        && <Users     size={13} />}
              {t === 'Certificates' && <Award     size={13} />}
              {t}
            </button>
          ))}
        </div>

        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400 flex items-center gap-2"
          >
            <Check size={14} /> {msg}
          </motion.div>
        )}

        {/* ── Posts tab ──────────────────────────────────────────────────── */}
        {tab === 'Posts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-neutral-400">Blog Posts ({posts.length})</h2>
              <button
                onClick={() => setForm({ title: '', excerpt: '', content: '', category: '', image: '', link: '' })}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} /> New Post
              </button>
            </div>

            {form !== null && (
              <motion.form
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                onSubmit={submitPost}
                className="glass rounded-2xl p-6 mb-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{form._id ? 'Edit Post' : 'New Post'}</h3>
                  <button type="button" onClick={() => setForm(null)} className="p-1 text-neutral-600 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <input required value={form.title}   onChange={e => setForm(f => ({ ...f, title: e.target.value }))}   placeholder="Title"                  className="input-base" />
                <input        value={form.excerpt}   onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Excerpt (short summary)" className="input-base" />
                <select       value={form.category}  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                  <option value="">No category</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-600">Image upload</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="input-base file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-black hover:file:bg-neutral-100" />
                  {form.image && <p className="text-xs text-neutral-500">Image selected.</p>}
                </div>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Resource link (optional)" className="input-base" />
                <textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full content..." rows={8} className="input-base" />
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Saving...' : 'Save Post'}</button>
                  <button type="button" onClick={() => setForm(null)} className="btn-ghost text-sm">Cancel</button>
                </div>
              </motion.form>
            )}

            <div className="flex flex-col gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
              {posts.length === 0 && <div className="bg-surface-0 px-6 py-8 text-center text-sm text-neutral-600">No posts yet.</div>}
              {posts.map(post => (
                <div key={post._id} className="bg-surface-0 hover:bg-surface-1 transition-colors px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{post.title}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 flex items-center gap-3">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.category && <span className="label-text">{post.category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setForm(post)} className="p-1.5 text-neutral-600 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => deletePost(post._id)} className="p-1.5 text-neutral-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Resources tab ──────────────────────────────────────────────── */}
        {tab === 'Resources' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-neutral-400">Resources ({resources.length})</h2>
              <button onClick={() => setForm({ title: '', description: '', category: '', image: '', link: '' })} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={14} /> New Resource
              </button>
            </div>

            {form !== null && (
              <motion.form
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                onSubmit={submitResource}
                className="glass rounded-2xl p-6 mb-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{form._id ? 'Edit Resource' : 'New Resource'}</h3>
                  <button type="button" onClick={() => setForm(null)} className="p-1 text-neutral-600 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <input    required value={form.title}       onChange={e => setForm(f => ({ ...f, title: e.target.value }))}       placeholder="Title"        className="input-base" />
                <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="input-base" />
                <select            value={form.category}    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}    className="input-base">
                  <option value="">No category</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
                <input    required value={form.link}        onChange={e => setForm(f => ({ ...f, link: e.target.value }))}        placeholder="Resource URL" className="input-base" />
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-600">Image upload</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="input-base file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-black hover:file:bg-neutral-100" />
                  {form.image && <p className="text-xs text-neutral-500">Image selected.</p>}
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Saving...' : 'Save Resource'}</button>
                  <button type="button" onClick={() => setForm(null)} className="btn-ghost text-sm">Cancel</button>
                </div>
              </motion.form>
            )}

            <div className="flex flex-col gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
              {resources.length === 0 && <div className="bg-surface-0 px-6 py-8 text-center text-sm text-neutral-600">No resources yet.</div>}
              {resources.map(res => (
                <div key={res._id} className="bg-surface-0 hover:bg-surface-1 transition-colors px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{res.title}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 font-mono truncate">{res.link}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setForm(res)} className="p-1.5 text-neutral-600 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => deleteResource(res._id)} className="p-1.5 text-neutral-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Users tab ──────────────────────────────────────────────────── */}
        {tab === 'Users' && (
          <div>
            <h2 className="text-sm font-medium text-neutral-400 mb-6">Users ({users.length})</h2>
            <div className="flex flex-col gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
              {users.length === 0 && <div className="bg-surface-0 px-6 py-8 text-center text-sm text-neutral-600">No users yet.</div>}
              {users.map(u => (
                <div key={u._id} className="bg-surface-0 hover:bg-surface-1 transition-colors px-5 py-4 flex items-center gap-4">
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{u.name}</div>
                    <div className="text-xs text-neutral-600">{u.email}</div>
                  </div>
                  <span className={`text-xs font-mono ${u.isAdmin ? 'text-blue-400' : 'text-neutral-600'}`}>
                    {u.isAdmin ? 'admin' : 'contributor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Certificates tab ───────────────────────────────────────────── */}
        {tab === 'Certificates' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-medium text-lg">Certificate Manager</h2>
                <p className="text-sm text-neutral-500 mt-1">Generate and edit achievements for contributors.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCustomForm({
                      userId: allUsers[0]?._id || '',
                      badgeName: 'Community Leader',
                      platforms: [],
                      contribution: '',
                      themeColor: '#5B8CFF',
                      customMessage: 'Thank you for your awesome multi-platform contributions!',
                    })
                    setShowCustomModal(true)
                  }}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Custom Certificate
                </button>
                <button onClick={fetchData} className="btn-ghost text-sm flex items-center gap-2">
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
            </div>

            {/* Badge tier legend */}
            <div className="grid grid-cols-4 gap-3 flex-wrap">
              {Object.entries(TIER_META).map(([key, meta]) => (
                <div key={key} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${meta.bg}`}>
                  {meta.iconUrl ? (
                    <img src={meta.iconUrl} className="w-6 h-6 object-contain" alt={meta.label} />
                  ) : (
                    <span className="text-xl">{meta.icon}</span>
                  )}
                  <div>
                    <div className={`text-sm font-semibold ${meta.color}`}>{meta.label}</div>
                    <div className="text-xs text-neutral-500">
                      {key === 'codespark' && '1+ resources/month'}
                      {key === 'codeflame' && '5+ resources/month'}
                      {key === 'codeelite' && '10+ resources/month'}
                      {key === 'custom' && 'External platform contributors'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidates list */}
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-4">
                This Month's Contributors {candidates.length > 0 && `(${candidates.length})`}
              </h3>

              {certLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
                </div>
              ) : candidates.length === 0 ? (
                <div className="glass rounded-xl px-6 py-8 text-center text-sm text-neutral-500">
                  No contributors this month yet.
                </div>
              ) : (
                <div className="flex flex-col gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
                  {candidates.map(c => {
                    const meta = c.tier ? TIER_META[c.tier.tier] : null
                    const isGen = generating === String(c.userId)
                    return (
                      <div key={c.userId} className="bg-surface-0 hover:bg-surface-1 transition-colors px-5 py-4 flex items-center gap-4">
                        <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full border border-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm">{c.name}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">{c.email}</div>
                        </div>

                        {/* Resource count */}
                        <div className="text-center shrink-0">
                          <div className="text-lg font-bold text-white">{c.count}</div>
                          <div className="text-xs text-neutral-600">resources</div>
                        </div>

                        {/* Badge tier */}
                        {meta && (
                          <div className={`text-xs px-2 py-1 rounded-lg border shrink-0 ${meta.bg} ${meta.color} flex items-center gap-1`}>
                            {meta.iconUrl ? (
                              <img src={meta.iconUrl} className="w-3.5 h-3.5 object-contain" alt={meta.label} />
                            ) : (
                              <span>{meta.icon}</span>
                            )}
                            <span>{meta.label}</span>
                          </div>
                        )}

                        {/* Action */}
                        <div className="shrink-0">
                          {!c.tier ? (
                            <span className="text-xs text-neutral-600">Below threshold</span>
                          ) : c.hasCert ? (
                            <span className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> Issued</span>
                          ) : (
                            <button
                              onClick={() => generateCertificate(String(c.userId), c.tier.tier)}
                              disabled={isGen}
                              className="btn-primary text-xs flex items-center gap-1.5"
                            >
                              {isGen
                                ? <><RefreshCw size={11} className="animate-spin" /> Generating...</>
                                : <><Award size={11} /> Generate</>
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Issued certificates history */}
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-4">
                Issued Certificates {certificates.length > 0 && `(${certificates.length})`}
              </h3>
              {certificates.length === 0 ? (
                <div className="glass rounded-xl px-6 py-6 text-center text-sm text-neutral-500">No certificates issued yet.</div>
              ) : (
                <div className="flex flex-col gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
                  {certificates.map(cert => {
                    const meta = TIER_META[cert.tier] || TIER_META.custom
                    return (
                      <div key={cert._id} className="bg-surface-0 hover:bg-surface-1 transition-colors px-5 py-4 flex items-center gap-4 flex-wrap md:flex-nowrap">
                        {cert.userId?.avatar && <img src={cert.userId.avatar} alt={cert.userId.name} className="w-8 h-8 rounded-full border border-white/10 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm">{cert.userId?.name || 'Unknown Recipient'}</div>
                          <div className="text-xs text-neutral-600">{monthLabel(cert.month, cert.year)}</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 ${meta?.bg} ${meta?.color}`}>
                          {meta?.iconUrl ? (
                            <img src={meta.iconUrl} className="w-3.5 h-3.5 object-contain" alt={cert.badgeName} />
                          ) : (
                            <span>{meta?.icon}</span>
                          )}
                          <span>{cert.badgeName}</span>
                        </div>
                        <div className="text-xs text-neutral-600 shrink-0">
                          {cert.downloaded ? <span className="text-green-500 flex items-center gap-1"><Download size={11} /> Downloaded</span> : 'Not yet downloaded'}
                        </div>
                        <button
                          onClick={() => rerenderCertificate(cert._id)}
                          disabled={rerenderingCertId === cert._id}
                          className="btn-ghost text-xs flex items-center gap-1"
                        >
                          <RefreshCw size={12} className={rerenderingCertId === cert._id ? 'animate-spin' : ''} />
                          {rerenderingCertId === cert._id ? 'Refreshing...' : 'Refresh Design'}
                        </button>
                        <button
                          onClick={() => {
                            setEditForm({
                              _id: cert._id,
                              badgeName: cert.badgeName,
                              themeColor: cert.themeColor || '#FFD700',
                              customMessage: cert.customMessage || '',
                            })
                            setShowEditModal(true)
                          }}
                          className="btn-ghost text-xs flex items-center gap-1"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Custom Certificate Modal ────────────────────────────────────── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
          >
            <button onClick={() => setShowCustomModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-lg font-bold text-white mb-4">Generate Custom Certificate</h2>
            <form onSubmit={submitCustomCertificate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Recipient User</label>
                <select
                  required
                  value={customForm.userId}
                  onChange={e => setCustomForm(f => ({ ...f, userId: e.target.value }))}
                  className="input-base"
                >
                  <option value="">Select User...</option>
                  {allUsers.map(u => <option key={u._id} value={u._id}>{u.name} (@{u.username})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Badge/Award Title</label>
                <input
                  required
                  value={customForm.badgeName}
                  onChange={e => setCustomForm(f => ({ ...f, badgeName: e.target.value }))}
                  placeholder="e.g. Community Champ, Dev Advocate"
                  className="input-base"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Contribution Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {['Website', 'WhatsApp', 'Discord', 'LinkedIn'].map(p => {
                    const isSelected = customForm.platforms.includes(p)
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}
                      >
                        {p === 'Website' && <Globe size={11} />}
                        {p === 'WhatsApp' && <MessageSquare size={11} />}
                        {p === 'Discord' && <MessageSquare size={11} />}
                        {p === 'LinkedIn' && <Linkedin size={11} />}
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Contribution Details</label>
                <textarea
                  value={customForm.contribution}
                  onChange={e => setCustomForm(f => ({ ...f, contribution: e.target.value }))}
                  placeholder="Describe what they contributed..."
                  rows={3}
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400">Theme Color (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customForm.themeColor}
                      onChange={e => setCustomForm(f => ({ ...f, themeColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      required
                      value={customForm.themeColor}
                      onChange={e => setCustomForm(f => ({ ...f, themeColor: e.target.value }))}
                      className="input-base flex-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400">Congratulations Msg</label>
                  <input
                    value={customForm.customMessage}
                    onChange={e => setCustomForm(f => ({ ...f, customMessage: e.target.value }))}
                    placeholder="e.g. Keep inspiring others!"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCustomModal(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm">
                  {submitting ? 'Generating...' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Edit Certificate Modal ──────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md relative"
          >
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-lg font-bold text-white mb-4">Edit Certificate Appearance</h2>
            <form onSubmit={submitEditCertificate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Badge Title</label>
                <input
                  required
                  value={editForm.badgeName}
                  onChange={e => setEditForm(f => ({ ...f, badgeName: e.target.value }))}
                  className="input-base"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Theme Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editForm.themeColor}
                    onChange={e => setEditForm(f => ({ ...f, themeColor: e.target.value }))}
                    className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    required
                    value={editForm.themeColor}
                    onChange={e => setEditForm(f => ({ ...f, themeColor: e.target.value }))}
                    className="input-base flex-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">Custom Message</label>
                <input
                  value={editForm.customMessage}
                  onChange={e => setEditForm(f => ({ ...f, customMessage: e.target.value }))}
                  className="input-base"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm">
                  {submitting ? 'Updating...' : 'Save & Render'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
