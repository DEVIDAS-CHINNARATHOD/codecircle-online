import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import CategoryPage from './pages/CategoryPage'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'
import SubmitResource from './pages/SubmitResource'
import Dashboard from './pages/Dashboard'
import PublicProfile from './pages/PublicProfile'
import VerifyCertificate from './pages/VerifyCertificate'
import ResourceDetail from './pages/ResourceDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submit-resource" element={<SubmitResource />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/verify/:certId" element={<VerifyCertificate />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}
