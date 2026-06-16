import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Gavel, Eye, EyeOff, AlertCircle, Scale } from 'lucide-react'

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [localErr, setLocalErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLocalErr('')
    clearError()
    if (!email.trim() || !password) { setLocalErr('Please fill in all fields'); return }
    const res = await login(email.trim(), password)
    if (res.success) navigate('/')
  }

  const displayErr = localErr || error

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,67,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(212,168,67,0.03) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(212,168,67,0.3)'
          }}>
            <Gavel size={28} color="#0f0d0a" strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Legal<span style={{ color: 'var(--gold)' }}>One</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI Legal Drafting System — Advocate Portal</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px 28px' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            Access your cases and drafts
          </p>

          {displayErr && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: 'var(--error)', fontSize: 13, marginBottom: 18 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {displayErr}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="legal-input"
                style={{ fontSize: 14 }}
                placeholder="advocate@example.com"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="legal-input"
                  style={{ fontSize: 14, paddingRight: 44 }}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-gold" disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, fontSize: 15 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            New advocate?{' '}
            <Link to="/signup" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Create account
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            <Scale size={11} style={{ display: 'inline', marginRight: 4, color: 'var(--gold)' }} />
            You can also use LegalOne <strong style={{ color: 'var(--text-secondary)' }}>without signing in</strong>
          </p>
          <Link to="/" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>
            Continue as guest →
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 20, opacity: 0.6 }}>
          TLC · LegalOne AI · Krishnagiri
        </p>
      </div>
    </div>
  )
}
