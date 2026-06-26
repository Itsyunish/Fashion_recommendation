import { API_BASE_URL } from '../config';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

export default function DetailModal({ rec, onClose }) {
  if (!rec) return null;

  const filename = rec.image_path.split('/').pop();
  const score = (rec.similarity_score * 100).toFixed(1);

  function fmt(val, prefix) {
    if (!valid(val)) return null;
    return (prefix || '') + val;
  }

  function Row({ label, val }) {
    if (!valid(val)) return null;
    return <tr><td className="label">{label}</td><td className="value">{val}</td></tr>;
  }

  function Section({ label }) {
    return <tr className="section-label"><td colSpan="2">{label}</td></tr>;
  }

  const attrs = rec.article_attributes || {};

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-img-wrap">
          <img src={API_BASE_URL + rec.image_path} alt={filename} />
        </div>

        <div className="modal-info">
          <div className="modal-head">
            <div>
              <div className="modal-title">{rec.product_display_name || filename}</div>
              {rec.brand_name && <div className="modal-brand">{rec.brand_name}</div>}
            </div>
            <span className="modal-score">{score}% match</span>
          </div>

          <div className="modal-meta-row">
            {rec.discounted_price && (
              <span className="modal-price">₹{Number(rec.discounted_price).toLocaleString()}</span>
            )}
            {rec.price && rec.discounted_price && rec.price !== rec.discounted_price && (
              <span className="modal-price-original">₹{Number(rec.price).toLocaleString()}</span>
            )}
            {rec.rating && <span className="modal-rating">★ {rec.rating}</span>}
          </div>

          <table className="modal-table">
            <tbody>
              <Section label="Details" />
              <Row label="Image" val={filename} />
              <Row label="Similarity" val={`${score}%`} />
              <Row label="Gender" val={rec.gender} />
              <Row label="Category" val={rec.master_category} />
              <Row label="Sub Category" val={rec.sub_category} />
              <Row label="Article Type" val={rec.article_type} />
              <Row label="Colour" val={rec.base_colour} />
              <Row label="Season" val={rec.season} />
              <Row label="Year" val={rec.year} />
              <Row label="Usage" val={rec.usage} />
              <Row label="Brand" val={rec.brand_name} />
              <Row label="Price" val={rec.price ? `₹${Number(rec.price).toLocaleString()}` : null} />
              <Row label="Discounted Price" val={rec.discounted_price ? `₹${Number(rec.discounted_price).toLocaleString()}` : null} />
              <Row label="Rating" val={rec.rating ? `★ ${rec.rating} / 5` : null} />
              {Object.keys(attrs).length > 0 && <Section label="Attributes" />}
              {Object.entries(attrs).map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, ' ')} val={v} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
