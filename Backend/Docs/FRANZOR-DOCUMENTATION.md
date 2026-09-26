# Franzor's Module — Notices, Notifications & Email

**Author:** Franzor (Francis Chinazor)
**Scope owned:** Notice board, in-app notifications, and outbound email —
covering `Notice.js`, `Notification.js`, `noticeController.js`,
`notificationController.js`, `noticeRoutes.js`, `notificationRoutes.js`,
and `emailService.js`, plus a small extra helper (`notificationService.js`)
described below.

This page documents what I built for the Central Audit Log Dashboard, why it's
structured the way it is, and how to run/test it.

---

## 1. What this module does

Two connected features:

1. **Notice board** — admins draft, publish, update, and archive short
   announcements. Regular users only ever see notices that are currently
   published *and* not expired. Every create/update/archive action is
   captured as an audit event.
2. **Notifications** — a per-user inbox of system messages (e.g. "your role
   changed", "a new notice was published"), each markable as read
   individually or all at once, with an unread count for a badge/UI.

Email is the delivery mechanism that can accompany either: `emailService.js`
sends a real email if SMTP is configured, or just logs to the console if it
isn't (so the app runs locally/in demos without real credentials).

## 2. Where the files live

```
Backend/
├── Models/
│   ├── Notice.js
│   └── Notification.js
├── Controllers/
│   ├── noticeController.js
│   └── notificationController.js
├── Routes/
│   ├── noticeRoutes.js
│   └── notificationRoutes.js
├── Services/
│   ├── emailService.js
│   └── notificationService.js
└── Docs/
    └── FRANZOR-DOCUMENTATION.md   (this file)
```

I matched the repo's existing capitalization style (`Config`, `Controllers`,
`Models`, `Utils` were already capitalized) rather than the lowercase
`src/controllers` layout from the original planning PDF — folder names are
cosmetic, but consistency matters more than matching the PDF exactly.

`Routes` and `Services` didn't exist yet in this repo, so I created them.

## 3. Data models

**`Notice`** — `title`, `body`, `status` (`DRAFT` / `PUBLISHED` / `ARCHIVED`),
`createdBy`, `publishedAt`, `expiresAt`. It has a `Notice.activeFilter()`
static that returns the "currently live" query (published + not expired) —
every public-facing read uses this one filter so the "is it live" logic only
exists in one place.

**`Notification`** — `userId`, `type` (a free-text tag like `LOGIN` or
`ROLE_CHANGE`), `subject`, `message`, `status` (`UNREAD` / `READ`), `sentAt`,
`metadata`. Indexed on `(userId, status, createdAt)` since that's the exact
shape of the "my unread notifications, newest first" query the frontend will
make constantly.

## 4. Endpoints

| Method | Endpoint                        | Who can call it | What it does |
|--------|-----------------------------------|------------------|---------------|
| GET    | `/api/notices`                  | any logged-in user | Published, non-expired notices, paginated |
| GET    | `/api/notices/manage`           | `PUBLISH_NOTICE`   | All notices, any status, filterable by `?status=` |
| GET    | `/api/notices/:id`               | any logged-in user | Single notice detail |
| POST   | `/api/notices`                  | `PUBLISH_NOTICE`   | Create (draft or published) |
| PATCH  | `/api/notices/:id`               | `PUBLISH_NOTICE`   | Edit title/body/status/expiry |
| PATCH  | `/api/notices/:id/archive`       | `PUBLISH_NOTICE`   | Archive (separate action, separately audited) |
| GET    | `/api/notifications`             | any logged-in user | Own notifications, paginated, includes `unreadCount` |
| PATCH  | `/api/notifications/:id/read`    | any logged-in user | Mark one as read |
| PATCH  | `/api/notifications/read-all`    | any logged-in user | Mark everything read |

## 5. Design decisions worth knowing

- **Separate `/manage` route instead of a role-check inside `listNotices`.**
  Keeping the public feed and the admin feed as two distinct handlers means
  the public one can never accidentally leak a draft — there's no branching
  logic inside it to get wrong.
- **Archiving is its own endpoint**, not just `PATCH` with `status: ARCHIVED`.
  The SRS calls out that admin actions must be individually audited
  (NFR-08), so giving archive its own audit action name (`NOTICE_ARCHIVE`
  vs. `NOTICE_UPDATE`) makes the audit trail easier to read later.
- **`emailService.js` never throws.** A failed email (bad SMTP creds,
  network hiccup) shouldn't 500 an API request that otherwise succeeded —
  it logs the failure and returns `{ skipped: true }` instead.
- **`notificationService.js` is new, not in the original plan.** It bundles
  "create a Notification row" + "optionally email too" into one call so
  teammates working on auth/users/companies don't have to duplicate that
  pairing everywhere a notification is needed. It's optional for them to
  adopt — nothing else depends on it.

## 6. Dependencies this module needs from teammates

These files are referenced by `noticeRoutes.js` / `notificationRoutes.js`
but are **not part of my scope** and don't exist in the repo yet as of this
push:

| Expected file | Exports | Owner (per group plan) |
|---|---|---|
| `Backend/Middleware/authMiddleware.js` | `{ protect }` | Algorithm / Pleasure Haven |
| `Backend/Middleware/permissionMiddleware.js` | `{ requirePermission }` | Algorithm / Pleasure Haven |
| `Backend/Middleware/validate.js` | validation-result handler | Algorithm / Pleasure Haven |
| `Backend/Utils/constants.js` | `{ PERMISSIONS }` | Algorithm / Pleasure Haven |
| `Backend/Services/auditService.js` | `{ createAuditEvent }` | Tope Dickson |

Until those exist, `require()`-ing my route files will throw. That's
expected at this stage of the build — I've documented it here so it's clear
this isn't a bug in my code, it's a pending integration point. Once those
five files land, my routes should work without any changes on my end.

Also **not yet wired**: `Backend/app.js` is still empty, so nothing mounts
`noticeRoutes.js` / `notificationRoutes.js` onto the Express app yet. Whoever
owns `app.js` will need to add:

```js
app.use('/api/notices', require('./Routes/noticeRoutes'));
app.use('/api/notifications', require('./Routes/notificationRoutes'));
```

## 7. How to test once the app is wired up

1. Log in as a user with `PUBLISH_NOTICE` permission to get a JWT.
2. `POST /api/notices` with:
   ```json
   { "title": "Maintenance window", "body": "Sat 2am-4am", "status": "PUBLISHED" }
   ```
3. `GET /api/notices` (any user) — the notice should appear.
4. `PATCH /api/notices/:id/archive` — then `GET /api/notices` again, it
   disappears from the public feed but still shows under
   `GET /api/notices/manage?status=ARCHIVED`.
5. `GET /api/notifications` — empty until something calls `notifyUser()`;
   notifications aren't auto-created from notice publishing yet (see below).

## 8. Open question for the group

FR-16 in the SRS implies publishing a notice should notify users. Right now
`createNotice`/`updateNotice` only write an **audit** event, not a
**notification** to affected users — deciding who counts as "affected"
(everyone? one company? some role?) is a product decision, not something I
wanted to hardcode without the group agreeing on it first.
