import { useState, useEffect } from 'react';
import { 
  HiOutlineArchiveBox, 
  HiOutlineArrowLeft, 
  HiOutlineDocumentArrowDown, 
  HiOutlineAcademicCap,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineArrowTrendingUp
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './archives.css';

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#6366f1', '#818cf8', '#a78bfa', '#8b5cf6'];

// Helper: normalize turnout entries — supports both old (plain number) and new ({voted, total}) formats
function normalizeTurnout(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return [];
  return Object.entries(rawObj).map(([name, val]) => {
    if (typeof val === 'object' && val !== null) {
      const voted = Number(val.voted || 0);
      const total = Number(val.total || 0);
      return { name, voted, total, notVoted: Math.max(total - voted, 0), pct: total > 0 ? ((voted / total) * 100).toFixed(1) : '0.0' };
    }
    // Legacy plain-number format (voted count only, no total available)
    const voted = Number(val || 0);
    return { name, voted, total: voted, notVoted: 0, pct: '100.0' };
  });
}

function ArchivesPage() {
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [archiveYear, setArchiveYear] = useState('');
  const [resetCandidates, setResetCandidates] = useState(true);
  const [archiveError, setArchiveError] = useState('');
  
  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

  // Fetch archives list
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/archives');
      if (res.data.success) {
        setArchives(res.data.archives);
      }
    } catch (err) {
      console.error('Failed to fetch past archives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // Fetch details of selected archive
  const handleSelectArchive = async (id) => {
    try {
      const res = await api.get(`/api/archives/${id}`);
      if (res.data.success) {
        setSelectedArchive(res.data.archive);
      }
    } catch (err) {
      console.error('Failed to load archive details:', err);
    }
  };

  // Delete an archive
  const handleDeleteArchive = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this election archive? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await api.delete(`/api/archives/${id}`);
      if (res.data.success) {
        fetchArchives();
        if (selectedArchive?.id === id) {
          setSelectedArchive(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete archive:', err);
    }
  };

  // Perform archiving of current election
  const handleCreateArchive = async (e) => {
    e.preventDefault();
    setArchiveError('');
    if (!/^\d{4}$/.test(archiveYear)) {
      setArchiveError('Please enter a valid 4-digit year (e.g. 2026).');
      return;
    }

    try {
      const res = await api.post('/api/archives', {
        election_year: archiveYear,
        delete_candidates: resetCandidates
      });
      if (res.data.success) {
        setModalOpen(false);
        setArchiveYear('');
        fetchArchives();
        alert(res.data.message);
      }
    } catch (err) {
      setArchiveError(err.response?.data?.message || 'Failed to archive active election.');
    }
  };

  // Export archive details to PDF
  const handleExportPDF = () => {
    if (!selectedArchive) return;
    
    const doc = new jsPDF();
    const title = selectedArchive.election_title;
    const year = selectedArchive.election_year;
    
    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(`${title} (Archive)`, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Election Year: ${year}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);
    
    // Add Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Election Performance Summary', 14, 46);
    
    const turnoutPct = selectedArchive.total_voters > 0 
      ? ((selectedArchive.total_votes / selectedArchive.total_voters) * 100).toFixed(1) 
      : 0;

    autoTable(doc, {
      startY: 51,
      head: [['Key Indicator', 'Record Value']],
      body: [
        ['Total Enrolled Voters', selectedArchive.total_voters.toLocaleString()],
        ['Total Ballots Cast', selectedArchive.total_votes.toLocaleString()],
        ['Election Voter Turnout', `${turnoutPct}%`],
        ['Start Date', selectedArchive.start_date ? new Date(selectedArchive.start_date).toLocaleDateString() : 'N/A'],
        ['End Date', selectedArchive.end_date ? new Date(selectedArchive.end_date).toLocaleDateString() : 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    let currentY = doc.lastAutoTable.finalY + 12;

    // Turnout by course
    const courseTurnout = normalizeTurnout(selectedArchive.votes_data?.turnout_by_course);
    if (courseTurnout.length > 0) {
      doc.setFontSize(14);
      doc.text('Voter Turnout by Academic Course', 14, currentY);
      currentY += 5;

      const courseRows = courseTurnout.map(row => [
        row.name,
        row.voted.toLocaleString(),
        row.total.toLocaleString(),
        `${row.pct}%`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Course', 'Voted', 'Total Students', 'Turnout %']],
        body: courseRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }

    // Turnout by year level
    const yearTurnout = normalizeTurnout(selectedArchive.votes_data?.turnout_by_year);
    if (yearTurnout.length > 0) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.text('Voter Turnout by Year Level', 14, currentY);
      currentY += 5;

      const yearRows = yearTurnout.map(row => [
        row.name,
        row.voted.toLocaleString(),
        row.total.toLocaleString(),
        `${row.pct}%`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Year Level', 'Voted', 'Total Students', 'Turnout %']],
        body: yearRows,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237] },
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }

    // Results per Position
    doc.setFontSize(14);
    doc.text('Archived Results by Position', 14, currentY);
    currentY += 5;

    const candidates = selectedArchive.candidates_data || [];
    const positions = [...new Set(candidates.map(c => c.position))];

    positions.forEach((pos) => {
      const posCandidates = candidates.filter(c => c.position === pos).sort((a, b) => b.votes - a.votes);
      const posTotalVotes = posCandidates.reduce((sum, c) => sum + parseInt(c.votes || 0, 10), 0);

      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text(pos, 14, currentY + 5);

      const tableData = posCandidates.map(c => [
        c.name,
        c.party || 'Independent',
        c.votes.toString(),
        posTotalVotes > 0 ? `${((c.votes / posTotalVotes) * 100).toFixed(1)}%` : '0%'
      ]);

      autoTable(doc, {
        startY: currentY + 8,
        head: [['Candidate Name', 'Party List Affiliation', 'Votes Gained', 'Vote Percentage']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`${title.replace(/\s+/g, '_')}_Archive_Report.pdf`);
  };

  // Group winners by position for detailed view dashboard
  const getWinners = () => {
    if (!selectedArchive) return [];
    const candidates = selectedArchive.candidates_data || [];
    const positions = [...new Set(candidates.map(c => c.position))];
    
    return positions.map(pos => {
      const posCandidates = candidates.filter(c => c.position === pos);
      const sorted = [...posCandidates].sort((a, b) => b.votes - a.votes);
      return {
        position: pos,
        winner: sorted[0] || { name: 'None', votes: 0 },
        candidates: sorted
      };
    });
  };

  return (
    <div className="archives" id="archives-page">
      {/* Header Area */}
      <div className="archives__header-section">
        <div className="archives__title-group">
          <div className="archives__badge">Election Vault</div>
          <h1 className="archives__title">
            {selectedArchive ? `${selectedArchive.election_title}` : 'Past Election Archives'}
          </h1>
          <p className="archives__subtitle">
            {selectedArchive 
              ? `Year ${selectedArchive.election_year} • Analytics Dashboard` 
              : 'Secure record archives for previous Student Council Elections'}
          </p>
        </div>

        <div className="archives__actions">
          {selectedArchive ? (
            <>
              <button 
                className="archives__btn archives__btn--secondary"
                onClick={() => setSelectedArchive(null)}
              >
                <HiOutlineArrowLeft /> Back to List
              </button>
              <button 
                className="archives__btn archives__btn--primary"
                onClick={handleExportPDF}
              >
                <HiOutlineDocumentArrowDown /> Export PDF
              </button>
            </>
          ) : (
            <button 
              className="archives__btn archives__btn--primary"
              onClick={() => setModalOpen(true)}
            >
              <HiOutlinePlusCircle /> Archive Active Election
            </button>
          )}
        </div>
      </div>

      {/* Archives Dashboard Mode */}
      {selectedArchive ? (
        <div className="archive-detail">
          {/* Stats Cards */}
          <div className="analytics-grid">
            <div className="analytic-card">
              <span className="analytic-card__label">Total Enrolled Voters</span>
              <span className="analytic-card__value">
                {selectedArchive.total_voters.toLocaleString()}
              </span>
              <span className="analytic-card__desc">Registered voter population</span>
            </div>

            <div className="analytic-card">
              <span className="analytic-card__label">Total Ballots Cast</span>
              <span className="analytic-card__value">
                {selectedArchive.total_votes.toLocaleString()}
              </span>
              <span className="analytic-card__desc">Validated successfully</span>
            </div>

            <div className="analytic-card">
              <span className="analytic-card__label">Turnout Rate</span>
              <span className="analytic-card__value">
                {selectedArchive.total_voters > 0 
                  ? ((selectedArchive.total_votes / selectedArchive.total_voters) * 100).toFixed(1) 
                  : 0}%
              </span>
              <span className="analytic-card__desc">Total voting participation</span>
            </div>

            <div className="analytic-card">
              <span className="analytic-card__label">Timeline</span>
              <span className="analytic-card__value" style={{ fontSize: '1.25rem', paddingTop: '10px' }}>
                {selectedArchive.start_date ? new Date(selectedArchive.start_date).toLocaleDateString() : 'N/A'}
              </span>
              <span className="analytic-card__desc">Election commencement date</span>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="archive-detail__content">
            {/* Winners List */}
            <div className="winners-box">
              <h3 className="winners-box__title">
                🏆 Elected Winners
              </h3>
              <div className="winners-box__list">
                {getWinners().map(({ position, winner }) => (
                  <div className="winner-item" key={position}>
                    <span className="winner-item__pos">{position}</span>
                    <div className="winner-item__details">
                      <div className="winner-item__avatar">
                        {winner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="winner-item__info">
                        <span className="winner-item__name">{winner.name}</span>
                        <span className="winner-item__party">{winner.party || 'Independent'}</span>
                      </div>
                      <span className="winner-item__votes">{winner.votes} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics charts per position */}
            <div className="charts-area">
              {getWinners().map(({ position, candidates }) => (
                <div className="chart-card" key={position}>
                  <div className="chart-card__header">
                    <h4 className="chart-card__title">
                      Vote Tally Breakdown: {position}
                    </h4>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart 
                      data={candidates.map(c => ({ name: c.name, votes: parseInt(c.votes || 0, 10) }))} 
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#1e293b', 
                          border: 'none', 
                          borderRadius: '10px', 
                          color: '#fff', 
                          fontSize: '12px' 
                        }} 
                      />
                      <Bar dataKey="votes" radius={[8, 8, 0, 0]} maxBarSize={45}>
                        {candidates.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}

              {/* Turnout Breakdowns Charts */}
              <div className="turnout-charts-grid">
                {selectedArchive.votes_data?.turnout_by_course && (
                  <div className="chart-card">
                    <div className="chart-card__header">
                      <h4 className="chart-card__title">Turnout by Academic Course</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart 
                        data={normalizeTurnout(selectedArchive.votes_data.turnout_by_course)}
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                          formatter={(value, name) => [value, name === 'voted' ? 'Voted' : 'Did Not Vote']}
                        />
                        <Bar dataKey="voted" stackId="turnout" fill="#4f46e5" radius={[0, 0, 0, 0]} maxBarSize={35} name="Voted" />
                        <Bar dataKey="notVoted" stackId="turnout" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={35} name="Did Not Vote" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="turnout-legend">
                      {normalizeTurnout(selectedArchive.votes_data.turnout_by_course).map(row => (
                        <div className="turnout-legend__item" key={row.name}>
                          <span className="turnout-legend__name">{row.name}</span>
                          <span className="turnout-legend__stat">{row.voted}/{row.total} ({row.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedArchive.votes_data?.turnout_by_year && (
                  <div className="chart-card">
                    <div className="chart-card__header">
                      <h4 className="chart-card__title">Turnout by Year Level</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart 
                        data={normalizeTurnout(selectedArchive.votes_data.turnout_by_year)}
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                          formatter={(value, name) => [value, name === 'voted' ? 'Voted' : 'Did Not Vote']}
                        />
                        <Bar dataKey="voted" stackId="turnout" fill="#8b5cf6" radius={[0, 0, 0, 0]} maxBarSize={35} name="Voted" />
                        <Bar dataKey="notVoted" stackId="turnout" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={35} name="Did Not Vote" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="turnout-legend">
                      {normalizeTurnout(selectedArchive.votes_data.turnout_by_year).map(row => (
                        <div className="turnout-legend__item" key={row.name}>
                          <span className="turnout-legend__name">{row.name}</span>
                          <span className="turnout-legend__stat">{row.voted}/{row.total} ({row.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Archive List Mode */
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-500)' }}>Loading archive databases...</div>
          ) : archives.length > 0 ? (
            <div className="archives__grid">
              {archives.map(archive => {
                const pct = archive.total_voters > 0 
                  ? ((archive.total_votes / archive.total_voters) * 100).toFixed(1) 
                  : 0;
                return (
                  <div 
                    className="archive-card" 
                    key={archive.id}
                    onClick={() => handleSelectArchive(archive.id)}
                  >
                    <div className="archive-card__year-badge">{archive.election_year}</div>
                    <h3 className="archive-card__title">{archive.election_title}</h3>
                    
                    <div className="archive-card__details">
                      <div className="archive-card__row">
                        <span>Total Ballots</span>
                        <span className="archive-card__value">{archive.total_votes.toLocaleString()}</span>
                      </div>
                      <div className="archive-card__row">
                        <span>Registered Voters</span>
                        <span className="archive-card__value">{archive.total_voters.toLocaleString()}</span>
                      </div>
                      
                      <div className="archive-card__row" style={{ flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <span>Voter Turnout</span>
                        <div className="archive-card__turnout">
                          <div className="archive-card__progress-bar">
                            <div className="archive-card__progress" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="archive-card__percentage">{pct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="archive-card__actions">
                      <span className="archive-card__btn-view">
                        View Analytics Dashboard →
                      </span>
                      {isSuperAdmin && (
                        <button 
                          className="archives__btn archives__btn--danger"
                          style={{ padding: '6px 10px', borderRadius: '8px' }}
                          onClick={(e) => handleDeleteArchive(e, archive.id)}
                          title="Delete Archive Record"
                        >
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="archives__empty">
              <span className="archives__empty-icon">📁</span>
              <h3 className="archives__empty-title">Archive Vault is Empty</h3>
              <p className="archives__empty-desc">
                No past elections have been archived yet. Click "Archive Active Election" above to snapshot and preserve current results.
              </p>
            </div>
          )}
        </>
      )}

      {/* Archive Modal Overlay */}
      {modalOpen && (
        <div className="archive-modal-overlay" onClick={() => setModalOpen(false)}>
          <form 
            className="archive-modal" 
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateArchive}
          >
            <h3 className="archive-modal__title">Archive Current Election</h3>
            <p className="archive-modal__desc">
              This will snapshot the current live election results (turnouts, vote tallies, candidates) into the historical vault. 
              <strong> The current active vote registry will be reset</strong> to prepare for next semester's election.
            </p>

            {archiveError && (
              <div style={{ color: 'var(--danger-600)', background: 'var(--danger-50)', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '500' }}>
                {archiveError}
              </div>
            )}

            <div className="archive-modal__field">
              <label className="archive-modal__label">Election School Year (4 digits)</label>
              <input 
                type="text" 
                placeholder="e.g. 2026" 
                className="archive-modal__input"
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
                maxLength={4}
                required
              />
            </div>

            <div className="archive-modal__checkbox-container">
              <input 
                type="checkbox" 
                id="resetCandidatesCheckbox" 
                className="archive-modal__checkbox"
                checked={resetCandidates}
                onChange={(e) => setResetCandidates(e.target.checked)}
              />
              <label 
                htmlFor="resetCandidatesCheckbox" 
                className="archive-modal__checkbox-label"
              >
                Clear current candidate records (recommended)
              </label>
            </div>

            <div className="archive-modal__actions">
              <button 
                type="button" 
                className="archives__btn archives__btn--secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="archives__btn archives__btn--primary"
              >
                Submit Archive
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ArchivesPage;
