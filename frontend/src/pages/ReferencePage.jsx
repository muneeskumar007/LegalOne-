import { useState } from 'react'
import { BookOpen, Search } from 'lucide-react'

const ACTS = [
  {
    name: 'Code of Civil Procedure, 1908', short: 'CPC',
    color: 'rgba(96,165,250,0.12)', textColor: 'var(--info)',
    sections: [
      { sec: 'Section 9',       desc: 'Courts to try all civil suits unless barred' },
      { sec: 'Order VII R.1',   desc: 'Particulars to be contained in a plaint' },
      { sec: 'Order XXXVII',    desc: 'Summary suits — money recovery' },
      { sec: 'Order XXXIX',     desc: 'Temporary injunctions and interlocutory orders' },
      { sec: 'Section 96',      desc: 'Appeals from original decrees' },
    ]
  },
  {
    name: 'Indian Contract Act, 1872', short: 'ICA',
    color: 'rgba(74,222,128,0.1)', textColor: 'var(--success)',
    sections: [
      { sec: 'Section 10', desc: 'What agreements are contracts' },
      { sec: 'Section 37', desc: 'Obligation of parties to perform promises' },
      { sec: 'Section 73', desc: 'Compensation for breach of contract' },
      { sec: 'Section 74', desc: 'Compensation where penalty is stipulated' },
    ]
  },
  {
    name: 'Indian Evidence Act, 1872 / BSA 2023', short: 'IEA/BSA',
    color: 'rgba(212,168,67,0.1)', textColor: 'var(--gold)',
    sections: [
      { sec: 'Section 101', desc: 'Burden of proof — whoever asserts must prove' },
      { sec: 'Section 102', desc: 'Burden lies on party who would fail without evidence' },
      { sec: 'Section 114', desc: 'Court may presume existence of certain facts' },
    ]
  },
  {
    name: 'Negotiable Instruments Act, 1881', short: 'NIA',
    color: 'rgba(251,146,60,0.1)', textColor: 'var(--warning)',
    sections: [
      { sec: 'Section 118', desc: 'Presumptions as to negotiable instruments' },
      { sec: 'Section 138', desc: 'Dishonour of cheque for insufficiency of funds' },
      { sec: 'Section 139', desc: 'Presumption in favour of holder' },
      { sec: 'Section 141', desc: 'Offences by companies' },
    ]
  },
  {
    name: 'Limitation Act, 1963', short: 'LA',
    color: 'rgba(248,113,113,0.1)', textColor: 'var(--error)',
    sections: [
      { sec: 'Article 18', desc: 'Suit on money lent — 3 years limitation' },
      { sec: 'Article 55', desc: 'Suit for breach of contract — 3 years' },
      { sec: 'Section 5',  desc: 'Extension of prescribed period in certain cases' },
    ]
  },
  {
    name: 'Specific Relief Act, 1963', short: 'SRA',
    color: 'rgba(96,165,250,0.08)', textColor: 'var(--info)',
    sections: [
      { sec: 'Section 34', desc: 'Declaratory decrees — rights over property' },
      { sec: 'Section 38', desc: 'Perpetual injunction when granted' },
      { sec: 'Section 39', desc: 'Mandatory injunctions' },
    ]
  },
  {
    name: 'Bharatiya Nyaya Sanhita, 2023', short: 'BNS',
    color: 'rgba(212,168,67,0.08)', textColor: 'var(--gold)',
    sections: [
      { sec: 'Section 85',  desc: 'Cruelty by husband or relative of husband' },
      { sec: 'Section 115', desc: 'Voluntarily causing hurt' },
      { sec: 'Section 118', desc: 'Voluntarily causing grievous hurt' },
      { sec: 'Section 316', desc: 'Criminal breach of trust' },
    ]
  },
  {
    name: 'Consumer Protection Act, 2019', short: 'CPA',
    // color: 'rgba(74,222,128,0.08)', textColor: 'var(--success)',
    sections: [
      { sec: 'Section 2(7)', desc: 'Definition of "consumer"' },
      { sec: 'Section 34',   desc: 'Jurisdiction of District Commission' },
      { sec: 'Section 35',   desc: 'Manner in which complaint shall be made' },
    ]
  },
  {
    name: 'Protection of Women from DV Act, 2005', short: 'PWDVA',
    color: 'rgba(251,146,60,0.08)', textColor: 'var(--warning)',
    sections: [
      { sec: 'Section 12', desc: 'Application to Magistrate for protection order' },
      { sec: 'Section 18', desc: 'Protection orders against domestic violence' },
      { sec: 'Section 19', desc: 'Residence orders — right to shared household' },
      { sec: 'Section 20', desc: 'Monetary relief to aggrieved person' },
    ]
  },
  {
    name: 'Transfer of Property Act, 1882', short: 'TPA',
    color: 'rgba(96,165,250,0.1)', textColor: 'var(--info)',
    sections: [
      { sec: 'Section 5',   desc: 'Transfer of property defined' },
      { sec: 'Section 54',  desc: 'Sale of immovable property' },
      { sec: 'Section 105', desc: 'Lease of immovable property defined' },
    ]
  },
]

export default function ReferencePage() {
  const [query, setQuery] = useState('')

  const filtered = ACTS.map(act => ({
    ...act,
    sections: act.sections.filter(s =>
      !query ||
      s.sec.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase()) ||
      act.name.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(a => a.sections.length > 0)

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            <BookOpen size={22} style={{ display: 'inline', marginRight: 10, color: 'var(--gold)' }} />
            Bare Acts Reference
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Quick reference for {ACTS.length} Indian statutes used in LegalOne
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="legal-input"
            style={{ paddingLeft: 34, width: 220, resize: 'none' }}
            placeholder="Search section or keyword…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map((act, i) => (
          <div key={i} className="glass-card animate-fade-up" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: act.color, color: act.textColor,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em'
              }}>{act.short}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{act.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {act.sections.map((s, j) => (
                <div key={j} style={{
                  display: 'flex', gap: 10, padding: '8px 0',
                  borderBottom: j < act.sections.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontSize: 11,
                    color: act.textColor, fontWeight: 500,
                    minWidth: 96, flexShrink: 0, paddingTop: 1
                  }}>{s.sec}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p>No results for "{query}"</p>
        </div>
      )}
    </div>
  )
}
