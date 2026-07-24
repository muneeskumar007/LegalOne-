import { Routes, Route } from 'react-router-dom'
import Layout        from './components/Layout'
import Dashboard     from './pages/Dashboard'
import DraftPage     from './pages/DraftPage'

 
import ReferencePage from './pages/ReferencePage'

import LoginPage     from './pages/LoginPage'
import SignupPage    from './pages/SignupPage'
import ProfilePage   from './pages/ProfilePage'
 
import JudgementUI from './pages/JudgementUI'
import MyCasesPage   from './pages/Mycases'
import RagStatusPage from './pages/RagStatusPage'


export default function App() {
  return (
    <Routes>
      {/* Auth pages — no Layout wrapper */}
      <Route path="/login"  element={<LoginPage />}  />
      <Route path="/signup" element={<SignupPage />}  />

      {/* App pages — with sidebar Layout */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/"          element={<Dashboard />}    />
           
            <Route path="/draft"     element={<DraftPage />}    />
            
            <Route path="/reference" element={<ReferencePage />}/>
            <Route path="/my-cases"  element={<MyCasesPage />} />
            <Route path="/judgements"  element={<JudgementUI />} />


<Route path="/rag" element={<RagStatusPage />} />

            <Route path="/profile"   element={<ProfilePage />}  />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}
