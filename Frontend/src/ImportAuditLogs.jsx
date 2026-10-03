import React, { useState } from 'react';

export default function ImportAuditLogs() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startImportProcess = () => {
    setIsProcessing(true);
    setCurrentStep(2);

    // Simulate stepping through validation, preview, confirmation, and processing
    setTimeout(() => setCurrentStep(3), 800);
    setTimeout(() => setCurrentStep(4), 1600);
    setTimeout(() => {
      setCurrentStep(5);
      setIsProcessing(false);
    }, 2400);
  };

  const resetImport = () => {
    setFile(null);
    setCurrentStep(1);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Import Audit Logs</h2>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Upload CSV or JSON files to batch import audit records into the central database.</p>
      </div>

      {/* 5-Step Progress Stepper (Screen 9 Header) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px auto' }}>
        {[
          { step: 1, label: 'Upload File' },
          { step: 2, label: 'Validate' },
          { step: 3, label: 'Preview' },
          { step: 4, label: 'Confirm' },
          { step: 5, label: 'Process' },
        ].map((item, idx) => (
          <React.Fragment key={item.step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: currentStep >= item.step ? '#2563eb' : '#f1f5f9',
                color: currentStep >= item.step ? '#fff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                {item.step}
              </div>
              <span style={{ fontSize: '11px', color: currentStep >= item.step ? '#0f172a' : '#94a3b8', fontWeight: currentStep === item.step ? 'bold' : 'normal' }}>
                {item.label}
              </span>
            </div>
            {idx < 4 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > item.step ? '#2563eb' : '#e2e8f0', margin: '0 8px', marginTop: '-18px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Screen 9: File Upload Stage */}
      {currentStep < 5 && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>☁️</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '4px' }}>
              Select a file to upload or drag & drop.
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Supported formats: CSV, JSON. (Max 10MB)
            </div>

            <input 
              type="file" 
              id="csvUpload" 
              accept=".csv,.json" 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
            <label htmlFor="csvUpload" style={{
              display: 'inline-block',
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Choose File
            </label>

            {file && (
              <div style={{ marginTop: '16px', fontSize: '13px', color: '#16a34a', fontWeight: 'bold' }}>
                Selected: {file.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={resetImport} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button 
              onClick={startImportProcess} 
              disabled={!file || isProcessing}
              style={{
                padding: '8px 20px',
                backgroundColor: file && !isProcessing ? '#2563eb' : '#94a3b8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: file && !isProcessing ? 'pointer' : 'not-allowed'
              }}
            >
              {isProcessing ? 'Processing File...' : 'Start Import'}
            </button>
          </div>
        </div>
      )}

      {/* Screen 10: Import Results Summary Stage */}
      {currentStep === 5 && (
        <div>
          {/* Success Banner */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '28px', backgroundColor: '#16a34a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d' }}>Import Completed</div>
              <div style={{ fontSize: '12px', color: '#166534' }}>Your file has been processed successfully.</div>
            </div>
          </div>

          {/* Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Records</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>500</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Successful</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>480</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Failed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>15</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Duplicates</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>5</div>
            </div>
          </div>

          {/* Failed Records Table */}
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Failed Records</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 16px' }}>#</th>
                <th style={{ padding: '10px 16px' }}>Row</th>
                <th style={{ padding: '10px 16px' }}>Error</th>
                <th style={{ padding: '10px 16px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px' }}>1</td>
                <td style={{ padding: '10px 16px' }}>25</td>
                <td style={{ padding: '10px 16px', color: '#dc2626' }}>Invalid date format</td>
                <td style={{ padding: '10px 16px', color: '#64748b' }}>2024-13-45</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px' }}>2</td>
                <td style={{ padding: '10px 16px' }}>78</td>
                <td style={{ padding: '10px 16px', color: '#dc2626' }}>Missing required field</td>
                <td style={{ padding: '10px 16px', color: '#64748b' }}>userId is required</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 16px' }}>3</td>
                <td style={{ padding: '10px 16px' }}>102</td>
                <td style={{ padding: '10px 16px', color: '#dc2626' }}>Invalid action type</td>
                <td style={{ padding: '10px 16px', color: '#64748b' }}>action must be a valid type</td>
              </tr>
            </tbody>
          </table>

          <button onClick={resetImport} style={{ marginTop: '20px', padding: '8px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Import Another File
          </button>
        </div>
      )}

    </div>
  );
}