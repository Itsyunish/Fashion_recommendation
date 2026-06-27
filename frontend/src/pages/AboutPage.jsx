export default function AboutPage() {
  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      title: 'Visual Search',
      desc: 'Upload any outfit photo and our AI finds visually similar items from a catalog of 44K+ fashion products using deep learning embeddings.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
      title: 'Similarity Search',
      desc: 'Powered by EfficientNetB3 and pgvector cosine similarity, delivering millisecond-level search across thousands of high-dimensional vectors.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
        </svg>
      ),
      title: 'Store Availability',
      desc: 'See which stores in Nepal carry each product. Click to open Google Maps directions directly to the store location.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      title: 'Fine-Tuned Model',
      desc: 'A custom-trained model for improved fashion-specific similarity, plus a side-by-side comparison mode to evaluate both models.',
    },
  ];

  const techStack = [
    { label: 'Backend', value: 'FastAPI (Python)' },
    { label: 'Frontend', value: 'React 18 + Vite' },
    { label: 'AI Model', value: 'EfficientNetB3 (TensorFlow/Keras)' },
    { label: 'Vector DB', value: 'PostgreSQL + pgvector' },
    { label: 'Auth', value: 'Session-based (bcrypt)' },
    { label: 'Container', value: 'Docker Compose' },
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1>About PixelCloset</h1>
          <p className="about-hero-sub">AI-powered visual similarity search for fashion — built for Nepal.</p>
        </div>
      </div>

      <div className="container about-content">
        <div className="about-grid">
          {features.map((f, i) => (
            <div key={i} className="about-card">
              <div className="about-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="about-tech-section">
          <h2>Tech Stack</h2>
          <div className="about-tech-grid">
            {techStack.map((t, i) => (
              <div key={i} className="about-tech-item">
                <span className="about-tech-label">{t.label}</span>
                <span className="about-tech-value">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
