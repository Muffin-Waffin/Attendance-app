import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { io } from 'socket.io-client';

export function useSheetData(csvUrl, serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!csvUrl) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        let finalCsvUrl = csvUrl;
        if (csvUrl.includes('/edit') || csvUrl.includes('/view')) {
          const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
            finalCsvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
          }
        }

        const response = await fetch(finalCsvUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch data from the Google Sheet. Please check the URL and ensure the sheet is accessible.');
        }
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Filter out empty rows and generate unique IDs for smooth React rendering
            const cleanData = results.data.filter(row => {
               return row['Name'] || row['Branch'] || Object.keys(row).some(k => k.toLowerCase().includes('name'));
            }).map((row, index) => {
              // Extract only Name and Branch, handling possible variations in casing
              const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name')) || 'Name';
              const branchKey = Object.keys(row).find(k => k.toLowerCase().includes('branch')) || 'Branch';
              
              return {
                Name: row[nameKey] || '',
                Branch: row[branchKey] || '',
                _id: `csv-${index}` // Stable ID based on initial position
              };
            });
            
            setData(cleanData);
            setError(null);
            setLoading(false);
          },
          error: (err) => {
            setError('Failed to parse CSV: ' + err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData(); // Initial fetch for historical data

    // Setup WebSocket connection for live updates
    const socket = io(serverUrl);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('new_response', (newRow) => {
      console.log('New real-time response received:', newRow);
      // Extract only Name and Branch
      const nameKey = Object.keys(newRow).find(k => k.toLowerCase().includes('name')) || 'Name';
      const branchKey = Object.keys(newRow).find(k => k.toLowerCase().includes('branch')) || 'Branch';

      // Generate a highly unique ID for the new row so React animations don't glitch
      const rowWithId = { 
        Name: newRow[nameKey] || '',
        Branch: newRow[branchKey] || '',
        _id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` 
      };
      
      setData(prevData => [...prevData, rowWithId]);
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [csvUrl, serverUrl]);

  return { data, loading, error };
}
