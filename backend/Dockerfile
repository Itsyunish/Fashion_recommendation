# ── Build stage ─────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy project files
COPY pyproject.toml .

# Install dependencies only
RUN uv pip compile --python-version 3.13 pyproject.toml > requirements.txt
RUN uv pip install --system -r requirements.txt

# ── Runtime stage ───────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
