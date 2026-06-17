// All assignable roles, shown in the Users page dropdowns.
export const ROLE_NAMES = ['admin', 'super_admin', 'moderator', 'editor']

// Which roles may access each section. Mirrors the backend @Roles() decorators.
export const SECTION_ROLES = {
  guestbook: ['admin', 'super_admin', 'moderator'],
  dispatches: ['admin', 'super_admin', 'editor'],
  users: ['super_admin'],
}

export function canAccess(section, role) {
  return SECTION_ROLES[section]?.includes(role) ?? false
}

// Where to send a user after login / on an unknown route, based on what they can reach.
export function landingPath(role) {
  if (canAccess('guestbook', role)) return '/guestbook'
  if (canAccess('dispatches', role)) return '/dispatches'
  return '/login'
}
