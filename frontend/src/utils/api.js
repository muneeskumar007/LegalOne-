import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

export const extractFacts    = (text)                              => api.post('/extract',    { text }).then(r => r.data)
export const classifyCase    = (facts)                             => api.post('/classify',   { facts }).then(r => r.data)
export const generateDraft   = (text, additional_context='', draft_type='petition') =>
  api.post('/generate-draft', { text, additional_context, draft_type }).then(r => r.data)
export const validateDraft   = (draft_text)                        => api.post('/validate',   { draft_text }).then(r => r.data)
export const compareDocuments= (document1, document2, label1='Petition', label2='Counter') =>
  api.post('/compare',   { document1, document2, label1, label2 }).then(r => r.data)
export const generateArguments = (text, side='both')               => api.post('/arguments',  { text, side }).then(r => r.data)

// PDF export — returns blob
export const exportPDF = (draft_text, metadata={}) =>
  api.post('/export-pdf', { draft_text, metadata }, { responseType: 'blob' }).then(r => r.data)

export default api
