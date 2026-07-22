import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

const floatingProducts = [
  { id: '15970', name: 'Navy Blue Shirt', top: '10%', left: '6%', rotate: -12, delay: 0, w: 110, h: 147 },
  { id: '53759', name: 'Grey T-shirt', top: '58%', left: '3%', rotate: 8, delay: 0.5, w: 100, h: 133 },
  { id: '39386', name: 'Blue Jeans', top: '8%', right: '6%', rotate: 10, delay: 0.3, w: 115, h: 153 },
  { id: '59607', name: 'Pink Sari', top: '55%', right: '4%', rotate: -8, delay: 0.8, w: 105, h: 140 },
  { id: '16957', name: 'Sunglasses', top: '40%', left: '10%', rotate: 5, delay: 0.2, w: 90, h: 120 },
  { id: '9204', name: 'Casual Shoes', top: '38%', right: '8%', rotate: -6, delay: 0.6, w: 108, h: 144 },
  { id: '59263', name: 'Watch', top: '75%', left: '15%', rotate: 12, delay: 1.0, w: 80, h: 107 },
  { id: '39716', name: 'Blue Dress', top: '78%', right: '12%', rotate: -10, delay: 0.4, w: 95, h: 127 },
];

const faqs = [
  {
    q: 'How does the visual search work?',
    a: 'Upload a photo of any outfit — a screenshot, a photo from your gallery, or even a picture you take on the spot. Our AI analyzes the visual features like color, pattern, style, and silhouette to find the closest matches from our catalog of 44,000+ fashion products.',
  },
  {
    q: 'Where do the store locations come from?',
    a: 'We map each product category to relevant stores across Kathmandu and Lalitpur. Each result shows which stores carry similar items, along with their address, website, and a direct link to Google Maps for directions.',
  },
  {
    q: 'Is PixelCloset free to use?',
    a: 'Yes. PixelCloset is completely free. You can search as many times as you want, browse the catalog, and find store locations without any charges.',
  },
  {
    q: 'What types of products can I search for?',
    a: 'We cover 9 major categories: T-Shirts, Shirts, Pants & Jeans, Shoes, Watches, Sarees, Innerwear, Sunglasses, and Glasses. The catalog includes 44,000+ products from various brands.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'You need a free account to use the visual search feature. Signing up takes less than a minute — just enter your email and password. Browsing the catalog does not require an account.',
  },
  {
    q: 'How accurate are the matches?',
    a: 'Our AI uses deep learning to analyze visual similarity at a detailed level. Results are ranked by similarity score so the best matches appear first. For best results, use clear, well-lit photos with the outfit visible.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [storeCount, setStoreCount] = useState(null);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/stores/status')
      .then(r => r.json())
      .then(d => setStoreCount(d.count))
      .catch(() => {});
  }, []);

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

  const openLogin = () => { resetForm(); setAuthMode('login'); setShowAuth(true); };
  const openSignup = () => { resetForm(); setAuthMode('signup'); setShowAuth(true); };
  const closeAuth = () => { setShowAuth(false); resetForm(); };

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
    <div className={`landing ${showAuth ? 'auth-open' : ''}`}>
      <div className="landing-hero-bg">
        <div className="landing-deco landing-deco-1" />
        <div className="landing-deco landing-deco-2" />

        {floatingProducts.map((p, i) => (
          <div
            key={p.id}
            className={`floating-product fp-${i}`}
            style={{
              top: p.top,
              left: p.left,
              right: p.right,
              width: p.w,
              height: p.h,
              animationDelay: `${p.delay}s`,
            }}
          >
            <img src={`/images/${p.id}.jpg`} alt="" />
          </div>
        ))}

        <nav className="landing-nav">
          <div className="landing-nav-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>PixelCloset</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-btn" onClick={openLogin}>Sign In</button>
            <button className="landing-nav-btn landing-nav-btn-primary" onClick={openSignup}>Get Started</button>
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
              <div className="landing-stat-num">{storeCount ?? '—'}</div>
              <div className="landing-stat-label">Stores</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-num">9</div>
              <div className="landing-stat-label">Categories</div>
            </div>
          </div>

          <div className="landing-cta-row">
            <button className="landing-cta-btn" onClick={openSignup}>
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button className="landing-cta-btn-secondary" onClick={openLogin}>
              Sign In
            </button>
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
                <div className="landing-feature-desc">Locate stores</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Side Panel */}
      {showAuth && (
        <div className="landing-overlay" onClick={closeAuth}>
          <div className="landing-auth-panel" onClick={(e) => e.stopPropagation()}>
            <button className="auth-panel-close" onClick={closeAuth}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="landing-right-brand">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>PixelCloset</span>
            </div>

            <div className="landing-auth-tabs">
              <button
                className={`landing-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { resetForm(); setAuthMode('login'); }}
              >Sign In</button>
              <button
                className={`landing-tab ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => { resetForm(); setAuthMode('signup'); }}
              >Sign Up</button>
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
                  <button className="link-btn" onClick={() => { resetForm(); setAuthMode('signup'); }}>Create one</button>
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
                  <button className="link-btn" onClick={() => { resetForm(); setAuthMode('login'); }}>Sign in</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="landing-faq-section">
        <div className="landing-faq-inner">
          <h2 className="landing-faq-title">Frequently Asked Questions</h2>
          <p className="landing-faq-sub">Everything you need to know about PixelCloset</p>
          <div className="landing-faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`landing-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="landing-faq-q">
                  <span>{faq.q}</span>
                  <svg className="landing-faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                {openFaq === i && (
                  <div className="landing-faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="landing-footer-bar">
        <span>PixelCloset &copy; {new Date().getFullYear()}. Built for Nepal.</span>
      </footer>
    </div>
  );
}
