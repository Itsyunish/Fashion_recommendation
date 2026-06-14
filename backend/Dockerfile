# ── Build stage ─────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install system build deps (needed by some wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Pre-install torch/torchvision from the CPU-only index so that:
#   1. We avoid bundling the CUDA runtime (triggers the cuInit error in containers)
#   2. The wheel is much smaller
#   3. torch is available even if uv cannot resolve it for Python 3.13 from PyPI
RUN uv pip install --system \
    --index-url https://download.pytorch.org/whl/cpu \
    'torch>=2.5.0' 'torchvision>=0.20.0'

# Copy project files
COPY pyproject.toml .

# Compile & install the remaining dependencies
RUN uv pip compile --python-version 3.13 pyproject.toml > requirements.txt
RUN uv pip install --system -r requirements.txt

# ── Runtime stage ───────────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
