import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineClipboardDocumentList, HiOutlineMagnifyingGlass,
  HiOutlineTrash, HiOutlineArrowPath, HiOutlineShieldCheck,
  HiOutlineUserCircle, HiOutlineIdentification, HiOutlineCheckBadge
} from 'react-icons/hi2';
import api from '../api/axios';
import './auditTrail.css';

const ENTITY_ICONS = {
  admin: <HiOutlineShieldCheck />,
  student: <HiOutlineIdentification />,
  candidate: <HiOutlineUserCircle />,
  vote: <HiOutlineCheckBadge />,
};

const ENTITY_COLORS = {
  admin: 'audit-badge--admin',
  student: 'audit-badge--student',
  candidate: 'audit-badge--candidate',
  vote: 'audit-badge--vote',
};

function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clearConfirm, setClearConfirm] = useState(false);
  const LIMIT = 20;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/logs', {
        params: { limit: LIMIT, offset: (page - 1) * LIMIT, filter: debouncedSearch }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClearLogs = async () => {
    try {
      await api.delete('/api/logs');
      setClearConfirm(false);
      fetchLogs();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="audit-trail" id="audit-trail-page">

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div className="audit-confirm-overlay">
          <div className="audit-confirm">
            <div className="audit-confirm__icon"><HiOutlineTrash /></div>
            <h3>Clear All Logs?</h3>
            <p>This will permanently delete <strong>all {total} audit records</strong>. This action cannot be undone.</p>
            <div className="audit-confirm__actions">
              <button className="audit-confirm__cancel" onClick={() => setClearConfirm(false)}>Cancel</button>
              <button className="audit-confirm__delete" onClick={handleClearLogs}>Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="audit-trail__header">
        <div>
          <h1 className="audit-trail__title">
            <HiOutlineClipboardDocumentList className="audit-trail__title-icon" />
            Audit Trail
          </h1>
          <p className="audit-trail__subtitle">{total} total events recorded in the system</p>
        </div>
        <div className="audit-trail__header-actions">
          <button className="audit-trail__refresh-btn" onClick={fetchLogs} title="Refresh">
            <HiOutlineArrowPath /> Refresh
          </button>
          <button className="audit-trail__clear-btn" onClick={() => setClearConfirm(true)}>
            <HiOutlineTrash /> Clear Logs
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="audit-trail__search-bar">
        <HiOutlineMagnifyingGlass className="audit-trail__search-icon" />
        <input
          type="text"
          placeholder="Search by action, user, or type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="audit-trail__search-input"
          id="audit-search-input"
        />
      </div>

      {/* Log Table */}
      <div className="audit-trail__table-container">
        {loading ? (
          <div className="audit-trail__loading">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="audit-trail__empty">
            <HiOutlineClipboardDocumentList />
            <p>No audit records found.</p>
          </div>
        ) : (
          <table className="audit-trail__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id} className="audit-trail__row" style={{ animationDelay: `${index * 0.02}s` }}>
                  <td className="audit-trail__id">#{log.id}</td>
                  <td className="audit-trail__time">{formatTime(log.timestamp)}</td>
                  <td>
                    {log.entity_type && (
                      <span className={`audit-badge ${ENTITY_COLORS[log.entity_type] || 'audit-badge--default'}`}>
                        {ENTITY_ICONS[log.entity_type] || null}
                        {log.entity_type}
                      </span>
                    )}
                  </td>
                  <td className="audit-trail__action">{log.action}</td>
                  <td className="audit-trail__user">{log.performed_by}</td>
                  <td>
                    <span className={`audit-role-badge audit-role-badge--${log.role}`}>
                      {log.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="audit-trail__pagination">
          <button
            className="audit-page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >‹ Prev</button>
          <span className="audit-page-info">Page {page} of {totalPages}</span>
          <button
            className="audit-page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Next ›</button>
        </div>
      )}
    </div>
  );
}

export default AuditTrailPage;
