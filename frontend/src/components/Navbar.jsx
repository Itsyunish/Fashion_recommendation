import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export default function Navbar({ currentTab, onTabChange }) {
  const { enableFineTune } = useApp();

  const handleLogout = async () => {
    try {
      await fetch(API_BASE_URL + '/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.hash = '/';
    window.location.reload();
  };

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'fine-tune', label: 'Fine Tune', hidden: !enableFineTune },
    { id: 'about', label: 'About' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#" onClick={(e) => { e.preventDefault(); onTabChange('home'); }}>
          Pixel<span className="brand-accent">Closet</span>
        </a>
        <div className="nav-links">
          {tabs.filter(t => !t.hidden).map(tab => (
            <a
              key={tab.id}
              href="#"
              className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onTabChange(tab.id); }}
            >
              {tab.label}
            </a>
          ))}
          <button className="nav-link" onClick={handleLogout} style={{ border: 'none', cursor: 'pointer', background: 'none' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
