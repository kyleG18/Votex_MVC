import { HiOutlineUsers, HiOutlineCheckBadge, HiOutlineClock } from 'react-icons/hi2';
import StatCard from '../Component/stat-card/statcard';
import VoteChart from '../Component/vote-chart/votechart';
import data from '../../data.json';
import './page.css';

function DashboardPage() {
  const { candidates, electionInfo } = data;

  // Prepare chart data for Presidential candidates
  const presidentCandidates = candidates.filter(c => c.position === 'President');
  const chartData = presidentCandidates.map(c => ({
    name: c.name,
    votes: c.votes,
  }));

  // Calculate time remaining (mock)
  const timeRemaining = '3d : 14h : 22m';
  const turnout = ((electionInfo.totalVotesCast / electionInfo.totalRegisteredVoters) * 100).toFixed(0);

  return (
    <div className="dashboard" id="admin-dashboard">
      {/* Page Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Admin Dashboard</h1>
          <p className="dashboard__subtitle">Dashboard Overview</p>
        </div>
        <div className="dashboard__user">
          <div className="dashboard__user-avatar">AU</div>
          <div className="dashboard__user-info">
            <span className="dashboard__user-name">Admin User</span>
            <span className="dashboard__user-role">Election Committee</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard__stats">
        <StatCard
          icon={<HiOutlineUsers />}
          title="Total Registered Voters"
          value={electionInfo.totalRegisteredVoters.toLocaleString()}
          subtitle="+2.1% from yesterday"
          color="primary"
        />
        <StatCard
          icon={<HiOutlineCheckBadge />}
          title="Current Vote Count"
          value={electionInfo.totalVotesCast.toLocaleString()}
          subtitle={`${turnout}% Turnout`}
          color="success"
        />
        <StatCard
          icon={<HiOutlineClock />}
          title="Time Remaining"
          value={timeRemaining}
          subtitle="Election ends Apr 28"
          color="warning"
        />
      </div>

      {/* Vote Tally Chart */}
      <VoteChart data={chartData} title="Election Progress — Live Vote Tally (President)" />

      {/* Recent Activity */}
      <div className="dashboard__recent">
        <h3 className="dashboard__section-title">Recent Voting Activity</h3>
        <div className="dashboard__activity-list">
          {[
            { time: '2 min ago', action: 'Vote submitted', station: 'Station 1' },
            { time: '5 min ago', action: 'Fingerprint verified', station: 'Station 3' },
            { time: '8 min ago', action: 'Vote submitted', station: 'Station 2' },
            { time: '12 min ago', action: 'Vote submitted', station: 'Station 1' },
            { time: '15 min ago', action: 'Fingerprint verified', station: 'Station 4' },
          ].map((activity, index) => (
            <div key={index} className="dashboard__activity-item">
              <div className="dashboard__activity-dot" />
              <div className="dashboard__activity-content">
                <span className="dashboard__activity-action">{activity.action}</span>
                <span className="dashboard__activity-meta">{activity.station} · {activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
