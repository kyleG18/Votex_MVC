import { HiOutlineDocumentArrowDown, HiOutlinePrinter } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import data from '../../data.json';
import './page.css';

const COLORS = ['#4f46e5', '#7c3aed', '#6366f1', '#818cf8', '#a78bfa'];

function ReportsPage() {
  const { candidates, positions, electionInfo } = data;

  // Get winners per position
  const results = positions.map(position => {
    const positionCandidates = candidates.filter(c => c.position === position);
    const sorted = [...positionCandidates].sort((a, b) => b.votes - a.votes);
    const totalVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
    return {
      position,
      winner: sorted[0],
      candidates: sorted,
      totalVotes,
    };
  });

  // Turnout data for pie chart
  const turnoutData = [
    { name: 'Voted', value: electionInfo.totalVotesCast },
    { name: 'Not Voted', value: electionInfo.totalRegisteredVoters - electionInfo.totalVotesCast },
  ];

  return (
    <div className="reports" id="reports-page">
      {/* Header */}
      <div className="reports__header">
        <div>
          <h1 className="reports__title">Election Reports</h1>
          <p className="reports__subtitle">{electionInfo.title}</p>
        </div>
        <div className="reports__actions">
          <button className="reports__btn" id="print-report-btn">
            <HiOutlinePrinter /> Print
          </button>
          <button className="reports__btn reports__btn--primary" id="export-report-btn">
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
              {((electionInfo.totalVotesCast / electionInfo.totalRegisteredVoters) * 100).toFixed(1)}%
            </span>
            <span className="reports__summary-label">Turnout</span>
          </div>
        </div>

        <div className="reports__summary-stats">
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{electionInfo.totalRegisteredVoters.toLocaleString()}</span>
            <span className="reports__summary-stat-label">Total Registered</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{electionInfo.totalVotesCast.toLocaleString()}</span>
            <span className="reports__summary-stat-label">Total Votes Cast</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{positions.length}</span>
            <span className="reports__summary-stat-label">Positions</span>
          </div>
          <div className="reports__summary-stat">
            <span className="reports__summary-stat-value">{candidates.length}</span>
            <span className="reports__summary-stat-label">Total Candidates</span>
          </div>
        </div>
      </div>

      {/* Results Per Position */}
      <div className="reports__results">
        <h2 className="reports__section-title">Results by Position</h2>

        {results.map(({ position, winner, candidates: posCandidates, totalVotes }) => (
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
