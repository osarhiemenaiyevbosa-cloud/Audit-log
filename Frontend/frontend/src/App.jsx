import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(data?.message || 'Something went wrong')
  return data
}

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('auditSession') || 'null'))
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('Password123!')
  const [loginError, setLoginError] = useState('')

  function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      .then((data) => {
        const nextSession = { token: data.token, user: data.user }
        localStorage.setItem('auditSession', JSON.stringify(nextSession))
        setSession(nextSession)
        window.history.pushState({}, '', '/admin')
      })
      .catch((error) => setLoginError(error.message))
  }

  function logout() {
    localStorage.removeItem('auditSession')
    setSession(null)
    window.history.pushState({}, '', '/')
  }

  if (!session) return <Login email={email} password={password} setEmail={setEmail} setPassword={setPassword} error={loginError} onSubmit={handleLogin} />
  return <Dashboard session={session} onLogout={logout} />
}

function Login({ email, password, setEmail, setPassword, error, onSubmit }) {
  return (
    <main className="login-page">
      <div className="login-aside">
        <div className="brand-mark">AL</div>
        <p className="eyebrow">CONTROL ROOM / 01</p>
        <h1>Know what changed.</h1>
        <p className="aside-copy">A quiet, searchable record of the actions that shape your system.</p>
        <div className="signal"><span /> Audit stream operational</div>
      </div>
      <section className="login-card">
        <p className="eyebrow">Administrator access</p>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to inspect your organization&apos;s activity.</p>
        <form onSubmit={onSubmit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">Enter console <span>→</span></button>
        </form>
        <p className="login-note">Admin access is required to view the audit history.</p>
      </section>
    </main>
  )
}

function Dashboard({ session, onLogout }) {
  const [activeSection, setActiveSection] = useState('audit-history')
  const [logs, setLogs] = useState([])
  const [records, setRecords] = useState([])
  const [equipment, setEquipment] = useState([])
  const [users, setUsers] = useState([])
  const [equipmentForm, setEquipmentForm] = useState({ name: '', category: '', serialNumber: '', location: '', status: 'active' })
  const [editingRecord, setEditingRecord] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ action: '', entityType: '' })
  const [record, setRecord] = useState({ title: '', content: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const isAdmin = session.user.role === 'admin'

  useEffect(() => { if (isAdmin) { loadRecords(); loadLogs(1) } }, [isAdmin])

  useEffect(() => {
    if (activeSection === 'warehouse-equipment' && isAdmin) loadEquipment()
    if (activeSection === 'settings' && isAdmin) loadUsers()
  }, [activeSection, isAdmin])

  function loadRecords() {
    request('/api/records', { headers: { Authorization: `Bearer ${session.token}` } })
      .then(setRecords)
      .catch((requestError) => setError(requestError.message))
  }

  function loadEquipment() {
    request('/api/equipment', { headers: { Authorization: `Bearer ${session.token}` } })
      .then(setEquipment)
      .catch((requestError) => setError(requestError.message))
  }

  function loadUsers() {
    request('/api/users', { headers: { Authorization: `Bearer ${session.token}` } })
      .then(setUsers)
      .catch((requestError) => setError(requestError.message))
  }

  function loadLogs(page = 1) {
    const params = new URLSearchParams({ page, limit: 8 })
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value))
    request(`/api/audit-logs?${params}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then((data) => { setLogs(data.data); setPagination(data.pagination); setError('') })
      .catch((requestError) => setError(requestError.message))
  }

  function createRecord(event) {
    event.preventDefault()
    request('/api/records', { method: 'POST', headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify(record) })
      .then(() => { setRecord({ title: '', content: '' }); setNotice('Record created and audit event captured.'); loadRecords(); if (isAdmin) loadLogs(1) })
      .catch((requestError) => setError(requestError.message))
  }

  function updateRecord(event) {
    event.preventDefault()
    request(`/api/records/${editingRecord._id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ title: editingRecord.title, content: editingRecord.content }) })
      .then(() => { setEditingRecord(null); setNotice('Record updated and audit event captured.'); loadRecords(); if (isAdmin) loadLogs(1) })
      .catch((requestError) => setError(requestError.message))
  }

  function deleteRecord(recordId) {
    if (!window.confirm('Delete this record? This action will be logged.')) return
    request(`/api/records/${recordId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } })
      .then(() => { setNotice('Record deleted and audit event captured.'); loadRecords(); if (isAdmin) loadLogs(1) })
      .catch((requestError) => setError(requestError.message))
  }

  function createEquipment(event) {
    event.preventDefault()
    request('/api/equipment', { method: 'POST', headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify(equipmentForm) })
      .then(() => { setEquipmentForm({ name: '', category: '', serialNumber: '', location: '', status: 'active' }); setNotice('Equipment saved successfully.'); if (isAdmin) loadEquipment() })
      .catch((requestError) => setError(requestError.message))
  }

  function changeUserRole(userId, role) {
    request(`/api/users/${userId}/role`, { method: 'PATCH', headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ role }) })
      .then((updatedUser) => { setUsers((currentUsers) => currentUsers.map((user) => user._id === updatedUser._id ? updatedUser : user)); setNotice('User role updated.') })
      .catch((requestError) => setError(requestError.message))
  }

  function removeUser(userId) {
    if (!window.confirm('Remove this user?')) return
    request(`/api/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } })
      .then(() => { setUsers((currentUsers) => currentUsers.filter((user) => user._id !== userId)); setNotice('User removed.') })
      .catch((requestError) => setError(requestError.message))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark small">AL</span><span>auditlog</span></div>
        <div className="topbar-right"><span className="status-dot" /><span>{session.user.email}</span><button className="text-button" onClick={onLogout}>Sign out</button></div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div><p className="eyebrow">Workspace</p><h1>System activity</h1><p className="muted">A clear trail for every important action.</p><nav className="side-nav">{['audit-history', 'record-management', 'warehouse-equipment', 'settings', 'personal-duty-roster', 'data-import-export', 'backup-restore', 'notice-board', 'whistleblowers'].map((section) => <button className={activeSection === section ? 'active' : ''} key={section} onClick={() => setActiveSection(section)}>{section.replaceAll('-', ' ')} <span>↗</span></button>)}</nav></div>
          <div className="sidebar-footer"><div className="avatar">{session.user.name?.slice(0, 1).toUpperCase()}</div><div><strong>{session.user.name}</strong><small>{session.user.role}</small></div></div>
        </aside>
        <section className={`content section-${activeSection}`}>
          <div className="content-heading"><div><p className="eyebrow">Workspace / {activeSection.replaceAll('-', ' ')}</p><h2>Good morning, {session.user.name?.split(' ')[0] || 'Admin'}.</h2><p className="muted heading-copy">Here&apos;s the latest activity across your system.</p></div><div className="heading-actions"><span className="role-pill">{isAdmin ? 'ADMIN VIEW' : 'USER VIEW'}</span>{isAdmin && activeSection === 'audit-history' && <button className="refresh-button" onClick={() => { loadRecords(); loadLogs(1) }} title="Refresh dashboard">↻ <span>Refresh</span></button>}</div></div>
          {activeSection !== 'audit-history' && activeSection !== 'record-management' && activeSection !== 'warehouse-equipment' && activeSection !== 'settings' && <div className="workspace-empty"><span className="workspace-icon">✦</span><p className="eyebrow">Workspace section</p><h3>{activeSection.replaceAll('-', ' ')}</h3><p className="muted">This workspace is ready for its next workflow.</p></div>}
          {activeSection === 'warehouse-equipment' && <section className="workspace-panel equipment-panel"><div><p className="eyebrow">Warehouse equipment</p><h3>Register equipment</h3><p className="muted">Users can keep equipment details here. Administrators can view the complete inventory.</p></div><form onSubmit={createEquipment}><input placeholder="Equipment name" value={equipmentForm.name} onChange={(event) => setEquipmentForm({ ...equipmentForm, name: event.target.value })} required /><input placeholder="Category" value={equipmentForm.category} onChange={(event) => setEquipmentForm({ ...equipmentForm, category: event.target.value })} required /><input placeholder="Serial number" value={equipmentForm.serialNumber} onChange={(event) => setEquipmentForm({ ...equipmentForm, serialNumber: event.target.value })} required /><input placeholder="Location" value={equipmentForm.location} onChange={(event) => setEquipmentForm({ ...equipmentForm, location: event.target.value })} required /><select value={equipmentForm.status} onChange={(event) => setEquipmentForm({ ...equipmentForm, status: event.target.value })}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option></select><button className="primary-button" type="submit">Save equipment <span>＋</span></button></form>{isAdmin && <div className="equipment-list"><p className="eyebrow">Admin inventory view</p>{equipment.length ? equipment.map((item) => <article className="equipment-item" key={item._id}><div><strong>{item.name}</strong><p>{item.category} · {item.serialNumber}</p><small>{item.location} · Added by {item.owner?.name || item.owner?.email}</small></div><span className={`status-tag ${item.status}`}>{item.status}</span></article>) : <p className="muted">No equipment has been registered yet.</p>}</div>}</section>}
          {activeSection === 'settings' && (isAdmin ? <section className="workspace-panel settings-panel"><div><p className="eyebrow">Settings</p><h3>Manage users</h3><p className="muted">Promote users to administrators or remove accounts from the system.</p></div><div className="user-list">{users.map((user) => <article className="user-item" key={user._id}><div><strong>{user.name}</strong><small>{user.email}</small></div><select value={user.role} onChange={(event) => changeUserRole(user._id, event.target.value)} disabled={user._id === session.user._id}><option value="user">User</option><option value="admin">Admin</option></select><button className="danger-button" disabled={user._id === session.user._id} onClick={() => removeUser(user._id)}>Remove</button></article>)}</div></section> : <div className="access-panel"><span className="lock">!</span><div><h3>Admin access required</h3><p>Only administrators can manage users and settings.</p></div></div>)}
          {notice && <div className="notice"><>{notice}</><button onClick={() => setNotice('')}>×</button></div>}
          {error && <div className="form-error banner">{error}</div>}
          {!isAdmin ? <div className="access-panel"><span className="lock">!</span><div><h3>Admin access required</h3><p>Your account is signed in, but only administrators can inspect the audit history.</p></div></div> : (
            <>
              <div className="stats"><div><span>Total events</span><strong className="total-events-value">{pagination.total.toLocaleString()}</strong><em>All recorded activity</em></div><div><span>Latest action</span><strong>{logs[0]?.action?.replaceAll('_', ' ') || '—'}</strong><em>Most recent event</em></div><div><span>Current page</span><strong>{pagination.page} <small>/ {pagination.pages || 1}</small></strong><em>Use arrows to browse</em></div></div>
              <div className="filter-bar"><select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}><option value="">All actions</option><option value="LOGIN">Login</option><option value="USER_CREATED">User created</option><option value="RECORD_CREATED">Record created</option><option value="RECORD_UPDATED">Record updated</option><option value="RECORD_DELETED">Record deleted</option></select><select value={filters.entityType} onChange={(event) => setFilters({ ...filters, entityType: event.target.value })}><option value="">All entities</option><option value="User">Users</option><option value="Record">Records</option></select><button className="primary-button compact" onClick={() => loadLogs(1)}>Apply filters</button></div>
              <div className="table-wrap"><table><thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>Source</th><th>Timestamp</th></tr></thead><tbody>{logs.length ? logs.map((log) => <tr key={log._id}><td><span className={`action-dot ${log.action.includes('DELETED') ? 'danger' : ''}`} />{log.action.replaceAll('_', ' ')}</td><td>{log.entityType}<small>{log.entityId?.slice(-8)}</small></td><td>{log.actor?.name || 'Unknown'}<small>{log.actor?.email}</small></td><td>{log.ipAddress || '—'}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>) : <tr><td colSpan="5" className="empty">No events match these filters.</td></tr>}</tbody></table></div>
              <div className="pagination"><span>{pagination.total} events recorded</span><div><button disabled={pagination.page <= 1} onClick={() => loadLogs(pagination.page - 1)}>←</button><button disabled={pagination.page >= pagination.pages} onClick={() => loadLogs(pagination.page + 1)}>→</button></div></div>
            </>
          )}
          {isAdmin ? <section className="record-panel"><div><p className="eyebrow">Admin record management</p><h3>All records</h3><p className="muted">Only administrators can update or delete records. Every change is added to the audit history.</p></div><div className="records-list">{records.length ? records.map((item) => editingRecord?._id === item._id ? <form className="record-item editing" key={item._id} onSubmit={updateRecord}><input value={editingRecord.title} onChange={(event) => setEditingRecord({ ...editingRecord, title: event.target.value })} required /><textarea value={editingRecord.content} onChange={(event) => setEditingRecord({ ...editingRecord, content: event.target.value })} required /><div className="record-actions"><button className="primary-button compact" type="submit">Save changes</button><button className="text-button" type="button" onClick={() => setEditingRecord(null)}>Cancel</button></div></form> : <article className="record-item" key={item._id}><div><strong>{item.title}</strong><p>{item.content}</p><small>Created by {item.owner?.name || item.owner?.email || 'Unknown user'} · Updated {new Date(item.updatedAt).toLocaleString()}</small></div><div className="record-actions"><button className="text-button" onClick={() => setEditingRecord({ _id: item._id, title: item.title, content: item.content })}>Update</button><button className="danger-button" onClick={() => deleteRecord(item._id)}>Delete</button></div></article>) : <p className="muted">No records available.</p>}</div></section> : <section className="record-panel"><div><p className="eyebrow">Create record</p><h3>Add a record</h3><p className="muted">You can create records. Only an administrator can update or delete them.</p></div><form onSubmit={createRecord}><input placeholder="Record title" value={record.title} onChange={(event) => setRecord({ ...record, title: event.target.value })} required /><textarea placeholder="What should be recorded?" value={record.content} onChange={(event) => setRecord({ ...record, content: event.target.value })} required /><button className="primary-button" type="submit">Create record <span>＋</span></button></form></section>}
        </section>
      </div>
    </main>
  )
}

export default App
