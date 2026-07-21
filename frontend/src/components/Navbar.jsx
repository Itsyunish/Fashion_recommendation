import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Navbar({ currentTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(API_BASE_URL + '/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.hash = '/';
    window.location.reload();
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
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
