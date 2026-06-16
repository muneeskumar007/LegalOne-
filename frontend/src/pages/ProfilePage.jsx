import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Trash2, Star, FileText, GitBranch, Scale, CheckCircle, GitCompare, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

const MODULE_META = {
  pipeline:  { icon: GitBranch,    label:'AI Pipeline',  color:'var(--gold)'    },
  draft:     { icon: FileText,     label:'Drafts',       color:'var(--info)'    },
  arguments: { icon: Scale,        label:'Arguments',    color:'var(--warning)' },
  validate:  { icon: CheckCircle,  label:'Validations',  color:'var(--success)' },
  compare:   { icon: GitCompare,   label:'Comparisons',  color:'var(--error)'   },
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ padding:'16px 18px', background:'var(--bg-card)', borderRadius:10, border:'1px solid var(--border)', textAlign:'center' }}>
      <Icon size={18} color={color} style={{ margin:'0 auto 8px' }} />
      <div style={{ fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
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
    { id:'profile',  label:'Profile'  },
    { id:'security', label:'Security' },
    { id:'stats',    label:'Stats'    },
  ]

  return (
    <div style={{ maxWidth:700 }}>
      <div className="animate-fade-up" style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
          <User size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
          Advocate Profile
        </h2>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Manage your account, security, and view activity stats</p>
      </div>

      {/* Profile header card */}
      <div className="glass-card" style={{ padding:'20px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold),var(--gold-dim))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#0f0d0a', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:600 }}>{advocate?.name}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{advocate?.email}</div>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {advocate?.bar_number && <span className="badge badge-gold" style={{ fontSize:10 }}>{advocate.bar_number}</span>}
            {advocate?.court      && <span className="badge badge-info"  style={{ fontSize:10 }}>{advocate.court}</span>}
            {totalCases > 0       && <span className="badge badge-success" style={{ fontSize:10 }}>{totalCases} cases saved</span>}
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid rgba(248,113,113,0.3)', background:'rgba(248,113,113,0.08)', color:'var(--error)', borderRadius:7, fontSize:13, cursor:'pointer' }}>
          Sign Out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-card)', padding:4, borderRadius:10, border:'1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:'8px', border:'none', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer', background:tab===t.id?'var(--gold)':'transparent', color:tab===t.id?'#0f0d0a':'var(--text-secondary)', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Feedback messages */}
      {msg && <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, color:'var(--success)', fontSize:13, marginBottom:16 }}><CheckCircle2 size={15} style={{ flexShrink:0, marginTop:1 }} />{msg}</div>}
      {err && <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:16 }}><AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />{err}</div>}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div className="glass-card" style={{ padding:'24px 22px' }}>
          <form onSubmit={saveProfile}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Full Name','name','Adv. Ravi Kumar'],['Bar Council No.','bar_number','TN/1234/2020'],['Court / District','court','Krishnagiri District'],['Phone','phone','+91 99521 20941']].map(([lbl,key,ph]) => (
                <div key={key}>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{lbl}</label>
                  <input className="legal-input" style={{ fontSize:14 }} value={form[key]} onChange={set(key)} placeholder={ph} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email (cannot be changed)</label>
              <input className="legal-input" style={{ fontSize:14, opacity:0.5, cursor:'not-allowed' }} value={advocate?.email||''} disabled />
            </div>
            <button type="submit" className="btn-gold" disabled={saving} style={{ padding:'11px 28px', borderRadius:8, fontSize:14, display:'flex', alignItems:'center', gap:7 }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* SECURITY TAB */}
      {tab === 'security' && (
        <div className="glass-card" style={{ padding:'24px 22px' }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <Lock size={16} color="var(--gold)" /> Change Password
          </div>
          <form onSubmit={changePw}>
            {[['Current Password','current_password'],['New Password','new_password'],['Confirm New Password','confirm']].map(([lbl,key]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{lbl}</label>
                <input type="password" className="legal-input" style={{ fontSize:14 }} value={pwForm[key]} onChange={setPw(key)} placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" className="btn-gold" disabled={saving} style={{ padding:'11px 28px', borderRadius:8, fontSize:14 }}>
              {saving ? 'Updating…' : 'Change Password'}
            </button>
          </form>

          <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, marginBottom:8, color:'var(--error)', display:'flex', alignItems:'center', gap:8 }}>
              <Trash2 size={16} /> Danger Zone
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Deactivating your account will remove access. Your case history will be preserved for 30 days.</p>
            <button onClick={() => { if (window.confirm('Are you sure you want to deactivate your account?')) { authApi.delete('/auth/account').then(() => { logout(); navigate('/') }) } }} style={{ padding:'9px 20px', border:'1px solid rgba(248,113,113,0.4)', background:'rgba(248,113,113,0.08)', color:'var(--error)', borderRadius:7, fontSize:13, cursor:'pointer' }}>
              Deactivate Account
            </button>
          </div>
        </div>
      )}

      {/* STATS TAB */}
      {tab === 'stats' && (
        <div>
          {stats ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                <StatCard icon={FileText}   label="Total Cases" value={stats.total}   color="var(--gold)"    />
                <StatCard icon={Star}       label="Starred"     value={stats.starred} color="var(--warning)" />
                {Object.entries(stats.modules||{}).map(([mod,count]) => {
                  const meta = MODULE_META[mod] || { icon:FileText, label:mod, color:'var(--text-muted)' }
                  return <StatCard key={mod} icon={meta.icon} label={meta.label} value={count} color={meta.color} />
                })}
              </div>

              {/* Module breakdown bar */}
              {Object.keys(stats.modules||{}).length > 0 && (
                <div className="glass-card" style={{ padding:18 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Usage Breakdown</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {Object.entries(stats.modules).sort(([,a],[,b]) => b-a).map(([mod,count]) => {
                      const meta  = MODULE_META[mod] || { label:mod, color:'var(--text-muted)' }
                      const pct   = stats.total > 0 ? Math.round(count/stats.total*100) : 0
                      return (
                        <div key={mod}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{meta.label}</span>
                            <span style={{ fontSize:13, color:meta.color, fontWeight:500 }}>{count} ({pct}%)</span>
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
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
                  <FileText size={32} style={{ margin:'0 auto 12px', opacity:0.4 }} />
                  <p>No cases saved yet. Use any tool and your results will appear here.</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ display:'flex', gap:10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:90, flex:1, borderRadius:10 }} />)}</div>
          )}
        </div>
      )}
    </div>
  )
}
