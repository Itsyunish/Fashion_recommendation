import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Navbar({ currentTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(API_BASE_URL + '/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    window.location.href = '/';
  };

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'browse', label: 'Browse' },
    { id: 'about', label: 'About' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#" onClick={(e) => { e.preventDefault(); handleTabClick('home'); }}>
          <img src="/images/logo.svg" alt="PixelCloset" className="nav-logo" />
        </a>
        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {tabs.filter(t => !t.hidden).map(tab => (
            <a
              key={tab.id}
              href="#"
              className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleTabClick(tab.id); }}
            >
              {tab.label}
            </a>
          ))}
          <button className="nav-link nav-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.3rem'}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
