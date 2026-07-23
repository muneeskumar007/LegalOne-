import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Trash2, Star, FileText, GitBranch, Scale, CheckCircle, GitCompare, Save, AlertCircle, CheckCircle2, Camera } from 'lucide-react'

const MODULE_META = {
  pipeline:  { icon: GitBranch,    label:'AI Pipeline',  color:'var(--text-primary)' },
  draft:     { icon: FileText,     label:'Drafts',       color:'var(--info)'         },
  arguments: { icon: Scale,        label:'Arguments',    color:'var(--warning)'      },
  validate:  { icon: CheckCircle,  label:'Validations',  color:'var(--success)'      },
  compare:   { icon: GitCompare,   label:'Comparisons',  color:'var(--error)'        },
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      padding:'18px 20px', background:'#ffffff', borderRadius:12,
      border:'1px solid var(--border)', textAlign:'center',
      transition: 'all 0.2s'
    }}>
      <Icon size={18} color={color} style={{ margin:'0 auto 8px' }} />
      <div style={{ fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500 }}>{label}</div>
    </div>
  )
}

export default function ProfilePage() {
  const { advocate, isLoggedIn, logout, updateProfile, authApi } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]   = useState('profile')
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ name:'', bar_number:'', court:'', phone:'' })
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const [err,    setErr]    = useState('')

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    setForm({ name: advocate.name||'', bar_number: advocate.bar_number||'', court: advocate.court||'', phone: advocate.phone||'' })
    // Load stats
    authApi.get('/history/stats').then(r => setStats(r.data.stats)).catch(() => {})
  }, [isLoggedIn, advocate])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg(''); setErr('')
    try {
      await updateProfile(form)
      setMsg('Profile updated successfully')
      setTimeout(() => setMsg(''), 3000)
    } catch(e) { setErr(e.response?.data?.detail || 'Update failed') }
    setSaving(false)
  }

  const changePw = async (e) => {
    e.preventDefault()
    setMsg(''); setErr('')
    if (pwForm.new_password !== pwForm.confirm) { setErr('Passwords do not match'); return }
    if (pwForm.new_password.length < 6) { setErr('New password must be at least 6 characters'); return }
    setSaving(true)
    try {
      await authApi.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      setMsg('Password changed successfully')
      setPwForm({ current_password:'', new_password:'', confirm:'' })
      setTimeout(() => setMsg(''), 3000)
    } catch(e) { setErr(e.response?.data?.detail || 'Failed') }
    setSaving(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const initials = advocate?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'
  const totalCases = stats?.total || 0

  const TABS = [
    { id:'profile',  label:'Profile',  icon: User },
    { id:'security', label:'Security', icon: Lock },
    { id:'stats',    label:'Stats',    icon: FileText },
  ]

  return (
    <div style={{ maxWidth:720 }}>
      {/* ── Page Header ── */}
      <div className="animate-fade-up" style={{ marginBottom:28 }}>
        <h1 style={{
          fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700,
          color:'var(--text-primary)', marginBottom:6
        }}>
          Settings
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:14 }}>Manage your profile, security, and preferences</p>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display:'flex', gap:0, marginBottom:24,
        borderBottom: '2px solid var(--border)'
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'12px 20px',
              border:'none', background:'transparent',
              fontSize:14, fontWeight: isActive ? 600 : 500,
              cursor:'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:8
            }}>
              <t.icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Feedback messages ── */}
      {msg && (
        <div style={{
          display:'flex', gap:8, padding:'12px 16px',
          background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)',
          borderRadius:10, color:'var(--success)', fontSize:13, marginBottom:16,
          alignItems:'center'
        }}>
          <CheckCircle2 size={15} style={{ flexShrink:0 }} />{msg}
        </div>
      )}
      {err && (
        <div style={{
          display:'flex', gap:8, padding:'12px 16px',
          background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)',
          borderRadius:10, color:'var(--error)', fontSize:13, marginBottom:16,
          alignItems:'center'
        }}>
          <AlertCircle size={15} style={{ flexShrink:0 }} />{err}
        </div>
      )}

      {/* ═══ PROFILE TAB ═══ */}
      {tab === 'profile' && (
        <div>
          {/* Profile Info Card */}
          <div className="glass-card" style={{ padding:'28px 24px', marginBottom:20 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Profile Information</h3>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Update your personal details and contact info</p>
            </div>

            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:24 }}>
              <div style={{ position:'relative' }}>
                <div style={{
                  width:72, height:72, borderRadius:'50%',
                  background:'#e5e5e5',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24, fontWeight:700, color:'#a3a3a3'
                }}>
                  <User size={30} color="#a3a3a3" />
                </div>
                <button style={{
                  position:'absolute', bottom:0, right:0,
                  width:24, height:24, borderRadius:'50%',
                  background:'var(--text-primary)', border:'2px solid #fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer'
                }}>
                  <Camera size={11} color="#fff" />
                </button>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{advocate?.name}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{advocate?.email}</div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={saveProfile}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {[
                  ['Phone Number','phone','+91 98765 43210'],
                  ['Bar Council No.','bar_number','TN/1234/2020'],
                  ['Chamber / Firm Name','court','Sharma & Associates'],
                  ['Full Name','name','Adv. Ravi Kumar'],
                ].map(([lbl,key,ph]) => (
                  <div key={key}>
                    <label style={{
                      fontSize:12, color:'var(--text-muted)', display:'block',
                      marginBottom:6, fontWeight:500
                    }}>{lbl}</label>
                    <input className="legal-input" style={{ fontSize:14, background:'#fff' }}
                      value={form[key]} onChange={set(key)} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{
                  fontSize:12, color:'var(--text-muted)', display:'block',
                  marginBottom:6, fontWeight:500
                }}>Email (cannot be changed)</label>
                <input className="legal-input" style={{ fontSize:14, opacity:0.5, cursor:'not-allowed', background:'var(--bg-card)' }}
                  value={advocate?.email||''} disabled />
              </div>
              <button type="submit" className="btn-gold" disabled={saving} style={{
                padding:'11px 28px', borderRadius:10, fontSize:14,
                display:'flex', alignItems:'center', gap:8
              }}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {tab === 'security' && (
        <div>
          {/* Change Password */}
          <div className="glass-card" style={{ padding:'28px 24px', marginBottom:20 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Change Password</h3>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Update your password to keep your account secure</p>
            </div>
            <form onSubmit={changePw}>
              {[['Current Password','current_password'],['New Password','new_password'],['Confirm New Password','confirm']].map(([lbl,key]) => (
                <div key={key} style={{ marginBottom:16 }}>
                  <label style={{
                    fontSize:12, color:'var(--text-muted)', display:'block',
                    marginBottom:6, fontWeight:500
                  }}>{lbl}</label>
                  <input type="password" className="legal-input" style={{ fontSize:14, background:'#fff' }}
                    value={pwForm[key]} onChange={setPw(key)} placeholder={`Enter ${lbl.toLowerCase()}`} />
                </div>
              ))}
              <button type="submit" className="btn-gold" disabled={saving} style={{
                padding:'11px 28px', borderRadius:10, fontSize:14
              }}>
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="glass-card" style={{ padding:'24px', border:'1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color:'var(--error)', display:'flex', alignItems:'center', gap:8 }}>
              <Trash2 size={16} /> Danger Zone
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>
              Deactivating your account will remove access. Your case history will be preserved for 30 days.
            </p>
            <button onClick={() => {
              if (window.confirm('Are you sure you want to deactivate your account?')) {
                authApi.delete('/auth/account').then(() => { logout(); navigate('/') })
              }
            }} style={{
              padding:'10px 20px', border:'1px solid rgba(239,68,68,0.3)',
              background:'rgba(239,68,68,0.05)', color:'var(--error)',
              borderRadius:10, fontSize:13, cursor:'pointer', fontWeight:500
            }}>
              Deactivate Account
            </button>
          </div>
        </div>
      )}

      {/* ═══ STATS TAB ═══ */}
      {tab === 'stats' && (
        <div>
          {stats ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
                <StatCard icon={FileText} label="Total Cases" value={stats.total} color="var(--text-primary)" />
                <StatCard icon={Star}     label="Starred"     value={stats.starred} color="var(--warning)" />
                {Object.entries(stats.modules||{}).map(([mod,count]) => {
                  const meta = MODULE_META[mod] || { icon:FileText, label:mod, color:'var(--text-muted)' }
                  return <StatCard key={mod} icon={meta.icon} label={meta.label} value={count} color={meta.color} />
                })}
              </div>

              {/* Module breakdown */}
              {Object.keys(stats.modules||{}).length > 0 && (
                <div className="glass-card" style={{ padding:20 }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16, fontWeight:500 }}>Usage Breakdown</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {Object.entries(stats.modules).sort(([,a],[,b]) => b-a).map(([mod,count]) => {
                      const meta  = MODULE_META[mod] || { label:mod, color:'var(--text-muted)' }
                      const pct   = stats.total > 0 ? Math.round(count/stats.total*100) : 0
                      return (
                        <div key={mod}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{meta.label}</span>
                            <span style={{ fontSize:13, color:meta.color, fontWeight:600 }}>{count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width:`${pct}%`, background:meta.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.total === 0 && (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text-muted)' }}>
                  <FileText size={36} style={{ margin:'0 auto 12px', opacity:0.3 }} />
                  <p>No cases saved yet. Use any tool and your results will appear here.</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ display:'flex', gap:12 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:100, flex:1, borderRadius:12 }} />)}</div>
          )}
        </div>
      )}
    </div>
  )
}
