# Guestbook Image Upload — Design Spec
**Date:** 2026-04-17
**Status:** Approved

## Overview

Optional image attachments on guestbook entries. Images require manual admin approval before rendering publicly. Admin workflow is entirely within the Supabase dashboard — no separate admin UI needed.

---

## Schema Changes

Add two columns to `guestbook_entries`:

| Column | Type | Default | Notes |
|---|---|---|---|
| `image_path` | `text` | `null` | Supabase Storage object path, e.g. `guestbook/abc123.jpg` |
| `image_approved` | `boolean` | `false` | Only `true` entries render image in card |

Public image URL is derived client-side: `${SUPABASE_URL}/storage/v1/object/public/guestbook-images/${image_path}`

---

## Supabase Storage Bucket

**Bucket name:** `guestbook-images`
**Visibility:** Public (enables direct URL rendering without auth tokens)

RLS policies:
- `anon` role: INSERT allowed (upload)
- `anon` role: SELECT allowed (read/download)
- `anon` role: DELETE and UPDATE blocked
- All other roles: default Supabase behavior

---

## Upload Flow

1. User fills form (name, message, optional image)
2. Client validates image before submit:
   - File type: JPG, PNG, WEBP only (`accept="image/*"` + JS type check)
   - Max size: 5MB
3. On submit (if image selected): upload to Storage → receive `image_path`
4. Insert row into `guestbook_entries` with `name`, `message`, `image_path` (or `null`), `image_approved` defaults `false`
5. If Storage upload fails: abort insert, show error to user
6. Text entry shows immediately in guestbook; image hidden until approved

---

## File Input

```html
<input type="file" accept="image/*" capture="environment" />
```

- Mobile: prompts camera (rear) or gallery picker
- Desktop: opens standard file picker
- No additional libraries required

---

## Render Logic

`loadEntries()` fetches `name, message, created_at, image_path, image_approved`.

Card renders image block only when `image_path !== null && image_approved === true`.

```
[HANDLE] · [DATE]
[message text]
[image — only if image_path set AND image_approved true]
```

Image rendered as `<img>` with explicit `width`/`height` constraints and `loading="lazy"`.

---

## Admin Review Workflow

1. New entry arrives — text visible immediately
2. Admin opens Supabase dashboard → Storage → `guestbook-images` bucket → preview image
3. **Approve:** Set `image_approved = true` in table editor → image appears on site
4. **Reject:** Delete object from Storage bucket + set `image_path = null` in table editor

No code changes needed for admin operations.

---

## Client-Side Guards

- File type validated via `file.type` check (JPG/PNG/WEBP)
- File size validated via `file.size <= 5 * 1024 * 1024`
- Existing profanity check on name + message: unchanged
- Existing 1hr localStorage rate limit: unchanged

---

## Out of Scope

- Automatic AI/ML content moderation
- Admin UI on the site itself
- Image compression or resizing before upload
- Multiple images per entry
