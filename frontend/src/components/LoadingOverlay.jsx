export default function LoadingOverlay({ show, message = 'Finding similar outfits…', sub = 'Searching across — outfits' }) {
  if (!show) return null;

  return (
    <div id="loadingOverlay" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
      <div className="loading-content">
        <div className="spinner lg"></div>
        <p>{message}</p>
        <p className="loading-sub">{sub}</p>
      </div>
    </div>
  );
}
