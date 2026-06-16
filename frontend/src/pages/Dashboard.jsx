import { Scale, FileText, GitBranch, CheckCircle, GitCompare, ArrowRight, Gavel, MessageSquare, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CARDS = [
  { to:'/pipeline',  icon:GitBranch,     title:'AI Pipeline',      desc:'Full extract → classify → RAG → draft → validate in one click',       badge:'Recommended',  cls:'badge-gold'    },
  { to:'/draft',     icon:FileText,      title:'Quick Draft',       desc:'Get an AI petition in seconds with PDF export',                        badge:'AI + PDF',     cls:'badge-info'    },
  { to:'/arguments', icon:MessageSquare, title:'Argument Writer',   desc:'Generate petitioner & respondent arguments with SC precedents',        badge:'Precedents',   cls:'badge-warning' },
  { to:'/validate',  icon:CheckCircle,   title:'Validate',          desc:'Check any draft for missing sections and legal compliance',            badge:'Quality Check',cls:'badge-success' },
  { to:'/compare',   icon:GitCompare,    title:'Compare Docs',      desc:'Detect factual contradictions between petition and counter',           badge:'Contradiction',cls:'badge-error'   },
  { to:'/reference', icon:BookOpen,      title:'Bare Acts',         desc:'Quick-search 10 Indian Acts and 35+ key sections',                    badge:'Reference',    cls:'badge-gold'    },
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

      {/* Pipeline strip */}
      {/* <div className="glass-card animate-fade-up delay-100" style={{ padding: '18px 22px', marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          AI Pipeline Architecture
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {PIPELINE.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                padding: '4px 9px', borderRadius: 5, fontSize: 11, fontWeight: 500,
                background: i === 0 ? 'rgba(212,168,67,0.15)' : 'var(--bg-card)',
                color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)',
                border: `1px solid ${i === 0 ? 'rgba(212,168,67,0.3)' : 'var(--border)'}`,
              }}>{step}</div>
              {i < PIPELINE.length - 1 && <ArrowRight size={10} color="var(--text-muted)" />}
            </div>
          ))}
        </div>
      </div> */}

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))', gap: 14 }}>
        {CARDS.map(({ to, icon: Icon, title, desc, badge, cls }, i) => (
          <div
            key={to}
            className={`glass-card animate-fade-up delay-${Math.min((i+1)*100,300)}`}
            onClick={() => navigate(to)}
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

      {/* Tech stack */}
      {/* <div className="animate-fade-up" style={{ marginTop: 28, padding: '14px 18px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Tech Stack — 100% Free &amp; Open Source
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {TECH.map(([name, role]) => (
            <div key={name} style={{ padding: '5px 11px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{name}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>— {role}</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  )
}
