import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, setUser, theme, toggleTheme, clearFavorites, favorites, enableFineTune, setEnableFineTune } = useApp();
  const [fineTuneLoading, setFineTuneLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileError('');
    const body = {};
    if (username.trim() && username.trim() !== user?.username) body.username = username.trim();
    if (email.trim() && email.trim() !== user?.email) body.email = email.trim();
    if (!Object.keys(body).length) return;

    setProfileLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.detail || 'Failed');
        return;
      }
      setUser(data.user);
      showToast(data.message, 'success');
    } catch {
      setProfileError('Network error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!oldPass || !newPass) {
      setPasswordError('Fill all fields');
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.detail || 'Failed');
        return;
      }
      setOldPass('');
      setNewPass('');
      showToast(data.message, 'success');
    } catch {
      setPasswordError('Network error');
    } finally {
      setPassLoading(false);
    }
  };

  const handleToggleFineTune = async () => {
    const next = !enableFineTune;
    setFineTuneLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/config/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || 'Failed to update');
        return;
      }
      setEnableFineTune(data.enable_fine_tune);
      showToast(data.message, 'success');
    } catch {
      showToast('Network error');
    } finally {
      setFineTuneLoading(false);
    }
  };

  const handleClearFavorites = () => {
    if (!confirm('Clear all your favorites?')) return;
    clearFavorites();
    showToast('Favorites cleared', 'info');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/me', {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) navigate('/');
      else { const d = await res.json(); showToast(d.detail || 'Failed'); }
    } catch {
      showToast('Network error');
    }
  };

  return (
    <div className="container settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Profile</h2>
              <p>Update your username and email</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="field-row">
              <label>Username</label>
              <input type="text" className="field-input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Email</label>
              <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {profileError && <div className="form-error">{profileError}</div>}
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Security</h2>
              <p>Change your password</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="field-row">
              <label>Current Password</label>
              <input type="password" className="field-input" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
            </div>
            <div className="field-row">
              <label>New Password</label>
              <input type="password" className="field-input" minLength={6} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </div>
            {passwordError && <div className="form-error">{passwordError}</div>}
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={passLoading}>
              {passLoading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Appearance</h2>
              <p>Toggle dark mode</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="theme-row">
              <span>Dark Mode</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <p className="field-hint">Automatically saved</p>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Style Focus</h2>
              <p>Enable or disable the Style Focus recommendation model</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="theme-row">
              <span>Enable Style Focus</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={enableFineTune} onChange={handleToggleFineTune} disabled={fineTuneLoading} />
                <span className="toggle-slider"></span>
              </label>
            </div>
              <p className="field-hint">When enabled, a Style Focus tab will appear in the navigation bar.</p>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Favorites</h2>
              <p>Manage your saved items</p>
            </div>
          </div>
          <div className="settings-card-body">
            <p className="field-hint" style={{ marginBottom: '0.75rem' }}>Clear all your favorited items. This action cannot be undone.</p>
            <button className="btn" onClick={handleClearFavorites} style={{ background: 'var(--border)', color: 'var(--text)' }}>
              Clear All Favorites ({favorites.size})
            </button>
          </div>
        </div>

        <div className="settings-card settings-card-danger">
          <div className="settings-card-header">
            <div>
              <h2>Delete Account</h2>
              <p>Permanently remove your account and data</p>
            </div>
          </div>
          <div className="settings-card-body">
            <p className="field-hint" style={{ marginBottom: '0.75rem' }}>Once deleted, your account cannot be recovered.</p>
            <button className="btn" onClick={handleDeleteAccount} style={{ background: 'var(--danger)', color: '#fff' }}>
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
