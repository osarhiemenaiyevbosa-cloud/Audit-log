/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a company and first company administrator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, registrationNumber, companyEmail, name, email, password]
 *             properties:
 *               companyName: { type: string }
 *               registrationNumber: { type: string }
 *               companyEmail: { type: string, format: email }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201:
 *         description: Registration created
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     summary: Get current user
 *     responses:
 *       200:
 *         description: Current user
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     summary: Logout
 *     responses:
 *       200:
 *         description: Logged out
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     summary: Dashboard metrics and recent activity
 *     responses:
 *       200:
 *         description: Dashboard data
 * /audits:
 *   get:
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     summary: Search, filter and paginate audit history
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit list
 * /audits/{id}:
 *   get:
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     summary: Get audit event details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit detail
 * /audits/import:
 *   post:
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     summary: Import audit logs from CSV
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import summary
 * /audits/export/csv:
 *   get:
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     summary: Export filtered audit logs as CSV
 *     responses:
 *       200:
 *         description: CSV file
 * /companies:
 *   get:
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     summary: List companies within user scope
 *     responses:
 *       200:
 *         description: Companies
 *   post:
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     summary: Create company
 *     responses:
 *       201:
 *         description: Company created
 * /companies/{id}/status:
 *   patch:
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     summary: Approve, reject, suspend or reactivate a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company status updated
 * /users:
 *   get:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: List users
 *     responses:
 *       200:
 *         description: Users
 *   post:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Create user
 *     responses:
 *       201:
 *         description: User created
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Change user role
 *     responses:
 *       200:
 *         description: Role changed
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Activate or deactivate user
 *     responses:
 *       200:
 *         description: Status changed
 * /notices:
 *   get:
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     summary: List published notices
 *     responses:
 *       200:
 *         description: Notices
 *   post:
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     summary: Create notice
 *     responses:
 *       201:
 *         description: Notice created
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     summary: List notifications
 *     responses:
 *       200:
 *         description: Notifications
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     summary: Mark notification as read
 *     responses:
 *       200:
 *         description: Notification updated
 * /whistleblower/reports:
 *   post:
 *     tags: [Whistleblower]
 *     summary: Submit protected report
 *     responses:
 *       201:
 *         description: Report submitted and reference code returned
 *   get:
 *     tags: [Whistleblower]
 *     security:
 *       - bearerAuth: []
 *     summary: List protected reports for authorised investigators
 *     responses:
 *       200:
 *         description: Reports
 * /whistleblower/reports/{id}:
 *   get:
 *     tags: [Whistleblower]
 *     security:
 *       - bearerAuth: []
 *     summary: View protected report
 *     responses:
 *       200:
 *         description: Report detail
 *   patch:
 *     tags: [Whistleblower]
 *     security:
 *       - bearerAuth: []
 *     summary: Update report status
 *     responses:
 *       200:
 *         description: Report status updated
 */