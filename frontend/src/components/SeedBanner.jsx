import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';

export default function SeedBanner({ type = 'base' }) {
  const showToast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [hidden, setHidden] = useState(false);

  const isBase = type === 'base';
  const seedEndpoint = isBase ? '/api/seed' : '/api/fine-tune/seed';

  const handleSeed = async () => {
    setSeeding(true);
    setStatusText(isBase
      ? 'Seeding database… (may take a minute)'
      : 'Seeding Style Focus database… (may take a minute)'
    );

    try {
      const res = await fetch(API_BASE_URL + seedEndpoint, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatusText('Seeded successfully.');
        setTimeout(() => setHidden(true), 2000);
        showToast(isBase ? 'Database seeded!' : 'Fine-tune database seeded!', 'success');
      } else {
        setStatusText(`Failed: ${data.detail || 'Error'}`);
      }
    } catch (err) {
      setStatusText(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  if (hidden) return null;

  return (
    <div className="container">
      <div className="seed-banner">
        <div className="seed-banner-content" style={{ display: seeding ? 'none' : 'flex' }}>
          <strong>{isBase ? 'Database not seeded.' : 'Style Focus database not seeded.'}</strong>
          <span>
            {isBase
              ? 'Load the outfit embeddings from CSV to enable Style Match recommendations.'
              : 'Load Style Focus embeddings from CSV to enable Style Focus recommendations.'
            }
          </span>
          <button className="btn btn-primary" onClick={handleSeed} disabled={seeding}>
            {isBase ? 'Seed Database' : 'Seed Style Focus DB'}
          </button>
        </div>
        {seeding && (
          <div className="seed-progress">
            <span className="spinner"></span>
            <span>{statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
