import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import SeedBanner from '../components/SeedBanner';
import DropZone from '../components/DropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import { FineTuneResultCard } from '../components/ResultCard';

export default function FineTunePage() {
  const showToast = useToast();

  const [topK, setTopK] = useState(5);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dropZoneKey, setDropZoneKey] = useState(0);
  const [ftLoading, setFtLoading] = useState(false);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const [ftResults, setFtResults] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [ftSeeded, setFtSeeded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/fine-tune/seed/status');
        const data = await res.json();
        if (!cancelled) setFtSeeded(data.seeded);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setFtResults(null);
    setCompareData(null);
  }, []);

  const handleFtRecommend = useCallback(async () => {
    if (!selectedFile) return;
    setFtLoading(true);
    setLoadingMsg('Searching with Style Focus…');
    setFtResults(null);
    setCompareData(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const url = API_BASE_URL + `/api/fine-tune/recommend?top_k=${topK}`;
      const res = await fetch(url, { method: 'POST', body: formData });

      if (res.status === 404) {
        setFtLoading(false);
        showToast('No Style Focus embeddings in database. Seed the data first.');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');

      setFtResults(data.recommendations || []);
      setFtLoading(false);
    } catch (err) {
      setFtLoading(false);
      showToast(err.message);
    }
  }, [selectedFile, topK, showToast]);

  const handleCompare = useCallback(async () => {
    if (!selectedFile) return;
    setCmpLoading(true);
    setLoadingMsg('Running both models…');
    setFtResults(null);
    setCompareData(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const url = API_BASE_URL + `/api/fine-tune/compare?top_k=${topK}`;
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || 'Request failed');

      setCompareData({
        base: data.base_recommendations || [],
        fineTune: data.fine_tune_recommendations || [],
      });
      setCmpLoading(false);
    } catch (err) {
      setCmpLoading(false);
      showToast(err.message);
    }
  }, [selectedFile, topK, showToast]);

  const loading = ftLoading || cmpLoading;

  return (
    <>
      {ftSeeded === false && <SeedBanner type="fine-tune" />}

      <div className="container home-layout">
        <aside className="query-panel">
          <div className="query-card">
            <h2 className="query-title">Style Focus Query</h2>
            <p className="query-sub">Upload a photo to get recommendations from the Style Focus model.</p>

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
              <div className="ft-btn-row">
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleFtRecommend}
                  disabled={ftLoading || cmpLoading}
                >
                  {ftLoading ? 'Analysing…' : 'Get Style Focus Recommendations'}
                </button>
                <button
                  className="btn btn-full"
                  onClick={handleCompare}
                  disabled={ftLoading || cmpLoading}
                  style={{ background: 'var(--border)', color: 'var(--text)' }}
                >
                  {cmpLoading ? 'Comparing…' : 'Compare Both Models'}
                </button>
                <button
                  className="btn btn-full"
                  onClick={() => {
                    setSelectedFile(null);
                    setDropZoneKey(k => k + 1);
                  }}
                  disabled={ftLoading || cmpLoading}
                  style={{ background: 'var(--border)', color: 'var(--text)' }}
                >
                  Try Another
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="results-panel">
          {loading && (
            <LoadingOverlay show={true} message={loadingMsg} sub="" />
          )}

          {!loading && !ftResults && !compareData && (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p>Upload an image to see Style Focus recommendations</p>
            </div>
          )}

          {ftResults && !loading && (
            <>
              <div className="results-header">
                <h2>Style Focus Recommendations</h2>
                <div className="results-stats">
                  <span className="stat"><strong>{ftResults.length}</strong> results (Style Focus)</span>
                </div>
              </div>
              <div className="result-grid">
                {ftResults.map((rec, i) => (
                  <FineTuneResultCard key={rec.image_path + i} rec={rec} />
                ))}
              </div>
            </>
          )}

          {compareData && !loading && (
            <>
              <div className="results-header">
                <h2>Model Comparison</h2>
                <div className="results-stats">
                  <span className="stat">
                    <strong>{compareData.base.length}</strong> Style Match ·{' '}
                    <strong>{compareData.fineTune.length}</strong> Style Focus
                  </span>
                </div>
              </div>
              <div className="compare-grid-wrap" style={{ marginTop: '0.5rem' }}>
                <div className="compare-side-by-side">
                  <div className="compare-side-col">
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Style Match</h3>
                    {compareData.base.map((rec, i) => {
                      return (
                        <div className="compare-side-card" key={i}>
                          <div className="compare-side-img">
                            <img src={API_BASE_URL + rec.image_path} alt="" loading="lazy" />
                          </div>
                          <div className="compare-side-info">
                            {rec.product_display_name && (
                              <div className="compare-side-name">{rec.product_display_name}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="compare-side-col">
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Style Focus</h3>
                    {compareData.fineTune.map((rec, i) => {
                      return (
                        <div className="compare-side-card" key={i}>
                          <div className="compare-side-img">
                            <img src={API_BASE_URL + rec.image_path} alt="" loading="lazy" />
                          </div>
                          <div className="compare-side-info">
                            {rec.product_display_name && (
                              <div className="compare-side-name">{rec.product_display_name}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
