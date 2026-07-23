import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scale, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 13 }}>
    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
)

export default function SignupPage() {
  const { signup, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [form,   setForm]   = useState({ name:'', email:'', password:'', bar_number:'', court:'', phone:'' })
  const [showPw, setShowPw] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLocalErr(''); clearError()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setLocalErr('Name, email, and password are required')
      return
    }
    if (form.password.length < 6) { setLocalErr('Password must be at least 6 characters'); return }
    const res = await signup(form)
    if (res.success) navigate('/')
    else if (!res.message || res.message === 'Signup failed') {
      setLocalErr('Cannot reach server. Please ensure the backend is running on port 8000.')
    }
  }

  const displayErr = localErr || error

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,67,0.04) 0%, transparent 60%)',
      padding: '24px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 14px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
            <Scale size={25} color="#fff" strokeWidth={1.8} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Legal<span style={{ color: 'var(--gold)' }}>One</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create your Advocate account</p>
        </div>

        <div className="glass-card" style={{ padding: '28px 26px' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 600, marginBottom: 20, textAlign: 'center' }}>Register as Advocate</h2>

          {displayErr && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{displayErr}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Name + Email row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name *">
                <input className="legal-input" style={{ fontSize: 14 }} value={form.name} onChange={set('name')} placeholder="Adv. Orange Kumar" disabled={loading} autoFocus />
              </Field>
              <Field label="Email *">
                <input type="email" className="legal-input" style={{ fontSize: 14 }} value={form.email} onChange={set('email')} placeholder="orange@example.com" disabled={loading} />
              </Field>
            </div>

            {/* Password */}
            <Field label="Password * (min 6 chars)">
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className="legal-input" style={{ fontSize: 14, paddingRight: 44 }} value={form.password} onChange={set('password')} placeholder="PASSWORD Within 6 digits only (••••••)" disabled={loading} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password.length >= 6 && (
                <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} /> Strong enough
                </div>
              )}
            </Field>

            {/* Bar + Court row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Bar Council No.">
                <input className="legal-input" style={{ fontSize: 14 }} value={form.bar_number} onChange={set('bar_number')} placeholder="TN/1234/2026" disabled={loading} />
              </Field>
              <Field label="Court / District">
                <input className="legal-input" style={{ fontSize: 14 }} value={form.court} onChange={set('court')} placeholder=" District" disabled={loading} />
              </Field>
            </div>

            <Field label="Phone (optional)">
              <input className="legal-input" style={{ fontSize: 14 }} value={form.phone} onChange={set('phone')} placeholder="+91 9383736353" disabled={loading} />
            </Field>

            {/* Benefits */}
            <div style={{ marginBottom: 18, padding: '10px 12px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 7 }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 6, fontWeight: 600 }}>After registering you get:</div>
              {['Case history saved per module','Star & annotate important cases','Search across all your drafts','Export any draft as PDF'].map(b => (
                <div key={b} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2, display: 'flex', gap: 6 }}>
                  <CheckCircle size={11} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />{b}
                </div>
              ))}
            </div>

            <button type="submit" className="btn-gold" disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, fontSize: 15 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
