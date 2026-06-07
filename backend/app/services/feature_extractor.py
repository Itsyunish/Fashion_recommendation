"""EfficientNetB3 model — load once, extract embeddings from image bytes.

Responsibility of **Team A**.
"""
import io
import logging

import numpy as np
from numpy.linalg import norm
from PIL import Image
from tensorflow.keras.applications.efficientnet import EfficientNetB3, preprocess_input
from tensorflow.keras.layers import GlobalMaxPooling2D
from tensorflow.keras.models import Model

from app.config import settings

logger = logging.getLogger(__name__)

_model: Model | None = None


def get_model() -> Model:
    """Lazy‑load and cache the EfficientNetB3 feature extractor singleton."""
    global _model
    if _model is None:
        logger.info("Loading EfficientNetB3 feature extractor …")
        base = EfficientNetB3(
            weights="imagenet",
            include_top=False,
            input_shape=(settings.MODEL_INPUT_SIZE, settings.MODEL_INPUT_SIZE, 3),
        )
        base.trainable = False
        _model = Model(inputs=base.input, outputs=GlobalMaxPooling2D()(base.output))
        logger.info(f"Model loaded — output shape: {_model.output_shape}")
    return _model


def extract_features(img_bytes: bytes) -> np.ndarray:
    """Return a 1536‑dim L2‑normalised embedding for the given image bytes."""
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((settings.MODEL_INPUT_SIZE, settings.MODEL_INPUT_SIZE))
    x = np.array(img, dtype=np.float32)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    vec = get_model().predict(x, verbose=0).flatten()
    return vec / norm(vec)
