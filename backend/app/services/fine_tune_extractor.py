"""Fine-tuned model — load once, extract embeddings from image bytes.
Supports both PyTorch (.pt) and Keras (.keras) fine-tuned models."""
import io
import logging

import numpy as np
from numpy.linalg import norm
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

_model = None
_device = None
_keras_output_dim: int | None = None


def _load_pytorch_model():
    global _device
    try:
        import torch
        import torch.nn as nn
        import torchvision.models as models
    except ImportError:
        logger.warning("PyTorch is not installed; fine-tuned model unavailable")
        return None

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Loading fine-tuned PyTorch model on {_device} …")

    try:
        raw = torch.load(settings.FINE_TUNE_MODEL_PATH, map_location=_device, weights_only=False)
    except FileNotFoundError:
        logger.warning("Fine-tuned PyTorch model file not found at %s", settings.FINE_TUNE_MODEL_PATH)
        return None

    if isinstance(raw, nn.Module):
        model = raw.to(_device)
        model.eval()
        logger.info("Fine-tuned PyTorch model loaded (full model)")
        return model

    base = models.efficientnet_b3(weights=None)
    in_features = base.classifier[1].in_features
    base.classifier = nn.Identity()

    base.load_state_dict(raw, strict=False)
    base = base.to(_device)
    base.eval()

    logger.info(f"Fine-tuned PyTorch model loaded (state_dict) — output dim: {in_features}")
    return base


def _load_keras_model():
    global _keras_output_dim
    import tensorflow as tf
    from tensorflow import keras

    model_path = settings.FINE_TUNE_KERAS_MODEL_PATH
    try:
        best_model = keras.models.load_model(model_path)
    except FileNotFoundError:
        logger.warning("Fine-tuned Keras model file not found at %s", model_path)
        return None

    _ = best_model(tf.zeros((1, 224, 224, 3)))

    model = tf.keras.Model(
        inputs=best_model.inputs,
        outputs=best_model.layers[-2].output,
    )

    _keras_output_dim = model.output_shape[-1]
    logger.info(
        "Fine-tuned Keras model loaded from %s — output dim: %s",
        model_path, _keras_output_dim,
    )
    return model


def get_keras_output_dim() -> int | None:
    return _keras_output_dim


def get_fine_tune_model():
    global _model
    if _model is not None:
        return _model

    if settings.USE_KERAS:
        _model = _load_keras_model()
    else:
        _model = _load_pytorch_model()

    if _model is None:
        logger.warning("Fine-tuned model could not be loaded")
    return _model


def _extract_pytorch_features(img_bytes: bytes, model) -> np.ndarray | None:
    import torch
    from torchvision import transforms

    transform = transforms.Compose([
        transforms.Resize((settings.MODEL_INPUT_SIZE, settings.MODEL_INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    x = transform(img).unsqueeze(0).to(_device)

    with torch.no_grad():
        vec = model(x).cpu().numpy().flatten()

    return vec / norm(vec)


def _extract_keras_features(img_bytes: bytes, model) -> np.ndarray:
    input_shape = model.input_shape
    target_size = input_shape[1] if input_shape else 224
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize((target_size, target_size))
    x = np.array(img, dtype=np.float32) / 255.0
    x = np.expand_dims(x, axis=0)
    vec = model.predict(x, verbose=0).flatten()
    return vec / norm(vec)


def extract_fine_tune_features(img_bytes: bytes) -> np.ndarray | None:
    model = get_fine_tune_model()
    if model is None:
        return None

    if settings.USE_KERAS:
        return _extract_keras_features(img_bytes, model)
    else:
        return _extract_pytorch_features(img_bytes, model)
