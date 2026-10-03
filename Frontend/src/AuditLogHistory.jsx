import React, { useState } from 'react';

const mockLogs = [
  { id: 'LOG-2024-000123', timestamp: 'Aug 30, 2024 10:15:23', user: 'John Doe (john@abc.com)', action: 'Create', module: 'Audit Log', details: 'Created new audit entry for financial record', ip: '192.168.1.10', status: 'Success', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', rawData: { recordId: 'FIN-2024-001', amount: '15000', description: 'Payment to supplier', status: 'created' } },
  { id: 'LOG-2024-000124', timestamp: 'Aug 30, 2024 09:45:10', user: 'Jane Smith', action: 'Login', module: 'Auth', details: 'Successful login', ip: '192.168.1.11', status: 'Success', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', rawData: { session: 'sess_991823', method: '2FA_OAUTH' } },
  { id: 'LOG-2024-000125', timestamp: 'Aug 30, 2024 09:20:00', user: 'Mike Johnson', action: 'Update', module: 'Users', details: 'Updated user role', ip: '192.168.1.12', status: 'Success', userAgent: 'Mozilla/5.0 (Windows NT 10.0)', rawData: { targetUser: 'user_881', roleAssigned: 'Admin' } },
  { id: 'LOG-2024-000126', timestamp: 'Aug 29, 2024 16:30:15', user: 'John Doe', action: 'Export', module: 'Reports', details: 'Exported 500 records', ip: '192.168.1.13', status: 'Success', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', rawData: { format: 'CSV', recordCount: 500 } }
];

export default function AuditLogHistory() {
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState('');

  const filteredLogs = mockLogs.filter(log => 
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Audit Logs</h2>
          <p style={{ color: '#64748b', fontSize: '13px' }}>View and search all audit activities</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            📥 Export CSV
          </button>
          <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            📤 Import CSV
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px 8px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '220px' }}
        />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#64748b' }}>
          <option>Action Type: All</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#64748b' }}>
          <option>User: All</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#64748b' }}>
          <option>Date Range</option>
        </select>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px 16px' }}>#</th>
              <th style={{ padding: '12px 16px' }}>Timestamp ↑</th>
              <th style={{ padding: '12px 16px' }}>User</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
              <th style={{ padding: '12px 16px' }}>Module</th>
              <th style={{ padding: '12px 16px' }}>Details</th>
              <th style={{ padding: '12px 16px' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr 
                key={log.id} 
                onClick={() => setSelectedLog(log)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: selectedLog?.id === log.id ? '#eff6ff' : 'transparent' }}
              >
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{log.timestamp}</td>
                <td style={{ padding: '12px 16px', color: '#2563eb' }}>{log.user}</td>
                <td style={{ padding: '12px 16px' }}>{log.action}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{log.module}</td>
                <td style={{ padding: '12px 16px' }}>{log.details}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table Footer / Pagination */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
          <span>Showing 1 to {filteredLogs.length} of 1,248 records</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={pageBtnStyle(true)}>1</button>
            <button style={pageBtnStyle(false)}>2</button>
            <button style={pageBtnStyle(false)}>3</button>
            <span style={{ padding: '4px 8px' }}>...</span>
            <button style={pageBtnStyle(false)}>312</button>
          </div>
        </div>
      </div>

      {/* Side Details Drawer (Screen 8) */}
      {selectedLog && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', backgroundColor: '#fff', boxShadow: '-4px 0 12px rgba(0,0,0,0.15)', zIndex: 100, padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Log Details</h3>
            <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div><strong style={{ color: '#64748b' }}>ID:</strong> <div>{selectedLog.id}</div></div>
            <div><strong style={{ color: '#64748b' }}>Timestamp:</strong> <div>{selectedLog.timestamp}</div></div>
            <div><strong style={{ color: '#64748b' }}>User:</strong> <div style={{ color: '#2563eb' }}>{selectedLog.user}</div></div>
            <div><strong style={{ color: '#64748b' }}>Action:</strong> <div>{selectedLog.action}</div></div>
            <div><strong style={{ color: '#64748b' }}>Module:</strong> <div>{selectedLog.module}</div></div>
            <div><strong style={{ color: '#64748b' }}>Details:</strong> <div>{selectedLog.details}</div></div>
            <div><strong style={{ color: '#64748b' }}>IP Address:</strong> <div>{selectedLog.ip}</div></div>
            <div><strong style={{ color: '#64748b' }}>User Agent:</strong> <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedLog.userAgent}</div></div>
            <div>
              <strong style={{ color: '#64748b' }}>Status:</strong> 
              <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 'bold' }}>
                {selectedLog.status}
              </span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <strong style={{ color: '#64748b', display: 'block', marginBottom: '8px' }}>Related Data</strong>
              <pre style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a' }}>
                {JSON.stringify(selectedLog.rawData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function pageBtnStyle(active) {
  return {
    padding: '4px 10px',
    border: '1px solid #cbd5e1',
    backgroundColor: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#0f172a',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer'
  };
}