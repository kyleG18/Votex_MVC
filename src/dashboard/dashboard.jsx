import { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineCheckBadge, HiOutlineClock } from 'react-icons/hi2';
import axios from 'axios';
import StatCard from '../Component/stat-card/statcard';
import VoteChart from '../Component/vote-chart/votechart';
import './dashboard.css';

function DashboardPage() {
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
          axios.get('http://localhost:5000/api/dashboard/stats'),
          axios.get('http://localhost:5000/api/dashboard/tally')
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
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  // Calculate time remaining based on settings
  const calculateTimeRemaining = () => {
    if (!stats.settings || !stats.settings.end_date) return 'Not Set';
    const end = new Date(stats.settings.end_date);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    return `${days}d : ${hours}h : ${mins}m`;
  };

  const timeRemaining = calculateTimeRemaining();
  const turnout = stats.totalRegisteredVoters > 0 
    ? ((stats.totalVotesCast / stats.totalRegisteredVoters) * 100).toFixed(1) 
    : 0;

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
          value={stats.totalRegisteredVoters.toLocaleString()}
          subtitle="Registered in system"
          color="primary"
        />
        <StatCard
          icon={<HiOutlineCheckBadge />}
          title="Current Vote Count"
          value={stats.totalVotesCast.toLocaleString()}
          subtitle={`${turnout}% Turnout`}
          color="success"
        />
        <StatCard
          icon={<HiOutlineClock />}
          title="Election Status"
          value={timeRemaining === 'Ended' ? 'Ended' : 'Active'}
          subtitle={timeRemaining === 'Ended' ? 'Election has concluded' : `Time Remaining: ${timeRemaining}`}
          color={timeRemaining === 'Ended' ? 'primary' : 'warning'}
        />
      </div>

      {/* Vote Tally Charts for ALL positions */}
      {tallyData.positions.map((position) => {
        const positionCandidates = tallyData.candidates.filter(c => c.position === position);
        const chartData = positionCandidates.map(c => ({
          name: c.name,
          votes: c.votes,
        }));

        return (
          <div key={position} style={{ marginBottom: '2rem' }}>
            <VoteChart 
              data={chartData} 
              title={`Election Progress — Live Vote Tally (${position})`} 
            />
          </div>
        );
      })}


    </div>
  );
}

export default DashboardPage;
