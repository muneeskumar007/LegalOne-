// import { useEffect, useMemo, useRef, useState } from 'react'
// import {
//   BookOpen,
//   CheckCircle2,
//   ChevronDown,
//   Clock3,
//   Download,
//   Eye,
//   FileText,
//   Filter,
//   HelpCircle,
//   LogOut,
//   MoreVertical,
//   Moon,
//   Search,
//   Settings,
//   Sun,
//   UploadCloud,
//   User,
//   X,
// } from 'lucide-react'
// import toast, { Toaster } from 'react-hot-toast'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// const INITIAL_ACTS = []
// const BARE_ACTS_API = {
//   list: '/bare-acts',
//   stats: '/bare-acts/stats',
//   upload: '/bare-acts/upload',
// }

// export default function ReferencePage() {
//   const { advocate, isLoggedIn, logout, authApi } = useAuth()
//   const navigate = useNavigate()
//   const profileRef = useRef(null)
//   const [acts, setActs] = useState(INITIAL_ACTS)
//   const [apiStats, setApiStats] = useState(null)
//   const [query, setQuery] = useState('')
//   const [category, setCategory] = useState('All Categories')
//   const [jurisdiction, setJurisdiction] = useState('All Jurisdictions')
//   const [status, setStatus] = useState('All Status')
//   const [uploadOpen, setUploadOpen] = useState(false)
//   const [selectedFile, setSelectedFile] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [uploadError, setUploadError] = useState('')
//   const [pageError, setPageError] = useState('')
//   const [darkMode, setDarkMode] = useState(() => localStorage.getItem('legalDark') === 'true')
//   const [showProfile, setShowProfile] = useState(false)
//   const [showFilters, setShowFilters] = useState(true)


//   const fetchBareActs = async () => {
//     setLoading(true)
//     setPageError('')
//     try {
//       const [{ data: listData }, statsResult] = await Promise.all([
//         authApi.get(BARE_ACTS_API.list),
//         authApi.get(BARE_ACTS_API.stats).catch(() => ({ data: null })),
//       ])
//       setActs(extractActs(listData))
//       setApiStats(statsResult.data)
//     } catch (error) {
//       const message = getApiErrorMessage(error, 'Failed to load Bare Acts.')
//       setPageError(message)
//       toast.error(message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchBareActs()
//   }, [])

//   useEffect(() => {
//     document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
//     localStorage.setItem('legalDark', String(darkMode))
//   }, [darkMode])

//   useEffect(() => {
//     const handler = e => {
//       if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [])

//   const rows = useMemo(() => acts.map(act => ({
//     ...act,
//     title: act.title || act.name || act.act_title || act.actTitle || '',
//     category: act.category || '-',
//     jurisdiction: act.jurisdiction || '-',
//     year: act.year || '-',
//     sectionsCount: act.sectionsCount || act.sections_count || act.totalSections || act.total_sections || act.sections?.length || 0,
//     status: act.status || 'Inactive',
//     lastUpdated: formatDate(act.lastUpdated || act.updatedAt || act.updated_at),
//   })), [acts])

//   const categoryOptions = useMemo(() => ['All Categories', ...new Set(rows.map(act => act.category).filter(value => value && value !== '-'))], [rows])
//   const jurisdictionOptions = useMemo(() => ['All Jurisdictions', ...new Set(rows.map(act => act.jurisdiction).filter(value => value && value !== '-'))], [rows])
//   const statusOptions = useMemo(() => ['All Status', ...new Set(rows.map(act => act.status).filter(Boolean))], [rows])

//   const filtered = rows.filter(act => {
//     const searchText = `${act.title} ${act.category} ${act.jurisdiction} ${act.year} ${act.status}`.toLowerCase()

//     return (
//       (!query || searchText.includes(query.toLowerCase())) &&
//       (category === 'All Categories' || act.category === category) &&
//       (jurisdiction === 'All Jurisdictions' || act.jurisdiction === jurisdiction) &&
//       (status === 'All Status' || act.status === status)
//     )
//   })

//   const stats = [
//     { label: 'Total Acts', value: apiStats?.totalActs ?? apiStats?.total_acts ?? rows.length, detail: 'Uploaded', icon: FileText, tone: 'purple' },
//     { label: 'Active Acts', value: apiStats?.activeActs ?? apiStats?.active_acts ?? rows.filter(act => act.status?.toLowerCase() === 'active').length, detail: 'Ready to use', icon: CheckCircle2, tone: 'green' },
//     { label: 'Recently Added', value: apiStats?.recentlyAdded ?? apiStats?.recently_added ?? rows.filter(act => isRecentlyAdded(act.createdAt || act.uploadedAt || act.lastUpdated)).length, detail: 'In last 30 days', icon: Clock3, tone: 'amber' },
//     { label: 'Total Sections Indexed', value: apiStats?.totalSectionsIndexed ?? apiStats?.total_sections_indexed ?? rows.reduce((sum, act) => sum + act.sectionsCount, 0), detail: 'Across all acts', icon: BookOpen, tone: 'blue' },
//   ]

//   const openUploadDialog = () => setUploadOpen(true)
//   const closeUploadDialog = (force = false) => {
//     if (uploading && !force) return
//     setUploadOpen(false)
//     setSelectedFile(null)
//     setUploadError('')
//   }

//   const handleFileSelect = (file) => {
//     setUploadError('')
//     if (!file) {
//       setSelectedFile(null)
//       return
//     }

//     const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
//     if (!isPdf) {
//       const message = 'Please select a PDF file.'
//       setSelectedFile(null)
//       setUploadError(message)
//       toast.error(message)
//       return
//     }

//     setSelectedFile(file)
//   }

//   const handleUpload = async () => {
//     if (!selectedFile || uploading) return

//     setUploading(true)
//     setUploadError('')
//     try {
//       const formData = new FormData()
//       formData.append('file', selectedFile)

//       await authApi.post(BARE_ACTS_API.upload, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         timeout: 120000,
//       })

//       toast.success('Bare Act uploaded successfully.')
//       closeUploadDialog(true)
//       await fetchBareActs()
//     } catch (error) {
//       const message = getApiErrorMessage(error, 'Upload failed. Please try again.')
//       setUploadError(message)
//       toast.error(message)
//     } finally {
//       setUploading(false)
//     }
//   }

//   const handleViewAct = async (act) => {
//     if (!act?.id) {
//       toast.error('This Bare Act is missing its file reference.')
//       return
//     }

//     try {
//       const { data } = await authApi.get(`/bare-acts/${act.id}/view`, { responseType: 'blob' })
//       const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
//       window.open(url, '_blank', 'noopener,noreferrer')
//       setTimeout(() => URL.revokeObjectURL(url), 60000)
//     } catch (error) {
//       toast.error(getApiErrorMessage(error, 'Could not open this Bare Act.'))
//     }
//   }

//   const handleDownloadAct = async (act) => {
//     if (!act?.id) {
//       toast.error('This Bare Act is missing its file reference.')
//       return
//     }

//     try {
//       const { data } = await authApi.get(`/bare-acts/${act.id}/download`, { responseType: 'blob' })
//       const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
//       const link = document.createElement('a')
//       link.href = url
//       link.download = act.filename || `${sanitizeFileName(act.title || 'bare-act')}.pdf`
//       document.body.appendChild(link)
//       link.click()
//       link.remove()
//       URL.revokeObjectURL(url)
//     } catch (error) {
//       toast.error(getApiErrorMessage(error, 'Could not download this Bare Act.'))
//     }
//   }

//   const handleDeleteAct = async (act) => {
//     if (!act?.id) {
//       toast.error('This Bare Act is missing its file reference.')
//       return
//     }

//     setDeleteMenuAct(null)
//     const confirmed = window.confirm(`Delete "${act.title || 'this Bare Act'}"?`)
//     if (!confirmed) return

//     try {
//       await authApi.delete(`/bare-acts/${act.id}`)
//       toast.success('Bare Act deleted successfully.')
//       await fetchBareActs()
//     } catch (error) {
//       toast.error(getApiErrorMessage(error, 'Could not delete this Bare Act.'))
//     }
//   }

//   const clearFilters = () => {
//     setQuery('')
//     setCategory('All Categories')
//     setJurisdiction('All Jurisdictions')
//     setStatus('All Status')
//   }

//   return (
//     <div className="bare-page animate-fade-up">
//       <Toaster position="top-right" />
//       <div className="bare-header">
//         <div>
//           <h1>Bare Acts</h1>
//           <p>Access, manage and refer to Bare Acts for legal drafting.</p>
//         </div>
//         <div className="bare-header-actions">
//           <button className="bare-icon-btn" type="button" title="Help" onClick={() => window.location.href = 'mailto:customersupport@legalone.cc'}>
//             <HelpCircle size={17} />
//           </button>
//           <button className="bare-icon-btn" type="button" title={darkMode ? 'Light Mode' : 'Dark Mode'} onClick={() => setDarkMode(value => !value)}>
//             {darkMode ? <Sun size={17} /> : <Moon size={17} />}
//           </button>
//           <div className="bare-profile-wrap" ref={profileRef}>
//             <button className="bare-icon-btn" type="button" title="Profile" onClick={() => setShowProfile(value => !value)}>
//               {isLoggedIn ? (
//                 <span className="bare-profile-initial">{advocate?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
//               ) : (
//                 <User size={17} />
//               )}
//             </button>
//             {showProfile && (
//               <ProfileDropdown
//                 advocate={advocate}
//                 isLoggedIn={isLoggedIn}
//                 onProfile={() => { setShowProfile(false); navigate('/profile') }}
//                 onLogout={() => { setShowProfile(false); logout(); navigate('/') }}
//                 onLogin={() => { setShowProfile(false); navigate('/login') }}
//                 onRegister={() => { setShowProfile(false); navigate('/signup') }}
//               />
//             )}
//           </div>
//           <button className="bare-primary" type="button" onClick={openUploadDialog}>
//             <UploadCloud size={15} />
//             Upload New Act
//           </button>
//           <button className="bare-filter-btn" type="button" onClick={() => setShowFilters(value => !value)} aria-pressed={showFilters}>
//             <Filter size={15} />
//             Filters
//           </button>
//         </div>
//       </div>

//       {showFilters && <section className="bare-toolbar" aria-label="Bare Acts search and filters">
//         <label className="bare-search">
//           <Search size={16} />
//           <input
//             placeholder="Search acts by title, year or keyword..."
//             value={query}
//             onChange={e => setQuery(e.target.value)}
//           />
//         </label>
//         <Select value={category} onChange={setCategory} options={categoryOptions} />
//         <Select value={jurisdiction} onChange={setJurisdiction} options={jurisdictionOptions} />
//         <Select value={status} onChange={setStatus} options={statusOptions} />
//         {/* <button className="bare-filter-btn bare-clear-btn" type="button" onClick={clearFilters}>
//           Clear
//         </button> */}
//       </section>}

//       <section className="bare-stats" aria-label="Bare Acts statistics">
//         {stats.map(({ label, value, detail, icon: Icon, tone }) => (
//           <div className="bare-stat-card" key={label}>
//             <div className={`bare-stat-icon ${tone}`}>
//               <Icon size={18} />
//             </div>
//             <div>
//               <p>{label}</p>
//               <strong>{value.toLocaleString('en-IN')}</strong>
//               <span>{detail}</span>
//             </div>
//           </div>
//         ))}
//       </section>

//       <section className="bare-table-card">
//         {pageError && <div className="bare-error">{pageError}</div>}
//         <div className="bare-table-scroll">
//           <table className="bare-table">
//             <thead>
//               <tr>
//                 <th>Act Title</th>
//                 <th>Category</th>
//                 <th>Jurisdiction</th>
//                 <th>Year</th>
//                 <th>Sections</th>
//                 <th>Status</th>
//                 <th>Last Updated</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {!loading && filtered.map(act => (
//                 <tr key={act.id || act.title}>
//                   <td>
//                     <div className="bare-title-cell">
//                       <FileText size={15} />
//                       <div>
//                         <strong>{act.title}</strong>
//                         {act.description && <span>{act.description}</span>}
//                       </div>
//                     </div>
//                   </td>
//                   <td><CategoryBadge value={act.category} /></td>
//                   <td>{act.jurisdiction}</td>
//                   <td>{act.year}</td>
//                   <td>{act.sectionsCount}</td>
//                   <td><StatusBadge status={act.status} /></td>
//                   <td>{act.lastUpdated}</td>
//                   <td>
//                     <ActionMenu
//   act={act}
//   onView={handleViewAct}
//   onDownload={handleDownloadAct}
//   onDelete={handleDeleteAct}
// />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {loading && (
//           <div className="bare-empty">
//             <div className="bare-empty-icon"><FileText size={30} /></div>
//             <h2>Loading Bare Acts...</h2>
//             <p>Please wait while the latest Bare Acts are fetched.</p>
//           </div>
//         )}

//         {!loading && filtered.length === 0 && (
//           <div className="bare-empty">
//             <div className="bare-empty-icon"><BookOpen size={30} /></div>
//             <h2>No Bare Acts available yet.</h2>
//             <p>Upload your first Bare Act to begin indexing statutes for legal drafting.</p>
//           </div>
//         )}

//         <div className="bare-pagination">
//           <p>Showing {filtered.length ? 1 : 0} to {filtered.length} of {rows.length} acts</p>
//           <div>
//             <button type="button" disabled aria-label="Previous page">‹</button>
//             <button type="button" className="active">1</button>
//             <button type="button" disabled aria-label="Next page">›</button>
//           </div>
//         </div>
//       </section>

//       <section className="bare-upload-card">
//         <div className="bare-upload-icon"><UploadCloud size={28} /></div>
//         <div>
//           <h2>Upload New Bare Act</h2>
//           <p>Upload PDF Bare Acts. The system extracts metadata, indexes sections, and makes the Act available for legal drafting.</p>
//           <span>Supported: PDF</span>
//         </div>
//         <button className="bare-primary" type="button" onClick={openUploadDialog}>
//           Upload Act
//         </button>
//       </section>

//       {uploadOpen && (
//         <div className="bare-modal-backdrop" role="presentation" onMouseDown={() => closeUploadDialog()}>
//           <div className="bare-modal" role="dialog" aria-modal="true" aria-labelledby="bare-upload-title" onMouseDown={e => e.stopPropagation()}>
//             <div className="bare-modal-header">
//               <div>
//                 <h2 id="bare-upload-title">Upload New Bare Act</h2>
//                 <p>Select a PDF file to upload and index it for legal drafting.</p>
//               </div>
//               <button type="button" className="bare-close-btn" onClick={() => closeUploadDialog()} aria-label="Close upload dialog">
//                 <X size={18} />
//               </button>
//             </div>
//             <label className="bare-file-drop">
//               <UploadCloud size={34} />
//               <strong>{selectedFile ? selectedFile.name : 'Choose a PDF file'}</strong>
//               <span>PDF only</span>
//               <input
//                 type="file"
//                 accept="application/pdf,.pdf"
//                 onChange={e => handleFileSelect(e.target.files?.[0] || null)}
//               />
//             </label>
//             {uploadError && <div className="bare-error bare-upload-error">{uploadError}</div>}
//             <div className="bare-modal-actions">
//               <button type="button" className="bare-filter-btn" onClick={closeUploadDialog} disabled={uploading}>Cancel</button>
//               <button type="button" className="bare-primary" disabled={!selectedFile || uploading} onClick={handleUpload}>
//                 {uploading ? 'Uploading...' : 'Upload Act'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

       

//       <style>{`
//         .bare-page {
//           max-width: 1280px;
//           margin: -8px auto 0;
//           color: var(--text-primary);
//         }
//         .bare-header {
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 18px;
//           margin-bottom: 24px;
//         }
//         .bare-header h1 {
//           margin: 0 0 4px;
//           font-size: 26px;
//           line-height: 1.2;
//           font-weight: 800;
//           letter-spacing: 0;
//           color: var(--text-primary);
//         }
//         .bare-header p {
//           color: var(--text-muted);
//           font-size: 13px;
//         }
//         .bare-header-actions {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           flex-wrap: wrap;
//           justify-content: flex-end;
//         }
//         .bare-icon-btn {
//           display: inline-grid;
//           width: 38px;
//           height: 38px;
//           place-items: center;
//           border: 1px solid var(--border);
//           border-radius: 999px;
//           background: var(--bg-primary);
//           color: var(--text-muted);
//           cursor: pointer;
//           transition: background .18s, color .18s, border-color .18s, box-shadow .18s;
//         }
//         .bare-icon-btn:hover {
//           border-color: var(--border-light);
//           background: var(--bg-card);
//           color: var(--text-primary);
//           box-shadow: 0 4px 14px rgba(0,0,0,.08);
//         }
//         .bare-profile-wrap {
//           position: relative;
//         }
//         .bare-profile-initial {
//           display: grid;
//           width: 24px;
//           height: 24px;
//           place-items: center;
//           border-radius: 999px;
//           background: var(--accent);
//           color: var(--bg-primary);
//           font-size: 10px;
//           font-weight: 800;
//         }
//         .bare-profile-menu {
//           position: absolute;
//           top: calc(100% + 8px);
//           right: 0;
//           z-index: 220;
//           width: 240px;
//           overflow: hidden;
//           border: 1px solid var(--border);
//           border-radius: 12px;
//           background: var(--bg-primary);
//           box-shadow: 0 16px 40px rgba(0,0,0,.14);
//         }
//         .bare-profile-card {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           padding: 15px;
//           border-bottom: 1px solid var(--border);
//         }
//         .bare-profile-card strong {
//           display: block;
//           overflow: hidden;
//           color: var(--text-primary);
//           font-size: 13px;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }
//         .bare-profile-card span {
//           display: block;
//           overflow: hidden;
//           margin-top: 2px;
//           color: var(--text-muted);
//           font-size: 11.5px;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }
//         .bare-profile-menu-actions {
//           padding: 6px;
//         }
//         .bare-profile-menu-actions button {
//           display: flex;
//           align-items: center;
//           gap: 9px;
//           width: 100%;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: var(--text-secondary);
//           font-size: 13px;
//           font-weight: 600;
//           text-align: left;
//           cursor: pointer;
//         }
//         .bare-profile-menu-actions button:hover {
//           background: var(--bg-card);
//           color: var(--text-primary);
//         }
//         .bare-profile-menu-actions .danger {
//           color: var(--error);
//         }
//         .bare-primary,
//         .bare-filter-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           min-height: 38px;
//           padding: 0 14px;
//           border-radius: 7px;
//           font-size: 12px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: transform .18s, box-shadow .18s, border-color .18s, background .18s;
//         }
//         .bare-primary {
//           border: 1px solid var(--accent);
//           background: var(--accent);
//           color: var(--bg-primary);
//           box-shadow: 0 6px 16px rgba(0,0,0,.12);
//         }
//         .bare-filter-btn {
//           border: 1px solid var(--border);
//           background: var(--bg-primary);
//           color: var(--text-secondary);
//         }
//         .bare-primary:hover:not(:disabled),
//         .bare-filter-btn:hover:not(:disabled) {
//           transform: translateY(-1px);
//           box-shadow: 0 8px 20px rgba(0,0,0,.1);
//         }
//         .bare-primary:disabled,
//         .bare-filter-btn:disabled {
//           opacity: .56;
//           cursor: not-allowed;
//           transform: none;
//         }
//         .bare-toolbar {
//           display: grid;
//           grid-template-columns: minmax(260px, 1.65fr) repeat(3, minmax(145px, .8fr)) auto;
//           gap: 12px;
//           margin-bottom: 16px;
//         }
//         .bare-search,
//         .bare-select {
//           display: flex;
//           align-items: center;
//           height: 42px;
//           border: 1px solid var(--border);
//           border-radius: 7px;
//           background: var(--bg-primary);
//           color: var(--text-muted);
//           box-shadow: 0 1px 2px rgba(0,0,0,.025);
//         }
//         .bare-search {
//           gap: 10px;
//           padding: 0 14px;
//         }
//         .bare-search input,
//         .bare-select select {
//           width: 100%;
//           min-width: 0;
//           border: 0;
//           outline: 0;
//           background: transparent;
//           color: var(--text-primary);
//           font: 13px/1 Inter, system-ui, sans-serif;
//         }
//         .bare-search input::placeholder { color: var(--text-muted); }
//         .bare-select {
//           position: relative;
//           padding: 0 13px;
//         }
//         .bare-select select {
//           appearance: none;
//           cursor: pointer;
//           padding-right: 24px;
//         }
//         .bare-select svg {
//           position: absolute;
//           right: 12px;
//           pointer-events: none;
//         }
//         .bare-clear-btn {
//           min-width: 78px;
//         }
//         .bare-search:focus-within,
//         .bare-select:focus-within {
//           border-color: var(--accent);
//           box-shadow: 0 0 0 3px rgba(10,10,10,.06);
//         }
//         .bare-stats {
//           display: grid;
//           grid-template-columns: repeat(4, minmax(0, 1fr));
//           margin-bottom: 16px;
//           border: 1px solid var(--border);
//           border-radius: 7px;
//           background: var(--bg-primary);
//           box-shadow: 0 1px 3px rgba(0,0,0,.03);
//           overflow: hidden;
//         }
//         .bare-stat-card {
//           display: flex;
//           align-items: center;
//           gap: 14px;
//           min-height: 84px;
//           padding: 18px 22px;
//           border-right: 1px solid var(--border);
//           transition: background .18s;
//         }
//         .bare-stat-card:last-child { border-right: 0; }
//         .bare-stat-card:hover { background: var(--bg-card); }
//         .bare-stat-icon {
//           display: grid;
//           width: 34px;
//           height: 34px;
//           place-items: center;
//           border-radius: 999px;
//           flex: 0 0 auto;
//         }
//         .bare-stat-icon.purple { background: rgba(147, 51, 234, .1); color: #9333ea; }
//         .bare-stat-icon.green { background: rgba(34, 197, 94, .1); color: var(--success); }
//         .bare-stat-icon.amber { background: rgba(245, 158, 11, .12); color: var(--warning); }
//         .bare-stat-icon.blue { background: rgba(59, 130, 246, .1); color: var(--info); }
//         .bare-stat-card p {
//           margin: 0 0 2px;
//           color: var(--text-secondary);
//           font-size: 11px;
//           font-weight: 700;
//         }
//         .bare-stat-card strong {
//           display: block;
//           color: var(--text-primary);
//           font-size: 21px;
//           line-height: 1.1;
//           font-weight: 800;
//         }
//         .bare-stat-card span {
//           color: var(--text-muted);
//           font-size: 11px;
//         }
//         .bare-table-card {
//           border: 1px solid var(--border);
//           border-radius: 7px;
//           background: var(--bg-primary);
//           box-shadow: 0 1px 3px rgba(0,0,0,.035);
//           overflow: visible;
//         }
//         .bare-table-scroll {
//           overflow-x: auto;
//           border-radius: 7px 7px 0 0;
//         }
//         .bare-table {
//           width: 100%;
//           min-width: 940px;
//           border-collapse: collapse;
//           text-align: left;
//         }
//         .bare-table th {
//           padding: 13px 18px;
//           border-bottom: 1px solid var(--border);
//           color: var(--text-secondary);
//           background: var(--bg-primary);
//           font-size: 11px;
//           font-weight: 800;
//           white-space: nowrap;
//         }
//         .bare-table td {
//           padding: 13px 18px;
//           border-bottom: 1px solid var(--border);
//           color: var(--text-secondary);
//           font-size: 12px;
//           vertical-align: middle;
//         }
//         .bare-table tbody tr:hover td { background: var(--bg-card); }
//         .bare-title-cell {
//           display: flex;
//           align-items: flex-start;
//           gap: 10px;
//           min-width: 260px;
//         }
//         .bare-title-cell svg {
//           margin-top: 3px;
//           color: var(--text-secondary);
//           flex: 0 0 auto;
//         }
//         .bare-title-cell strong {
//           display: block;
//           color: var(--text-primary);
//           font-size: 12.5px;
//           font-weight: 750;
//           line-height: 1.35;
//         }
//         .bare-title-cell span {
//           display: block;
//           margin-top: 2px;
//           color: var(--text-muted);
//           font-size: 11px;
//         }
//         .bare-category,
//         .bare-status {
//           display: inline-flex;
//           align-items: center;
//           border-radius: 999px;
//           padding: 4px 9px;
//           font-size: 10.5px;
//           font-weight: 750;
//           white-space: nowrap;
//         }
//         .bare-category {
//           background: rgba(59,130,246,.1);
//           color: var(--info);
//         }
//         .bare-status.active {
//           background: rgba(34,197,94,.1);
//           color: var(--success);
//         }
//         .bare-status.inactive {
//           background: rgba(115,115,115,.12);
//           color: var(--text-secondary);
//         }
//         .bare-status.archived {
//           background: rgba(239,68,68,.1);
//           color: var(--error);
//         }
//         .bare-actions {
//           position: relative;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }
//         .bare-actions button,
//         .bare-pagination button,
//         .bare-close-btn {
//           display: inline-grid;
//           place-items: center;
//           width: 30px;
//           height: 30px;
//           border: 1px solid var(--border);
//           border-radius: 7px;
//           background: var(--bg-primary);
//           color: var(--text-secondary);
//           cursor: pointer;
//           transition: background .16s, color .16s, border-color .16s;
//         }
//         .bare-actions button:hover:not(:disabled),
//         .bare-pagination button:hover:not(:disabled),
//         .bare-close-btn:hover {
//           border-color: var(--border-light);
//           background: var(--bg-card);
//           color: var(--text-primary);
//         }
//         .bare-actions button.danger:hover:not(:disabled) {
//           border-color: rgba(239,68,68,.28);
//           background: rgba(239,68,68,.08);
//           color: var(--error);
//         }
//         .bare-pagination button:disabled {
//           opacity: .45;
//           cursor: not-allowed;
//         }
//         .bare-more-wrap {
//           position: relative;
//         }
//         .bare-delete-backdrop {
//           position: fixed;
//           inset: 0;
//           z-index: 500;
//           display: grid;
//           place-items: center;
//           background: rgba(0,0,0,.12);
//         }
//         .bare-delete-popup {
//           min-width: 180px;
//           padding: 6px;
//           border: 1px solid var(--border);
//           border-radius: 10px;
//           background: var(--bg-primary);
//           box-shadow: 0 14px 34px rgba(0,0,0,.14);
//         }
//         .bare-delete-popup button {
//           display: flex;
//           align-items: center;
//           justify-content: flex-start;
//           width: 100%;
//           height: auto;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: var(--text-secondary);
//           font-size: 12px;
//           font-weight: 650;
//           text-align: left;
//           cursor: pointer;
//         }
//         .bare-delete-popup button.danger {
//           color: var(--error);
//         }
//         .bare-delete-popup button.danger:hover {
//           background: rgba(239,68,68,.08);
//           color: var(--error);
//         }
//         .bare-empty {
//           display: grid;
//           place-items: center;
//           gap: 8px;
//           padding: 54px 20px;
//           color: var(--text-muted);
//           text-align: center;
//           border-bottom: 1px solid var(--border);
//         }
//         .bare-error {
//           margin: 14px 18px 0;
//           padding: 10px 12px;
//           border: 1px solid rgba(239,68,68,.22);
//           border-radius: 8px;
//           background: rgba(239,68,68,.08);
//           color: var(--error);
//           font-size: 12px;
//           font-weight: 600;
//         }
//         .bare-upload-error {
//           margin: 12px 0 0;
//         }
//         .bare-empty-icon {
//           display: grid;
//           width: 62px;
//           height: 62px;
//           place-items: center;
//           border-radius: 16px;
//           background: var(--bg-card);
//           color: var(--text-secondary);
//           margin-bottom: 4px;
//         }
//         .bare-empty h2 {
//           margin: 0;
//           color: var(--text-primary);
//           font-size: 15px;
//           font-weight: 800;
//         }
//         .bare-empty p {
//           max-width: 420px;
//           margin: 0;
//           color: var(--text-muted);
//           font-size: 12.5px;
//         }
//         .bare-pagination {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 12px 18px;
//         }
//         .bare-pagination p {
//           margin: 0;
//           color: var(--text-muted);
//           font-size: 12px;
//         }
//         .bare-pagination div {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//         .bare-pagination button.active {
//           background: var(--accent);
//           border-color: var(--accent);
//           color: var(--bg-primary);
//         }
//         .bare-upload-card {
//           display: grid;
//           grid-template-columns: auto 1fr auto;
//           align-items: center;
//           gap: 18px;
//           margin-top: 14px;
//           padding: 22px;
//           border: 1px dashed var(--border-light);
//           border-radius: 7px;
//           background: var(--bg-primary);
//         }
//         .bare-upload-icon {
//           display: grid;
//           width: 58px;
//           height: 58px;
//           place-items: center;
//           border-radius: 999px;
//           background: var(--bg-card);
//           color: var(--text-secondary);
//         }
//         .bare-upload-card h2,
//         .bare-modal h2 {
//           margin: 0 0 4px;
//           color: var(--text-primary);
//           font-size: 14px;
//           font-weight: 800;
//         }
//         .bare-upload-card p,
//         .bare-modal p {
//           margin: 0 0 6px;
//           color: var(--text-secondary);
//           font-size: 12px;
//         }
//         .bare-upload-card span {
//           display: inline-block;
//           margin-right: 16px;
//           color: var(--text-muted);
//           font-size: 11.5px;
//         }
//         .bare-modal-backdrop {
//           position: fixed;
//           inset: 0;
//           z-index: 300;
//           display: grid;
//           place-items: center;
//           padding: 18px;
//           background: rgba(0,0,0,.38);
//           backdrop-filter: blur(2px);
//         }
//         .bare-modal {
//           width: min(520px, 100%);
//           border: 1px solid var(--border);
//           border-radius: 12px;
//           background: var(--bg-primary);
//           box-shadow: 0 24px 70px rgba(0,0,0,.25);
//           padding: 20px;
//         }
//         .bare-modal-header {
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 14px;
//           margin-bottom: 16px;
//         }
//         .bare-file-drop {
//           display: grid;
//           place-items: center;
//           gap: 7px;
//           min-height: 170px;
//           padding: 24px;
//           border: 1px dashed var(--border-light);
//           border-radius: 10px;
//           background: var(--bg-secondary);
//           color: var(--text-secondary);
//           text-align: center;
//           cursor: pointer;
//         }
//         .bare-file-drop strong {
//           max-width: 100%;
//           overflow: hidden;
//           color: var(--text-primary);
//           font-size: 13px;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }
//         .bare-file-drop span {
//           color: var(--text-muted);
//           font-size: 12px;
//         }
//         .bare-file-drop input {
//           position: absolute;
//           width: 1px;
//           height: 1px;
//           opacity: 0;
//           pointer-events: none;
//         }
//         .bare-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           margin-top: 16px;
//         }
//         @media (max-width: 1100px) {
//           .bare-toolbar { grid-template-columns: 1fr 1fr; }
//           .bare-search { grid-column: span 2; }
//           .bare-clear-btn { width: 100%; }
//           .bare-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
//           .bare-stat-card:nth-child(2) { border-right: 0; }
//           .bare-stat-card:nth-child(-n+2) { border-bottom: 1px solid var(--border); }
//         }
//         @media (max-width: 720px) {
//           .bare-header,
//           .bare-pagination,
//           .bare-upload-card {
//             align-items: stretch;
//             grid-template-columns: 1fr;
//             flex-direction: column;
//           }
//           .bare-header-actions { justify-content: flex-start; }
//           .bare-toolbar,
//           .bare-stats {
//             grid-template-columns: 1fr;
//           }
//           .bare-search { grid-column: auto; }
//           .bare-stat-card,
//           .bare-stat-card:nth-child(2) {
//             border-right: 0;
//             border-bottom: 1px solid var(--border);
//           }
//           .bare-stat-card:last-child { border-bottom: 0; }
//           .bare-upload-card .bare-primary { width: 100%; }
//           .bare-modal-actions { flex-direction: column-reverse; }
//           .bare-modal-actions button { width: 100%; }
//         }
//       `}</style>
//     </div>
//   )
// }

// function Select({ value, onChange, options }) {
//   return (
//     <label className="bare-select">
//       <select value={value} onChange={e => onChange(e.target.value)}>
//         {options.map(option => <option key={option} value={option}>{option}</option>)}
//       </select>
//       <ChevronDown size={15} />
//     </label>
//   )
// }

// function CategoryBadge({ value }) {
//   return <span className="bare-category">{value}</span>
// }

// function StatusBadge({ status }) {
//   return <span className={`bare-status ${status.toLowerCase()}`}>{status}</span>
// }

// function extractActs(data) {
//   if (Array.isArray(data)) return data
//   if (Array.isArray(data?.acts)) return data.acts
//   if (Array.isArray(data?.bareActs)) return data.bareActs
//   if (Array.isArray(data?.bare_acts)) return data.bare_acts
//   if (Array.isArray(data?.data)) return data.data
//   return []
// }

// function getApiErrorMessage(error, fallback) {
//   if (error.message && !error.response) return error.message
//   if (!error.response) return 'Network error. Please check your connection and try again.'

//   const detail = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error
//   if (Array.isArray(detail)) return detail.map(item => item.msg || item.message || String(item)).join(', ')
//   if (typeof detail === 'string') return detail

//   return fallback
// }

// function formatDate(value) {
//   if (!value) return '-'

//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return value

//   return date.toLocaleDateString('en-IN', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   })
// }

// function isRecentlyAdded(value) {
//   if (!value) return false

//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return false

//   const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
//   return date.getTime() >= thirtyDaysAgo
// }

// function sanitizeFileName(value) {
//   return String(value).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'bare-act'
// }

// function ProfileDropdown({ advocate, isLoggedIn, onProfile, onLogout, onLogin, onRegister }) {
//   return (
//     <div className="bare-profile-menu">
//       {isLoggedIn ? (
//         <>
//           <div className="bare-profile-card">
//             <span className="bare-profile-initial">{advocate?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
//             <div style={{ minWidth: 0 }}>
//               <strong>Adv. {advocate?.name || 'Advocate'}</strong>
//               <span>{advocate?.email || ''}</span>
//             </div>
//           </div>
//           <div className="bare-profile-menu-actions">
//             <button type="button" onClick={onProfile}>
//               <Settings size={14} /> Settings & Profile
//             </button>
//             <button type="button" className="danger" onClick={onLogout}>
//               <LogOut size={14} /> Sign Out
//             </button>
//           </div>
//         </>
//       ) : (
//         <div className="bare-profile-menu-actions">
//           <button type="button" onClick={onLogin}>
//             <User size={14} /> Sign In
//           </button>
//           <button type="button" onClick={onRegister}>
//             <Settings size={14} /> Create Account
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// function ActionMenu({ act, onView, onDownload, onDelete }) {
//   const [open, setOpen] = useState(false)
//   const wrapRef = useRef(null)

//   useEffect(() => {
//     if (!open) return
//     const handler = (e) => {
//       if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [open])

//   const view = () => onView(act)
//   const download = () => onDownload(act)
//   const remove = () => {
//     setOpen(false)
//     onDelete(act)
//   }

//   return (
//     <div className="bare-actions">
//       <button type="button" title="View" onClick={view}>
//         <Eye size={14} />
//       </button>
//       <button type="button" title="Download" onClick={download}>
//         <Download size={14} />
//       </button>
//       <div className="bare-more-wrap" ref={wrapRef}>
//         <button
//           type="button"
//           title="More actions"
//           aria-label="More actions"
//           onClick={() => setOpen(v => !v)}
//         >
//           <MoreVertical size={14} />
//         </button>
//         {open && (
//           <div className="bare-more-menu" role="menu" aria-label="Bare Act actions">
//             <button type="button" className="danger" role="menuitem" onClick={remove}>
//               Delete
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }





import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  LogOut,
  MoreVertical,
  Moon,
  Search,
  Settings,
  Sun,
  UploadCloud,
  User,
  X,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INITIAL_ACTS = []
const BARE_ACTS_API = {
  list: '/bare-acts',
  stats: '/bare-acts/stats',
  upload: '/bare-acts/upload',
}

function getActId(act) {
  return act?.id ?? act?._id ?? act?.actId ?? act?.act_id ?? null
}

export default function ReferencePage() {
  const { advocate, isLoggedIn, logout, authApi } = useAuth()
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [acts, setActs] = useState(INITIAL_ACTS)
  const [apiStats, setApiStats] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [jurisdiction, setJurisdiction] = useState('All Jurisdictions')
  const [status, setStatus] = useState('All Status')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pageError, setPageError] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('legalDark') === 'true')
  const [showProfile, setShowProfile] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchBareActs = async () => {
    setLoading(true)
    setPageError('')
    try {
      const [{ data: listData }, statsResult] = await Promise.all([
        authApi.get(BARE_ACTS_API.list),
        authApi.get(BARE_ACTS_API.stats).catch(() => ({ data: null })),
      ])
      setActs(extractActs(listData))
      setApiStats(statsResult.data)
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load Bare Acts.')
      setPageError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBareActs()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('legalDark', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const rows = useMemo(() => acts.map(act => ({
    ...act,
    id: getActId(act),
    title: act.title || act.name || act.act_title || act.actTitle || '',
    category: act.category || '-',
    jurisdiction: act.jurisdiction || '-',
    year: act.year || '-',
    sectionsCount: act.sectionsCount || act.sections_count || act.totalSections || act.total_sections || act.sections?.length || 0,
    status: act.status || 'Inactive',
    lastUpdated: formatDate(act.lastUpdated || act.updatedAt || act.updated_at),
  })), [acts])

  const categoryOptions = useMemo(() => ['All Categories', ...new Set(rows.map(act => act.category).filter(value => value && value !== '-'))], [rows])
  const jurisdictionOptions = useMemo(() => ['All Jurisdictions', ...new Set(rows.map(act => act.jurisdiction).filter(value => value && value !== '-'))], [rows])
  const statusOptions = useMemo(() => ['All Status', ...new Set(rows.map(act => act.status).filter(Boolean))], [rows])

  const filtered = rows.filter(act => {
    const searchText = `${act.title} ${act.category} ${act.jurisdiction} ${act.year} ${act.status}`.toLowerCase()

    return (
      (!query || searchText.includes(query.toLowerCase())) &&
      (category === 'All Categories' || act.category === category) &&
      (jurisdiction === 'All Jurisdictions' || act.jurisdiction === jurisdiction) &&
      (status === 'All Status' || act.status === status)
    )
  })

  const stats = [
    { label: 'Total Acts', value: apiStats?.totalActs ?? apiStats?.total_acts ?? rows.length, detail: 'Uploaded', icon: FileText, tone: 'purple' },
    { label: 'Active Acts', value: apiStats?.activeActs ?? apiStats?.active_acts ?? rows.filter(act => act.status?.toLowerCase() === 'active').length, detail: 'Ready to use', icon: CheckCircle2, tone: 'green' },
    { label: 'Recently Added', value: apiStats?.recentlyAdded ?? apiStats?.recently_added ?? rows.filter(act => isRecentlyAdded(act.createdAt || act.uploadedAt || act.lastUpdated)).length, detail: 'In last 30 days', icon: Clock3, tone: 'amber' },
    { label: 'Total Sections Indexed', value: apiStats?.totalSectionsIndexed ?? apiStats?.total_sections_indexed ?? rows.reduce((sum, act) => sum + act.sectionsCount, 0), detail: 'Across all acts', icon: BookOpen, tone: 'blue' },
  ]

  const openUploadDialog = () => setUploadOpen(true)
  const closeUploadDialog = (force = false) => {
    if (uploading && !force) return
    setUploadOpen(false)
    setSelectedFile(null)
    setUploadError('')
  }

  const handleFileSelect = (file) => {
    setUploadError('')
    if (!file) {
      setSelectedFile(null)
      return
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      const message = 'Please select a PDF file.'
      setSelectedFile(null)
      setUploadError(message)
      toast.error(message)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      await authApi.post(BARE_ACTS_API.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })

      toast.success('Bare Act uploaded successfully.')
      closeUploadDialog(true)
      await fetchBareActs()
    } catch (error) {
      const message = getApiErrorMessage(error, 'Upload failed. Please try again.')
      setUploadError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleViewAct = async (act) => {
    const id = getActId(act)
    if (!id) {
      toast.error('This Bare Act is missing its file reference.')
      return
    }

    try {
      const { data } = await authApi.get(`/bare-acts/${id}/view`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not open this Bare Act.'))
    }
  }

  const handleDownloadAct = async (act) => {
    const id = getActId(act)
    if (!id) {
      toast.error('This Bare Act is missing its file reference.')
      return
    }

    try {
      const { data } = await authApi.get(`/bare-acts/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = act.filename || `${sanitizeFileName(act.title || 'bare-act')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not download this Bare Act.'))
    }
  }

  const handleDeleteAct = async (act) => {
    const id = getActId(act)
    if (!id) {
      toast.error('This Bare Act is missing its file reference.')
      return
    }

    const confirmed = window.confirm(`Delete "${act.title || 'this Bare Act'}"?`)
    if (!confirmed) return

    setDeletingId(id)
    try {
      await authApi.delete(`/bare-acts/${id}`)
      toast.success('Bare Act deleted successfully.')
      // Optimistically remove from local state so the row disappears immediately
      setActs(prev => prev.filter(a => getActId(a) !== id))
      // Then re-sync with the server
      await fetchBareActs()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(getApiErrorMessage(error, 'Could not delete this Bare Act.'))
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => {
    setQuery('')
    setCategory('All Categories')
    setJurisdiction('All Jurisdictions')
    setStatus('All Status')
  }

  return (
    <div className="bare-page animate-fade-up">
      <Toaster position="top-right" />
      <div className="bare-header">
        <div>
          <h1>Bare Acts</h1>
          <p>Access, manage and refer to Bare Acts for legal drafting.</p>
        </div>
        <div className="bare-header-actions">
          <button className="bare-icon-btn" type="button" title="Help" onClick={() => window.location.href = 'mailto:customersupport@legalone.cc'}>
            <HelpCircle size={17} />
          </button>
          <button className="bare-icon-btn" type="button" title={darkMode ? 'Light Mode' : 'Dark Mode'} onClick={() => setDarkMode(value => !value)}>
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div className="bare-profile-wrap" ref={profileRef}>
            <button className="bare-icon-btn" type="button" title="Profile" onClick={() => setShowProfile(value => !value)}>
              {isLoggedIn ? (
                <span className="bare-profile-initial">{advocate?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              ) : (
                <User size={17} />
              )}
            </button>
            {showProfile && (
              <ProfileDropdown
                advocate={advocate}
                isLoggedIn={isLoggedIn}
                onProfile={() => { setShowProfile(false); navigate('/profile') }}
                onLogout={() => { setShowProfile(false); logout(); navigate('/') }}
                onLogin={() => { setShowProfile(false); navigate('/login') }}
                onRegister={() => { setShowProfile(false); navigate('/signup') }}
              />
            )}
          </div>
          <button className="bare-primary" type="button" onClick={openUploadDialog}>
            <UploadCloud size={15} />
            Upload New Act
          </button>
          <button className="bare-filter-btn" type="button" onClick={() => setShowFilters(value => !value)} aria-pressed={showFilters}>
            <Filter size={15} />
            Filters
          </button>
        </div>
      </div>

      {showFilters && <section className="bare-toolbar" aria-label="Bare Acts search and filters">
        <label className="bare-search">
          <Search size={16} />
          <input
            placeholder="Search acts by title, year or keyword..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <Select value={category} onChange={setCategory} options={categoryOptions} />
        <Select value={jurisdiction} onChange={setJurisdiction} options={jurisdictionOptions} />
        <Select value={status} onChange={setStatus} options={statusOptions} />
        {/* <button className="bare-filter-btn bare-clear-btn" type="button" onClick={clearFilters}>
          Clear
        </button> */}
      </section>}

      <section className="bare-stats" aria-label="Bare Acts statistics">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <div className="bare-stat-card" key={label}>
            <div className={`bare-stat-icon ${tone}`}>
              <Icon size={18} />
            </div>
            <div>
              <p>{label}</p>
              <strong>{value.toLocaleString('en-IN')}</strong>
              <span>{detail}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="bare-table-card">
        {pageError && <div className="bare-error">{pageError}</div>}
        <div className="bare-table-scroll">
          <table className="bare-table">
            <thead>
              <tr>
                <th>Act Title</th>
                <th>Category</th>
                <th>Jurisdiction</th>
                <th>Year</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map(act => (
                <tr key={act.id || act.title}>
                  <td>
                    <div className="bare-title-cell">
                      <FileText size={15} />
                      <div>
                        <strong>{act.title}</strong>
                        {act.description && <span>{act.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td><CategoryBadge value={act.category} /></td>
                  <td>{act.jurisdiction}</td>
                  <td>{act.year}</td>
                  <td>{act.sectionsCount}</td>
                  <td><StatusBadge status={act.status} /></td>
                  <td>{act.lastUpdated}</td>
                  <td>
                    <ActionMenu
                      act={act}
                      onView={handleViewAct}
                      onDownload={handleDownloadAct}
                      onDelete={handleDeleteAct}
                      isDeleting={deletingId === act.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="bare-empty">
            <div className="bare-empty-icon"><FileText size={30} /></div>
            <h2>Loading Bare Acts...</h2>
            <p>Please wait while the latest Bare Acts are fetched.</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bare-empty">
            <div className="bare-empty-icon"><BookOpen size={30} /></div>
            <h2>No Bare Acts available yet.</h2>
            <p>Upload your first Bare Act to begin indexing statutes for legal drafting.</p>
          </div>
        )}

        <div className="bare-pagination">
          <p>Showing {filtered.length ? 1 : 0} to {filtered.length} of {rows.length} acts</p>
          <div>
            <button type="button" disabled aria-label="Previous page">‹</button>
            <button type="button" className="active">1</button>
            <button type="button" disabled aria-label="Next page">›</button>
          </div>
        </div>
      </section>

      <section className="bare-upload-card">
        <div className="bare-upload-icon"><UploadCloud size={28} /></div>
        <div>
          <h2>Upload New Bare Act</h2>
          <p>Upload PDF Bare Acts. The system extracts metadata, indexes sections, and makes the Act available for legal drafting.</p>
          <span>Supported: PDF</span>
        </div>
        <button className="bare-primary" type="button" onClick={openUploadDialog}>
          Upload Act
        </button>
      </section>

      {uploadOpen && (
        <div className="bare-modal-backdrop" role="presentation" onMouseDown={() => closeUploadDialog()}>
          <div className="bare-modal" role="dialog" aria-modal="true" aria-labelledby="bare-upload-title" onMouseDown={e => e.stopPropagation()}>
            <div className="bare-modal-header">
              <div>
                <h2 id="bare-upload-title">Upload New Bare Act</h2>
                <p>Select a PDF file to upload and index it for legal drafting.</p>
              </div>
              <button type="button" className="bare-close-btn" onClick={() => closeUploadDialog()} aria-label="Close upload dialog">
                <X size={18} />
              </button>
            </div>
            <label className="bare-file-drop">
              <UploadCloud size={34} />
              <strong>{selectedFile ? selectedFile.name : 'Choose a PDF file'}</strong>
              <span>PDF only</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />
            </label>
            {uploadError && <div className="bare-error bare-upload-error">{uploadError}</div>}
            <div className="bare-modal-actions">
              <button type="button" className="bare-filter-btn" onClick={closeUploadDialog} disabled={uploading}>Cancel</button>
              <button type="button" className="bare-primary" disabled={!selectedFile || uploading} onClick={handleUpload}>
                {uploading ? 'Uploading...' : 'Upload Act'}
              </button>
            </div>
          </div>
        </div>
      )}
 
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <label className="bare-select">
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown size={15} />
    </label>
  )
}

function CategoryBadge({ value }) {
  return <span className="bare-category">{value}</span>
}

function StatusBadge({ status }) {
  return <span className={`bare-status ${status.toLowerCase()}`}>{status}</span>
}

function extractActs(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.acts)) return data.acts
  if (Array.isArray(data?.bareActs)) return data.bareActs
  if (Array.isArray(data?.bare_acts)) return data.bare_acts
  if (Array.isArray(data?.data)) return data.data
  return []
}

function getApiErrorMessage(error, fallback) {
  if (error.message && !error.response) return error.message
  if (!error.response) return 'Network error. Please check your connection and try again.'

  const detail = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error
  if (Array.isArray(detail)) return detail.map(item => item.msg || item.message || String(item)).join(', ')
  if (typeof detail === 'string') return detail

  return fallback
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isRecentlyAdded(value) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return date.getTime() >= thirtyDaysAgo
}

function sanitizeFileName(value) {
  return String(value).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'bare-act'
}

function ProfileDropdown({ advocate, isLoggedIn, onProfile, onLogout, onLogin, onRegister }) {
  return (
    <div className="bare-profile-menu">
      {isLoggedIn ? (
        <>
          <div className="bare-profile-card">
            <span className="bare-profile-initial">{advocate?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            <div style={{ minWidth: 0 }}>
              <strong>Adv. {advocate?.name || 'Advocate'}</strong>
              <span>{advocate?.email || ''}</span>
            </div>
          </div>
          <div className="bare-profile-menu-actions">
            <button type="button" onClick={onProfile}>
              <Settings size={14} /> Settings & Profile
            </button>
            <button type="button" className="danger" onClick={onLogout}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="bare-profile-menu-actions">
          <button type="button" onClick={onLogin}>
            <User size={14} /> Sign In
          </button>
          <button type="button" onClick={onRegister}>
            <Settings size={14} /> Create Account
          </button>
        </div>
      )}
    </div>
  )
}

function ActionMenu({ act, onView, onDownload, onDelete, isDeleting }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const view = () => onView(act)
  const download = () => onDownload(act)
  const remove = () => {
    setOpen(false)
    onDelete(act)
  }

  return (
    <div className="bare-actions">
      <button type="button" title="View" onClick={view}>
        <Eye size={14} />
      </button>
      <button type="button" title="Download" onClick={download}>
        <Download size={14} />
      </button>
      <div className="bare-more-wrap" ref={wrapRef}>
        <button
          type="button"
          title="More actions"
          aria-label="More actions"
          onClick={() => setOpen(v => !v)}
          disabled={isDeleting}
        >
          <MoreVertical size={14} />
        </button>
        {open && (
          <div className="bare-more-menu" role="menu" aria-label="Bare Act actions">
            <button type="button" className="danger" role="menuitem" onClick={remove} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}