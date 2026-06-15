import { Navigate } from 'react-router-dom'
import { getToken, getRole } from '../lib/api'

export default function ProtectedRoute({ children, requiredRole }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  if (requiredRole && getRole() !== requiredRole) return <Navigate to="/guestbook" replace />
  return children
}
