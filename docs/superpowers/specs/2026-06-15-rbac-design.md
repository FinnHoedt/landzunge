# Role-Based Access Control — Admin Dashboard

**Ticket:** #66
**Date:** 2026-06-15 (updated 2026-06-16: added `moderator` and `editor` roles, account auto-provisioning)

## Summary

Replace the `admins` boolean-whitelist table with a normalized role system. Every Supabase auth user must have exactly one role. Four roles exist: `super_admin` (everything + user management), `admin` (guestbook + dispatches), `moderator` (guestbook only), and `editor` (dispatches only). The admin dashboard enforces roles at both the API and UI layer.

---

## Data Model

### `roles` (lookup table, seeded — not managed via UI)

| column | type | notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `text` UNIQUE | `'super_admin'` \| `'admin'` \| `'moderator'` \| `'editor'` |

### `user_roles` (1:1 with `auth.users`)

| column | type | notes |
|--------|------|-------|
| `user_id` | `uuid` PK | FK → `auth.users.id` |
| `role_id` | `uuid` | FK → `roles.id` |

**Invariant:** every row in `auth.users` has exactly one row in `user_roles`. Enforced by the admin UI (role is required on create) and by the FK constraint.

### Migration

1. Create `roles` table and seed the four roles (`super_admin`, `admin`, `moderator`, `editor`).
2. Create `user_roles` table.
3. Migrate existing `admins` rows → `user_roles` with role `admin`.
4. Drop `admins` table.

The `moderator` and `editor` roles were added after the initial rollout; on an existing database, seed them with:

```sql
insert into roles (id, name) values
  (gen_random_uuid(), 'moderator'),
  (gen_random_uuid(), 'editor')
on conflict (name) do nothing;
```

---

## Role Permissions

| Role | Guestbook | Dispatches | User management |
|------|-----------|------------|-----------------|
| `super_admin` | ✓ | ✓ | ✓ |
| `admin` | ✓ | ✓ | — |
| `moderator` | ✓ | — | — |
| `editor` | — | ✓ | — |

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

`GuestbookController` admin routes get `@Roles('admin', 'super_admin', 'moderator')`; `DispatchesController` admin routes get `@Roles('admin', 'super_admin', 'editor')`.

### Users module (new)

All routes: `SupabaseAuthGuard + AdminGuard + @Roles('super_admin')`.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/users` | List all `user_roles` rows with auth user emails |
| `POST` | `/api/users` | Resolve auth user by email (creating the account if none exists), insert `user_roles` row; returns the generated password when an account was created |
| `PATCH` | `/api/users/:id` | Update role in `user_roles` |
| `DELETE` | `/api/users/:id` | Remove `user_roles` row |

**Self-modification guards:** `DELETE /api/users/:id` and `PATCH /api/users/:id` return `BadRequestException` if `id === request.user.id` (no removing or demoting yourself).

**Email lookup / provisioning:** `POST` uses `supabase.auth.admin.listUsers({ perPage: 1000 })` to resolve email → user id. If no account exists, it creates one via `supabase.auth.admin.createUser({ email, password, email_confirm: true })` with a random password (no SMTP/invite email) and returns that password once in the response. Re-adding an already-assigned user → `ConflictException`.

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

Accepts optional `allowedRoles` prop (array). If token missing → redirect `/login`. If `allowedRoles` is set and the user's role isn't in it → redirect to `landingPath(role)` (the first section that role can reach). The access model — which roles may reach guestbook / dispatches / users — lives in `admin/src/lib/roles.js` and mirrors the backend `@Roles()` decorators.

### `App.jsx`

- Each route is wrapped in `<ProtectedRoute allowedRoles={SECTION_ROLES.<section>}>`; the catch-all route redirects to `landingPath(role)`.

### `Layout`

- Each nav link (Guestbook, Dispatches, Users) is rendered only when the current role can access that section (`canAccess(section, role)`).

### `UsersPage`

- Table: email, role (inline dropdown, saves on change), remove button.
- Add-user form at bottom: email input + role select (required, no empty option, all four roles). Submit adds the user.
- When adding a user provisions a new account, the generated password is shown once in a dismissible banner (with a copy button).
- Self-remove / self-demote blocked: remove button and role dropdown disabled when the row is the current user's email.
- Errors shown inline per row / per form.

---

## Error handling

- Login with no `user_roles` row → generic "Invalid credentials" (same message as wrong password). A real role-lookup error → `500` (not masked as invalid credentials).
- `POST /api/users` with an unknown email → the account is provisioned (no error).
- `POST /api/users` for an already-assigned user → `409 Conflict` ("User already has a role").
- `PATCH /api/users/:id` → `204 No Content` on success.
- `DELETE /api/users/:id` or `PATCH /api/users/:id` for self → `400 Bad Request`.

---

## Testing

- `AdminGuard` spec: mock `user_roles` join; test no-row, role-mismatch, role-match cases.
- `AuthService` spec: mock `user_roles` lookup; missing row → `UnauthorizedException`, lookup error → `InternalServerErrorException`.
- `UsersService` spec: `add` provisions a new account (returns a password) and throws `ConflictException` for an already-assigned user.
- `UsersController` spec: list, add, update, delete (self/other).
