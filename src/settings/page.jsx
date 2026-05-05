import { useState } from 'react';
import { HiOutlineCog6Tooth, HiOutlineCalendarDays, HiOutlineShieldCheck, HiOutlineBellAlert } from 'react-icons/hi2';
import data from '../../data.json';
import './page.css';

function SettingsPage() {
  const { electionInfo } = data;

  const [settings, setSettings] = useState({
    electionTitle: electionInfo.title,
    startDate: electionInfo.startDate,
    endDate: electionInfo.endDate,
    allowMultipleVotes: false,
    requireBiometrics: true,
    showLiveResults: true,
    enableNotifications: true,
    maxCandidatesPerPosition: 5,
    votingTimeStart: '08:00',
    votingTimeEnd: '17:00',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
                <span className="settings__toggle-label">Require Biometric Verification</span>
                <span className="settings__toggle-desc">Students must scan fingerprint before voting</span>
              </div>
              <label className="settings__switch">
                <input
                  type="checkbox"
                  name="requireBiometrics"
                  checked={settings.requireBiometrics}
                  onChange={handleChange}
                />
                <span className="settings__switch-slider" />
              </label>
            </div>

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
          <button type="submit" className="settings__save-btn" id="save-settings-btn">
            <HiOutlineCog6Tooth /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
