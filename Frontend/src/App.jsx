import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ROLES = ['SYSTEM_ADMIN', 'COMPANY_ADMIN', 'AUDITOR', 'USER', 'VIEWER'];
const readToken = () => localStorage.getItem('audit-token') || '';
const readUser = () => {
  try { return JSON.parse(localStorage.getItem('audit-user') || 'null'); } catch { return null; }
};
const date = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};
const initials = (value = 'Admin') => value.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const NAV = [
  { key: 'overview', label: 'Dashboard', icon: '▦' },
  { key: 'auditLogs', label: 'Audit logs', icon: '◷' },
  { key: 'companies', label: 'Companies', icon: '▤' },
  { key: 'assets', label: 'Company assets', icon: '▣' },
  { key: 'users', label: 'Users & roles', icon: '♧' },
  { key: 'import', label: 'Import / export', icon: '⇧' },
  { key: 'notices', label: 'Notices', icon: '▱' },
  { key: 'notifications', label: 'Notifications', icon: '♧' },
  { key: 'whistleblower', label: 'Whistleblower', icon: '◇' },
  { key: 'profile', label: 'My profile', icon: '◎' },
];

function Icon({ children }) { return <span aria-hidden="true" className="icon">{children}</span>; }

function App() {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(readUser);
  const [page, setPage] = useState('overview');
  const [data, setData] = useState({ dashboard: null, auditLogs: [], companies: [], assets: [], assetPagination: { page: 1, limit: 5, total: 0, pages: 0 }, users: [], notices: [], notifications: [], reports: [] });
  const [assetPage, setAssetPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ action: '', from: '', to: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [modal, setModal] = useState('');
  const [form, setForm] = useState({});
  const [companyId, setCompanyId] = useState('');
  const [publicReference, setPublicReference] = useState('');
  const [publicMode, setPublicMode] = useState(false);
  const [greeting] = useState(() => new Date().getHours() < 12 ? 'morning' : 'afternoon');
  const [currentYear] = useState(() => new Date().getFullYear());

  const request = useCallback(async (path, options = {}, auth = token) => {
    const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...options.headers };
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const isCsv = response.headers.get('content-type')?.includes('text/csv');
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || 'The request could not be completed.');
    }
    if (isCsv) return response.blob();
    return response.json();
  }, [token]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3800);
  };

  const loadPage = useCallback(async (nextPage = page, auth = token) => {
    if (!auth) return;
    setBusy(true);
    setError('');
    try {
      const tasks = {
        overview: async () => {
          const [summary, companies] = await Promise.all([request('/dashboard/summary', {}, auth), request('/companies', {}, auth)]);
          setData((old) => ({ ...old, dashboard: summary.data || summary, companies: companies.data || [] }));
        },
        auditLogs: async () => {
          if (user?.role !== 'SYSTEM_ADMIN') {
            setPage('overview');
            return;
          }
          const params = new URLSearchParams({ limit: '100' });
          if (search) params.set('search', search);
          if (filters.action) params.set('action', filters.action);
          if (filters.from) params.set('from', new Date(filters.from).toISOString());
          if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59`).toISOString());
          const result = await request(`/audit-logs?${params}`, {}, auth);
          setData((old) => ({ ...old, auditLogs: result.data || [] }));
        },
        companies: async () => { const result = await request('/companies', {}, auth); setData((old) => ({ ...old, companies: result.data || [] })); },
        assets: async () => {
          const params = new URLSearchParams({ page: String(assetPage), limit: '5' });
          if (search) params.set('search', search);
          const result = await request(`/assets?${params}`, {}, auth);
          setData((old) => ({ ...old, assets: result.data || [], assetPagination: result.pagination || { page: 1, limit: 5, total: 0, pages: 0 } }));
        },
        users: async () => { const result = await request('/users', {}, auth); setData((old) => ({ ...old, users: result.data || [] })); },
        notices: async () => { const result = await request('/notices/manage', {}, auth); setData((old) => ({ ...old, notices: result.data || [] })); },
        notifications: async () => { const result = await request('/notifications', {}, auth); const notifications = result.data || []; setData((old) => ({ ...old, notifications })); setNotificationCount(notifications.filter((item) => item.status === 'UNREAD').length); },
        whistleblower: async () => { const result = await request('/whistleblower/reports', {}, auth); setData((old) => ({ ...old, reports: result.data || [] })); },
      };
      if (tasks[nextPage]) await tasks[nextPage]();
    } catch (loadError) {
      setError(loadError.message);
    } finally { setBusy(false); }
  }, [token, page, request, search, filters, assetPage, user]);

  useEffect(() => {
    if (!token || page === 'profile' || page === 'import') return undefined;
    const timer = window.setTimeout(() => { loadPage(page); }, 0);
    return () => window.clearTimeout(timer);
  }, [token, page, loadPage]);

  const login = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(form) }, '');
      localStorage.setItem('audit-token', result.token); localStorage.setItem('audit-user', JSON.stringify(result.user));
      setToken(result.token); setUser(result.user); setPage('overview'); setForm({}); notify('Welcome back. You’re signed in.');
    } catch (loginError) { setError(loginError.message); }
    finally { setBusy(false); }
  };

  const registerCompany = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(form) }, '');
      setToast(result.message || 'Registration submitted for approval.'); setPublicMode(false); setPage('login'); setForm({});
    } catch (registrationError) { setError(registrationError.message); }
    finally { setBusy(false); }
  };

  const logout = () => {
    const activeToken = token;
    localStorage.removeItem('audit-token');
    localStorage.removeItem('audit-user');
    setToken('');
    setUser(null);
    setPage('login');
    setData({ dashboard: null, auditLogs: [], companies: [], assets: [], assetPagination: { page: 1, limit: 5, total: 0, pages: 0 }, users: [], notices: [], notifications: [], reports: [] });

    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeToken}` },
    }).then((response) => {
      if (!response.ok) console.warn('The session ended, but the logout audit event could not be recorded.');
    }).catch((logoutError) => {
      console.warn('The session ended, but the logout audit event could not be recorded:', logoutError);
    });
  };

  const submitForm = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      let result;
      if (modal === 'company') result = await request('/companies', { method: 'POST', body: JSON.stringify(form) });
      if (modal === 'user') result = await request('/users', { method: 'POST', body: JSON.stringify({ ...form, companyId: form.companyId || companyId }) });
      if (modal === 'asset') {
        const asset = { ...form };
        if (user?.role === 'SYSTEM_ADMIN') asset.companyId = form.companyId;
        const editing = Boolean(form._id);
        if (editing) {
          delete asset._id;
          result = await request(`/assets/${form._id}`, { method: 'PATCH', body: JSON.stringify(asset) });
        } else {
          result = await request('/assets', { method: 'POST', body: JSON.stringify(asset) });
        }
      }
      if (modal === 'notice') {
        const notice = { ...form };
        if (!notice.expiresAt) delete notice.expiresAt;
        result = await request('/notices', { method: 'POST', body: JSON.stringify(notice) });
      }
      if (modal === 'report') {
        result = await request('/whistleblower/reports', { method: 'POST', body: JSON.stringify(form) });
        setPublicReference(result.referenceCode || 'Submitted successfully');
        setPublicMode(true);
      }
      if (modal === 'profile') {
        const nextUser = { ...user, name: form.name, phone: form.phone || user?.phone };
        setUser(nextUser); localStorage.setItem('audit-user', JSON.stringify(nextUser));
        notify('Profile updated on this device.');
      } else if (modal !== 'report') notify('Changes saved successfully.');
      setModal(''); setForm({});
      if (modal !== 'profile' && modal !== 'report') await loadPage(modal === 'user' ? 'users' : modal === 'company' ? 'companies' : modal === 'asset' ? 'assets' : 'notices');
    } catch (submitError) { setError(submitError.message); }
    finally { setBusy(false); }
  };

  const importCsv = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Choose a CSV file to continue.'); return; }
    const body = new FormData(); body.append('file', file); setBusy(true); setError('');
    try {
      const result = await request('/audit-logs/import', { method: 'POST', body });
      setImportResult({ ...result.summary, errors: result.errors || [] }); notify('CSV import finished.');
    } catch (importError) { setError(importError.message); }
    finally { setBusy(false); }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const blob = await request('/audit-logs/export/csv');
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'audit-logs.csv'; anchor.click(); URL.revokeObjectURL(url);
      notify('Your audit log export is ready.');
    } catch (exportError) { setError(exportError.message); }
    finally { setBusy(false); }
  };

  const show = (key, initial = {}) => { setError(''); setForm(initial); setModal(key); };
  const filtered = (rows, keys) => rows.filter((row) => keys.some((key) => String(row[key] || '').toLowerCase().includes(search.toLowerCase())));
  const activities = data.dashboard?.recentActivity || [];
  const overview = data.dashboard || {};
  const visibleLogs = useMemo(() => data.auditLogs, [data.auditLogs]);

  const getLog = async (id) => {
    try { const result = await request(`/audit-logs/${id}`); setSelectedLog(result.data); }
    catch (detailError) { setError(detailError.message); }
  };

  const markNotification = async (item) => {
    if (item.status !== 'UNREAD') return;
    try { await request(`/notifications/${item._id}/read`, { method: 'PATCH' }); await loadPage('notifications'); }
    catch (notificationError) { setError(notificationError.message); }
  };

  const submitWhistleblower = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await request('/whistleblower/reports', { method: 'POST', body: JSON.stringify(form) });
      setPublicReference(result.referenceCode); setForm({});
    } catch (reportError) { setError(reportError.message); }
    finally { setBusy(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: form.name ?? user?.name ?? '', phone: form.phone ?? user?.phone ?? '' }),
      });
      setUser(result.user);
      localStorage.setItem('audit-user', JSON.stringify(result.user));
      notify('Your profile has been updated.');
    } catch (profileError) { setError(profileError.message); }
    finally { setBusy(false); }
  };

  const submit = (label, initial = {}) => <button className="primary-button" onClick={() => show(label, initial)} type="button"><Icon>＋</Icon>{label === 'company' ? 'Add company' : label === 'user' ? 'Add user' : 'New notice'}</button>;
  const statusBadge = (value) => <span className={`status-badge ${String(value || 'active').toLowerCase()}`}>{String(value || 'ACTIVE').replaceAll('_', ' ')}</span>;
  const headerActions = page === 'auditLogs' && user?.role === 'SYSTEM_ADMIN' ? <><button className="secondary-button" onClick={exportCsv} type="button">↓ Export CSV</button><button className="primary-button" onClick={() => setPage('import')} type="button">↑ Import CSV</button></> :
    page === 'companies' && user?.role === 'SYSTEM_ADMIN' ? submit('company') : page === 'assets' ? <button className="primary-button" onClick={() => show('asset', { category: 'EQUIPMENT', status: 'ACTIVE' })} type="button"><Icon>＋</Icon>Add asset</button> : page === 'users' ? submit('user') : page === 'notices' ? submit('notice') : null;

  const section = () => {
    if (page === 'overview') return <>
      <section className="welcome-card"><div><div className="eyebrow light">COMPLIANCE WORKSPACE · LIVE</div><h2>Good {greeting}, {user?.name?.split(' ')[0] || 'Admin'}</h2><p>Your organization's audit and compliance activity, all in one place.</p>{user?.role === 'SYSTEM_ADMIN' && <button className="hero-action" onClick={() => setPage('auditLogs')} type="button">Review audit activity <span>→</span></button>}</div><div className="hero-decoration"><span>✳</span></div></section>
      <div className="stats-grid">
        {user?.role === 'SYSTEM_ADMIN' && <Stat icon="◷" title="Total audit logs" value={overview.auditEvents ?? 0} foot="All recorded events" tone="violet" onClick={() => setPage('auditLogs')} />}
        <Stat icon="♧" title="Active users" value={overview.users ?? 0} foot="Across your workspace" tone="blue" onClick={() => setPage('users')} />
        <Stat icon="▤" title="Companies" value={overview.companies ?? 0} foot="Registered organizations" tone="green" onClick={() => setPage('companies')} />
        {['SYSTEM_ADMIN', 'COMPANY_ADMIN'].includes(user?.role) && <Stat icon="▣" title="Company assets" value={overview.assets ?? 0} foot="Vehicles, keys & equipment" tone="blue" onClick={() => setPage('assets')} />}
        <Stat icon="◇" title="New reports" value={overview.newWhistleblowerReports ?? 0} foot="Awaiting review" tone="amber" onClick={() => setPage('whistleblower')} />
      </div>
      <div className="overview-grid">
        {user?.role === 'SYSTEM_ADMIN' && <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MONITORING</span><h3>Recent activity</h3></div><button className="text-button" onClick={() => setPage('auditLogs')} type="button">View all →</button></div>
          {activities.length ? <div className="activity-list">{activities.slice(0, 6).map((item, index) => <div className="activity-item" key={item._id || index}><span className={`activity-mark mark-${index % 4}`}>{['↗', '◈', '＋', '✓'][index % 4]}</span><div className="activity-copy"><strong>{item.action || item.description || 'Audit event'}</strong><span>{item.description || item.resourceType || 'System activity'}</span></div><time>{date(item.timestamp)}</time></div>)}</div> : <Empty text="New audit events will appear here." />}</section>}
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ORGANIZATIONS</span><h3>Companies</h3></div><button className="text-button" onClick={() => setPage('companies')} type="button">View all →</button></div>
          {data.companies.length ? <div className="company-list">{data.companies.slice(0, 5).map((company) => <div className="company-item" key={company._id}><span className="company-mark">{initials(company.name)}</span><div className="activity-copy"><strong>{company.name}</strong><span>{company.email}</span></div>{statusBadge(company.status)}</div>)}</div> : <Empty text="No companies were returned." />}
        </section>
      </div>
    </>;

    if (page === 'auditLogs' && user?.role !== 'SYSTEM_ADMIN') return <section className="panel"><Empty text="Audit logs are available to system administrators only." /></section>;
    if (page === 'auditLogs') return <section className="panel table-panel"><div className="table-tools"><label className="search-box"><span>⌕</span><input aria-label="Search audit logs" placeholder="Search event or resource…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Filter action" value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}><option value="">All actions</option>{['LOGIN', 'LOGOUT', 'USER_CREATE', 'ROLE_CHANGE', 'COMPANY_CREATE', 'IMPORT_AUDIT', 'EXPORT_AUDIT'].map((item) => <option key={item}>{item}</option>)}</select><input aria-label="Start date" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /><input aria-label="End date" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></div>
      <div className="table-wrap"><table><thead><tr><th>EVENT</th><th>USER</th><th>ACTION</th><th>MODULE</th><th>DETAILS</th><th>IP ADDRESS</th><th>TIME</th></tr></thead><tbody>{visibleLogs.map((row) => <tr key={row._id}><td className="mono">{row.eventId || row._id}</td><td><strong>{row.actorId?.name || row.actorId?.email || 'System'}</strong></td><td>{statusBadge(row.action)}</td><td>{row.resourceType || '—'}</td><td>{row.description || row.resourceId || '—'}</td><td className="mono">{row.ipAddress || '—'}</td><td>{date(row.timestamp)}</td><td><button className="icon-button" title="View details" onClick={() => getLog(row._id)} type="button">↗</button></td></tr>)}</tbody></table>{!busy && !visibleLogs.length && <Empty text="No audit events match this search." />}</div>
      <div className="table-foot">Showing {visibleLogs.length} {visibleLogs.length === 1 ? 'event' : 'events'}{busy ? ' · Refreshing…' : ''}<span>Audit events are immutable and timestamped.</span></div></section>;

    if (page === 'assets') return <Collection title="Company asset register" description="Keep track of vehicles, equipment, keys, and other company property." search={search} setSearch={(value) => { setSearch(value); setAssetPage(1); }} count={data.assetPagination.total}>
      <table><thead><tr><th>ASSET</th><th>CATEGORY</th><th>ASSET TAG</th><th>SERIAL NUMBER</th><th>LOCATION</th><th>STATUS</th><th>ADDED</th><th>ACTIONS</th></tr></thead><tbody>{data.assets.map((asset) => <tr key={asset._id}><td><strong>{asset.name}</strong>{user?.role === 'SYSTEM_ADMIN' && <small className="asset-company">{asset.companyId?.name}</small>}</td><td>{asset.category}</td><td className="mono">{asset.assetTag || '—'}</td><td className="mono">{asset.serialNumber || '—'}</td><td>{asset.location || '—'}</td><td>{statusBadge(asset.status)}</td><td>{date(asset.createdAt)}</td><td><button className="icon-button" title={`Edit ${asset.name}`} aria-label={`Edit ${asset.name}`} type="button" onClick={() => show('asset', { ...asset, companyId: asset.companyId?._id || asset.companyId, category: asset.category, status: asset.status })}>✎</button><select aria-label={`Update ${asset.name} status`} value={asset.status} onChange={async (event) => { try { await request(`/assets/${asset._id}`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) }); await loadPage('assets'); } catch (statusError) { setError(statusError.message); } }}><option value="ACTIVE">ACTIVE</option><option value="MAINTENANCE">MAINTENANCE</option><option value="RETIRED">RETIRED</option></select></td></tr>)}</tbody></table>{!data.assets.length && <Empty text="Add your first company asset to start your register." />}{data.assetPagination.pages > 1 && <div className="pagination"><span>Showing {(assetPage - 1) * 5 + 1}–{Math.min(assetPage * 5, data.assetPagination.total)} of {data.assetPagination.total} assets</span><div><button className="secondary-button page-arrow" type="button" disabled={assetPage <= 1} onClick={() => setAssetPage((current) => current - 1)}>← Previous</button><span className="page-number">Page {assetPage} of {data.assetPagination.pages}</span><button className="secondary-button page-arrow" type="button" disabled={assetPage >= data.assetPagination.pages} onClick={() => setAssetPage((current) => current + 1)}>Next →</button></div></div>}
    </Collection>;

    if (page === 'companies') return <Collection title="Registered companies" description="Manage organization registration and approval status." search={search} setSearch={setSearch} count={filtered(data.companies, ['name', 'email', 'registrationNumber']).length}>
      <table><thead><tr><th>COMPANY</th><th>REGISTRATION</th><th>CONTACT EMAIL</th><th>STATUS</th><th>INDUSTRY</th><th>REGISTERED</th>{user?.role === 'SYSTEM_ADMIN' && <th>ACTIONS</th>}</tr></thead><tbody>{filtered(data.companies, ['name', 'email', 'registrationNumber']).map((row) => <tr key={row._id}><td><strong>{row.name}</strong></td><td className="mono">{row.registrationNumber || '—'}</td><td>{row.email}</td><td>{statusBadge(row.status)}</td><td>{row.industry || '—'}</td><td>{date(row.createdAt)}</td>{user?.role === 'SYSTEM_ADMIN' && <td><select aria-label={`Update ${row.name} status`} value={row.status || 'PENDING'} onChange={async (event) => { try { await request(`/companies/${row._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) }); await loadPage('companies'); } catch (statusError) { setError(statusError.message); } }}><option>APPROVED</option><option>PENDING</option><option>REJECTED</option><option>SUSPENDED</option></select></td>}</tr>)}</tbody></table>{!data.companies.length && <Empty text="No companies registered yet." />}
    </Collection>;

    if (page === 'users') return <Collection title="Workspace members" description="Manage team access and role-based permissions." search={search} setSearch={setSearch} count={filtered(data.users, ['name', 'email', 'role']).length}>
      <table><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th>LAST LOGIN</th><th>MEMBER SINCE</th><th>UPDATE ROLE</th></tr></thead><tbody>{filtered(data.users, ['name', 'email', 'role']).map((row) => <tr key={row._id}><td><div className="member-cell"><span className="avatar small">{initials(row.name)}</span><strong>{row.name}</strong></div></td><td>{row.email}</td><td>{statusBadge(row.role)}</td><td>{statusBadge(row.status)}</td><td>{date(row.lastLoginAt)}</td><td>{date(row.createdAt)}</td><td><select aria-label={`Change ${row.name}'s role`} value={row.role} onChange={async (event) => { try { await request(`/users/${row._id}/role`, { method: 'PATCH', body: JSON.stringify({ role: event.target.value }) }); await loadPage('users'); } catch (roleError) { setError(roleError.message); } }}>{ROLES.filter((role) => user?.role === 'SYSTEM_ADMIN' || !['SYSTEM_ADMIN', 'COMPANY_ADMIN'].includes(role)).map((role) => <option key={role}>{role}</option>)}</select></td></tr>)}</tbody></table>{!data.users.length && <Empty text="No team members were found." />}
    </Collection>;

    if (page === 'notices') return <Collection title="Notices & announcements" description="Publish important compliance updates to your organization." search={search} setSearch={setSearch} count={filtered(data.notices, ['title', 'body', 'status']).length}>
      <table><thead><tr><th>NOTICE</th><th>MESSAGE</th><th>STATUS</th><th>AUTHOR</th><th>CREATED</th><th>EXPIRES</th></tr></thead><tbody>{filtered(data.notices, ['title', 'body', 'status']).map((row) => <tr key={row._id}><td><strong>{row.title}</strong></td><td>{row.body?.slice(0, 100) || '—'}</td><td>{statusBadge(row.status)}</td><td>{row.createdBy?.name || '—'}</td><td>{date(row.createdAt)}</td><td>{date(row.expiresAt)}</td></tr>)}</tbody></table>{!data.notices.length && <Empty text="No notices have been published." />}
    </Collection>;

    if (page === 'notifications') return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">YOUR INBOX</span><h3>Notifications</h3></div><button className="secondary-button" onClick={async () => { try { await request('/notifications/read-all', { method: 'PATCH' }); await loadPage('notifications'); } catch (readError) { setError(readError.message); } }} type="button">Mark all as read</button></div>
      <div className="notification-list">{data.notifications.map((item) => <button className={`notification-item ${item.status === 'UNREAD' ? 'unread' : ''}`} key={item._id} onClick={() => markNotification(item)} type="button"><span className="activity-mark mark-0">◷</span><span className="activity-copy"><strong>{item.subject || item.type || 'Workspace update'}</strong><span>{item.message || 'You have a new notification.'}</span></span><time>{date(item.sentAt || item.createdAt)}</time>{item.status === 'UNREAD' && <span className="unread-dot" />}</button>)}{!data.notifications.length && <Empty text="You're all caught up. No notifications yet." />}</div>
    </section>;

    if (page === 'whistleblower') return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">CONFIDENTIAL CASES</span><h3>Whistleblower reports</h3></div></div><div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>CATEGORY</th><th>STATUS</th><th>ASSIGNED TO</th><th>SUBMITTED</th></tr></thead><tbody>{filtered(data.reports, ['referenceCode', 'category', 'status']).map((row) => <tr key={row._id}><td className="mono">{row.referenceCode}</td><td>{row.category || 'General'}</td><td>{statusBadge(row.status)}</td><td>{row.assignedTo?.name || 'Unassigned'}</td><td>{date(row.submittedAt || row.createdAt)}</td></tr>)}</tbody></table>{!data.reports.length && <Empty text="No reports have been submitted." />}</div><p className="privacy-note">Report contents are encrypted and are only decrypted when an authorized reviewer opens a case.</p></section>;

    if (page === 'import') return <div className="import-layout"><section className="panel import-panel"><div className="panel-heading"><div><span className="eyebrow">BULK DATA</span><h3>Import audit logs</h3><p>Upload a CSV to securely add historical events to your audit trail.</p></div><span className="step-pill">1&nbsp; Upload</span></div><label className="dropzone"><input type="file" accept=".csv,text/csv" onChange={(event) => importCsv(event.target.files?.[0])} /><span className="upload-icon">↑</span><strong>{busy ? 'Importing your records…' : 'Drop your CSV here, or browse'}</strong><span>CSV files up to 5 MB</span><span className="primary-button choose-button">Choose CSV file</span></label><p className="csv-hint">Required columns: <code>action</code> and <code>resourceType</code>. Optional columns: <code>eventId</code>, <code>timestamp</code>, <code>resourceId</code>, <code>status</code>, <code>description</code>, <code>metadata</code>.</p><button className="text-button" type="button" onClick={() => { const blob = new Blob(['eventId,timestamp,action,resourceType,resourceId,status,description\\nEVT-001,2026-10-01T09:00:00Z,LOGIN,User,user-001,SUCCESS,Example login\\n'], { type: 'text/csv' }); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'audit-import-template.csv'; anchor.click(); URL.revokeObjectURL(anchor.href); }}>↓ Download CSV template</button></section>
      {importResult && <section className="panel"><div className="import-success"><span>✓</span><div><strong>Import completed</strong><p>Your file has been processed.</p></div></div><div className="stats-grid import-stats"><Stat title="Total records" value={importResult.totalRows} tone="blue" /><Stat title="Successful" value={importResult.successRows} tone="green" /><Stat title="Failed" value={importResult.failedRows} tone="amber" /></div>{importResult.errors.length > 0 && <div className="table-wrap"><table><thead><tr><th>ROW</th><th>ERROR</th></tr></thead><tbody>{importResult.errors.map((item, index) => <tr key={index}><td>{item.row || '—'}</td><td>{item.error}</td></tr>)}</tbody></table></div>}</section>}
    </div>;

    if (page === 'profile') return <div className="profile-grid"><section className="panel profile-card"><div className="profile-cover" /><div className="profile-summary"><span className="avatar profile-avatar">{initials(user?.name)}</span><strong>{user?.name || 'Administrator'}</strong><span>{user?.email}</span><div>{statusBadge(user?.role)}</div></div><div className="profile-company"><span className="eyebrow">ACCOUNT</span><h3>{user?.role === 'SYSTEM_ADMIN' ? 'Central Audit Log' : user?.companyId?.name || 'Company workspace'}</h3><span>Member since {date(user?.createdAt)}</span></div></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">PERSONAL DETAILS</span><h3>Profile information</h3></div></div><form className="form-stack" onSubmit={saveProfile}><label>Full name<input value={form.name ?? user?.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email address<input value={user?.email || ''} disabled /></label><label>Account role<input value={user?.role || ''} disabled /></label><label>Phone number<input value={form.phone ?? user?.phone ?? ''} placeholder="+234 801 234 5678" onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>{error && <p className="error-message">{error}</p>}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save profile'}</button></form></section></div>;
    return null;
  };

  if (page === 'publicReport' || publicMode) return <main className="public-screen"><section className="public-card"><div className="public-brand"><span className="brand-mark">✓</span><div><strong>Central Audit Log</strong><small>Secure, independent, accountable</small></div></div>{publicReference ? <div className="reference-result"><span className="reference-check">✓</span><h1>Report received</h1><p>Your confidential report has been submitted securely. Save your reference number to check its status later.</p><code>{publicReference}</code><button className="secondary-button" type="button" onClick={() => { setPublicReference(''); setPublicMode(false); setPage('login'); }}>Return to sign in</button></div> : <>
      <span className="eyebrow">CONFIDENTIAL & SECURE</span><h1>Speak up. We'll listen.</h1><p className="public-subtitle">Share a concern safely. Reports are encrypted and reviewed only by authorized personnel.</p><form className="form-stack" onSubmit={submitWhistleblower}><label>What is your report about?<select value={form.category || 'GENERAL'} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="GENERAL">General concern</option><option value="FRAUD">Fraud or financial misconduct</option><option value="HARASSMENT">Harassment or discrimination</option><option value="SAFETY">Health and safety</option><option value="CORRUPTION">Bribery or corruption</option><option value="OTHER">Other</option></select></label><label>Tell us what happened<textarea minLength="10" maxLength="10000" required rows={6} placeholder="Include dates, locations, people involved, and any other details that might help." value={form.content || ''} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label><p className="privacy-note">Do not include your name or contact details unless you want us to know your identity. Your report is encrypted before it is stored.</p><button className="primary-button full-button" disabled={busy} type="submit">{busy ? 'Submitting securely…' : 'Submit confidential report'}</button></form></>}<button className="public-back" onClick={() => { setPublicMode(false); setPage('login'); }} type="button">← Back to administrator sign in</button></section></main>;

  if (!token || page === 'login' || page === 'register') return <main className="auth-screen"><section className="auth-aside"><a className="auth-brand" href="#login" onClick={() => setPage('login')}><span className="brand-mark">✓</span><span><strong>Audit<span>Log</span></strong><small>TRUST, IN EVERY DETAIL</small></span></a><div className="auth-copy"><span className="eyebrow light">THE CLARITY TO ACT. THE PROOF TO TRUST.</span><h1>{page === 'register' ? 'Your compliance, built on trust.' : 'Every action has a story.'}</h1><p>One secure place to see what happened, understand why, and make your next decision with confidence.</p><div className="auth-proof"><span>✓</span> Tamper-evident by design <span>·</span> Encryption at rest <span>·</span> Built for accountability</div></div><div className="auth-aside-foot">CENTRAL AUDIT LOG <span>·</span> SECURE COMPLIANCE WORKSPACE</div><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /></section><section className="auth-main"><div className="auth-card">{page === 'register' ? <>
      <span className="eyebrow accent">GET STARTED</span><h2>Register your company</h2><p className="auth-description">Create your organization’s secure compliance workspace.</p><form className="form-stack" onSubmit={registerCompany}><label>Company name<input required value={form.companyName || ''} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label><label>Registration number<input required value={form.registrationNumber || ''} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} /></label><label>Company email<input type="email" required value={form.companyEmail || ''} onChange={(event) => setForm({ ...form, companyEmail: event.target.value })} /></label><label>Your full name<input required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input type="email" required value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Password<input type="password" minLength="8" required value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Use at least 8 characters.</small></label>{error && <p className="error-message">{error}</p>}<button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Creating account…' : 'Create company account →'}</button></form><p className="auth-switch">Already registered? <button onClick={() => { setPage('login'); setError(''); }} type="button">Sign in</button></p>
    </> : <><span className="eyebrow accent">ADMINISTRATOR ACCESS</span><h2>Welcome back</h2><p className="auth-description">Sign in to your secure compliance workspace.</p><form className="form-stack" onSubmit={login}><label>Work email<input autoComplete="username" type="email" required placeholder="you@company.com" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Password<input autoComplete="current-password" type="password" required placeholder="Enter your password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{error && <p className="error-message">{error}</p>}<div className="login-options"><label className="remember-option"><input type="checkbox" /> Remember me</label><span>Protected with secure authentication</span></div><button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in securely →'}</button></form><p className="auth-switch">New to AuditLog? <button onClick={() => { setPage('register'); setForm({}); setError(''); }} type="button">Register your company</button></p><button className="public-link" type="button" onClick={() => { setPublicMode(true); setPublicReference(''); }}>Need to report a concern? <span>Submit a confidential report →</span></button></>}
    </div><span className="auth-legal">Protected information · Authorized access only</span></section>{toast && <div className="toast" role="status">{toast}</div>}</main>;

  return <div className="admin-layout"><aside className="sidebar"><a className="sidebar-header" href="#dashboard" onClick={() => setPage('overview')}><span className="brand-mark">✓</span><span><strong>AuditLog</strong><small>SECURE WORKSPACE</small></span></a><span className="sidebar-label">WORKSPACE</span><nav className="sidebar-nav">{NAV.filter((item) => (item.key !== 'assets' || ['SYSTEM_ADMIN', 'COMPANY_ADMIN'].includes(user?.role)) && (item.key !== 'auditLogs' || user?.role === 'SYSTEM_ADMIN')).map((item) => <button className={`nav-item ${page === item.key ? 'active' : ''}`} type="button" key={item.key} onClick={() => { setPage(item.key); setSearch(''); setAssetPage(1); setError(''); }}><Icon>{item.icon}</Icon>{item.label}{item.key === 'notifications' && notificationCount > 0 && <span className="nav-count">{notificationCount}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="connection-card"><span className="online-dot" /><div><strong>Secure connection</strong><small>API workspace</small></div></div><button className="sidebar-account" type="button" onClick={() => setPage('profile')}><span className="avatar">{initials(user?.name)}</span><span className="account-details"><strong>{user?.name || 'Administrator'}</strong><small>{String(user?.role || 'SYSTEM_ADMIN').replaceAll('_', ' ')}</small></span><span className="account-menu">···</span></button><button className="logout-link" type="button" onClick={logout}>↗&nbsp; Sign out</button></div></aside><main className="main-area"><header className="topbar"><div><span className="breadcrumb">WORKSPACE&nbsp; / &nbsp;{NAV.find((item) => item.key === page)?.label.toUpperCase()}</span><h1>{page === 'overview' ? 'Dashboard' : NAV.find((item) => item.key === page)?.label || 'Dashboard'}</h1></div><div className="topbar-actions"><button className="notification-trigger" aria-label={`${notificationCount} unread notifications`} onClick={() => setPage('notifications')} type="button">♧{notificationCount > 0 && <i />}</button><span className="topbar-divider" /><button className="user-pill" type="button" onClick={() => setPage('profile')}><span className="avatar small">{initials(user?.name)}</span><span><strong>{user?.name || 'Administrator'}</strong><small>{String(user?.role || 'SYSTEM_ADMIN').replaceAll('_', ' ')}</small></span><span>⌄</span></button><button className="topbar-signout" type="button" onClick={logout}>Sign out</button></div></header><div className="page-heading"><div><h2>{page === 'overview' ? 'Your organization at a glance' : NAV.find((item) => item.key === page)?.label}</h2><p>{page === 'overview' ? 'A real-time view of your compliance workspace.' : page === 'auditLogs' ? 'View, filter, and export your complete activity history.' : page === 'import' ? 'Bring historical audit records into your secure activity trail.' : page === 'assets' ? 'Manage your company property with five assets per page.' : 'Review and manage your secure compliance workspace.'}</p></div><div className="heading-actions">{headerActions}</div></div>{error && <div className="error-banner" role="alert"><span>!</span>{error}<button aria-label="Dismiss error" onClick={() => setError('')} type="button">×</button></div>}{busy && !['import', 'profile'].includes(page) && <div className="loading-line" />}{section()}<footer className="app-footer"><span>© {currentYear} Central Audit Log</span><span><span className="online-dot" /> All systems operational · Your events are protected</span></footer></main>{toast && <div className="toast" role="status">{toast}</div>}
    {selectedLog && <div className="modal-backdrop" onClick={() => setSelectedLog(null)} role="presentation"><section className="modal-card detail-card" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">IMMUTABLE RECORD</span><h3>Event details</h3></div><button aria-label="Close details" className="close-button" onClick={() => setSelectedLog(null)} type="button">×</button></div><dl className="detail-list">{[['Event ID', selectedLog.eventId || selectedLog._id], ['Timestamp', date(selectedLog.timestamp)], ['User', selectedLog.actorId?.name || selectedLog.actorId?.email || 'System'], ['Action', selectedLog.action], ['Module', selectedLog.resourceType], ['Resource ID', selectedLog.resourceId], ['Description', selectedLog.description], ['IP address', selectedLog.ipAddress], ['Result', selectedLog.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>{(selectedLog.before || selectedLog.after || selectedLog.metadata) && <div className="related-data"><span className="eyebrow">EVENT DATA</span><pre>{JSON.stringify({ ...(selectedLog.before ? { before: selectedLog.before } : {}), ...(selectedLog.after ? { after: selectedLog.after } : {}), ...(selectedLog.metadata ? { metadata: selectedLog.metadata } : {}) }, null, 2)}</pre></div>}</section></div>}
    {modal && modal !== 'report' && <div className="modal-backdrop" onClick={() => setModal('')} role="presentation"><section className="modal-card" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">WORKSPACE MANAGEMENT</span><h3>{modal === 'company' ? 'Register a company' : modal === 'user' ? 'Invite a team member' : modal === 'asset' ? (form._id ? 'Edit company asset' : 'Register company asset') : modal === 'notice' ? 'Create a notice' : 'Update profile'}</h3></div><button className="close-button" onClick={() => setModal('')} type="button">×</button></div><form className="form-stack" onSubmit={submitForm}>{modal === 'company' && <><label>Company name<input required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Registration number<input required value={form.registrationNumber || ''} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} /></label><label>Company email<input type="email" required value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Phone number<input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>Industry<input value={form.industry || ''} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label></>}{modal === 'user' && <><label>Full name<input required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input required type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Temporary password<input required minLength="8" type="password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{user?.role === 'SYSTEM_ADMIN' && <label>Company<select value={form.companyId || companyId} onChange={(event) => { setForm({ ...form, companyId: event.target.value }); setCompanyId(event.target.value); }} required><option value="">Choose a company</option>{data.companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}</select></label>}<label>Role<select value={form.role || 'USER'} onChange={(event) => setForm({ ...form, role: event.target.value })}>{ROLES.filter((role) => user?.role === 'SYSTEM_ADMIN' || !['SYSTEM_ADMIN', 'COMPANY_ADMIN'].includes(role)).map((role) => <option key={role}>{role}</option>)}</select></label></>}{modal === 'asset' && <><label>Asset name<input required maxLength="150" placeholder="e.g. Toyota Hilux" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Category<select required value={form.category || 'EQUIPMENT'} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['VEHICLE', 'EQUIPMENT', 'KEY', 'PROPERTY', 'FURNITURE', 'IT EQUIPMENT', 'OTHER'].map((category) => <option key={category}>{category}</option>)}</select></label><label>Asset tag<input maxLength="80" placeholder="e.g. AST-001" value={form.assetTag || ''} onChange={(event) => setForm({ ...form, assetTag: event.target.value })} /></label><label>Serial number<input maxLength="120" value={form.serialNumber || ''} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} /></label><label>Location<input maxLength="160" placeholder="e.g. Lagos office" value={form.location || ''} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Description<textarea maxLength="2000" rows="3" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Status<select value={form.status || 'ACTIVE'} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">Active</option><option value="MAINTENANCE">Under maintenance</option><option value="RETIRED">Retired</option></select></label>{user?.role === 'SYSTEM_ADMIN' && <label>Company<select value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })} required><option value="">Choose a company</option>{data.companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}</select></label>}</>}{modal === 'notice' && <><label>Title<input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Message<textarea required rows="5" value={form.body || ''} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label><label>Publish status<select value={form.status || 'PUBLISHED'} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="PUBLISHED">Publish now</option><option value="DRAFT">Save draft</option></select></label><label>Expiry date<input type="date" value={form.expiresAt || ''} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label></>}{error && <p className="error-message">{error}</p>}<button className="primary-button full-button" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button></form></section></div>}
  </div>;
}

function Stat({ icon, title, value, foot, tone = 'blue', onClick }) {
  return <button className="stat-card" type="button" onClick={onClick}><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{title}</span><strong>{value ?? 0}</strong><span className="stat-foot">{foot}</span></button>;
}

function Empty({ text }) { return <div className="empty-state"><span className="empty-icon">⌁</span><strong>Nothing to show just yet</strong><span>{text}</span></div>; }

function Collection({ title, description, search, setSearch, count, children }) {
  return <section className="panel table-panel"><div className="collection-heading"><div><h3>{title}</h3><p>{description}</p></div><span className="record-count">{count} records</span></div><div className="collection-tools"><label className="search-box"><span>⌕</span><input placeholder="Search records…" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><div className="table-wrap">{children}</div></section>;
}

export default App;
