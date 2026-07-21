import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [authMode, setAuthMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/auth/me', { credentials: 'include' })
      .then(res => { if (res.ok) navigate('/dashboard'); })
      .catch(() => {});
  }, [navigate]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirm('');
    setError('');
  };

  const switchMode = (mode) => {
    resetForm();
    setAuthMode(mode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Invalid email or password');
        return;
      }
      setUser(data.user);
      navigate('/dashboard');
    } catch {
      setError('Unable to connect. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirm_password: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail
          ? (Array.isArray(data.detail) ? data.detail[0].msg : data.detail)
          : 'Sign up failed';
        setError(msg);
        return;
      }
      setUser(data.user);
      navigate('/dashboard');
    } catch {
      setError('Unable to connect. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-left">
        <div className="landing-deco landing-deco-1" />
        <div className="landing-deco landing-deco-2" />

        <nav className="landing-nav">
          <div className="landing-nav-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>PixelCloset</span>
          </div>
        </nav>

        <div className="landing-hero">
          <div className="landing-badge">AI-Powered Fashion Search</div>
          <h1 className="landing-title">
            Find Your<br />
            <span className="landing-gradient-text">Perfect Match</span>
          </h1>
          <p className="landing-sub">
            Upload any outfit photo and discover similar styles available at
            stores near you. Our AI analyzes visual features to find the closest matches.
          </p>

          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-num">44K+</div>
              <div className="landing-stat-label">Products</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">45+</div>
              <div className="landing-stat-label">Stores</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">9</div>
              <div className="landing-stat-label">Categories</div>
            </div>
          </div>

          <div className="landing-features">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div>
                <div className="landing-feature-title">Visual Search</div>
                <div className="landing-feature-desc">Upload a photo, find similar items instantly</div>
              </div>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              <div>
                <div className="landing-feature-title">Smart Matching</div>
                <div className="landing-feature-desc">AI analyzes color, style, and pattern</div>
              </div>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div className="landing-feature-title">Store Finder</div>
                <div className="landing-feature-desc">Locate nearby stores with website links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-left-footer">
          PixelCloset &copy; {new Date().getFullYear()}
        </div>
      </div>

      <div className="landing-right">
        <div className="landing-auth-card">
          <div className="landing-right-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>PixelCloset</span>
          </div>

          <div className="landing-auth-tabs">
            <button
              className={`landing-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`landing-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? (
            <div className="landing-auth-body">
              <div className="landing-auth-header">
                <h2>Welcome back</h2>
                <p>Sign in to your account</p>
              </div>
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="loginEmail">Email</label>
                  <input
                    id="loginEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="loginPassword">Password</label>
                  <input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <button className="link-btn" onClick={() => switchMode('signup')}>Create one</button>
              </p>
            </div>
          ) : (
            <div className="landing-auth-body">
              <div className="landing-auth-header">
                <h2>Create account</h2>
                <p>Get started with PixelCloset</p>
              </div>
              <form className="auth-form" onSubmit={handleSignup}>
                <div className="form-group">
                  <label htmlFor="signupUsername">Username</label>
                  <input
                    id="signupUsername"
                    type="text"
                    placeholder="Choose a username"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signupEmail">Email</label>
                  <input
                    id="signupEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signupPassword">Password</label>
                  <input
                    id="signupPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signupConfirm">Confirm password</label>
                  <input
                    id="signupConfirm"
                    type="password"
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
              <p className="auth-footer-text">
                Already have an account?{' '}
                <button className="link-btn" onClick={() => switchMode('login')}>Sign in</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
