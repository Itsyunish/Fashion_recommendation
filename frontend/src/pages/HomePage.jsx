import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import SeedBanner from '../components/SeedBanner';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import FilterBar from '../components/FilterBar';
import CompareBar from '../components/CompareBar';
import CompareModal from '../components/CompareModal';
import DetailModal from '../components/DetailModal';
import LoadingOverlay from '../components/LoadingOverlay';



export default function HomePage() {
  const showToast = useToast();
  const { favorites } = useApp();

  const [totalImages, setTotalImages] = useState(0);
  const [topK, setTopK] = useState(5);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropZoneKey, setDropZoneKey] = useState(0);
  const [seeded, setSeeded] = useState(null);

  const [lastRecs, setLastRecs] = useState([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [selectedCompareItems, setSelectedCompareItems] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [detailRec, setDetailRec] = useState(null);


  const [activeFilters, setActiveFilters] = useState({
    brands: new Set(), colours: new Set(), categories: new Set(), genders: new Set(),
    minPrice: null, maxPrice: null,
  });

  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/seed/status');
        const data = await res.json();
        if (!cancelled) {
          setTotalImages(data.count || 0);
          setSeeded(data.seeded);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const toggleCompare = useCallback((path, checked) => {
    setSelectedCompareItems(prev => {
      if (checked) return [...prev, path];
      return prev.filter(p => p !== path);
    });
  }, []);

  const handleRecommend = useCallback(async (targetCategory) => {
    if (!selectedFile) return;

    setLoading(true);
    setLastRecs([]);
    setShowFavsOnly(false);
    setSelectedCompareItems([]);

    const startTime = performance.now();

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      let url = API_BASE_URL + `/api/recommend?top_k=${topK}`;
      if (targetCategory) url += `&target_category=${encodeURIComponent(targetCategory)}`;
      const res = await fetch(url, { method: 'POST', body: formData });
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (res.status === 404) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');

      data.elapsed = elapsed;
      setLastRecs(data.recommendations || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast(err.message);
    }
  }, [selectedFile, topK, showToast]);

  const findSimilar = useCallback(async (imagePath) => {
    const url = API_BASE_URL + imagePath;
    try {
      const resp = await fetch(url + '?t=' + Date.now());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const file = new File([blob], imagePath.split('/').pop(), { type: blob.type || 'image/jpeg' });

      setSelectedFile(file);
      setLoading(true);
      setLastRecs([]);
      setShowFavsOnly(false);
      setSelectedCompareItems([]);

      const formData = new FormData();
      formData.append('file', file);
      const startTime = performance.now();
      const res = await fetch(`${API_BASE_URL}/api/recommend?top_k=${topK}`, { method: 'POST', body: formData });
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (res.status === 404) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');

      data.elapsed = elapsed;
      setLastRecs(data.recommendations || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast(err.message);
    }
  }, [topK, showToast]);

  const openCompareModal = useCallback(() => {
    const items = lastRecs.filter(r => selectedCompareItems.includes(r.image_path));
    if (items.length < 2) return;
  }, [lastRecs, selectedCompareItems]);

  const filteredRecs = useMemo(() => {
    let recs = lastRecs;

    if (activeFilters.brands.size > 0) {
      recs = recs.filter(r => activeFilters.brands.has(r.brand_name));
    }
    if (activeFilters.colours.size > 0) {
      recs = recs.filter(r => activeFilters.colours.has(r.base_colour));
    }
    if (activeFilters.categories.size > 0) {
      recs = recs.filter(r => activeFilters.categories.has(r.master_category));
    }
    if (activeFilters.genders.size > 0) {
      recs = recs.filter(r => activeFilters.genders.has(r.gender));
    }
    if (activeFilters.minPrice != null) {
      recs = recs.filter(r => r.discounted_price != null && r.discounted_price >= activeFilters.minPrice);
    }
    if (activeFilters.maxPrice != null) {
      recs = recs.filter(r => r.discounted_price != null && r.discounted_price <= activeFilters.maxPrice);
    }

    if (showFavsOnly) {
      recs = recs.filter(r => favorites.has(r.image_path));
    }

    return recs;
  }, [lastRecs, activeFilters, showFavsOnly, favorites]);

  const compareItems = useMemo(() => {
    return lastRecs.filter(r => selectedCompareItems.includes(r.image_path));
  }, [lastRecs, selectedCompareItems]);

  const hasResults = lastRecs.length > 0;

  return (
    <>
      {seeded === false && <SeedBanner type="base" />}

      <div className="container home-layout">
        <aside className="query-panel">
          <div className="query-card">
            <h2 className="query-title">Query Image</h2>
            <p className="query-sub">Upload a photo to find visually similar outfits.</p>

            <div className="top-k-row">
              <label>Results: <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{topK}</span></label>
              <input
                type="range"
                min="1"
                max="20"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>

            <DropZone key={dropZoneKey} onFileSelect={handleFileSelect} />

            {selectedFile && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleRecommend()} disabled={loading}>
                  {loading ? 'Analysing…' : 'Get Recommendations'}
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--border)', color: 'var(--text)', flex: 1 }}
                  onClick={() => {
                    setSelectedFile(null);
                    setDropZoneKey(k => k + 1);
                  }}
                  disabled={loading}
                >
                  Reupload
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="results-panel">
          {!hasResults && !loading && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>Discover Your Style</h3>
              <p>Upload a photo of any outfit to find visually similar items from our catalog of <strong>{(totalImages || 44441).toLocaleString()}</strong> fashion products.</p>
              <div className="empty-state-hints">
                <div className="empty-hint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Drag & drop or click to browse</span>
                </div>
                <div className="empty-hint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <span>AI searches 44K+ products</span>
                </div>
                <div className="empty-hint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>View store availability for each result</span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <LoadingOverlay
              show={true}
              message="Finding similar outfits…"
              sub={`Searching across ${(totalImages || 44441).toLocaleString()} outfits`}
            />
          )}

          {hasResults && !loading && (
            <>
              <div className="results-header">
                <h2>Recommendations</h2>
                <div className="results-stats">
                  <span className="stat"><strong>{(totalImages || 44441).toLocaleString()}</strong> searched</span>
                  <span className="stat-divider">·</span>
                  <span className="stat"><strong>{lastRecs.length}</strong> results</span>
                  {lastRecs.elapsed && (
                    <>
                      <span className="stat-divider">·</span>
                      <span className="stat"><strong>{lastRecs.elapsed}s</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="results-toolbar">
                <button
                  className={`toolbar-btn ${showFavsOnly ? 'active' : ''}`}
                  onClick={() => setShowFavsOnly(!showFavsOnly)}
                >
                  ♡ Favorites
                </button>
              </div>

              <FilterBar
                recommendations={lastRecs}
                onFilterChange={handleFilterChange}
              />

              <div className="result-grid">
                {filteredRecs.map((rec, i) => (
                  <ResultCard
                    key={rec.image_path + i}
                    rec={rec}
                    isCompareChecked={selectedCompareItems.includes(rec.image_path)}
                    onToggleCompare={toggleCompare}
                    onFindSimilar={findSimilar}
                    onOpenDetail={setDetailRec}
                  />
                ))}
              </div>

              <CompareBar
                count={selectedCompareItems.length}
                onCompare={() => setShowCompareModal(true)}
              />
            </>
          )}
        </section>
      </div>

      {showCompareModal && compareItems.length >= 2 && (
        <CompareModal items={compareItems} onClose={() => { setShowCompareModal(false); setSelectedCompareItems([]); }} />
      )}

      {detailRec && (
        <DetailModal rec={detailRec} onClose={() => setDetailRec(null)} />
      )}
    </>
  );
}
