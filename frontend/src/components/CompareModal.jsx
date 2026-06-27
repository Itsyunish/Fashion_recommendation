import { API_BASE_URL } from '../config';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

function Row({ label, val }) {
  if (!valid(val)) return null;
  return <tr><td className="label">{label}</td><td className="value">{val}</td></tr>;
}

function Section({ label }) {
  return <tr className="section-label"><td colSpan="2">{label}</td></tr>;
}

function CompareCol({ rec }) {
  const attrs = rec.article_attributes || {};
  return (
    <div className="compare-col">
      <div className="modal-img-wrap">
        <img src={API_BASE_URL + rec.image_path} alt={rec.image_path.split('/').pop()} />
      </div>
      <div className="modal-head" style={{ marginBottom: '0.25rem' }}>
        <div className="modal-title" style={{ fontSize: '0.85rem' }}>
          {rec.product_display_name || rec.image_path.split('/').pop()}
        </div>
      </div>
      <table className="modal-table">
        <tbody>
          <Section label="Details" />
          <Row label="Brand" val={rec.brand_name} />
          <Row label="Gender" val={rec.gender} />
          <Row label="Category" val={rec.master_category} />
          <Row label="Colour" val={rec.base_colour} />
          <Row label="Usage" val={rec.usage} />
          <Row label="Rating" val={rec.rating || null} />
          {Object.keys(attrs).length > 0 && <Section label="Attributes" />}
          {Object.entries(attrs).map(([k, v]) => (
            <Row key={k} label={k.replace(/_/g, ' ')} val={v} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompareModal({ items, onClose }) {
  if (!items || items.length < 2) return null;

  const cols = Math.min(items.length, 4);

  return (
    <div className="modal-overlay open compare-modal" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-info">
          <div className="modal-head" style={{ marginBottom: '0.75rem' }}>
            <div className="modal-title">Compare Items</div>
          </div>
          <div className={`compare-grid cols-${cols}`}>
            {items.slice(0, cols).map((rec, i) => <CompareCol key={i} rec={rec} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
