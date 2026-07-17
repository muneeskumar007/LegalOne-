import { useState } from 'react'
import { Scale, FileText, GitBranch, CheckCircle, GitCompare, ArrowRight, Gavel, MessageSquare, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DraftPage from './DraftPage'

const CARDS = [
  { id: 'draft',     to:'/draft',     icon:FileText,      title:'AI Drafter',        desc:'Describe your case and let AI create a complete legal draft in seconds.',        badge:'AI + PDF',     cls:'badge-info'    },
  { id: null,        to:'/pipeline',  icon:GitBranch,     title:'AI Pipeline',       desc:'Full extract → classify → RAG → draft → validate in one click',                  badge:'Recommended',  cls:'badge-gold'    },
  { id: null,        to:'/arguments', icon:MessageSquare, title:'Argument Writer',   desc:'Generate petitioner & respondent arguments with SC precedents',                   badge:'Precedents',   cls:'badge-warning' },
  { id: null,        to:'/validate',  icon:CheckCircle,   title:'Validate',          desc:'Check any draft for missing sections and legal compliance',                       badge:'Quality Check',cls:'badge-success' },
  { id: null,        to:'/compare',   icon:GitCompare,    title:'Compare Docs',      desc:'Detect factual contradictions between petition and counter',                      badge:'Contradiction',cls:'badge-error'   },
  { id: null,        to:'/reference', icon:BookOpen,      title:'Bare Acts',         desc:'Quick-search 10 Indian Acts and 35+ key sections',                               badge:'Reference',    cls:'badge-gold'    },
]

const PIPELINE = ['User Input','Fact Extraction','Classification','Rule Engine','RAG Retrieval','LLM Draft','Validation','Advocate Review','Output']

const TECH = [
  ['Python + FastAPI','Backend API'],
  ['Ollama (Llama 3)','LLM Engine'],
  ['SentenceTransformers','Embeddings'],
  ['FAISS','Vector DB'],
  ['React + Vite','Frontend'],
  ['ReportLab','PDF Export'],
  ['RAG Pipeline','Retrieval'],
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState(null)

  /* ── If a module is active, render it in place of the dashboard ── */
  if (activeModule === 'draft') {
    return (
      <div style={{ margin: '-36px -32px -40px', minHeight: '100vh' }}>
        {/* Back button strip */}
        <div style={{ padding: '10px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setActiveModule(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Dashboard
          </button>
        </div>
        <DraftPage />
      </div>
    )
  }

  /* ── Default: Dashboard home ─────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 920 }}>
      {/* Hero */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 36px rgba(212,168,67,0.35)'
          }}>
            <Gavel size={26} color="#0f0d0a" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
              Welcome to <span className="gold-shimmer">LegalOne</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>
              AI-Driven Legal Drafting — RAG + Ollama (Llama 3) + Rule Engine · Presented by TLC
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.75, maxWidth: 660 }}>
          LegalOne removes fear, confusion, and delay from the justice system — empowering
          litigants with clarity and enabling advocates to work smarter through one intelligent
          AI platform. 100% free and open source.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))', gap: 14 }}>
        {CARDS.map(({ id, to, icon: Icon, title, desc, badge, cls }, i) => (
          <div
            key={to}
            className={`glass-card animate-fade-up delay-${Math.min((i+1)*100,300)}`}
            onClick={() => {
              if (id === 'draft') {
                setActiveModule('draft')
              } else {
                navigate(to)
              }
            }}
            style={{ padding: '18px 16px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';       e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color="var(--gold)" />
              </div>
              <span className={`badge ${cls}`} style={{ fontSize: 9 }}>{badge}</span>
            </div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 14, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: 12, fontWeight: 500 }}>
              Open <ArrowRight size={11} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
