import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './votechart.css';

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#6366f1', '#818cf8', '#a78bfa', '#8b5cf6'];

function VoteChart({ data, title = 'Election Progress - Live Vote Tally' }) {
  return (
    <div className="vote-chart" id="vote-tally-chart">
      <div className="vote-chart__header">
        <div className="vote-chart__icon">📊</div>
        <h3 className="vote-chart__title">{title}</h3>
      </div>

      <div className="vote-chart__body">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Votes', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                padding: '8px 12px',
              }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            <Bar dataKey="votes" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default VoteChart;
