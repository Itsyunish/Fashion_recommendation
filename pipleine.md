# System Pipeline

This document describes the overall system and data pipeline for the project.

## Repository layout (high level)

- `frontend/` — React/Vite client (UI, components, pages)
- `backend/` — FastAPI/Flask-like server (API endpoints, services, models)
- `fine_tuned_model/` — trained model artifacts and embeddings
- `data/`, `data_2/` — CSVs and raw dataset files
- `docker-compose.yml` — local development deployment

## High-level architecture

- Client (`frontend`) sends image uploads and search queries to the API.
- Server (`backend`) exposes endpoints for product search, recommendations, fine-tuning, and store lookups.
- Feature extraction and similarity use precomputed embeddings; a feature-extractor service converts images to vector representations.
- Fine-tuning and training produce artifacts stored in `fine_tuned_model/` and updated embeddings CSVs.

## What the system does

- Image-based product discovery: users upload an image (or browse) and the system returns visually similar products from the catalog.
- Catalog browsing and detail pages: search, filter, and view product metadata and store availability.
- Recommendations: find-similar and outfit-style suggestions via embedding similarity and business rules.
- Model lifecycle: support fine-tuning on curated datasets and swap-in new model weights and embeddings.
- Store and inventory lookups: map product results to store locations and inventory data.
- Optional mockup generation: generate or fetch product imagery for UI previews (can integrate external image APIs).

## Pipeline steps

1. Data ingestion
   - Collect product metadata (CSV) and image assets in `data/`. 
   - Normalize and deduplicate rows, validate image paths.

2. Preprocessing
   - Resize/normalize images, extract metadata fields used by the model.
   - Optionally augment images for fine-tuning.

3. Embedding / Feature extraction
   - Run images through a feature extractor (backend service) to produce embeddings.
   - Store embeddings in CSV or DB (`embeddings.csv`, `best_embeddings.csv`).

4. Indexing & Similarity
   - Build approximate nearest neighbor index (FAISS / Annoy) from embeddings.
   - Similarity searches return nearest product candidates for a query image.

5. Fine-tuning
   - Use curated training sets (`fine_tuned_model/`) to fine-tune models and re-generate embeddings.
   - Store versioned artifacts and update the service config to point to new weights.

6. Serving
   - Backend exposes REST endpoints consumed by the frontend for browse, find-similar, and fine-tune operations.
   - Optional image-generation endpoints can be added (external API or local diffusion) for mockups.

7. Frontend flow
   - UI upload -> call backend to get embeddings/similar results -> display results and details.

## Deployment & development

- Use `docker-compose.yml` for local dev; services include backend and frontend containers.
- Use the Python virtual environment (see `backend/pyproject.toml`) for backend development.

## Next steps / recommendations

- Replace placeholder/demo images with licensed brand assets or integrate an image provider (Unsplash API) for realistic visuals.
- Add automated tests for endpoints that produce embeddings and similarity results.
- Add CI/CD steps to build and deploy model artifacts when fine-tuning completes.

---

File references: `frontend/`, `backend/`, `fine_tuned_model/`, `data/`, `docker-compose.yml`.
