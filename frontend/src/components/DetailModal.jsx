import { API_BASE_URL } from '../config';

function valid(v) {
  return v != null && v !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim());
}

function StoreCard({ store }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayHours = store.opening_hours?.[today] || null;
  const isOpen = todayHours && todayHours !== 'Closed';

  return (
    <div className="store-card">
      <div className="store-card-top">
        <div className="store-card-info">
          <div className="store-card-name">{store.name}</div>
          <div className="store-card-addr">{store.address}, {store.city}</div>
        </div>
        <a
          href={store.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="store-card-map"
          title="Open in Google Maps"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </a>
      </div>
      <div className="store-card-bottom">
        {store.phone && (
          <div className="store-card-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {store.phone}
          </div>
        )}
        {todayHours && (
          <div className={`store-card-hours ${isOpen ? 'open' : ''}`}>
            <span className="store-card-dot"></span>
            {isOpen ? `Open today: ${todayHours}` : 'Closed today'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailModal({ rec, onClose }) {
  if (!rec) return null;

  const filename = rec.image_path.split('/').pop();
  const stores = rec.stores || [];

  function Row({ label, val }) {
    if (!valid(val)) return null;
    return <tr><td className="label">{label}</td><td className="value">{val}</td></tr>;
  }

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-img-wrap">
          <img src={API_BASE_URL + rec.image_path} alt={filename} />
        </div>

        <div className="modal-info">
          <div className="modal-head">
            <div className="modal-title">{rec.product_display_name || filename}</div>
          </div>

          {stores.length > 0 && (
            <div className="detail-stores">
              <div className="detail-stores-list">
                {stores.map((s, i) => (
                  <StoreCard key={s.id || i} store={s} />
                ))}
              </div>
            </div>
          )}

          <table className="modal-table">
            <tbody>
              <Row label="Gender" val={rec.gender} />
              <Row label="Category" val={rec.master_category} />
              <Row label="Sub Category" val={rec.sub_category} />
              <Row label="Colour" val={rec.base_colour} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
