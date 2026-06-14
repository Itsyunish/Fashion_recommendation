import { API_BASE_URL } from '../config';
import { useApp } from '../context/AppContext';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

export default function ResultCard({ rec, isCompareChecked, onToggleCompare, onFindSimilar, onOpenDetail }) {
  const { favorites, addFavorite, removeFavorite } = useApp();
  const filename = rec.image_path.split('/').pop();
  const score = (rec.similarity_score * 100).toFixed(1);
  const barWidth = Math.max(4, rec.similarity_score * 100);
  const isFav = favorites.has(rec.image_path);

  const attrs = rec.article_attributes || {};
  const attrParts = ['fabric', 'sleeve_length', 'neck']
    .map(k => attrs[k])
    .filter(valid);

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

  return (
    <div className="result-card">
      <div className="card-img-wrap">
        <img src={API_BASE_URL + rec.image_path} alt="" loading="lazy" />
        <button
          className={`card-fav ${isFav ? 'active' : ''}`}
          onClick={handleFavClick}
        >
          {isFav ? '\u2665' : '\u2661'}
        </button>
        <input
          type="checkbox"
          className="card-compare-check"
          checked={!!isCompareChecked}
          onChange={handleCompareChange}
        />
        <button className="card-find-btn" onClick={handleFindSimilar}>
          🔍 Find Similar
        </button>
      </div>
      <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => onOpenDetail(rec)}>
        {valid(rec.product_display_name)
          ? <div className="card-title" title={rec.product_display_name}>{rec.product_display_name}</div>
          : <div className="card-title">{filename}</div>
        }
        {valid(rec.brand_name) && <div className="card-brand">{rec.brand_name}</div>}
        <div className="card-price-row">
          {valid(rec.discounted_price) && (
            <span className="card-price">₹{Number(rec.discounted_price).toLocaleString()}</span>
          )}
          {rec.price && rec.discounted_price && rec.price !== rec.discounted_price && (
            <span className="card-price-original">₹{Number(rec.price).toLocaleString()}</span>
          )}
          {valid(rec.rating) && <span className="card-rating">★ {rec.rating}</span>}
        </div>
        <div className="card-details">
          {valid(rec.gender) && <span className="card-tag">{rec.gender}</span>}
          {valid(rec.usage) && <span className="card-tag">{rec.usage}</span>}
          {valid(rec.base_colour) && <span className="card-tag">{rec.base_colour}</span>}
          {valid(rec.season) && <span className="card-tag">{rec.season}</span>}
        </div>
        {attrParts.length > 0 && <div className="card-attr">{attrParts.join(' · ')}</div>}
        <div className="card-score-wrap">
          <div className="card-score-bar" style={{ width: `${barWidth}%` }}></div>
        </div>
        <div className="card-score">{score}% match</div>
      </div>
    </div>
  );
}

export function FineTuneResultCard({ rec }) {
  const filename = rec.image_path.split('/').pop();
  const score = (rec.similarity_score * 100).toFixed(1);
  const barWidth = Math.max(4, rec.similarity_score * 100);

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
        <div className="card-score-wrap">
          <div className="card-score-bar" style={{ width: `${barWidth}%` }}></div>
        </div>
        <div className="card-score">{score}% match</div>
      </div>
    </div>
  );
}
