import { Navigate } from 'react-router-dom'
import { getToken, getRole } from '../lib/api'
import { landingPath } from '../lib/roles'

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  const role = getRole()
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={landingPath(role)} replace />
  }
  return children
}
