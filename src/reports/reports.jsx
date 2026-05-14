import { useState, useEffect } from 'react';
import { HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './reports.css';

const COLORS = ['#4f46e5', '#7c3aed', '#6366f1', '#818cf8', '#a78bfa'];

function ReportsPage() {
  const [stats, setStats] = useState({
    totalRegisteredVoters: 0,
    totalVotesCast: 0,
    settings: null
  });
  
  const [tallyData, setTallyData] = useState({
    candidates: [],
    positions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tallyRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/tally')
        ]);
        
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        if (tallyRes.data.success) {
          setTallyData({
            candidates: tallyRes.data.candidates,
            positions: tallyRes.data.positions
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Get winners per position
  const results = tallyData.positions.map(position => {
    const positionCandidates = tallyData.candidates.filter(c => c.position === position);
    const sorted = [...positionCandidates].sort((a, b) => b.votes - a.votes);
    const totalVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
    return {
      position,
      winner: sorted[0] || { name: 'None', votes: 0 },
      candidates: sorted,
      totalVotes,
    };
  });

  // Turnout data for pie chart
  const turnoutData = [
    { name: 'Voted', value: stats.totalVotesCast },
    { name: 'Not Voted', value: Math.max(0, stats.totalRegisteredVoters - stats.totalVotesCast) },
  ];

  const turnoutPercentage = stats.totalRegisteredVoters > 0 
    ? ((stats.totalVotesCast / stats.totalRegisteredVoters) * 100).toFixed(1) 
    : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = stats.settings?.election_title || 'Election Report';
    
    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text(title, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Add Stats Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Election Summary', 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Registered Voters', stats.totalRegisteredVoters.toLocaleString()],
        ['Total Votes Cast', stats.totalVotesCast.toLocaleString()],
        ['Voter Turnout', `${turnoutPercentage}%`],
        ['Total Positions', tallyData.positions.length.toString()],
        ['Total Candidates', tallyData.candidates.length.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    // Add Results per Position
    let currentY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.text('Detailed Results by Position', 14, currentY);
    currentY += 5;
    
    results.forEach((res, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text(res.position, 14, currentY + 5);
      
      const tableData = res.candidates.map(c => [
        c.name,
        c.party || c.partylist || 'Independent',
        c.votes.toString(),
        res.totalVotes > 0 ? `${((c.votes / res.totalVotes) * 100).toFixed(1)}%` : '0%'
      ]);
      
      autoTable(doc, {
        startY: currentY + 8,
        head: [['Candidate', 'Party', 'Votes', 'Percentage']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] },
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    });
    
    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
  };

  return (
    <div className="reports" id="reports-page">
      {/* Header */}
      <div className="reports__header">
        <div>
          <h1 className="reports__title">Election Reports</h1>
          <p className="reports__subtitle">{stats.settings?.election_title || 'Election Title'}</p>
        </div>
        <div className="reports__actions">
          <button className="reports__btn reports__btn--primary" id="export-report-btn" onClick={handleExportPDF}>
            <HiOutlineDocumentArrowDown /> Export PDF
          </button>
        </div>
      </div>

      {/* Turnout Summary */}
      <div className="reports__summary">
        <div className="reports__summary-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={turnoutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#4f46e5" />
                <Cell fill="#e2e8f0" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="reports__summary-center">
            <span className="reports__summary-pct">
              {turnoutPercentage}%
            </span>
            <span className="reports__summary-label">Turnout</span>
          </div>
        </div>

        <div className="reports__summary-stats">
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{stats.totalRegisteredVoters.toLocaleString()}</span>
            <span className="reports__summary-stat-label">Total Registered</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{stats.totalVotesCast.toLocaleString()}</span>
            <span className="reports__summary-stat-label">Total Votes Cast</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{tallyData.positions.length}</span>
            <span className="reports__summary-stat-label">Positions</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{tallyData.candidates.length}</span>
            <span className="reports__summary-stat-label">Total Candidates</span>
          </div>
        </div>
      </div>

      {/* Results Per Position */}
      <div className="reports__results">
        <h2 className="reports__section-title">Results by Position</h2>

        {results.map(({ position, winner, candidates: posCandidates }) => (
          <div key={position} className="reports__position-card">
            <div className="reports__position-header">
              <h3 className="reports__position-name">{position}</h3>
              <div className="reports__winner-badge">
                🏆 Winner: <strong>{winner.name}</strong> ({winner.votes} votes)
              </div>
            </div>

            <div className="reports__position-chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={posCandidates.map(c => ({ name: c.name, votes: c.votes }))} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} width={100} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                  <Bar dataKey="votes" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {posCandidates.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
