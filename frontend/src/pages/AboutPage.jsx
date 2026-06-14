export default function AboutPage() {
  return (
    <div className="container about-content">
      <h1>About PixelCloset</h1>
      <p className="about-lead">An AI-powered visual similarity search engine for fashion.</p>

      <div className="about-grid">
        <div className="about-card">
          <h3>How it works</h3>
          <p>Upload an outfit photo. EfficientNetB3 extracts a feature vector, which is compared against 44K+ embeddings using pgvector cosine similarity. Results are ranked by visual similarity.</p>
        </div>
        <div className="about-card">
          <h3>Architecture</h3>
          <p>Three services: <strong>Feature Extraction</strong> (Team A), <strong>Similarity Search</strong> (Team B), and <strong>Image Repository</strong> (Team C). PostgreSQL + pgvector for scalable vector search.</p>
        </div>
        <div className="about-card">
          <h3>Tech Stack</h3>
          <p>FastAPI · EfficientNetB3 · PostgreSQL · pgvector · TensorFlow · Docker</p>
        </div>
      </div>
    </div>
  );
}
