import { Routes, Route } from 'react-router-dom'
import Layout        from './components/Layout'
import Dashboard     from './pages/Dashboard'
import DraftPage     from './pages/DraftPage'
import ValidatePage  from './pages/ValidatePage'
import ComparePage   from './pages/ComparePage'
import PipelinePage  from './pages/PipelinePage'
import ReferencePage from './pages/ReferencePage'
import ArgumentPage  from './pages/ArgumentPage'
import LoginPage     from './pages/LoginPage'
import SignupPage    from './pages/SignupPage'
import ProfilePage   from './pages/ProfilePage'
import Judgement     from './pages/Judgement'

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
            <Route path="/pipeline"  element={<PipelinePage />} />
            <Route path="/draft"     element={<DraftPage />}    />
            <Route path="/arguments" element={<ArgumentPage />} />
            <Route path="/validate"  element={<ValidatePage />} />
            <Route path="/compare"   element={<ComparePage />}  />
            <Route path="/reference" element={<ReferencePage />}/>
            <Route path="/profile"   element={<ProfilePage />}  />
            <Route path="/judgements" element={<Judgement />}    />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}
