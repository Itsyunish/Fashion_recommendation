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

  function row(label, val) {
    if (!valid(val)) return '';
    return `<tr><td class="label">${label}</td><td class="value">${val}</td></tr>`;
  }

  function section(label) {
    return `<tr class="section-label"><td colspan="2">${label}</td></tr>`;
  }

  const attrs = rec.article_attributes || {};
  const attrRows = Object.keys(attrs).map(k =>
    row(k.replace(/_/g, ' '), attrs[k])
  ).join('');

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
              {section('Details')}
              {row('Image', filename)}
              {row('Similarity', `${score}%`)}
              {row('Gender', rec.gender)}
              {row('Category', rec.master_category)}
              {row('Sub Category', rec.sub_category)}
              {row('Article Type', rec.article_type)}
              {row('Colour', rec.base_colour)}
              {row('Season', rec.season)}
              {row('Year', rec.year)}
              {row('Usage', rec.usage)}
              {row('Brand', rec.brand_name)}
              {row('Price', rec.price ? `₹${Number(rec.price).toLocaleString()}` : null)}
              {row('Discounted Price', rec.discounted_price ? `₹${Number(rec.discounted_price).toLocaleString()}` : null)}
              {row('Rating', rec.rating ? `★ ${rec.rating} / 5` : null)}
              {attrRows ? section('Attributes') : ''}
              {attrRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
