import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [authPanel, setAuthPanel] = useState(null); // null | 'login' | 'signup'
  const [stats, setStats] = useState({ products: '44,000+', stores: 48 });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/seed/status')
      .then(r => r.json())
      .then(d => { if (d.count) setStats(prev => ({ ...prev, products: d.count.toLocaleString() + '+' })); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/auth/me', { credentials: 'include' })
      .then(r => { if (r.ok) navigate('/dashboard'); })
      .catch(() => {});
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.detail || 'Invalid email or password'); return; }
      setUser(data.user);
      navigate('/dashboard');
    } catch { setLoginError('Unable to connect. Make sure the server is running.'); }
    finally { setLoginLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (signupPass !== signupConfirm) { setSignupError('Passwords do not match'); return; }
    setSignupLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: signupName.trim(), email: signupEmail.trim(), password: signupPass, confirm_password: signupConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? (Array.isArray(data.detail) ? data.detail[0].msg : data.detail) : 'Sign up failed';
        setSignupError(msg); return;
      }
      setUser(data.user);
      navigate('/dashboard');
    } catch { setSignupError('Unable to connect. Make sure the server is running.'); }
    finally { setSignupLoading(false); }
  };

  return (
    <div className="lp-root">
      {/* ── Left: Marketing ──────────────────────────── */}
      <div className="lp-left">
        <nav className="lp-left-nav">
          <div className="lp-left-brand">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            <span>Pixel<span className="lp-brand-accent">Closet</span></span>
          </div>
        </nav>

        <div className="lp-left-content">
          <div className="lp-hero-badge">AI-Powered Fashion Search</div>
          <h1 className="lp-hero-title">
            Find your next<br />
            <span className="lp-hero-highlight">favourite outfit</span><br />
            in seconds.
          </h1>
          <p className="lp-hero-sub">
            Upload a photo and discover visually similar items from thousands of products — then find them at stores near you.
          </p>

          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">{stats.products}</div>
              <div className="lp-hero-stat-label">Products</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">{stats.stores}</div>
              <div className="lp-hero-stat-label">Stores</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">&lt;1s</div>
              <div className="lp-hero-stat-label">Search</div>
            </div>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              Visual Search
            </div>
            <div className="lp-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Smart Matching
            </div>
            <div className="lp-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Store Finder
            </div>
          </div>
        </div>

        <div className="lp-left-footer">
          &copy; 2025 PixelCloset. AI-powered fashion discovery.
        </div>
      </div>

      {/* ── Right: Auth Panel ─────────────────────────── */}
      <div className="lp-right">
        {authPanel === null && (
          <div className="lp-right-default">
            <div className="lp-right-preview">
              <div className="lp-preview-img">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="m21 15-5-5L5 21"/>
                </svg>
              </div>
              <div className="lp-preview-body">
                <div className="lp-preview-line lp-line-lg"></div>
                <div className="lp-preview-line lp-line-sm"></div>
                <div className="lp-preview-tags">
                  <span className="lp-preview-tag"></span>
                  <span className="lp-preview-tag"></span>
                  <span className="lp-preview-tag"></span>
                </div>
                <div className="lp-preview-stores">
                  <div className="lp-preview-store"></div>
                  <div className="lp-preview-store"></div>
                </div>
              </div>
            </div>

            <div className="lp-right-actions">
              <button className="lp-panel-btn lp-panel-btn-primary" onClick={() => setAuthPanel('login')}>
                Log In
              </button>
              <button className="lp-panel-btn lp-panel-btn-outline" onClick={() => setAuthPanel('signup')}>
                Create Account
              </button>
            </div>
          </div>
        )}

        {authPanel === 'login' && (
          <div className="lp-auth-form-wrap">
            <div className="lp-auth-top">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              <span className="lp-auth-logo-text">Pixel<span>Closet</span></span>
            </div>
            <h2>Welcome back</h2>
            <p className="lp-auth-sub">Sign in to your account</p>

            <form className="lp-auth-form" onSubmit={handleLogin}>
              <div className="lp-form-group">
                <label>Email address</label>
                <input type="email" placeholder="you@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="lp-form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter your password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              {loginError && <div className="lp-form-error">{loginError}</div>}
              <button type="submit" className="lp-panel-btn lp-panel-btn-primary lp-full" disabled={loginLoading}>
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="lp-auth-switch">
              Don't have an account?{' '}
              <button className="lp-switch-btn" onClick={() => { setLoginError(''); setAuthPanel('signup'); }}>Create one</button>
            </p>
          </div>
        )}

        {authPanel === 'signup' && (
          <div className="lp-auth-form-wrap">
            <div className="lp-auth-top">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              <span className="lp-auth-logo-text">Pixel<span>Closet</span></span>
            </div>
            <h2>Create an account</h2>
            <p className="lp-auth-sub">Get started with PixelCloset</p>

            <form className="lp-auth-form" onSubmit={handleSignup}>
              <div className="lp-form-group">
                <label>Username</label>
                <input type="text" placeholder="Choose a username" required value={signupName} onChange={e => setSignupName(e.target.value)} />
              </div>
              <div className="lp-form-group">
                <label>Email address</label>
                <input type="email" placeholder="you@example.com" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
              </div>
              <div className="lp-form-group">
                <label>Password</label>
                <input type="password" placeholder="At least 6 characters" required minLength={6} value={signupPass} onChange={e => setSignupPass(e.target.value)} />
              </div>
              <div className="lp-form-group">
                <label>Confirm password</label>
                <input type="password" placeholder="Repeat your password" required value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} />
              </div>
              {signupError && <div className="lp-form-error">{signupError}</div>}
              <button type="submit" className="lp-panel-btn lp-panel-btn-primary lp-full" disabled={signupLoading}>
                {signupLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="lp-auth-switch">
              Already have an account?{' '}
              <button className="lp-switch-btn" onClick={() => { setSignupError(''); setAuthPanel('login'); }}>Sign in</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
