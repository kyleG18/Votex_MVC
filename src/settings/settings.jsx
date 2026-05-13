import { useState, useEffect } from 'react';
import { HiOutlineCog6Tooth, HiOutlineCalendarDays, HiOutlineShieldCheck, HiOutlineBellAlert } from 'react-icons/hi2';
import axios from 'axios';
import './settings.css';

function SettingsPage() {
  const [settings, setSettings] = useState({
    electionTitle: '',
    startDate: '',
    endDate: '',
    allowMultipleVotes: false,
    showLiveResults: true,
    enableNotifications: true,
    maxCandidatesPerPosition: 5,
    votingTimeStart: '08:00',
    votingTimeEnd: '17:00',
    adminAuthKey: 'JPC-ADMIN-2026',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper to format date strings to YYYY-MM-DD for input type="date"
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/settings');
        if (response.data.success && response.data.settings) {
          const s = response.data.settings;
          setSettings({
            electionTitle: s.election_title || '',
            startDate: formatDateForInput(s.start_date),
            endDate: formatDateForInput(s.end_date),
            allowMultipleVotes: !!s.allow_multiple_votes,
            showLiveResults: !!s.show_live_results,
            enableNotifications: !!s.enable_notifications,
            maxCandidatesPerPosition: s.max_candidates_per_position || 5,
            votingTimeStart: s.voting_time_start || '08:00',
            votingTimeEnd: s.voting_time_end || '17:00',
            adminAuthKey: s.admin_auth_key || 'JPC-ADMIN-2026',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    
    try {
      const response = await axios.put('http://localhost:5000/api/settings', settings);
      if (response.data.success) {
        setSaved(true);
        // Scroll to top to see the toast
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please verify the backend is running.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings" style={{ padding: '2rem', textAlign: 'center' }}>Loading settings...</div>;
  }

  return (
    <div className="settings" id="settings-page">
      {/* Header */}
      <div className="settings__header">
        <div>
          <h1 className="settings__title">Election Settings</h1>
          <p className="settings__subtitle">Configure election parameters and system preferences</p>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="settings__toast">
          <HiOutlineShieldCheck /> Settings saved successfully!
        </div>
      )}

      <form className="settings__form" onSubmit={handleSave}>
        {/* Election Information Section */}
        <div className="settings__section">
          <div className="settings__section-header">
            <HiOutlineCalendarDays className="settings__section-icon" />
            <div>
              <h2 className="settings__section-title">Election Information</h2>
              <p className="settings__section-desc">Basic election details and schedule</p>
            </div>
          </div>

          <div className="settings__grid">
            <div className="settings__field settings__field--full">
              <label htmlFor="electionTitle">Election Title</label>
              <input
                type="text"
                id="electionTitle"
                name="electionTitle"
                value={settings.electionTitle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="settings__field">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={settings.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="settings__field">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={settings.endDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="settings__field">
              <label htmlFor="votingTimeStart">Voting Starts At</label>
              <input
                type="time"
                id="votingTimeStart"
                name="votingTimeStart"
                value={settings.votingTimeStart}
                onChange={handleChange}
                required
              />
            </div>
            <div className="settings__field">
              <label htmlFor="votingTimeEnd">Voting Ends At</label>
              <input
                type="time"
                id="votingTimeEnd"
                name="votingTimeEnd"
                value={settings.votingTimeEnd}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="settings__section">
          <div className="settings__section-header">
            <HiOutlineShieldCheck className="settings__section-icon" />
            <div>
              <h2 className="settings__section-title">Security & Verification</h2>
              <p className="settings__section-desc">Control authentication and voting integrity</p>
            </div>
          </div>

          <div className="settings__toggles">
            <div className="settings__toggle">
              <div className="settings__toggle-info">
                <span className="settings__toggle-label">Allow Re-voting</span>
                <span className="settings__toggle-desc">Allow students to change their vote (not recommended)</span>
              </div>
              <label className="settings__switch">
                <input
                  type="checkbox"
                  name="allowMultipleVotes"
                  checked={settings.allowMultipleVotes}
                  onChange={handleChange}
                />
                <span className="settings__switch-slider" />
              </label>
            </div>

            <div className="settings__field settings__field--full" style={{ marginTop: 'var(--space-6)' }}>
              <label htmlFor="adminAuthKey">Authorization Setup Key</label>
              <p className="settings__field-desc" style={{ marginBottom: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                This secret key is required for new administrators to register. Keep it secure.
              </p>
              <input
                type="text"
                id="adminAuthKey"
                name="adminAuthKey"
                value={settings.adminAuthKey}
                onChange={handleChange}
                placeholder="Enter secret key for admin registration"
                style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
              />
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className="settings__section">
          <div className="settings__section-header">
            <HiOutlineBellAlert className="settings__section-icon" />
            <div>
              <h2 className="settings__section-title">Display & Notifications</h2>
              <p className="settings__section-desc">Control what users see and receive</p>
            </div>
          </div>

          <div className="settings__toggles">
            <div className="settings__toggle">
              <div className="settings__toggle-info">
                <span className="settings__toggle-label">Show Live Results</span>
                <span className="settings__toggle-desc">Display real-time vote tallies on the dashboard</span>
              </div>
              <label className="settings__switch">
                <input
                  type="checkbox"
                  name="showLiveResults"
                  checked={settings.showLiveResults}
                  onChange={handleChange}
                />
                <span className="settings__switch-slider" />
              </label>
            </div>

            <div className="settings__toggle">
              <div className="settings__toggle-info">
                <span className="settings__toggle-label">Enable Email Notifications</span>
                <span className="settings__toggle-desc">Send confirmation emails after voting</span>
              </div>
              <label className="settings__switch">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={handleChange}
                />
                <span className="settings__switch-slider" />
              </label>
            </div>
          </div>

          <div className="settings__grid" style={{ marginTop: 'var(--space-4)' }}>
            <div className="settings__field">
              <label htmlFor="maxCandidatesPerPosition">Max Candidates Per Position</label>
              <input
                type="number"
                id="maxCandidatesPerPosition"
                name="maxCandidatesPerPosition"
                value={settings.maxCandidatesPerPosition}
                onChange={handleChange}
                min="2"
                max="20"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings__actions">
          <button 
            type="submit" 
            className={`settings__save-btn ${saving ? 'settings__save-btn--loading' : ''}`} 
            id="save-settings-btn"
            disabled={saving}
          >
            {saving ? (
              <>Saving Settings...</>
            ) : (
              <>
                <HiOutlineCog6Tooth /> Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
