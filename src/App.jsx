import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [urls, setUrls] = useState(() => {
    const savedForm = localStorage.getItem('qr_form_url');
    const savedCsv = localStorage.getItem('qr_csv_url');
    if (savedForm && savedCsv) {
      return { formUrl: savedForm, csvUrl: savedCsv };
    }
    return null;
  });

  const handleSaveUrls = (newUrls) => {
    setUrls(newUrls);
  };

  const handleReset = () => {
    // We intentionally don't clear localStorage here so they are pre-filled
    setUrls(null);
  };

  return (
    <>
      {!urls ? (
        <SetupScreen onSave={handleSaveUrls} />
      ) : (
        <Dashboard 
          formUrl={urls.formUrl} 
          csvUrl={urls.csvUrl} 
          onReset={handleReset} 
        />
      )}
    </>
  );
}

export default App;
