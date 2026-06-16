import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import GuestbookPage from './pages/GuestbookPage'
import DispatchesPage from './pages/DispatchesPage'
import EditorPage from './pages/EditorPage'
import UsersPage from './pages/UsersPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { getToken, getRole } from './lib/api'
import { SECTION_ROLES, landingPath } from './lib/roles'

function DefaultRedirect() {
  if (!getToken()) return <Navigate to="/login" replace />
  return <Navigate to={landingPath(getRole())} replace />
}

export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/guestbook" element={
          <ProtectedRoute allowedRoles={SECTION_ROLES.guestbook}><Layout><GuestbookPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches" element={
          <ProtectedRoute allowedRoles={SECTION_ROLES.dispatches}><Layout><DispatchesPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/new" element={
          <ProtectedRoute allowedRoles={SECTION_ROLES.dispatches}><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/:id/edit" element={
          <ProtectedRoute allowedRoles={SECTION_ROLES.dispatches}><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={SECTION_ROLES.users}><Layout><UsersPage /></Layout></ProtectedRoute>
        } />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
