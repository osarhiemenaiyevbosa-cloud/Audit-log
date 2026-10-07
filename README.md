# Group 27 Capstone project 

## Central Audit Log Dashboard

A multi-organisation web application that records important actions performed within registered companies and provides a reliable, searchable history of those actions.

Companies register themselves, get approved by a system administrator, and then manage their own users. Every meaningful action (logins, role changes, company approvals, notices, imports, exports) is written to an audit trail that is scoped per company, so one organisation can never see another's history.

## Repository Structure

```
Audit-log/
├── Backend/                 Node.js + Express + MongoDB REST API
│   ├── package.json
│   └── src/
│       ├── server.js        App entry point
│       ├── config/          Database connection
│       ├── controllers/     Request handlers
│       ├── docs/            Swagger / OpenAPI setup
│       ├── middleware/      Auth, permissions, validation, errors
│       ├── models/          Mongoose schemas
│       ├── routes/          Express routers (mounted under /api)
│       ├── services/        Audit events, email, notifications
│       └── utils/           Constants, JWT, encryption, seed script
├── Frontend/
│   └── frontend/            React + Vite single-page app
└── docs/
    └── AUDIT_API_CONTRACT.md  Agreed contract for the audit-log endpoints
```

## Quick Start

You need **Node.js 18+**, **npm**, and a running **MongoDB** instance (local or Atlas).

```bash
# 1. Clone
git clone https://github.com/osarhiemenaiyevbosa-cloud/Audit-log.git
cd Audit-log

# 2. Backend (terminal 1)
cd Backend
npm install
# create Backend/.env (see "Environment Variables" below)
npm run seed        # creates the first system administrator
npm run dev         # http://localhost:5000

# 3. Frontend (terminal 2)
cd Frontend/frontend
npm install
cp .env.example .env
npm run dev         # http://localhost:5173
```

---

# Backend

## Tech Stack

| Concern | Library |
| :--- | :--- |
| Server | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Authentication | JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcryptjs` |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| File upload / CSV | `multer`, `csv-parse` |
| Email | `nodemailer` |
| API docs | `swagger-jsdoc`, `swagger-ui-express` |
| Misc | `uuid`, `dotenv`, `nodemon` |

## Environment Variables

Create `Backend/.env`:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `MONGO_URI` | Yes | MongoDB connection string. The server refuses to start without it. |
| `JWT_SECRET` | Yes | Secret used to sign and verify tokens. |
| `JWT_EXPIRES_IN` | No | Token lifetime. Defaults to `1d`. |
| `PORT` | No | API port. Defaults to `5000`. |
| `CLIENT_URL` |Defaults to `audit-log-r6sh.vercel.app`. |
| `WHISTLEBLOWER_ENCRYPTION_KEY` | Yes* | 64 hex characters (32 bytes) for AES-256-GCM. *Needed for whistleblower reports. |


Example:

```env
MONGO_URI=mongodb://localhost:27017/audit-log
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_URL= audit-log-r6sh.vercel.app
WHISTLEBLOWER_ENCRYPTION_KEY=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

## Scripts

| Command | What it does |
| :--- | :--- |
| `npm start` | Runs `node src/server.js` |
| `npm run dev` | Runs the server with `nodemon` (auto-restart) |
| `npm run seed` | Creates the initial system administrator and company |
| `npm test` | Runs `node --test` |

## Seeding the First Admin

`npm run seed` creates a company called *System Administration* and one `SYSTEM_ADMIN` user:

- **Email:** `admin@audit.local`
- **Password:** `Admin@12345`

Change this password immediately outside local development.

## Roles and Permissions

Access is controlled by role-based permissions defined in `src/utils/constants.js`.

| Permission | SYSTEM_ADMIN | COMPANY_ADMIN | AUDITOR | USER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `VIEW_DASHBOARD` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `VIEW_AUDIT` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SEARCH_AUDIT` | ✅ | ✅ | ✅ | | |
| `EXPORT_AUDIT` | ✅ | ✅ | ✅ | | |
| `IMPORT_AUDIT` | ✅ | ✅ | | | |
| `MANAGE_USERS` | ✅ | ✅ | | | |
| `PUBLISH_NOTICE` | ✅ | ✅ | | | |
| `MANAGE_COMPANIES` | ✅ | | | | |
| `MANAGE_ROLES` | ✅ | | | | |
| `VIEW_WHISTLEBLOWER` | ✅ | | | | |

**Company isolation:** every role except `SYSTEM_ADMIN` only sees data belonging to its own `companyId`. System admins can see everything and may filter audit logs by `companyId`.

## Authentication Flow

1. A company registers via `POST /api/auth/register`. This creates the company (status `PENDING`) and its first user as `COMPANY_ADMIN`.
2. A system admin approves the company via `PATCH /api/companies/:id/status`.
3. Users can log in only if their account is `ACTIVE` **and** their company is `APPROVED`.
4. `POST /api/auth/login` returns a JWT. Send it on every protected request:

```
Authorization: Bearer <token>
```

Logout is stateless: the API records a `LOGOUT` audit event and the client discards the token.

## API Reference

Base URL: `http://localhost:5000/api`. Interactive Swagger docs are served at `http://localhost:5000/api-docs`, and a health check is available at `GET /health`.

All responses use the shape `{ "success": true|false, ... }`. Errors include a `message`, and validation failures also include an `errors` array.

### Authentication

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| POST | `/auth/register` | Public | Register a company and its first admin |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/auth/me` | Token | Current user |
| POST | `/auth/logout` | Token | Record logout |

Register body: `companyName`, `registrationNumber`, `companyEmail`, `name`, `email`, `password` (min 8 characters), optional `phone`.

### Audit Logs

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/audit-logs` | `VIEW_AUDIT` | Paginated, filterable list |
| GET | `/audit-logs/:id` | `VIEW_AUDIT` | Single audit event |
| GET | `/audit-logs/export/csv` | `EXPORT_AUDIT` | Download filtered logs as CSV |
| POST | `/audit-logs/import` | `IMPORT_AUDIT` | Bulk import from a CSV file (`multipart/form-data`, field `file`, 5 MB max) |

**Query parameters for the list and export endpoints**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | string | Case-insensitive match on event ID, description, resource type, action or resource ID |
| `action` | string | Exact action, e.g. `LOGIN`, `ROLE_CHANGE` |
| `status` | string | `SUCCESS` or `FAILED` |
| `resourceType` | string | e.g. `User`, `Company`, `Notice` |
| `userId` | string | Filter by actor |
| `from`, `to` | ISO date | Timestamp range |
| `companyId` | string | System admins only |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, maximum `100` |

Paginated responses look like:

```json
{
  "success": true,
  "data": [ /* audit events */ ],
  "pagination": { "page": 1, "limit": 20, "total": 134, "pages": 7 }
}
```

**CSV import format.** Required columns: `action`, `resourceType`. Optional: `eventId`, `resourceId`, `timestamp`, `status` (`SUCCESS`/`FAILED`), `description`, `metadata`. The response returns a summary (`totalRows`, `successRows`, `failedRows`) and a per-row `errors` list. Imported records are tagged `metadata.imported = true`.

### Companies (`MANAGE_COMPANIES`)

| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/companies` | List companies (system admins see all) |
| POST | `/companies` | Create a company (auto-approved when created by a system admin) |
| PATCH | `/companies/:id/status` | Set status to `APPROVED`, `REJECTED`, `SUSPENDED` or `PENDING`; the company is emailed |

### Users (`MANAGE_USERS`)

| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/users` | List users in scope |
| POST | `/users` | Create a user (`name`, `email`, `password`, optional `role`). Company admins cannot assign `SYSTEM_ADMIN` or `COMPANY_ADMIN`. |
| PATCH | `/users/:id/role` | Change role |
| PATCH | `/users/:id/status` | Set `ACTIVE` or `INACTIVE` |

### Dashboard

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard/summary` | `VIEW_DASHBOARD` | Counts of audit events, users, companies, new whistleblower reports (system admin only) and the 10 most recent events |

### Notices

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/notices` | Any logged-in user | Published, non-expired notices |
| GET | `/notices/:id` | Any logged-in user | Single notice |
| GET | `/notices/manage` | `PUBLISH_NOTICE` | All notices, optional `?status=` |
| POST | `/notices` | `PUBLISH_NOTICE` | Create (`title`, `body`, optional `status`, `expiresAt`) |
| PATCH | `/notices/:id` | `PUBLISH_NOTICE` | Update; status may be `DRAFT`, `PUBLISHED` or `ARCHIVED` |
| PATCH | `/notices/:id/archive` | `PUBLISH_NOTICE` | Archive |

### Notifications

| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/notifications` | Latest 50 notifications for the current user |
| PATCH | `/notifications/:id/read` | Mark one as read |
| PATCH | `/notifications/read-all` | Mark all as read |

### Whistleblower Reports

Report bodies are encrypted at rest with AES-256-GCM and are never returned in list responses.

| Method | Path | Permission | Description |
| :--- | :--- | :--- | :--- |
| POST | `/whistleblower/reports` | Logged-in user | Submit a report (`content` 10 to 10,000 chars, optional `category`). Returns a `referenceCode` such as `WB-1A2B3C4D5E`. |
| GET | `/whistleblower/reports` | `VIEW_WHISTLEBLOWER` | List reports without content |
| GET | `/whistleblower/reports/:id` | `VIEW_WHISTLEBLOWER` | Decrypted report (the view itself is audited) |
| PATCH | `/whistleblower/reports/:id` | `VIEW_WHISTLEBLOWER` | Update status (`NEW`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED`) and assignee |

## Data Models

| Model | Key fields |
| :--- | :--- |
| **AuditLog** | `eventId` (unique, `EVT-<uuid>`), `companyId`, `actorId`, `action`, `resourceType`, `resourceId`, `timestamp`, `status`, `ipAddress`, `userAgent`, `before`, `after`, `metadata`, `description` |
| **Company** | `name`, `registrationNumber` (unique), `email`, `phone`, `address`, `industry`, `status` (`PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED`) |
| **User** | `companyId`, `name`, `email` (unique), `passwordHash`, `role`, `status` (`ACTIVE`/`INACTIVE`), `lastLoginAt` |
| **Notice** | `title`, `body`, `status`, `createdBy`, `publishedAt`, `expiresAt` |
| **Notification** | `userId`, `type`, `subject`, `message`, `status` (`UNREAD`/`READ`), `sentAt`, `metadata` |
| **WhistleblowerReport** | `referenceCode`, `encryptedContent`, `category`, `status`, `assignedTo`, `notes` |

## How Auditing Works

Controllers record events through one helper, `createAuditEvent` in `src/services/auditService.js`. It captures the acting user, company, IP address, user agent, and optional `before`/`after` snapshots, so changes such as a role update store both the old and new value. Events currently recorded include `COMPANY_REGISTER`, `LOGIN`, `LOGOUT`, `COMPANY_CREATE`, `COMPANY_STATUS_CHANGE`, `USER_CREATE`, `ROLE_CHANGE`, `USER_STATUS_CHANGE`, `NOTICE_CREATE`, `NOTICE_UPDATE`, `NOTICE_ARCHIVE`, `IMPORT_AUDIT`, `EXPORT_AUDIT`, `WHISTLEBLOWER_VIEW` and `WHISTLEBLOWER_STATUS_CHANGE`.

For in-app and email alerts, call `notifyUser` from `src/services/notificationService.js` rather than writing to the Notification model directly.

## Security Notes

- `helmet` sets secure HTTP headers; CORS is restricted to `CLIENT_URL`.
- Rate limit: 300 requests per 15 minutes per IP.
- JSON bodies are capped at 1 MB; CSV uploads at 5 MB.
- Audit search input is regex-escaped before querying.
- Emails never throw: if SMTP fails or is unconfigured, the request still succeeds.

---

# Frontend

## Tech Stack

React 19, Vite, and Oxlint. There is no router or UI library; the app is a single `App.jsx` with plain CSS in `App.css` and `index.css`.

## Setup

```bash
cd Frontend/frontend
npm install
cp .env.example .env
npm run dev
```

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL of the backend. Defaults to `https://audit-log-1-ukc4.onrender.com`. |

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Start the Vite dev server (default `audit-log-r6sh.vercel.app`) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Structure

```
Frontend/frontend/
├── index.html
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx     React entry point
    ├── App.jsx      Login screen, dashboard shell and all sections
    ├── App.css      Component styles
    └── index.css    Global styles
```

## Screens and Behaviour

**Login.** Email and password form that posts to `/api/auth/login`. On success the token and user are stored in `localStorage` under `auditSession`, so the session survives a refresh. **Sign out** clears it.

**Dashboard shell.** A top bar showing the signed-in user, and a sidebar with these sections: audit history, record management, warehouse equipment, settings, personal duty roster, data import/export, backup/restore, notice board and whistleblowers.

**Audit history.** The main working view. It shows summary cards (total events, latest action, current page), action and entity filters, a paginated table (8 per page) with action, entity, actor, source IP and timestamp, and previous/next controls.

**Other sections.** Record management, warehouse equipment and settings (user role management) have working UI. Personal duty roster, data import/export, backup/restore, notice board and whistleblowers currently show a "ready for its next workflow" placeholder.

**API helper.** A small `request()` wrapper adds the JSON content-type header, parses errors from the API's `message` field, and is used by every call. Protected calls pass `Authorization: Bearer <token>`.

## Integration Status: Read Before Running Both Together

The frontend was built against a slightly different API shape than the current backend exposes. Until they are aligned, parts of the dashboard will not work end to end:

| Area | Frontend expects | Backend provides |
| :--- | :--- | :--- |
| Roles | `admin` / `user` | `SYSTEM_ADMIN`, `COMPANY_ADMIN`, `AUDITOR`, `USER`, `VIEWER` |
| Log fields | `entityType`, `entityId`, `actor`, `createdAt` | `resourceType`, `resourceId`, `actorId` (populated), `timestamp` |
| Log filters | `entityType` | `resourceType` |
| Action names | `USER_CREATED`, `RECORD_CREATED` and similar | `USER_CREATE`, `ROLE_CHANGE`, `COMPANY_STATUS_CHANGE` and similar |
| Records | `/api/records` (CRUD) | Not implemented |
| Equipment | `/api/equipment` | Not implemented |
| Users | `DELETE /api/users/:id`, bare-array responses | No delete route; responses are wrapped in `{ success, data }` |
| Login form | Pre-filled `admin@example.com` / `Password123!` | Seed user is `admin@audit.local` / `Admin@12345` |

Because the frontend only unlocks the dashboard when `role === 'admin'`, a backend user will currently land on the "Admin access required" panel.

## Backend Issues to Fix Before First Run

These came up while reading the code. They are easy to miss on Windows or macOS (case-insensitive file systems) but will crash the server on Linux or in CI:

- **Filename casing.** Several `require()` calls do not match the actual filenames: `auditcontroller` vs `auditController.js`, `auditService` vs `auditservice.js`, `errorMiddleware` vs `errormiddleware.js`, `whistleblowerRoutes` vs `whistleblowerroutes.js`, and `whistleblowerController` vs `whistleblowercontroller.js`. Renaming the files to match the imports fixes it.
- **Swagger paths.** `swagger.js` points at `./src/docs/swaggerRoutes.js`, but the file is `swaggerRoute.js`. The documented paths (`/audits`) also differ from the real ones (`/audit-logs`).
- **Whistleblower submission** currently requires a login (`protect`), though the Swagger docs describe it as a public endpoint.
- **API contract.** `docs/AUDIT_API_CONTRACT.md` lists an `entity` filter and a default page size of 10. The backend uses `resourceType` and defaults to 20.

##  Deployment

| Part | Platform | URL |
| :--- | :--- | :--- |
| Backend | Render | https://audit-log-1-ukc4.onrender.com |
| Frontend | Vercel | https://audit-log-r6sh.vercel.app |

When deploying, make sure the backend's `CLIENT_URL` matches the deployed frontend URL and the frontend's `VITE_API_URL` points at the deployed backend.

## Contributing

1. Create a branch from `master`.
2. Keep route, controller and model names consistent (including filename casing).
3. Record meaningful actions with `createAuditEvent`.
4. Update this README and `docs/AUDIT_API_CONTRACT.md` when an endpoint changes.

## Project Context
Group 27. The audit API endpoints are documented in `docs/AUDIT_API_CONTRACT.md`.

| Contributor | Responsibility |
| :--- | :--- |
| Michael Okeorji Ayobami and BarakatIsmael | Authentication, RBAC, organisation access |
| Topeadegbemile-afk | Audit engine, audit APIs and company assets |
| marycaniceoraneli | Companies UI |
| Wunmex | Dashboard APIs/metrics support and dashboard UI |
| Nyxa045 | Audit log UI integration, import/export integration |
| FranTech | Import/export, notices and notifications |
| JAY | Whistleblower, QA, integration and deployment |
| Arvel12 | Code review |
