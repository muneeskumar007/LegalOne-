import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Scale, FileText, FolderOpen, LayoutTemplate, BookOpen, Gavel, Settings, Menu, X, LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to:'/draft',      icon: FileText,       label:'AI DRAFTER'   },
  { to:'/',            icon: FolderOpen,     label:'MY CASES'     },
  { to:'/reference',   icon: LayoutTemplate, label:'TEMPLATES'    },
  { to:'/compare',     icon: BookOpen,       label:'BARE ACTS'    },
  { to:'/judgements',  icon: Gavel,          label:'JUDGEMENTS'   },
  { to:'/profile',     icon: Settings,       label:'SETTINGS'     },
]

/* ── Balance / Scales SVG Logo ── */
function ScalesLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── Top triangular crown / pediment ── */}
      <polygon points="40,4 33,16 47,16" fill="#0a0a0a"/>
      {/* Small circle at apex */}
      <circle cx="40" cy="6" r="2" fill="#0a0a0a"/>

      {/* ── Horizontal beam ── */}
      <rect x="6" y="15" width="68" height="2.5" rx="1.25" fill="#0a0a0a"/>

      {/* ── Central pillar ── */}
      <rect x="38.5" y="17" width="3" height="40" fill="#0a0a0a"/>
      {/* Pillar decorative node */}
      <circle cx="40" cy="22" r="2.5" fill="#0a0a0a"/>

      {/* ── Base stand ── */}
      <path d="M28 57 L40 57 L52 57" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 62 Q32 57 40 57 Q48 57 56 62" stroke="#0a0a0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="22" y="62" width="36" height="2.5" rx="1.25" fill="#0a0a0a"/>

      {/* ── Left side ── */}
      {/* Left chain / strings */}
      <line x1="10" y1="17" x2="6" y2="34" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="17" x2="14" y2="34" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Left hanging pan / dish */}
      <path d="M3 34 Q10 46 17 34" stroke="#0a0a0a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <line x1="3" y1="34" x2="17" y2="34" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>

      {/* ── Right side ── */}
      {/* Right chain / strings */}
      <line x1="70" y1="17" x2="66" y2="34" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="70" y1="17" x2="74" y2="34" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Right hanging pan / dish */}
      <path d="M63 34 Q70 46 77 34" stroke="#0a0a0a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <line x1="63" y1="34" x2="77" y2="34" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function UserMenu({ advocate, logout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        background: 'transparent', border: '1px solid var(--border)', borderRadius: 12,
        cursor: 'pointer', width: '100%', transition: 'all 0.2s'
      }}>
        {/* Avatar circle */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#e5e5e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={18} color="#737373" />
        </div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {advocate.name ? `Adv. ${advocate.name}` : 'Advocate'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Premium Plan</div>
        </div>
        <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
            background: '#ffffff', border: '1px solid var(--border)', borderRadius: 12,
            zIndex: 201, overflow: 'hidden', boxShadow: '0 -8px 24px rgba(0,0,0,0.08)'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{advocate.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{advocate.email}</div>
              {advocate.court && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{advocate.court}</div>}
            </div>
            <button onClick={() => { setOpen(false); navigate('/profile') }} style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px solid var(--border)'
            }}>
              <Settings size={13} /> Settings
            </button>
            <button onClick={() => { setOpen(false); logout() }} style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              background: 'none', border: 'none', color: 'var(--error)',
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { advocate, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const SidebarContent = () => (
    <>
      {/* ── Logo ── */}
      <div style={{ padding: '28px 24px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ScalesLogo size={52} />
          <div>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20,
              color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em'
            }}>
              LegalOne AI
            </div>
            <div style={{
              fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.18em',
              textTransform: 'uppercase', marginTop: 4, fontWeight: 500
            }}>
              AI DRAFTER
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '0 14px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to + label} to={to} end={to==='/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ marginBottom: 0 }}>
              <Icon size={18} strokeWidth={1.5} /><span style={{ letterSpacing: '0.06em', fontSize: 13 }}>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Bottom Section ── */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
        {isLoggedIn ? (
          <>
            <UserMenu advocate={advocate} logout={logout} />
            {/* Logout row */}
            <button onClick={() => { logout(); navigate('/') }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', marginTop: 8,
              background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', width: '100%', borderRadius: 10,
              transition: 'all 0.2s', letterSpacing: '0.02em'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = 'var(--error)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <LogOut size={16} strokeWidth={1.5} /> Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/login')} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: '1px solid var(--border)', background: '#fff',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, transition: 'all 0.2s'
            }}>
              <LogIn size={14} /> Sign In
            </button>
            <button onClick={() => navigate('/signup')} className="btn-gold" style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13
            }}>
              Register
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 250, background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: '#ffffff', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 60
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScalesLogo size={28} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16 }}>LegalOne AI</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isLoggedIn && <button onClick={() => navigate('/login')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Sign In</button>}
          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 55 }} />}
      
      {/* Mobile Drawer */}
      <aside style={{
        position: 'fixed', top: 56, left: 0, bottom: 0, width: 250,
        background: '#ffffff', borderRight: '1px solid var(--border)', zIndex: 56,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column'
      }} className="mobile-drawer">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: 250, flex: 1,
        padding: '36px 40px 40px',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - 250px)',
        boxSizing: 'border-box',
        background: 'var(--bg-secondary)'
      }} className="main-content">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; max-width: 100vw !important; padding: 72px 16px 32px !important; }
        }
        @media (min-width: 769px) {
          .mobile-header, .mobile-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
