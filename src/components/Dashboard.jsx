import React, { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Settings, Users, BarChart3, QrCode } from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

// Extract robust keys from CSV rows ignoring case
const getFieldValue = (row, fieldNames) => {
  const keys = Object.keys(row);
  for (const key of keys) {
    if (fieldNames.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      return row[key];
    }
  }
  return null;
};

export default function Dashboard({ formUrl, csvUrl, onReset }) {
  // Uses default localhost:3001 for WebSocket server
  const { data, loading, error } = useSheetData(csvUrl);

  // Process data for the chart
  const branchData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts = {};
    data.forEach(row => {
      let branch = getFieldValue(row, ['branch', 'course', 'department']);
      if (!branch) branch = 'Unknown';
      branch = branch.trim();
      counts[branch] = (counts[branch] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key]
    })).sort((a, b) => b.count - a.count); // sort descending
  }, [data]);

  // Reverse data to show latest first
  const recentResponders = useMemo(() => {
    if (!data) return [];
    return [...data].reverse();
  }, [data]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          <Users size={28} color="#3b82f6" />
          Live Event Dashboard
        </h1>
        <button onClick={onReset} className="btn-icon" title="Settings">
          <Settings size={20} />
        </button>
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#fca5a5' }}>
          Error loading data: {error}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column: QR Code */}
        <div className="panel glass-panel">
          <h2 className="panel-title">
            <QrCode size={20} />
            Scan to Join
          </h2>
          <div className="qr-container" style={{ background: '#ffffff' }}>
            <QRCodeCanvas 
              value={formUrl} 
              size={220}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
              style={{ borderRadius: '8px' }}
            />
            <p style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
              Point your camera at the QR code to fill out the form
            </p>
          </div>
        </div>

        {/* Middle Column: Recent Responders */}
        <div className="panel glass-panel">
          <h2 className="panel-title">
            <Users size={20} />
            Recent Responders {data && `(${data.length})`}
          </h2>
          
          <div className="responders-list">
            {loading && (!data || data.length === 0) ? (
              <div className="empty-state">Loading responses...</div>
            ) : recentResponders.length === 0 ? (
              <div className="empty-state">
                <Users size={48} opacity={0.2} />
                <p>No responses yet. Scan the QR code to be the first!</p>
              </div>
            ) : (
              recentResponders.map((row, i) => {
                const name = getFieldValue(row, ['name', 'first name']);
                const branch = getFieldValue(row, ['branch', 'course']);
                // Enrollment number is deliberately hidden
                
                if (!name && !branch) return null;

                return (
                  <div key={row._id || i} className="responder-item" style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>
                    <div className="responder-name">
                      {name || 'Anonymous'}
                    </div>
                    <div className="responder-meta">
                      {branch && <span className="responder-branch">{branch}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Branch Chart */}
        <div className="panel glass-panel">
          <h2 className="panel-title">
            <BarChart3 size={20} />
            Branch Distribution
          </h2>
          <div className="chart-container">
            {branchData.length === 0 ? (
              <div className="empty-state">Not enough data to plot</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={branchData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {branchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
