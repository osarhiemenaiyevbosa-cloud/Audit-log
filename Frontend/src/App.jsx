import React, { useState } from 'react';
import AuditLogHistory from './AuditLogHistory.jsx';
import ImportAuditLogs from './ImportAuditLogs.jsx';
import ExportAuditLogs from './ExportAuditLogs.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '220px', backgroundColor: '#0f172a', color: '#94a3b8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
          AuditLog
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('history')} style={navBtnStyle(activeTab === 'history')}>📄 Audit Logs</button>
          <button onClick={() => setActiveTab('companies')} style={navBtnStyle(activeTab === 'companies')}>🏢 Companies</button>
          <button onClick={() => setActiveTab('users')} style={navBtnStyle(activeTab === 'users')}>👥 Users</button>
          <button onClick={() => setActiveTab('import')} style={navBtnStyle(activeTab === 'import')}>📥 Import Logs</button>
          <button onClick={() => setActiveTab('export')} style={navBtnStyle(activeTab === 'export')}>📤 Export Logs</button>
          <button onClick={() => setActiveTab('notices')} style={navBtnStyle(activeTab === 'notices')}>📢 Notices</button>
          <button onClick={() => setActiveTab('notifications')} style={navBtnStyle(activeTab === 'notifications')}>🔔 Notifications</button>
          <button onClick={() => setActiveTab('whistleblower')} style={navBtnStyle(activeTab === 'whistleblower')}>📢 Whistleblower</button>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button style={navBtnStyle(false)}>⚙️ Settings</button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input type="text" placeholder="Search..." style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc' }} />
            <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8', fontSize: '14px' }}>🔍</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>A</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Admin</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>System Administrator</div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px' }}>
          {activeTab === 'history' && <AuditLogHistory />}
          {activeTab === 'import' && <ImportAuditLogs />}
          {activeTab === 'export' && <ExportAuditLogs />}
        </main>
      </div>

    </div>
  );
}

function navBtnStyle(isActive) {
  return {
    width: '100%',
    padding: '10px 14px',
    textAlign: 'left',
    backgroundColor: isActive ? '#2563eb' : 'transparent',
    color: isActive ? '#ffffff' : '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : 'normal',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };
}