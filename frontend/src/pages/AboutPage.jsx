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
      desc: 'Upload any outfit photo and our AI instantly finds visually similar items from a catalog of 44,000+ fashion products.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      ),
      title: 'Smart Matching',
      desc: 'Our AI analyzes color, pattern, style, and silhouette to deliver the most relevant matches in seconds.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      title: 'Store Finder',
      desc: 'See which stores near you carry each product. Get directions with one click via Google Maps.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Category-Aware Results',
      desc: 'Results are mapped to the right stores — T-shirts show T-shirt stores, shoes show shoe stores, and so on.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Upload',
      desc: 'Take a photo of any outfit or upload one from your gallery.',
    },
    {
      num: '02',
      title: 'Discover',
      desc: 'Our AI finds the closest visual matches from 44K+ products.',
    },
    {
      num: '03',
      title: 'Shop',
      desc: 'Find nearby stores that carry your matched items and visit them.',
    },
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1>About PixelCloset</h1>
          <p className="about-hero-sub">Find your perfect style — powered by AI, built for Nepal.</p>
        </div>
      </div>

      <div className="container about-content">
        <div className="about-section">
          <h2 className="about-section-title">How It Works</h2>
          <div className="about-steps">
            {steps.map((s, i) => (
              <div key={i} className="about-step">
                <div className="about-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section">
          <h2 className="about-section-title">Features</h2>
          <div className="about-grid">
            {features.map((f, i) => (
              <div key={i} className="about-card">
                <div className="about-card-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section about-mission">
          <div className="about-mission-content">
            <h2>Our Mission</h2>
            <p>
              PixelCloset bridges the gap between online inspiration and offline shopping.
              Upload any outfit photo — from social media, a magazine, or your own wardrobe —
              and discover where to find similar styles at stores across Nepal.
            </p>
            <p>
              We currently cover 45+ stores across Kathmandu and Lalitpur, spanning
              T-shirts, shirts, pants, shoes, watches, sarees, innerwear, and eyewear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
