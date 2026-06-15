# Role-Based Access Control — Admin Dashboard

**Ticket:** #66
**Date:** 2026-06-15

## Summary

Replace the `admins` boolean-whitelist table with a normalized role system. Every Supabase auth user must have exactly one role. Two roles exist: `admin` (guestbook + dispatches) and `super_admin` (everything + user management). The admin dashboard enforces roles at both the API and UI layer.

---

## Data Model

### `roles` (lookup table, seeded — not managed via UI)

| column | type | notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `text` UNIQUE | `'admin'` \| `'super_admin'` |

### `user_roles` (1:1 with `auth.users`)

| column | type | notes |
|--------|------|-------|
| `user_id` | `uuid` PK | FK → `auth.users.id` |
| `role_id` | `uuid` | FK → `roles.id` |

**Invariant:** every row in `auth.users` has exactly one row in `user_roles`. Enforced by the admin UI (role is required on create) and by the FK constraint.

### Migration

1. Create `roles` table and seed `admin` + `super_admin` rows.
2. Create `user_roles` table.
3. Migrate existing `admins` rows → `user_roles` with role `admin`.
4. Drop `admins` table.

---

## Role Permissions

| Role | Guestbook | Dispatches | User management |
|------|-----------|------------|-----------------|
| `admin` | ✓ | ✓ | — |
| `super_admin` | ✓ | ✓ | ✓ |

---

## Backend

### Auth flow

`auth.service.ts` — after successful Supabase login:
1. Query `user_roles` joined with `roles` for the logged-in user.
2. If no row found → `UnauthorizedException('Invalid credentials')` (generic, does not reveal the user exists).
3. Return `{ access_token, expires_at, user: { email, role: string } }`.

### Guards + decorator

**`roles.decorator.ts`** — `@Roles(...roles: string[])` sets metadata via `SetMetadata`.

**`AdminGuard`** — updated:
1. Reads `user_roles` join `roles` for `request.user.id`.
2. If no row → `ForbiddenException`.
3. Sets `request.user.role = role.name`.
4. Reads `@Roles(...)` metadata via `Reflector`. If required roles are specified and the user's role is not in the list → `ForbiddenException`.

Existing routes (`GuestbookController`, `DispatchesController`) get `@Roles('admin', 'super_admin')`.

### Users module (new)

All routes: `SupabaseAuthGuard + AdminGuard + @Roles('super_admin')`.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/users` | List all `user_roles` rows with auth user emails |
| `POST` | `/api/users` | Look up auth user by email, insert `user_roles` row |
| `PATCH` | `/api/users/:id` | Update role in `user_roles` |
| `DELETE` | `/api/users/:id` | Remove `user_roles` row |

**Self-remove guard:** `DELETE /api/users/:id` returns `BadRequestException` if `id === request.user.id`.

**Email lookup:** uses `supabase.auth.admin.listUsers({ perPage: 1000 })` to resolve email → user id on `POST`.

### Module registration

`UsersModule` imported into `AppModule`.

---

## Frontend

### `api.js`

- `getRole()` / `setRole(role)` / `clearRole()` — backed by `localStorage` key `admin_role`.
- `login()` — stores role from response alongside token.
- `logout()` — clears role.
- New methods: `getUsers()`, `addUser(email, role)`, `updateUserRole(id, role)`, `removeUser(id)`.

### `ProtectedRoute`

Accepts optional `requiredRole` prop. If token missing → redirect `/login`. If `requiredRole` set and `getRole() !== requiredRole` → redirect to `/guestbook`.

### `App.jsx`

- `/users` route added, wrapped in `<ProtectedRoute requiredRole="super_admin">`.

### `Layout`

- Users nav link rendered only when `getRole() === 'super_admin'`.

### `UsersPage`

- Table: email, role (inline dropdown), save button, remove button.
- Add-user form at bottom: email input + role select (required, no empty option). Submit adds user.
- Self-remove blocked: remove button disabled when row is the current user's email.
- Errors shown inline per row / per form.

---

## Error handling

- Login with no `user_roles` row → generic "Invalid credentials" (same message as wrong password).
- `POST /api/users` with unknown email → `404 Not Found`.
- `POST /api/users` for an already-assigned user → Supabase unique constraint → `400 Bad Request`.
- `DELETE /api/users/:id` for self → `400 Bad Request`.

---

## Testing

- `AdminGuard` spec: update to mock `user_roles` join; test no-row, role-mismatch, role-match cases.
- `AuthService` spec: update to mock `user_roles` lookup; test missing row returns `UnauthorizedException`.
- `UsersController` spec: list, add (found/not-found), update, delete (self/other).
