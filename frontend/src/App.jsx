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

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<LoginPage />}  />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  )
}
