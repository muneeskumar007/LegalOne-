import { useState } from 'react'
 
import { Scale, FileText, GitBranch, CheckCircle, GitCompare, Menu, X, Gavel, BookOpen, MessageSquare, LogIn, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
 
import { useAuth } from '../context/AuthContext'
import Dashboard from '../pages/Dashboard'
import DraftPage from '../pages/DraftPage'
import PipelinePage from '../pages/PipelinePage'
import ArgumentPage from '../pages/ArgumentPage'
import ValidatePage from '../pages/ValidatePage'
import ComparePage from '../pages/ComparePage'
import ReferencePage from '../pages/ReferencePage'
import ProfilePage from '../pages/ProfilePage'

const NAV = [
  { id:'dashboard', to:'/',          icon:Scale,         label:'Dashboard'   },
  { id:'pipeline',  to:'/pipeline',  icon:GitBranch,     label:'AI Pipeline' },
  { id:'draft',     to:'/draft',     icon:FileText,      label:'Draft'       },
  { id:'arguments', to:'/arguments', icon:MessageSquare, label:'Arguments'   },
  { id:'validate',  to:'/validate',  icon:CheckCircle,   label:'Validate'    },
  { id:'compare',   to:'/compare',   icon:GitCompare,    label:'Compare'     },
  { id:'bareacts',  to:'/reference', icon:BookOpen,      label:'Bare Acts'   },
]

const MODULE_BY_PATH = {
  '/': 'dashboard',
  '/pipeline': 'pipeline',
  '/draft': 'draft',
  '/arguments': 'arguments',
  '/validate': 'validate',
  '/compare': 'compare',
  '/reference': 'bareacts',
  '/profile': 'profile',
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
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000000', flexShrink: 0 }}>
          {initials}
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

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { advocate, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeModule, setActiveModule] = useState(MODULE_BY_PATH[location.pathname] || 'dashboard')
  const isDraft = activeModule === 'draft'

  const selectModule = (moduleId) => {
    setActiveModule(moduleId)
    setOpen(false)
  }

  const renderContent = () => {
    switch (activeModule) {
      case 'draft':
        return <DraftPage />
      case 'pipeline':
        return <PipelinePage />
      case 'arguments':
        return <ArgumentPage />
      case 'validate':
        return <ValidatePage />
      case 'compare':
        return <ComparePage />
      case 'bareacts':
        return <ReferencePage />
      case 'profile':
        return <ProfilePage />
      case 'dashboard':
      default:
        return <Dashboard onModuleSelect={selectModule} />
    }
  }

  const SidebarContent = () => (
    <>
      <div style={{ padding: '22px 20px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(255,255,255,0.18)' }}>
            <Gavel size={17} color="#000000" strokeWidth={2.5} />
          </div>
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

      <nav style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 4px 6px', marginBottom: 4 }}>Navigation</div>
        {NAV.map(({ id, to, icon: Icon, label }) => (
          <a key={to} href={to} onClick={(e) => { e.preventDefault(); selectModule(id) }}
            className={`nav-item ${activeModule === id ? 'active' : ''}`}
            style={{ marginBottom: 2 }}>
            <Icon size={14} /><span>{label}</span>
          </a>
        ))}
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
          <Scale size={28} />
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

      <main
        style={{
          marginLeft: 220,
          flex: 1,
          padding: isDraft ? 0 : '36px 32px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          overflow: isDraft ? 'auto' : undefined,
        }}
        className={`main-content ${isDraft ? 'draft-main' : ''}`}
      >
        {renderContent()}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 68px 16px 32px !important; }
          .main-content.draft-main { padding: 52px 0 0 !important; }
        }
        @media (min-width: 769px) {
          .mobile-header, .mobile-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
