export default function CompareBar({ count, onCompare }) {
  if (count === 0) return null;

  return (
    <div className={`compare-bar ${count >= 2 ? 'visible' : ''}`}>
      <span className="compare-bar-count">{count} selected</span>
      <button
        className="btn btn-primary compare-btn"
        disabled={count < 2}
        onClick={onCompare}
      >
        Compare
      </button>
    </div>
  );
}
