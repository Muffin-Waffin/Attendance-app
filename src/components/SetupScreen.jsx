import React, { useState, useEffect } from 'react';

export default function SetupScreen({ onSave }) {
  const [formUrl, setFormUrl] = useState('');
  const [csvUrl, setCsvUrl] = useState('');

  // Load saved URLs if they exist
  useEffect(() => {
    const savedFormUrl = localStorage.getItem('qr_form_url');
    const savedCsvUrl = localStorage.getItem('qr_csv_url');
    if (savedFormUrl) setFormUrl(savedFormUrl);
    if (savedCsvUrl) setCsvUrl(savedCsvUrl);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formUrl || !csvUrl) return;

    let finalCsvUrl = csvUrl;
    // Automatically convert standard Google Sheet URLs to export CSV format
    if (csvUrl.includes('/edit') || csvUrl.includes('/view')) {
      const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        finalCsvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    // Save to local storage for persistence
    localStorage.setItem('qr_form_url', formUrl);
    localStorage.setItem('qr_csv_url', finalCsvUrl);

    onSave({ formUrl, csvUrl: finalCsvUrl });
  };

  return (
    <div className="setup-container glass-panel">
      <h1 className="setup-title">Dashboard Setup</h1>
      <p className="setup-subtitle">
        Enter your Google Form and Sheet links to get started.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label" htmlFor="formUrl">Google Form URL</label>
          <input
            id="formUrl"
            type="url"
            className="input-field"
            placeholder="https://docs.google.com/forms/d/e/..."
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="csvUrl">Google Sheet Published CSV URL</label>
          <input
            id="csvUrl"
            type="url"
            className="input-field"
            placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Launch Dashboard
        </button>
      </form>
    </div>
  );
}
