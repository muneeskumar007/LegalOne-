import { Scale, FileText, GitBranch, CheckCircle, GitCompare, ArrowRight, Gavel, MessageSquare, BookOpen } from 'lucide-react'
 
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CARDS = [
  { id: 'draft',     to:'/draft',     icon:FileText,      title:'AI Drafter',        desc:'Describe your case and let AI create a complete legal draft in seconds.',        badge:'AI + PDF',     cls:'badge-info'    },
  { id: 'pipeline',  to:'/pipeline',  icon:GitBranch,     title:'AI Pipeline',       desc:'Full extract → classify → RAG → draft → validate in one click',                  badge:'Recommended',  cls:'badge-gold'    },
  { id: 'arguments', to:'/arguments', icon:MessageSquare, title:'Argument Writer',   desc:'Generate petitioner & respondent arguments with SC precedents',                   badge:'Precedents',   cls:'badge-warning' },
  { id: 'validate',  to:'/validate',  icon:CheckCircle,   title:'Validate',          desc:'Check any draft for missing sections and legal compliance',                       badge:'Quality Check',cls:'badge-success' },
  { id: 'compare',   to:'/compare',   icon:GitCompare,    title:'Compare Docs',      desc:'Detect factual contradictions between petition and counter',                      badge:'Contradiction',cls:'badge-error'   },
  { id: 'bareacts',  to:'/reference', icon:BookOpen,      title:'Bare Acts',         desc:'Quick-search 10 Indian Acts and 35+ key sections',                               badge:'Reference',    cls:'badge-gold'    },
]

const PIPELINE = ['User Input','Fact Extraction','Classification','Rule Engine','RAG Retrieval','LLM Draft','Validation','Advocate Review','Output']

const TECH = [
  ['Python + FastAPI','Backend API'],
  ['Ollama (Llama 3)','LLM Engine'],
  ['SentenceTransformers','Embeddings'],
  ['FAISS','Vector DB'],
  ['React + Vite','Frontend'],
  ['ReportLab','PDF Export'],
  ['RAG Pipeline','Retrieval']]



export default function Dashboard({ onModuleSelect }) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 960 }}>
      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700,
              lineHeight: 1.2, color: 'var(--text-primary)'
            }}>
              My Cases
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
              AI-Driven Legal Drafting — Select a tool to get started
            </p>
          </div>
          <button
            onClick={() => navigate('/draft')}
            className="btn-gold"
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Plus size={16} /> New Draft
          </button>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginTop: 16 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="legal-input"
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, fontSize: 14, background: '#ffffff' }}
          />
        </div>
      </div>

      {/* ── Feature cards grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16
      }}>
        {filtered.map(({ to, icon: Icon, title, desc, badge }, i) => (
          <div
            key={to}
            className={`glass-card animate-fade-up delay-${Math.min((i+1)*100,300)}`}
            onClick={() => {
              if (onModuleSelect) {
                onModuleSelect(id)
              } else {
                navigate(to)
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} color="var(--text-primary)" strokeWidth={1.5} />
              </div>
              <span className="badge badge-gold" style={{ fontSize: 10 }}>{badge}</span>
            </div>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600,
              marginBottom: 6, color: 'var(--text-primary)'
            }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 5,
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600
            }}>
              Open <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          color: 'var(--text-muted)', fontSize: 14
        }}>
          <FolderOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p>No tools found matching "{search}"</p>
        </div>
      )}
    </div>
  )
}
