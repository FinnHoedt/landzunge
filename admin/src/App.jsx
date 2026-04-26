import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import GuestbookPage from './pages/GuestbookPage'
import DispatchesPage from './pages/DispatchesPage'
import EditorPage from './pages/EditorPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/guestbook" element={
          <ProtectedRoute><Layout><GuestbookPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches" element={
          <ProtectedRoute><Layout><DispatchesPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/new" element={
          <ProtectedRoute><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dispatches/:id/edit" element={
          <ProtectedRoute><Layout><EditorPage /></Layout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/guestbook" />} />
      </Routes>
    </BrowserRouter>
  )
}
