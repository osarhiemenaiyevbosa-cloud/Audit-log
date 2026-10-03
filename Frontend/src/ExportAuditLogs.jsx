import React, { useState } from 'react';

export default function ExportAuditLogs() {
  const [startDate, setStartDate] = useState('2024-08-01');
  const [endDate, setEndDate] = useState('2024-08-30');
  const [actionType, setActionType] = useState('All');
  const [user, setUser] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleExport = () => {
    setIsExporting(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsExporting(false);
      setStatusMessage('Export generated successfully! Download started.');
    }, 1200);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Export Audit Logs</h2>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Configure timeframe and filter options to generate custom log reports.</p>
      </div>

      {/* Two-Column Layout (Screen 11) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Export Settings Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>Export Settings</h3>

          {/* Date Range Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Date Range</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} 
              />
              <span style={{ color: '#94a3b8' }}>—</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} 
              />
            </div>
          </div>

          {/* Action Type Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Action Type</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value)} 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff' }}
            >
              <option value="All">All Actions</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Login">Login</option>
              <option value="Export">Export</option>
            </select>
          </div>

          {/* User Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>User</label>
            <select 
              value={user} 
              onChange={(e) => setUser(e.target.value)} 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff' }}
            >
              <option value="All">All Users</option>
              <option value="john@abc.com">John Doe (john@abc.com)</option>
              <option value="jane@abc.com">Jane Smith (jane@abc.com)</option>
              <option value="mike@xyz.com">Mike Johnson (mike@xyz.com)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              backgroundColor: isExporting ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isExporting ? 'Generating CSV...' : '📥 Export CSV'}
          </button>

          {statusMessage && (
            <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
              ✓ {statusMessage}
            </div>
          )}
        </div>

        {/* Right Column: Export Information Card */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>i</div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>Export Information</h4>
          </div>

          <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5', marginBottom: '16px' }}>
            The export will include all audit logs based on your selected filters. The file will be downloaded in standard CSV format.
          </p>

          <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '6px' }}>Note:</div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
            <li>Maximum export limit: 10,000 records per file</li>
            <li>Large exports may take a few minutes to process</li>
          </ul>
        </div>

      </div>

    </div>
  );
}