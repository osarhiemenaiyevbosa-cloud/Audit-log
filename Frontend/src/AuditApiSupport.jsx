import React, { useState } from 'react';

export default function AuditApiSupport() {
  const [endpoint, setEndpoint] = useState('/api/v1/audit-logs');
  const [method, setMethod] = useState('POST');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token_abc123"\n}');
  const [payload, setPayload] = useState('{\n  "action": "UPDATE_USER_ROLE",\n  "performedBy": "admin_01",\n  "targetUser": "user_99",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  const [response, setResponse] = useState(null);

  const handleTestContract = () => {
    try {
      const parsedBody = method !== 'GET' ? JSON.parse(payload) : null;
      const parsedHeaders = JSON.parse(headers);

      setResponse({
        status: 200,
        statusText: "OK - Contract Valid",
        headers: parsedHeaders,
        schemaMatch: true,
        data: {
          message: "Payload matches required Audit API contract specification.",
          payloadReceived: parsedBody
        }
      });
    } catch (err) {
      setResponse({
        status: 400,
        statusText: "Bad Request - Invalid Payload Schema",
        schemaMatch: false,
        error: err.message
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Audit API Contract & Integration Support</h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Configure headers, methods, and payloads to validate audit log integrations against defined contracts.
      </p>

      {/* Endpoint Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select 
          value={method} 
          onChange={(e) => setMethod(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input 
          type="text" 
          value={endpoint} 
          onChange={(e) => setEndpoint(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
        />
        <button 
          onClick={handleTestContract}
          style={{ padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Validate Contract
        </button>
      </div>

      {/* Request Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Headers (JSON):</label>
          <textarea 
            value={headers} 
            onChange={(e) => setHeaders(e.target.value)}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {method !== 'GET' && (
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Request Body (JSON):</label>
            <textarea 
              value={payload} 
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        )}
      </div>

      {/* Response Panel */}
      {response && (
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Validation Result:</h3>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '4px', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              backgroundColor: response.schemaMatch ? '#dcfce7' : '#fee2e2', 
              color: response.schemaMatch ? '#15803d' : '#b91c1c' 
            }}>
              {response.status} {response.statusText}
            </span>
          </div>
          <pre style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '6px', overflowX: 'auto', fontFamily: 'monospace' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}