# backend/services/face_embedding.py
from __future__ import annotations
import numpy as np
import os
import traceback
from typing import List, Optional, Tuple, Dict, Any
import torch
from PIL import Image
from facenet_pytorch import MTCNN
from .mobile_facenet import MobileFaceNet


# =========================
# Config
# =========================
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../backend
_ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")
_MOBILEFACENET_PATH = os.environ.get(
    "MOBILEFACENET_PATH",
    os.path.join(_ASSETS_DIR, "model_mobilefacenet.pth"),
)

_DEVICE = "cpu"  # keep CPU for now; switch to "mps"/"cuda" later if needed


# =========================
# Lazy singletons
# =========================
_mtcnn: Optional[MTCNN] = None
_model: Optional[MobileFaceNet] = None


def _get_mtcnn() -> MTCNN:
    global _mtcnn
    if _mtcnn is None:
        # keep_all=True gives multiple faces; set image_size=112 so crop matches embedding input
        _mtcnn = MTCNN(
            image_size=112,
            margin=10,
            min_face_size=40,
            thresholds=[0.6, 0.7, 0.7],
            factor=0.709,
            keep_all=True,
            device=_DEVICE,
        )
        print("[face] MTCNN initialized")
    return _mtcnn


def _load_state_dict_safely(model: torch.nn.Module, ckpt: Any) -> None:
    """
    Handles checkpoints saved as:
    - state_dict
    - {"state_dict": ...}
    - {"model": ...}
    and prefixes like 'module.'.
    """
    if isinstance(ckpt, dict) and "state_dict" in ckpt:
        sd = ckpt["state_dict"]
    elif isinstance(ckpt, dict) and "model" in ckpt and isinstance(ckpt["model"], dict):
        sd = ckpt["model"]
    elif isinstance(ckpt, dict):
        sd = ckpt
    else:
        raise ValueError("Unsupported checkpoint format (not a dict/state_dict).")

    # Strip common prefixes
    cleaned = {}
    for k, v in sd.items():
        nk = k
        for prefix in ("module.", "model.", "backbone."):
            if nk.startswith(prefix):
                nk = nk[len(prefix):]
        cleaned[nk] = v

    missing, unexpected = model.load_state_dict(cleaned, strict=False)
    if missing:
        print("[face] WARNING missing keys:", missing[:20])
    if unexpected:
        print("[face] WARNING unexpected keys:", unexpected[:20])


def _get_model() -> MobileFaceNet:
    global _model
    if _model is None:
        if not os.path.exists(_MOBILEFACENET_PATH):
            raise FileNotFoundError(f"MobileFaceNet checkpoint not found: {_MOBILEFACENET_PATH}")

        _model = MobileFaceNet(embedding_dim=128).to(_DEVICE).eval()

        ckpt = torch.load(_MOBILEFACENET_PATH, map_location=_DEVICE)
        _load_state_dict_safely(_model, ckpt)

        print(f"[face] MobileFaceNet loaded from {_MOBILEFACENET_PATH}")
    return _model


# =========================
# Public API used by main.py
# =========================
def detect_face_and_crop(bgr_image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Input: OpenCV BGR image
    Output: list of dicts: { "crop": np.ndarray(BGR), "bbox": [x1,y1,x2,y2] }
    """
    try:
        mtcnn = _get_mtcnn()

        # Convert BGR -> RGB PIL
        rgb = bgr_image[:, :, ::-1]
        pil = Image.fromarray(rgb)

        boxes, probs = mtcnn.detect(pil)
        if boxes is None or len(boxes) == 0:
            return []

        faces = []
        h, w = bgr_image.shape[:2]

        for i, box in enumerate(boxes):
            if probs is not None and probs[i] is not None and probs[i] < 0.90:
                continue

            x1, y1, x2, y2 = box
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

            # clamp
            x1 = max(0, min(w - 1, x1))
            x2 = max(0, min(w - 1, x2))
            y1 = max(0, min(h - 1, y1))
            y2 = max(0, min(h - 1, y2))
            if x2 <= x1 or y2 <= y1:
                continue

            crop = bgr_image[y1:y2, x1:x2].copy()
            faces.append({"crop": crop, "bbox": [x1, y1, x2, y2]})

        return faces

    except Exception as e:
        print("[face] detect_face_and_crop error:", e)
        traceback.print_exc()
        return []


def generate_embedding(face_crop_bgr: np.ndarray) -> np.ndarray:
    """
    Input: face crop (BGR)
    Output: normalized embedding (shape: (128,))
    """
    model = _get_model()

    # BGR -> RGB PIL -> 112x112
    rgb = face_crop_bgr[:, :, ::-1]
    pil = Image.fromarray(rgb).resize((112, 112))

    # to tensor [0,1], then normalize to [-1,1]
    x = torch.from_numpy(np.array(pil)).float() / 255.0  # HWC
    x = x.permute(2, 0, 1).unsqueeze(0)  # 1CHW
    x = (x - 0.5) / 0.5

    with torch.no_grad():
        emb = model(x.to(_DEVICE)).cpu().numpy()[0]  # (128,)

    # Ensure L2-normalized (model already does this)
    norm = np.linalg.norm(emb) + 1e-12
    return emb / norm


def compare_embedding_to_db(
    emb: np.ndarray,
    db_persons: List[dict],
    threshold: float = 0.6
) -> Optional[Tuple[str, float]]:
    """
    Returns (best_name, best_similarity) if best_similarity >= threshold else None.
    Assumes db_persons items look like: {"name": "...", "embeddings": [[...],[...],...]}
    """

    # ensure 1D float32
    emb = np.asarray(emb, dtype=np.float32).reshape(-1)

    # normalize (even if already normalized)
    emb_norm = np.linalg.norm(emb) + 1e-8
    emb = emb / emb_norm

    best_name = None
    best_sim = -1.0

    for person in db_persons:
        name = person.get("name", "unknown")
        embs_list = person.get("embeddings", [])

        for e in embs_list:
            e = np.asarray(e, dtype=np.float32).reshape(-1)
            e = e / (np.linalg.norm(e) + 1e-8)

            sim = float(np.dot(emb, e))  # cosine since both normalized
            if sim > best_sim:
                best_sim = sim
                best_name = name

    print(f"[match] best candidate: {best_name}, best cosine: {best_sim:.4f}, threshold: {threshold}")

    if best_sim >= threshold and best_name is not None:
        return best_name, best_sim
    return None
