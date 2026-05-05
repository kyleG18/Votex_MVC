import { useState } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import data from '../../data.json';
import './page.css';

function ManageStudentsPage() {
  const [students, setStudents] = useState(data.students);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, voted, not-voted

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'voted' && s.hasVoted) ||
      (filterStatus === 'not-voted' && !s.hasVoted);

    return matchesSearch && matchesFilter;
  });

  const votedCount = students.filter(s => s.hasVoted).length;
  const notVotedCount = students.filter(s => !s.hasVoted).length;

  return (
    <div className="manage-students" id="manage-students-page">
      {/* Header */}
      <div className="manage-students__header">
        <div>
          <h1 className="manage-students__title">Manage Students</h1>
          <p className="manage-students__subtitle">
            {students.length} total students · {votedCount} voted · {notVotedCount} pending
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="manage-students__toolbar">
        <div className="manage-students__search">
          <HiOutlineMagnifyingGlass className="manage-students__search-icon" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="manage-students__search-input"
            id="search-students-input"
          />
        </div>

        <div className="manage-students__filters">
          {['all', 'voted', 'not-voted'].map(filter => (
            <button
              key={filter}
              className={`manage-students__filter-btn ${filterStatus === filter ? 'manage-students__filter-btn--active' : ''}`}
              onClick={() => setFilterStatus(filter)}
            >
              {filter === 'all' ? 'All' : filter === 'voted' ? 'Voted' : 'Not Voted'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="manage-students__table-container">
        <table className="manage-students__table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Year Level</th>
              <th>Voting Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id} style={{ animationDelay: `${index * 0.03}s` }}>
                <td>
                  <code className="manage-students__id">{student.studentId}</code>
                </td>
                <td>
                  <span className="manage-students__name">{student.name}</span>
                </td>
                <td className="manage-students__email">{student.email}</td>
                <td>{student.course}</td>
                <td>{student.yearLevel}</td>
                <td>
                  {student.hasVoted ? (
                    <span className="manage-students__status manage-students__status--voted">
                      <HiOutlineCheckCircle /> Voted
                    </span>
                  ) : (
                    <span className="manage-students__status manage-students__status--pending">
                      <HiOutlineXCircle /> Not Yet
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="manage-students__empty">
            <p>No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageStudentsPage;
