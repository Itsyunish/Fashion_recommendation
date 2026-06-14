import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem('favs') || '[]'));
  } catch {
    return new Set();
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [enableFineTune, setEnableFineTune] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const persistFavorites = useCallback((newFavs) => {
    setFavorites(newFavs);
    localStorage.setItem('favs', JSON.stringify([...newFavs]));
  }, []);

  const addFavorite = useCallback((path) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(path);
      localStorage.setItem('favs', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((path) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(path);
      localStorage.setItem('favs', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
    localStorage.setItem('favs', '[]');
  }, []);

  return (
    <AppContext.Provider value={{
      user, setUser,
      favorites, addFavorite, removeFavorite, clearFavorites, persistFavorites,
      enableFineTune, setEnableFineTune,
      theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
