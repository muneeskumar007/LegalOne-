// ═══════════════════════════════════════════════════════════════════════
// JudgementUI.jsx — Complete Judgements Dashboard
// React 18 · Tailwind CSS · Lucide React · FastAPI backend
// ═══════════════════════════════════════════════════════════════════════
import React, {
  useState, useEffect, useMemo, useCallback, useRef,
} from 'react';
import {
  Search, ChevronDown, SlidersHorizontal, FileText, CheckCircle2,
  Star, Eye, EyeOff, FileDown, MoreVertical, Plus, HelpCircle,
  Moon, Sun, User, X, Trash2, Pencil, ChevronLeft, ChevronRight,
  Upload, FolderOpen, Scale, BookOpen, AlertTriangle, FileQuestion,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // ✅ same as ReferencePage

/* ─── Constants ──────────────────────────────────────────────────────── */

const THEME_KEY    = 'legalone_theme';
const PAGE_SIZE    = 5;
const LP_PAGE_SIZE = 2;

const CATEGORIES = [
  'Constitutional Law','Civil Law','Criminal Law','Family Law',
  'Labour Law','Corporate Law','Tax Law','Other',
];

const COURTS = [
  'Supreme Court of India','Delhi High Court','Bombay High Court',
  'Madras High Court','Calcutta High Court','Karnataka High Court',
  'Allahabad High Court','Gujarat High Court','Rajasthan High Court',
  'Punjab and Haryana High Court','Kerala High Court',
  'Telangana High Court','Patna High Court',
  'National Consumer Disputes Redressal Commission',
  'National Green Tribunal','Other',
];

const CATEGORY_COLORS = {
  'Constitutional Law': { bg:'#f0e6ff', text:'#7c3aed', dBg:'#2d1b4e', dText:'#c4b5fd' },
  'Civil Law':          { bg:'#dbeafe', text:'#2563eb', dBg:'#1e2a4a', dText:'#93c5fd' },
  'Criminal Law':       { bg:'#fee2e2', text:'#dc2626', dBg:'#4a1e1e', dText:'#fca5a5' },
  'Family Law':         { bg:'#ffedd5', text:'#c2410c', dBg:'#4a2d1e', dText:'#fdba74' },
  'Labour Law':         { bg:'#ccfbf1', text:'#0d9488', dBg:'#1e4a42', dText:'#5eead4' },
  'Corporate Law':      { bg:'#d1fae5', text:'#059669', dBg:'#1e4a2d', dText:'#6ee7b7' },
  'Tax Law':            { bg:'#fef9c3', text:'#ca8a04', dBg:'#4a421e', dText:'#fde047' },
  'Other':              { bg:'#f1f5f9', text:'#475569', dBg:'#2d3748', dText:'#94a3b8' },
};

// ✅ All API endpoints in one place — matches your bare-acts pattern
const JUDGEMENTS_API = {
  list:     '/judgements',
  create:   '/judgements',
  upload:   '/judgements/upload-pdf',
  view:     (id) => `/judgements/${id}/view`,
  download: (id) => `/judgements/${id}/download`,
  delete:   (id) => `/judgements/${id}`,
};

/* ─── Helpers ────────────────────────────────────────────────────────── */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function getApiErrorMessage(error, fallback) {
  if (error.message && !error.response) return error.message;
  if (!error.response) return 'Network error. Please check your connection.';
  const detail = error.response?.data?.detail || error.response?.data?.message;
  if (typeof detail === 'string') return detail;
  return fallback;
}

/* ─── Theme colours ──────────────────────────────────────────────────── */

function tc(isDark) {
  return isDark ? {
    pageBg:'#0f1117', cardBg:'#1a1d28', cardBorder:'#2a2d3a',
    tableHeadBg:'#1e2130', tableRowHover:'#22253a', tableBorder:'#2a2d3a',
    inputBg:'#1a1d28', inputBorder:'#2e3145',
    textP:'#eaecf0', textS:'#a1a7b8', textM:'#636b80',
    pillBg:'#252838', btnPrimBg:'#eaecf0', btnPrimText:'#0f1117',
    sidebarActiveBg:'#252d44', sidebarActiveText:'#7cacf8', sidebarActiveBorder:'#3b5998',
    statBlueBg:'#1a2744', statGreenBg:'#12342a', statBlueBg2:'#1a2744', statAmberBg:'#342e12',
    modalOverlay:'rgba(0,0,0,.65)', modalBg:'#1a1d28',
    dangerBg:'#3a1c1c', dangerText:'#f87171',
    keyBadgeBg:'#3d2e0a', keyBadgeText:'#fbbf24',
    starActive:'#facc15', starInactive:'#4a4d5c',
  } : {
    pageBg:'#f4f6fb', cardBg:'#ffffff', cardBorder:'#e0e8f4',
    tableHeadBg:'#f8fafd', tableRowHover:'#f5f8ff', tableBorder:'#edf2f9',
    inputBg:'#ffffff', inputBorder:'#dde6f5',
    textP:'#1a1f36', textS:'#4e617c', textM:'#94a3b8',
    pillBg:'#f1f5fb', btnPrimBg:'#111827', btnPrimText:'#ffffff',
    sidebarActiveBg:'#eef3fd', sidebarActiveText:'#2a4d9b', sidebarActiveBorder:'#b8ccf7',
    statBlueBg:'#ebf0fd', statGreenBg:'#e8f8f2', statBlueBg2:'#ebf0fd', statAmberBg:'#fef8e7',
    modalOverlay:'rgba(0,0,0,.45)', modalBg:'#ffffff',
    dangerBg:'#fef2f2', dangerText:'#dc2626',
    keyBadgeBg:'#fef3c7', keyBadgeText:'#b45309',
    starActive:'#f59e0b', starInactive:'#d1d5db',
  };
}

/* ─── Shared action button style ─────────────────────────────────────── */

function actionBtnStyle(c, isActive) {
  return {
    display:'inline-grid', placeItems:'center', width:30, height:30,
    borderRadius:7,
    background: isActive ? c.sidebarActiveBg : c.cardBg,
    border:`1px solid ${isActive ? c.sidebarActiveBorder : c.inputBorder}`,
    color: isActive ? c.sidebarActiveText : c.textS,
    cursor:'pointer', transition:'all .16s', padding:0,
    fontFamily:'Inter,sans-serif',
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Confirm Delete Modal ────────────────────────────────────────────── */
function ConfirmDeleteModal({ title, message, onConfirm, onCancel, c }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
         style={{ background: c.modalOverlay }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
           style={{ background: c.modalBg, border:`1px solid ${c.cardBorder}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl"
               style={{ background: c.dangerBg }}>
            <AlertTriangle size={20} style={{ color: c.dangerText }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: c.textP }}>{title}</h3>
        </div>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: c.textS }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: c.pillBg, color: c.textS, border:`1px solid ${c.cardBorder}` }}>
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background:'#dc2626', color:'#fff' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Judgement Modal ─────────────────────────────────────────────── */
function AddJudgementModal({ onSave, onClose, c, saving }) {
  const [form, setForm] = useState({
    caseName:'', citation:'', court:'', year:'', category:'',
    isKeyJudgement: false, pdfFileName:'', pdfFile: null,
  });
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ✅ Stores raw File object — no base64 conversion
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) { toast.error('Please select a PDF file.'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max file size is 50 MB.'); return; }
    set('pdfFile', file);
    set('pdfFileName', file.name);
  };

  const validate = () => {
    const e = {};
    if (!form.caseName.trim()) e.caseName = 'Required';
    if (!form.citation.trim()) e.citation = 'Required';
    if (!form.court)           e.court    = 'Required';
    if (!form.year || !/^\d{4}$/.test(form.year)) e.year = 'Valid 4-digit year required';
    if (!form.category)        e.category = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // ✅ Pass raw File object up — no base64, no localStorage
    onSave({
      caseName:       form.caseName.trim(),
      citation:       form.citation.trim(),
      court:          form.court,
      year:           form.year,
      category:       form.category,
      isKeyJudgement: form.isKeyJudgement,
      pdfFile:        form.pdfFile,
      pdfFileName:    form.pdfFileName || null,
    });
  };

  const inputStyle = {
    background: c.inputBg, border:`1px solid ${c.inputBorder}`,
    color: c.textP, borderRadius:10, padding:'10px 14px', width:'100%',
    fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', transition:'border-color .2s',
  };
  const labelStyle = { color: c.textS, fontSize:12, fontWeight:600, marginBottom:4, display:'block' };
  const errStyle   = { color:'#ef4444', fontSize:11, marginTop:2 };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
         style={{ background: c.modalOverlay }}
         onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
           style={{ background: c.modalBg, border:`1px solid ${c.cardBorder}`, maxHeight:'90vh' }}>

        <div className="flex items-center justify-between px-6 py-4"
             style={{ borderBottom:`1px solid ${c.cardBorder}` }}>
          <h3 className="text-lg font-bold" style={{ color: c.textP }}>Add New Judgement</h3>
          <button onClick={onClose} disabled={saving}
                  style={{ color: c.textM, background:'none', border:'none', cursor:'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto"
              style={{ maxHeight:'calc(90vh - 140px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label style={labelStyle}>Case Name *</label>
              <input style={inputStyle} placeholder="e.g. Shayara Bano vs Union of India"
                     value={form.caseName} onChange={e => set('caseName', e.target.value)} />
              {errors.caseName && <p style={errStyle}>{errors.caseName}</p>}
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Citation *</label>
              <input style={inputStyle} placeholder="e.g. (2017) 9 SCC 1"
                     value={form.citation} onChange={e => set('citation', e.target.value)} />
              {errors.citation && <p style={errStyle}>{errors.citation}</p>}
            </div>
            <div>
              <label style={labelStyle}>Court *</label>
              <select style={{ ...inputStyle, cursor:'pointer', appearance:'auto' }}
                      value={form.court} onChange={e => set('court', e.target.value)}>
                <option value="">Select Court</option>
                {COURTS.map(ct => <option key={ct} value={ct}>{ct}</option>)}
              </select>
              {errors.court && <p style={errStyle}>{errors.court}</p>}
            </div>
            <div>
              <label style={labelStyle}>Year *</label>
              <input style={inputStyle} placeholder="e.g. 2017" maxLength={4}
                     value={form.year} onChange={e => set('year', e.target.value.replace(/\D/g, ''))} />
              {errors.year && <p style={errStyle}>{errors.year}</p>}
            </div>
            <div>
              <label style={labelStyle}>Category *</label>
              <select style={{ ...inputStyle, cursor:'pointer', appearance:'auto' }}
                      value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {errors.category && <p style={errStyle}>{errors.category}</p>}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none"
                     style={{ color: c.textS, fontSize:13 }}>
                <input type="checkbox" checked={form.isKeyJudgement}
                       onChange={e => set('isKeyJudgement', e.target.checked)}
                       className="w-4 h-4 rounded accent-amber-500" />
                Mark as Key Judgement
              </label>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="mb-6">
            <label style={labelStyle}>Upload PDF (optional, max 50 MB)</label>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: c.pillBg, color: c.textS, border:`1px solid ${c.cardBorder}` }}>
                <Upload size={14} /> Choose File
              </button>
              <span className="text-xs truncate max-w-[200px]" style={{ color: c.textM }}>
                {form.pdfFileName || 'No file selected'}
              </span>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf"
                     className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: c.pillBg, color: c.textS, border:`1px solid ${c.cardBorder}` }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"
                    style={{ background: c.btnPrimBg, color: c.btnPrimText }}>
              <span className="flex items-center gap-2">
                <Plus size={15} />
                {saving ? 'Saving...' : 'Add Judgement'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────── */
function Pagination({ current, total, onPage, label, c }) {
  if (total <= 1) return label
    ? <div className="pt-4"><p className="text-xs" style={{ color: c.textM }}>{label}</p></div>
    : null;

  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }

  const base = {
    display:'inline-grid', placeItems:'center', width:32, height:32,
    borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer',
    border:`1px solid ${c.inputBorder}`, background:c.cardBg, color:c.textS, transition:'all .16s',
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
      {label && <p className="text-xs" style={{ color: c.textM }}>{label}</p>}
      <div className="flex items-center gap-1 ml-auto">
        <button style={current === 1 ? { ...base, opacity:.4, cursor:'not-allowed' } : base}
                disabled={current === 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ color: c.textM, fontSize:14, width:28, textAlign:'center', display:'inline-block' }}>…</span>
            : <button key={p}
                      style={p === current
                        ? { ...base, background:'#2e4d9a', color:'#fff', borderColor:'#2e4d9a' }
                        : base}
                      onClick={() => onPage(p)}>{p}</button>
        )}
        <button style={current === total ? { ...base, opacity:.4, cursor:'not-allowed' } : base}
                disabled={current === total} onClick={() => onPage(current + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Legal Point Modal ───────────────────────────────────────────────── */
function LegalPointModal({ point, onSave, onClose, c }) {
  const [title, setTitle] = useState(point?.title || '');
  const [obs, setObs]     = useState(point?.observation || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ id: point?.id || uid(), title: title.trim(), observation: obs.trim() });
  };

  const inputStyle = {
    background: c.inputBg, border:`1px solid ${c.inputBorder}`,
    color: c.textP, borderRadius:10, padding:'10px 14px', width:'100%',
    fontSize:13, fontFamily:'Inter,sans-serif', outline:'none',
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
         style={{ background: c.modalOverlay }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6"
           style={{ background: c.modalBg, border:`1px solid ${c.cardBorder}` }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: c.textP }}>
          {point ? 'Edit Legal Point' : 'Add Legal Point / Observation'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: c.textS }}>Legal Point *</label>
            <textarea style={{ ...inputStyle, minHeight:70, resize:'vertical' }}
                      placeholder="Enter the legal point..."
                      value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: c.textS }}>Observation</label>
            <textarea style={{ ...inputStyle, minHeight:60, resize:'vertical' }}
                      placeholder="Enter the observation..."
                      value={obs} onChange={e => setObs(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: c.pillBg, color: c.textS, border:`1px solid ${c.cardBorder}` }}>
              Cancel
            </button>
            <button type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                    style={{ background: c.btnPrimBg, color: c.btnPrimText }}>
              {point ? 'Save Changes' : 'Add Point'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function JudgementUI() {
  // ✅ authApi pulled from context — same as ReferencePage
  const { authApi } = useAuth();

  /* ── Theme ───────────────────────────────────────────────────────── */
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const c = useMemo(() => tc(isDark), [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  /* ── Data (from backend, not localStorage) ───────────────────────── */
  const [judgements, setJudgements] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false); // ✅ tracks upload-in-progress

  // ✅ Fetch all judgements from backend on mount
  const fetchJudgements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authApi.get(JUDGEMENTS_API.list);
      // Normalise backend snake_case → camelCase for the UI
      const normalised = (Array.isArray(data) ? data : data?.judgements ?? []).map(j => ({
        id:             j.id,
        caseName:       j.case_name,
        citation:       j.citation,
        court:          j.court,
        year:           j.year,
        category:       j.category,
        isKeyJudgement: j.is_key_judgement ?? false,
        isFavorite:     j.is_favorite      ?? false,
        addedOn:        j.created_at,
        pdfFileId:      j.pdf_file_id      ?? null, // ✅ server file id
        pdfFileName:    j.pdf_file_name    ?? null,
        legalPoints:    j.legal_points     ?? [],
      }));
      setJudgements(normalised);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load judgements.'));
    } finally {
      setLoading(false);
    }
  }, [authApi]);

  useEffect(() => { fetchJudgements(); }, [fetchJudgements]);

  /* ── UI State ────────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Judgements');
  const [courtFilter, setCourtFilter]           = useState('');
  const [yearFilter, setYearFilter]             = useState('');
  const [currentPage, setCurrentPage]           = useState(1);
  const [expandedId, setExpandedId]             = useState(null);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [deleteTarget, setDeleteTarget]         = useState(null);
  const [openMenuId, setOpenMenuId]             = useState(null);
  const [lpPage, setLpPage]                     = useState(1);
  const [lpModal, setLpModal]                   = useState(null);
  const [deleteLpTarget, setDeleteLpTarget]     = useState(null);

  /* ── Close menu on outside click ────────────────────────────────── */
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  /* ── Derived values ──────────────────────────────────────────────── */
  const uniqueCourts = useMemo(() =>
    [...new Set(judgements.map(j => j.court))].sort(), [judgements]);
  const uniqueYears  = useMemo(() =>
    [...new Set(judgements.map(j => j.year))].sort((a, b) => b - a), [judgements]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
    judgements.forEach(j => { if (counts[j.category] !== undefined) counts[j.category]++; });
    return counts;
  }, [judgements]);

  const stats = useMemo(() => {
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    return {
      total:  judgements.length,
      withLP: judgements.filter(j => j.legalPoints?.length > 0).length,
      recent: judgements.filter(j => new Date(j.addedOn) >= thirtyAgo).length,
      favs:   judgements.filter(j => j.isFavorite).length,
    };
  }, [judgements]);

  const filtered = useMemo(() => judgements.filter(j => {
    if (selectedCategory !== 'All Judgements' && j.category !== selectedCategory) return false;
    if (courtFilter && j.court !== courtFilter) return false;
    if (yearFilter  && j.year  !== yearFilter)  return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return j.caseName.toLowerCase().includes(s)
          || j.citation.toLowerCase().includes(s)
          || j.court.toLowerCase().includes(s)
          || j.category.toLowerCase().includes(s)
          || j.year.includes(s);
    }
    return true;
  }), [judgements, selectedCategory, courtFilter, yearFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = useMemo(() =>
    filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
  [filtered, safePage]);

  useEffect(() => { setCurrentPage(1); },
    [selectedCategory, courtFilter, yearFilter, searchTerm]);

  /* ── Handlers ────────────────────────────────────────────────────── */

  // ✅ Step 1: upload PDF → Step 2: save metadata — mirrors bare acts exactly
  const handleAddJudgement = useCallback(async (formData) => {
    const { pdfFile, pdfFileName, ...metadata } = formData;
    setSaving(true);
    try {
      let pdfFileId = null;

      // Step 1 — upload PDF if provided
      if (pdfFile) {
        const fd = new FormData();
        fd.append('file', pdfFile);
        const { data: uploadResult } = await authApi.post(
          JUDGEMENTS_API.upload, fd,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        pdfFileId = uploadResult.file_id ?? uploadResult.id ?? null;
      }

      // Step 2 — save judgement record
      const { data: newJudgement } = await authApi.post(JUDGEMENTS_API.create, {
        case_name:        metadata.caseName,
        citation:         metadata.citation,
        court:            metadata.court,
        year:             metadata.year,
        category:         metadata.category,
        is_key_judgement: metadata.isKeyJudgement,
        pdf_file_id:      pdfFileId,
        pdf_file_name:    pdfFileName,
      });

      // Step 3 — add to local state immediately (optimistic)
      setJudgements(prev => [{
        id:             newJudgement.id,
        caseName:       newJudgement.case_name,
        citation:       newJudgement.citation,
        court:          newJudgement.court,
        year:           newJudgement.year,
        category:       newJudgement.category,
        isKeyJudgement: newJudgement.is_key_judgement ?? metadata.isKeyJudgement,
        isFavorite:     false,
        addedOn:        newJudgement.created_at ?? new Date().toISOString(),
        pdfFileId,
        pdfFileName,
        legalPoints:    [],
      }, ...prev]);

      setShowAddModal(false);
      toast.success('Judgement added successfully.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add judgement.'));
    } finally {
      setSaving(false);
    }
  }, [authApi]);

  // ✅ Delete judgement — calls backend, then removes from state
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await authApi.delete(JUDGEMENTS_API.delete(deleteTarget));
      setJudgements(prev => prev.filter(j => j.id !== deleteTarget));
      if (expandedId === deleteTarget) setExpandedId(null);
      toast.success('Judgement deleted.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete judgement.'));
    } finally {
      setDeleteTarget(null);
      setOpenMenuId(null);
    }
  }, [deleteTarget, expandedId, authApi]);

  const toggleFavorite = useCallback((id) => {
    setJudgements(prev => prev.map(j =>
      j.id === id ? { ...j, isFavorite: !j.isFavorite } : j
    ));
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
    setLpPage(1);
  }, []);

  // ✅ View PDF — identical to bare acts handleViewAct
  const viewPdf = useCallback(async (j) => {
    if (!j.pdfFileId) { toast.error('No PDF uploaded for this judgement.'); return; }
    try {
      const { data } = await authApi.get(
        JUDGEMENTS_API.view(j.pdfFileId), { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Could not open the PDF.');
    }
  }, [authApi]);

  // ✅ Download PDF — identical to bare acts handleDownloadAct
  const downloadPdf = useCallback(async (j) => {
    if (!j.pdfFileId) { toast.error('No PDF uploaded for this judgement.'); return; }
    try {
      const { data } = await authApi.get(
        JUDGEMENTS_API.download(j.pdfFileId), { responseType: 'blob' }
      );
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = j.pdfFileName ?? `${j.caseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download the PDF.');
    }
  }, [authApi]);

  /* ── Legal Points CRUD (local state only — extend to API if needed) ── */
  const handleSaveLegalPoint = useCallback((point) => {
    if (!lpModal) return;
    setJudgements(prev => prev.map(j => {
      if (j.id !== lpModal.judgementId) return j;
      const lp  = [...(j.legalPoints || [])];
      const idx = lp.findIndex(p => p.id === point.id);
      if (idx >= 0) lp[idx] = point; else lp.push(point);
      return { ...j, legalPoints: lp };
    }));
    setLpModal(null);
  }, [lpModal]);

  const handleDeleteLegalPoint = useCallback(() => {
    if (!deleteLpTarget) return;
    setJudgements(prev => prev.map(j => {
      if (j.id !== deleteLpTarget.judgementId) return j;
      return { ...j, legalPoints: (j.legalPoints || []).filter(p => p.id !== deleteLpTarget.pointId) };
    }));
    setDeleteLpTarget(null);
  }, [deleteLpTarget]);

  /* ── Expanded judgement ──────────────────────────────────────────── */
  const expandedJudgement = useMemo(() =>
    expandedId ? judgements.find(j => j.id === expandedId) : null,
  [expandedId, judgements]);

  const expandedLP    = expandedJudgement?.legalPoints || [];
  const lpTotalPages  = Math.max(1, Math.ceil(expandedLP.length / LP_PAGE_SIZE));
  const lpSafePage    = Math.min(lpPage, lpTotalPages);
  const lpPaginated   = expandedLP.slice((lpSafePage - 1) * LP_PAGE_SIZE, lpSafePage * LP_PAGE_SIZE);
  const headingLabel  = selectedCategory === 'All Judgements'
    ? `All Judgements (${filtered.length})`
    : `${selectedCategory} (${filtered.length})`;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <section style={{
      background: c.pageBg, color: c.textP,
      fontFamily:"'Inter','DM Sans',system-ui,sans-serif",
      minHeight:'100vh', padding:'30px 36px 44px',
      transition:'background .25s,color .25s',
      margin:'-36px -32px -40px', maxWidth:1440,
    }}>
      <Toaster position="top-right" />

      {/* ════ HEADER ════ */}
      <header className="flex items-start justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.03em', color: c.textP, margin:0 }}>
            Judgements
          </h1>
          <p style={{ fontSize:13.5, color: c.textS, marginTop:6 }}>
            Search, manage and refer to important judgements with key legal points.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button title="Help"
                  style={{ display:'inline-grid', placeItems:'center', width:38, height:38,
                           borderRadius:10, border:`1px solid ${c.inputBorder}`,
                           background:c.cardBg, color:c.textS, cursor:'pointer' }}>
            <HelpCircle size={18} />
          </button>
          <button title="Toggle theme" onClick={() => setIsDark(d => !d)}
                  style={{ display:'inline-grid', placeItems:'center', width:38, height:38,
                           borderRadius:10, border:`1px solid ${c.inputBorder}`,
                           background:c.cardBg, color:c.textS, cursor:'pointer' }}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button title="Profile"
                  style={{ display:'inline-grid', placeItems:'center', width:38, height:38,
                           borderRadius:10, background: isDark ? '#e5e7eb' : '#111827',
                           color: isDark ? '#111827' : '#fff', cursor:'pointer', border:'none' }}>
            <User size={17} />
          </button>
          <button onClick={() => setShowAddModal(true)}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px',
                           borderRadius:10, background:c.btnPrimBg, color:c.btnPrimText,
                           fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
            <Plus size={15} /> Add New Judgement
          </button>
        </div>
      </header>

      {/* ════ SEARCH / FILTER TOOLBAR ════ */}
      <div className="grid gap-2.5 mb-6"
           style={{ gridTemplateColumns:'minmax(200px,1.6fr) repeat(3,minmax(120px,.73fr)) auto' }}>
        <div className="flex items-center gap-2.5 h-[42px] px-3 rounded-[9px]"
             style={{ background:c.inputBg, border:`1px solid ${c.inputBorder}` }}>
          <Search size={16} style={{ color:c.textM }} />
          <input placeholder="Search by case name, citation, court or keyword..."
                 value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                 className="w-full bg-transparent outline-none"
                 style={{ border:'none', fontSize:13, color:c.textP, fontFamily:'Inter,sans-serif' }} />
        </div>

        {[
          { value: selectedCategory === 'All Judgements' ? '' : selectedCategory,
            onChange: e => setSelectedCategory(e.target.value || 'All Judgements'),
            placeholder: 'All Categories', options: CATEGORIES },
          { value: courtFilter, onChange: e => setCourtFilter(e.target.value),
            placeholder: 'All Courts',
            options: uniqueCourts.length ? uniqueCourts : COURTS },
          { value: yearFilter, onChange: e => setYearFilter(e.target.value),
            placeholder: 'All Years', options: uniqueYears },
        ].map((sel, i) => (
          <div key={i} className="relative flex items-center h-[42px] px-2.5 rounded-[9px]"
               style={{ background:c.inputBg, border:`1px solid ${c.inputBorder}` }}>
            <select value={sel.value} onChange={sel.onChange}
                    className="w-full bg-transparent outline-none appearance-none pr-5 cursor-pointer"
                    style={{ border:'none', fontSize:13, color:c.textP, fontFamily:'Inter,sans-serif' }}>
              <option value="">{sel.placeholder}</option>
              {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 pointer-events-none"
                         style={{ color:c.textM }} />
          </div>
        ))}

        <button className="flex items-center justify-center gap-2 h-[42px] px-4 rounded-[9px]"
                style={{ background:c.inputBg, border:`1px solid ${c.inputBorder}`,
                         color:c.textS, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {/* ════ STATS ════ */}
      <div className="rounded-2xl mb-6 overflow-hidden"
           style={{ background:c.cardBg, border:`1px solid ${c.cardBorder}` }}>
        <div className="grid grid-cols-4">
          {[
            { icon:FolderOpen,   label:'Total Judgements',     value:stats.total,  desc:'Across all categories', iconBg:c.statBlueBg,  iconColor:'#2e5eda' },
            { icon:CheckCircle2, label:'With Legal Points',    value:stats.withLP, desc:'Judgements analysed',   iconBg:c.statGreenBg, iconColor:'#059669' },
            { icon:FileText,     label:'Recent Additions',     value:stats.recent, desc:'In last 30 days',       iconBg:c.statBlueBg2, iconColor:'#2e5eda' },
            { icon:Star,         label:'Favourite Judgements', value:stats.favs,   desc:'Marked as important',   iconBg:c.statAmberBg, iconColor:'#d97706' },
          ].map(({ icon:Icon, label, value, desc, iconBg, iconColor }, i, arr) => (
            <div key={label} className="flex items-start gap-4 p-5"
                 style={{ borderRight: i < arr.length - 1 ? `1px solid ${c.cardBorder}` : 'none' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                   style={{ background: iconBg }}>
                <Icon size={20} style={{ color: iconColor }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide"
                   style={{ color: c.textM, marginBottom:2 }}>{label}</p>
                <p style={{ fontSize:26, fontWeight:800, color: c.textP, margin:0 }}>
                  {value.toLocaleString()}
                </p>
                <p className="text-[11px] mt-1" style={{ color: c.textM }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════ SIDEBAR + TABLE ════ */}
      <div className="flex gap-6" style={{ alignItems:'flex-start' }}>

        {/* Sidebar */}
        <aside className="flex-shrink-0 hidden lg:block" style={{ width:210 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
                      color:c.textM, marginBottom:14, paddingLeft:4 }}>
            Categories
          </p>
          <nav className="flex flex-col gap-1">
            {[{ label:'All Judgements', count: judgements.length },
              ...CATEGORIES.map(cat => ({ label:cat, count: categoryCounts[cat] }))
            ].map(({ label, count }) => {
              const isActive = selectedCategory === label;
              return (
                <button key={label} onClick={() => setSelectedCategory(label)}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium"
                        style={{
                          background: isActive ? c.sidebarActiveBg : 'transparent',
                          color: isActive ? c.sidebarActiveText : c.textS,
                          border: isActive ? `1px solid ${c.sidebarActiveBorder}` : '1px solid transparent',
                          cursor:'pointer',
                        }}>
                  <FileText size={14} style={{ opacity:.6 }} />
                  <span className="truncate flex-1">{label}</span>
                  <span style={{ fontSize:11.5, fontWeight:600,
                                 color: isActive ? c.sidebarActiveText : c.textM }}>
                    {count > 0 ? count : '—'}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl overflow-hidden"
               style={{ background:c.cardBg, border:`1px solid ${c.cardBorder}` }}>
            <div className="px-6 pt-5 pb-4">
              <h2 style={{ fontSize:18, fontWeight:700, color:c.textP, margin:0 }}>
                {headingLabel}
              </h2>
            </div>

            {loading ? (
              <div className="py-16 text-center" style={{ color: c.textM, fontSize:14 }}>
                Loading judgements...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center"
                   style={{ borderTop:`1px solid ${c.cardBorder}` }}>
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                     style={{ background: isDark ? '#1e2744' : '#eef3fd' }}>
                  <Scale size={28} style={{ color:'#3a67c4' }} />
                </div>
                <h3 style={{ fontSize:16, fontWeight:700, color:c.textP, marginBottom:6 }}>
                  No Judgements Found
                </h3>
                <p style={{ fontSize:13, color:c.textM, maxWidth:340 }}>
                  {searchTerm || courtFilter || yearFilter || selectedCategory !== 'All Judgements'
                    ? 'No judgements match your filters.'
                    : 'Add your first judgement to get started.'}
                </p>
                {!searchTerm && !courtFilter && !yearFilter && selectedCategory === 'All Judgements' && (
                  <button onClick={() => setShowAddModal(true)}
                          className="mt-5"
                          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px',
                                   borderRadius:9, background:c.btnPrimBg, color:c.btnPrimText,
                                   fontSize:13, fontWeight:650, border:'none', cursor:'pointer' }}>
                    <Plus size={15} /> Add New Judgement
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', minWidth:820, borderCollapse:'collapse', textAlign:'left' }}>
                  <thead>
                    <tr style={{ background: c.tableHeadBg }}>
                      {['Case Name & Citation','Court','Year','Category','Added On','Actions'].map(h => (
                        <th key={h} style={{ padding:'12px 16px', borderBottom:`1px solid ${c.cardBorder}`,
                                             color:c.textM, fontSize:10.5, fontWeight:700,
                                             letterSpacing:'.07em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(j => {
                      const cc = CATEGORY_COLORS[j.category] || CATEGORY_COLORS['Other'];
                      return (
                        <tr key={j.id}
                            style={{ borderBottom:`1px solid ${c.tableBorder}` }}
                            onMouseEnter={e => e.currentTarget.style.background = c.tableRowHover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          <td style={{ padding:'14px 16px', verticalAlign:'middle' }}>
                            <div className="flex items-start gap-2.5">
                              <button onClick={() => toggleFavorite(j.id)}
                                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:0, marginTop:2 }}>
                                <Star size={16} fill={j.isFavorite ? c.starActive : 'none'}
                                      style={{ color: j.isFavorite ? c.starActive : c.starInactive }} />
                              </button>
                              <div>
                                <strong style={{ display:'block', fontSize:13.5, fontWeight:600, color:c.textP }}>
                                  {j.caseName}
                                </strong>
                                <span style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                                  <span style={{ fontSize:11.5, color:c.textM }}>{j.citation}</span>
                                  {j.isKeyJudgement && (
                                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4,
                                                   background:c.keyBadgeBg, color:c.keyBadgeText }}>
                                      Key Judgement
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding:'14px 16px', fontSize:13, color:c.textS }}>{j.court}</td>
                          <td style={{ padding:'14px 16px', fontSize:13, color:c.textS }}>{j.year}</td>

                          <td style={{ padding:'14px 16px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px',
                                           borderRadius:6, fontSize:11.5, fontWeight:600,
                                           background: isDark ? cc.dBg : cc.bg,
                                           color: isDark ? cc.dText : cc.text }}>
                              {j.category}
                            </span>
                          </td>

                          <td style={{ padding:'14px 16px', fontSize:12.5, color:c.textS }}>
                            {fmtDate(j.addedOn)}
                          </td>

                          <td style={{ padding:'14px 16px' }}>
                            <div className="flex items-center gap-1.5">
                              {/* View Legal Points */}
                              <button title={expandedId === j.id ? 'Hide Legal Points' : 'View Legal Points'}
                                      onClick={() => toggleExpand(j.id)}
                                      style={actionBtnStyle(c, expandedId === j.id)}>
                                {expandedId === j.id ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>

                              {/* ✅ Download — uses pdfFileId, not pdfData */}
                              <button title={j.pdfFileId ? 'Download PDF' : 'No PDF uploaded'}
                                      onClick={() => downloadPdf(j)}
                                      disabled={!j.pdfFileId}
                                      style={{ ...actionBtnStyle(c, false),
                                               opacity: j.pdfFileId ? 1 : .4,
                                               cursor: j.pdfFileId ? 'pointer' : 'not-allowed' }}>
                                <FileDown size={14} />
                              </button>

                              {/* Three-dot menu */}
                              <div className="relative" ref={openMenuId === j.id ? menuRef : null}>
                                <button onClick={() => setOpenMenuId(openMenuId === j.id ? null : j.id)}
                                        style={actionBtnStyle(c, openMenuId === j.id)}>
                                  <MoreVertical size={14} />
                                </button>
                                {openMenuId === j.id && (
                                  <div className="absolute right-0 z-[200] mt-1.5"
                                       style={{ minWidth:148, padding:5, borderRadius:10,
                                                background:c.cardBg, border:`1px solid ${c.cardBorder}`,
                                                boxShadow:'0 10px 32px rgba(18,36,78,.13)' }}>
                                    <button onClick={() => { setDeleteTarget(j.id); setOpenMenuId(null); }}
                                            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg"
                                            style={{ background:'transparent', border:'none', cursor:'pointer',
                                                     fontSize:12.5, fontWeight:500, color:c.dangerText,
                                                     fontFamily:'Inter,sans-serif' }}>
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="px-6 pb-4">
                <Pagination current={safePage} total={totalPages} onPage={setCurrentPage}
                  label={`Showing ${(safePage-1)*PAGE_SIZE+1}–${Math.min(safePage*PAGE_SIZE, filtered.length)} of ${filtered.length}`}
                  c={c} />
              </div>
            )}
          </div>

          {/* ════ LEGAL POINTS ════ */}
          {expandedJudgement && (
            <div className="mt-6 rounded-2xl overflow-hidden"
                 style={{ background:c.cardBg, border:`1px solid ${c.cardBorder}` }}>
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3 flex-wrap"
                   style={{ borderBottom:`1px solid ${c.cardBorder}` }}>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em',
                              textTransform:'uppercase', color:c.textM, marginBottom:8 }}>
                    Legal Points / Observations
                  </p>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} style={{ color:'#2e5eda' }} />
                    <span style={{ fontSize:14, fontWeight:700, color:c.textP }}>
                      {expandedJudgement.caseName} · {expandedJudgement.citation}
                    </span>
                  </div>
                  <p style={{ fontSize:11.5, color:c.textM, marginTop:4 }}>
                    {expandedJudgement.court} · {expandedJudgement.category}
                  </p>
                </div>
                <button onClick={() => setLpModal({ judgementId: expandedJudgement.id })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ background:c.pillBg, color:c.textS, border:`1px solid ${c.cardBorder}`,
                                 cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  <Plus size={14} /> Add Legal Point
                </button>
              </div>

              {expandedLP.length === 0 ? (
                <div className="py-12 text-center">
                  <FileQuestion size={32} style={{ color:c.textM, margin:'0 auto 10px' }} />
                  <p style={{ fontSize:14, fontWeight:600, color:c.textP, marginBottom:4 }}>No Legal Points Yet</p>
                  <p style={{ fontSize:12, color:c.textM }}>Add your first legal point or observation.</p>
                </div>
              ) : (
                <div>
                  {lpPaginated.map((pt, idx) => {
                    const globalIdx = (lpSafePage - 1) * LP_PAGE_SIZE + idx + 1;
                    return (
                      <div key={pt.id} className="flex items-start gap-4 px-6 py-4"
                           style={{ borderBottom:`1px solid ${c.cardBorder}` }}
                           onMouseEnter={e => e.currentTarget.style.background = c.tableRowHover}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                             style={{ background: isDark ? '#252838' : '#eef3fd',
                                      color:'#2e5eda', fontSize:12, fontWeight:700 }}>
                          {globalIdx}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize:13, fontWeight:600, color:c.textP, lineHeight:1.5 }}>{pt.title}</p>
                          {pt.observation && (
                            <p style={{ fontSize:12, color:c.textS, marginTop:4, lineHeight:1.55 }}>
                              <span style={{ fontWeight:600 }}>Observation: </span>{pt.observation}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button title="Edit"
                                  onClick={() => setLpModal({ judgementId: expandedJudgement.id, point: pt })}
                                  style={actionBtnStyle(c, false)}>
                            <Pencil size={13} />
                          </button>
                          <button title="Delete"
                                  onClick={() => setDeleteLpTarget({ judgementId: expandedJudgement.id, pointId: pt.id })}
                                  style={{ ...actionBtnStyle(c, false), color: c.dangerText }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {expandedLP.length > LP_PAGE_SIZE && (
                    <div className="px-6 pb-4">
                      <Pagination current={lpSafePage} total={lpTotalPages} onPage={setLpPage}
                        label={`${expandedLP.length} legal points total`} c={c} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════ MODALS ════ */}
      {showAddModal && (
        <AddJudgementModal
          onSave={handleAddJudgement}
          onClose={() => !saving && setShowAddModal(false)}
          saving={saving}
          c={c}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Judgement"
          message="Are you sure? This will permanently delete this judgement and all its legal points."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          c={c}
        />
      )}
      {lpModal && (
        <LegalPointModal
          point={lpModal.point || null}
          onSave={handleSaveLegalPoint}
          onClose={() => setLpModal(null)}
          c={c}
        />
      )}
      {deleteLpTarget && (
        <ConfirmDeleteModal
          title="Delete Legal Point"
          message="Are you sure you want to delete this legal point?"
          onConfirm={handleDeleteLegalPoint}
          onCancel={() => setDeleteLpTarget(null)}
          c={c}
        />
      )}
    </section>
  );
}