# Outfit Recommendation System

Upload an outfit photo and get similar outfit suggestions using AI.

---

## How it works

```
        ┌──────────────┐
        │  You upload   │
        │  an outfit    │
        │  photo        │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  AI Model     │
        │  (Efficient-  │
        │   NetB3)      │
        │  extracts     │
        │  1536 features│
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Search       │
        │  database for │
        │  similar      │
        │  feature      │
        │  vectors      │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Show you    │
        │  top matching│
        │  outfits     │
        └──────────────┘


Adding a new outfit to the database:

        ┌──────────────┐
        │  Upload a    │
        │  new outfit  │
        │  photo       │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  AI extracts │
        │  features &  │
        │  saves to    │
        │  database    │
        └──────────────┘
```

The system uses a pre-trained AI model (EfficientNetB3) to understand what an outfit looks like and find visually similar ones from a database of 44,000+ images.

---

## API Endpoints

### Check if data is loaded
```
GET /api/seed/status
```
Returns whether the outfit database has been populated.

### Load outfit data
```
POST /api/seed
```
Loads the outfit embeddings from CSV into the database. Run this once before using recommendations.

### Find similar outfits
```
POST /api/recommend?top_k=5
```
Upload an image and get top matching outfits.  
Use **form-data** with key `file` (File type).

### Add a new outfit to database
```
POST /api/embeddings
```
Upload an image → AI extracts features → saves to database.  
Use **form-data** with key `file` (File type).

---

## Database

| Field | Type | What it stores |
|---|---|---|
| `id` | Number | Unique ID for each entry |
| `image_path` | Text | Location of the outfit image |
| `embedding` | Vector (1536) | AI-generated features of the image |

The `embedding` is a set of 1536 numbers that describe the outfit's visual style. The system compares these numbers to find similar outfits.

---

## Tech Stack

- **Backend:** Python, FastAPI
- **AI Model:** EfficientNetB3 (TensorFlow/Keras)
- **Database:** PostgreSQL + pgvector
- **Frontend:** HTML, CSS, JavaScript
