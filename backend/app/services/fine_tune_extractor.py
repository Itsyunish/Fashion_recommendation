"""Fine-tuned EfficientNetB3 (PyTorch) — load once, extract embeddings from image bytes."""
import io
import logging

import numpy as np
from numpy.linalg import norm
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

_model = None
_device = None


def get_fine_tune_model():
    global _model, _device
    if _model is not None:
        return _model

    try:
        import torch
        import torch.nn as nn
        import torchvision.models as models
    except ImportError:
        logger.warning("PyTorch is not installed; fine-tuned model unavailable")
        return None

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Loading fine-tuned model on {_device} …")

    try:
        raw = torch.load(settings.FINE_TUNE_MODEL_PATH, map_location=_device, weights_only=False)
    except FileNotFoundError:
        logger.warning("Fine-tuned model file not found at %s", settings.FINE_TUNE_MODEL_PATH)
        return None

    if isinstance(raw, nn.Module):
        _model = raw.to(_device)
        _model.eval()
        logger.info("Fine-tuned model loaded (full model)")
        return _model

    base = models.efficientnet_b3(weights=None)
    in_features = base.classifier[1].in_features
    base.classifier = nn.Identity()

    base.load_state_dict(raw, strict=False)
    base = base.to(_device)
    base.eval()

    _model = base
    logger.info(f"Fine-tuned model loaded (state_dict) — output dim: {in_features}")
    return _model


def extract_fine_tune_features(img_bytes: bytes) -> np.ndarray:
    model = get_fine_tune_model()
    if model is None or _device is None:
        raise RuntimeError(
            "Fine-tuned model is not available. "
            "Make sure PyTorch is installed and the model file exists."
        )

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
