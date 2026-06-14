import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

export default function Signup() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { setUser } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) navigate('/dashboard');
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
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
    <div className="auth-body">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">Pixel<span>Closet</span></div>
            <h1>Create an account</h1>
            <p className="auth-sub">Get started with PixelCloset</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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
              <label htmlFor="signupEmail">Email address</label>
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
