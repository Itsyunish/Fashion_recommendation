import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

export default function ResultCard({ rec, isCompareChecked, onToggleCompare, onFindSimilar, onOpenDetail }) {
  const { favorites, addFavorite, removeFavorite } = useApp();
  const filename = rec.image_path.split('/').pop();
  const isFav = favorites.has(rec.image_path);
  const [showAllStores, setShowAllStores] = useState(false);

  const stores = rec.stores || [];
  const visibleStores = showAllStores ? stores : stores.slice(0, 2);
  const hasMoreStores = stores.length > 2;

  const handleFavClick = (e) => {
    e.stopPropagation();
    if (isFav) removeFavorite(rec.image_path);
    else addFavorite(rec.image_path);
  };

  const handleCompareChange = (e) => {
    onToggleCompare(rec.image_path, e.target.checked);
  };

  const handleFindSimilar = (e) => {
    e.stopPropagation();
    onFindSimilar(rec.image_path);
  };

  const handleMapClick = (e, mapUrl) => {
    e.stopPropagation();
    if (mapUrl) window.open(mapUrl, '_blank');
  };

  return (
    <div className="result-card">
      <div className="card-img-wrap">
        <img src={API_BASE_URL + rec.image_path} alt="" loading="lazy" />
        <button className={`card-fav ${isFav ? 'active' : ''}`} onClick={handleFavClick}>
          {isFav ? '\u2665' : '\u2661'}
        </button>
        <input type="checkbox" className="card-compare-check" checked={!!isCompareChecked} onChange={handleCompareChange} />
        <button className="card-find-btn" onClick={handleFindSimilar}>
          Find Similar
        </button>
      </div>
      <div className="card-body" onClick={() => onOpenDetail(rec)}>
        {valid(rec.product_display_name)
          ? <div className="card-title" title={rec.product_display_name}>{rec.product_display_name}</div>
          : <div className="card-title">{filename}</div>
        }
        <div className="card-details">
          {valid(rec.base_colour) && <span className="card-tag">{rec.base_colour}</span>}
          {valid(rec.gender) && <span className="card-tag">{rec.gender}</span>}
        </div>

        {stores.length > 0 && (
          <div className="card-stores">
            {visibleStores.map((s, i) => (
              <div key={s.id || i} className="card-store-item" onClick={(e) => handleMapClick(e, s.map_url)} title="Open in Maps">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {s.name}
              </div>
            ))}
            {hasMoreStores && !showAllStores && (
              <button className="card-stores-more" onClick={(e) => { e.stopPropagation(); setShowAllStores(true); }}>
                +{stores.length - 2}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FineTuneResultCard({ rec }) {
  const filename = rec.image_path.split('/').pop();

  const stores = rec.stores || [];
  const visibleStores = stores.slice(0, 2);
  const hasMoreStores = stores.length > 2;

  return (
    <div className="result-card">
      <div className="card-img-wrap">
        <img src={API_BASE_URL + rec.image_path} alt="" loading="lazy" />
      </div>
      <div className="card-body">
        {rec.product_display_name
          ? <div className="card-title">{rec.product_display_name}</div>
          : <div className="card-title">{filename}</div>
        }
        {rec.brand_name && <div className="card-brand">{rec.brand_name}</div>}

        {stores.length > 0 && (
          <div className="card-stores">
            {visibleStores.map((s, i) => (
              <div key={s.id || i} className="card-store-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
