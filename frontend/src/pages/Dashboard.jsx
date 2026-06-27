import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';
import HomePage from './HomePage';
import BrowsePage from './BrowsePage';
import FineTunePage from './FineTunePage';
import AboutPage from './AboutPage';
import SettingsPage from './SettingsPage';

export default function Dashboard() {
  const navigate = useNavigate();
  const { setUser, setEnableFineTune } = useApp();
  const [currentTab, setCurrentTab] = useState('home');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/auth/me', { credentials: 'include' });
        if (!res.ok) { navigate('/'); return; }
        const userData = await res.json();
        if (!cancelled) setUser(userData);
      } catch {
        if (!cancelled) navigate('/');
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, setUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/config');
        const cfg = await res.json();
        if (!cancelled) setEnableFineTune(cfg.enable_fine_tune === true);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [setEnableFineTune]);

  if (!authChecked) return null;

  return (
    <>
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
      <div style={{ display: currentTab === 'home' ? 'block' : 'none' }}>
        <HomePage key="home" />
      </div>
      <div style={{ display: currentTab === 'browse' ? 'block' : 'none' }}>
        <BrowsePage key="browse" />
      </div>
      <div style={{ display: currentTab === 'fine-tune' ? 'block' : 'none' }}>
        <FineTunePage key="fine-tune" />
      </div>
      <div style={{ display: currentTab === 'about' ? 'block' : 'none' }}>
        <AboutPage key="about" />
      </div>
      <div style={{ display: currentTab === 'settings' ? 'block' : 'none' }}>
        <SettingsPage key="settings" />
      </div>
    </>
  );
}
