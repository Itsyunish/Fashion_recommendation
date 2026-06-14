import { API_BASE_URL } from '../config';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

function row(label, val) {
  return valid(val) ? `<tr><td class="label">${label}</td><td class="value">${val}</td></tr>` : '';
}

function section(label) {
  return `<tr class="section-label"><td colspan="2">${label}</td></tr>`;
}

export default function CompareModal({ items, onClose }) {
  if (!items || items.length < 2) return null;

  const cols = Math.min(items.length, 4);
  const colHtml = items.map(rec => {
    const attrs = rec.article_attributes || {};
    const attrRows = Object.keys(attrs).map(k => row(k.replace(/_/g, ' '), attrs[k])).join('');
    return `<div class="compare-col">
      <div class="modal-img-wrap">
        <img src="${API_BASE_URL}${rec.image_path}" alt="${rec.image_path.split('/').pop()}">
      </div>
      <div class="modal-head" style="margin-bottom:0.25rem">
        <div class="modal-title" style="font-size:0.85rem">${rec.product_display_name || rec.image_path.split('/').pop()}</div>
      </div>
      <table class="modal-table">
        ${section('Details')}
        ${row('Similarity', (rec.similarity_score * 100).toFixed(1) + '%')}
        ${row('Brand', rec.brand_name)}
        ${row('Price', rec.discounted_price ? '\u20B9' + Number(rec.discounted_price).toLocaleString() : null)}
        ${row('Gender', rec.gender)}
        ${row('Category', rec.master_category)}
        ${row('Type', rec.article_type)}
        ${row('Colour', rec.base_colour)}
        ${row('Season', rec.season)}
        ${row('Usage', rec.usage)}
        ${row('Rating', rec.rating ? '\u2605 ' + rec.rating : null)}
        ${attrRows ? section('Attributes') : ''}
        ${attrRows}
      </table>
    </div>`;
  }).join('');

  return (
    <div className="modal-overlay open compare-modal" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-info">
          <div className="modal-head" style={{ marginBottom: '0.75rem' }}>
            <div className="modal-title">Compare Items</div>
          </div>
          <div className={`compare-grid cols-${cols}`} dangerouslySetInnerHTML={{ __html: colHtml }} />
        </div>
      </div>
    </div>
  );
}
