from typing import List, Optional, Tuple
import os
import traceback
import base64
import io

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from services import face_database, face_embedding, tts

# If your file is named "colour_detection.py" (British spelling)
from colour_detection import ColorDetector
from currency_detection import CurrencyDetector


# ================================================================
# App
# ================================================================
app = FastAPI(title="V-EYE Unified Backend (All Modes)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,   # ok for mobile dev
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n>>> {request.method} {request.url.path}")
    resp = await call_next(request)
    print(f"<<< {resp.status_code}\n")
    return resp


# ================================================================
# Paths (FIXED)
# ================================================================
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")

_NAV_MODEL_PATH = os.environ.get("NAV_MODEL_PATH", os.path.join(_ASSETS_DIR, "yolov8n.pt"))
_CURRENCY_MODEL_PATH = os.environ.get("CURRENCY_MODEL_PATH", os.path.join(_ASSETS_DIR, "best.pt"))
_CLOTHES_MODEL_PATH = os.environ.get(
    "CLOTHES_MODEL_PATH",
    os.path.join(_ASSETS_DIR, "deepfashion2_yolov8s-seg.pt")
)


# ================================================================
# Pydantic Models
# ================================================================
class PersonRegisterRequest(BaseModel):
    name: str
    images: List[str]  # Base64 encoded images


# ================================================================
# Helper: Decode base64 image to numpy array
# ================================================================
def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    """
    Decode base64 string to OpenCV image (BGR).
    Supports optional data URI prefix: 'data:image/jpeg;base64,...'
    """
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        image_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        print(f"[decode_base64_image] Error: {e}")
        return None


# ================================================================
# Helper Functions for Position and Distance
# ================================================================
def get_horizontal_position(x_center: float, img_width: int) -> str:
    if x_center < img_width * 0.33:
        return "left"
    elif x_center > img_width * 0.66:
        return "right"
    return "center"


def estimate_distance(bbox: list, img_height: int, img_width: int) -> str:
    x1, y1, x2, y2 = bbox
    box_area = (x2 - x1) * (y2 - y1)
    img_area = img_height * img_width
    ratio = box_area / img_area if img_area > 0 else 0

    if ratio > 0.20:
        return "very_close"
    elif ratio > 0.08:
        return "close"
    elif ratio > 0.03:
        return "medium"
    return "far"


# ================================================================
# Lazy-loaded detectors (avoid slow startup)
# ================================================================
_nav_detector = None
_color_detector = None
_currency_detector = None
_clothes_detector = None


def _get_nav_detector():
    """
    COCO YOLOv8n detector for object navigation + object detection endpoints
    """
    global _nav_detector
    if _nav_detector is None:
        from ultralytics import YOLO
        if not os.path.exists(_NAV_MODEL_PATH):
            raise FileNotFoundError(
                f"Navigation model not found at: {_NAV_MODEL_PATH}\n"
                f"Put yolov8n.pt inside: {_ASSETS_DIR}\n"
                f"OR set NAV_MODEL_PATH env var."
            )
        print(f"[nav] Loading navigation YOLO from {_NAV_MODEL_PATH}")
        _nav_detector = YOLO(_NAV_MODEL_PATH)
    return _nav_detector


def _get_color_detector():
    global _color_detector
    if _color_detector is None:
        print("[color] Initializing ColorDetector")
        _color_detector = ColorDetector()
    return _color_detector

def _get_clothes_detector():
    """
    DeepFashion2 YOLO model for clothing items (shirt, pants, etc.)
    """
    global _clothes_detector
    if _clothes_detector is None:
        from ultralytics import YOLO
        if not os.path.exists(_CLOTHES_MODEL_PATH):
            raise FileNotFoundError(
                f"Clothes model not found at: {_CLOTHES_MODEL_PATH}\n"
                f"Put deepfashion2_yolov8s-seg.pt inside: {_ASSETS_DIR}\n"
                f"OR set CLOTHES_MODEL_PATH env var."
            )
        print(f"[clothes] Loading clothes YOLO from {_CLOTHES_MODEL_PATH}")
        _clothes_detector = YOLO(_CLOTHES_MODEL_PATH)
    return _clothes_detector


def _get_currency_detector():
    global _currency_detector
    if _currency_detector is None:
        if not os.path.exists(_CURRENCY_MODEL_PATH):
            raise FileNotFoundError(
                f"Currency model not found at: {_CURRENCY_MODEL_PATH}\n"
                f"Put best.pt inside: {_ASSETS_DIR}\n"
                f"OR set CURRENCY_MODEL_PATH env var."
            )
        print(f"[currency] Loading CurrencyDetector from {_CURRENCY_MODEL_PATH}")
        _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
    return _currency_detector


# ================================================================
# Root / Health (SAFE, WILL NOT CRASH)
# ================================================================
@app.get("/")
async def root():
    return {
        "message": "V-EYE Unified Backend is running",
        "assets_dir": _ASSETS_DIR,
        "endpoints": {
            "health": "/health",
            "object_navigation_person_recognition": "/object-navigation-detect",
            "object_detection": "/detect-objects",
            "object_detection_annotated": "/detect-objects-annotated",
            "currency_detection": "/detect-currency",
            "currency_detection_annotated": "/detect-currency-annotated",
            "color_detection": "/detect-color",
            "color_detection_simple": "/detect-color-simple",
            "person_register_base64": "/api/person/register",
            "person_register_files": "/register-person",
            "debug_persons": "/debug/persons",
        },
    }


@app.get("/health")
async def health_check():
    # Health must NEVER crash. It should always return 200 if server is alive.
    return {
        "status": "healthy",
        "assets_dir": _ASSETS_DIR,
        "models_present": {
            "nav_model": os.path.exists(_NAV_MODEL_PATH),
            "currency_model": os.path.exists(_CURRENCY_MODEL_PATH),
        },
        "paths": {
            "nav_model_path": _NAV_MODEL_PATH,
            "currency_model_path": _CURRENCY_MODEL_PATH,
        },
    }


# ================================================================
# DEBUG: persons in DB
# ================================================================
@app.get("/debug/persons")
async def debug_get_persons():
    try:
        db_persons = face_database.get_all_persons()
        result = []
        for person in db_persons:
            embeddings_list = person.get("embeddings", [])
            embeddings_count = len(embeddings_list)

            first_emb_preview = None
            if embeddings_count > 0:
                first_emb = embeddings_list[0]
                first_emb_preview = {
                    "length": len(first_emb),
                    "norm": float(np.linalg.norm(np.array(first_emb, dtype=np.float32))),
                    "first_5": first_emb[:5] if len(first_emb) >= 5 else first_emb,
                }

            result.append(
                {
                    "name": person.get("name"),
                    "embeddings_count": embeddings_count,
                    "first_embedding_preview": first_emb_preview,
                }
            )

        return {"success": True, "total_persons": len(db_persons), "persons": result}

    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "message": "Make sure MongoDB is running at mongodb://localhost:27017",
        }


# ================================================================
# API: Person Registration (JSON base64)
# ================================================================
@app.post("/api/person/register")
async def api_person_register(request: PersonRegisterRequest):
    try:
        name = request.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        if not request.images or len(request.images) < 1:
            raise HTTPException(status_code=400, detail="At least 1 image required")

        print(f"[api_person_register] Registering '{name}' with {len(request.images)} images")

        embeddings = []
        for i, base64_str in enumerate(request.images):
            image = decode_base64_image(base64_str)
            if image is None:
                print(f"[api_person_register] Image {i+1}: Could not decode")
                continue

            faces = face_embedding.detect_face_and_crop(image)
            if not faces:
                print(f"[api_person_register] Image {i+1}: No faces detected")
                continue

            face_crop = faces[0]["crop"]
            emb = face_embedding.generate_embedding(face_crop)
            embeddings.append(emb.tolist())
            print(f"[api_person_register] Image {i+1}: ✓ Extracted embedding")

        if len(embeddings) == 0:
            return {"success": False, "error": "no_face_detected", "message": "Could not detect faces in any image"}

        try:
            face_database.save_person_profile(name, embeddings)
            return {"success": True, "name": name, "num_embeddings": len(embeddings), "message": f"Successfully registered {name}"}
        except face_database.DuplicateName:
            return {"success": False, "error": "duplicate_name", "message": f"Person '{name}' already exists"}
        except Exception as db_error:
            traceback.print_exc()
            return {"success": False, "error": "database_error", "message": str(db_error)}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": "server_error", "message": str(e)}


# ================================================================
# Person Registration (files)
# ================================================================
@app.post("/register-person")
async def register_person(name: str, files: List[UploadFile] = File(...)):
    try:
        if not name or len(name.strip()) == 0:
            raise HTTPException(status_code=400, detail="Name is required")

        if len(files) < 1:
            raise HTTPException(status_code=400, detail="At least 1 image required")

        name = name.strip()
        print(f"[register] Starting registration for '{name}' with {len(files)} images")

        embeddings = []
        for i, f in enumerate(files):
            image_bytes = await f.read()
            if not image_bytes:
                print(f"[register] Image {i+1}: Empty file, skipping")
                continue

            nparr = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                print(f"[register] Image {i+1}: Invalid image, skipping")
                continue

            faces = face_embedding.detect_face_and_crop(image)
            if not faces:
                print(f"[register] Image {i+1}: No faces detected")
                continue

            face_crop = faces[0]["crop"]
            emb = face_embedding.generate_embedding(face_crop)
            embeddings.append(emb.tolist())
            print(f"[register] Image {i+1}: ✓ Extracted embedding")

        if len(embeddings) == 0:
            raise HTTPException(
                status_code=400,
                detail="Could not extract embeddings. Make sure faces are clearly visible.",
            )

        try:
            face_database.save_person_profile(name, embeddings)
            return {"success": True, "name": name, "embeddings_count": len(embeddings)}
        except face_database.DuplicateName:
            raise HTTPException(status_code=400, detail=f"Person '{name}' already exists in database")

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# MODE 1: Object Navigation + Person Recognition
# ================================================================
@app.post("/object-navigation-detect")
async def object_navigation_detect(file: UploadFile = File(...), confidence: float = 0.25):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # Optional resize for speed
        h, w = image.shape[:2]
        max_dim = 640
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            image = cv2.resize(image, (new_w, new_h))
            h, w = image.shape[:2]

        detections: List[dict] = []
        persons_result: List[dict] = []
        tts_messages: List[str] = []

        # Load DB persons once
        try:
            db_persons = face_database.get_all_persons()
            print(f"[nav] Loaded {len(db_persons)} persons from DB")
        except Exception:
            traceback.print_exc()
            db_persons = []

        nav_model = _get_nav_detector()
        results = nav_model.predict(
            image,
            conf=confidence,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device="cpu",
        )

        # class names
        class_names = {}
        if hasattr(nav_model, "model") and hasattr(nav_model.model, "names"):
            class_names = nav_model.model.names
        elif hasattr(nav_model, "names"):
            class_names = nav_model.names

        person_boxes: List[Tuple[int, int, int, int]] = []

        for res in results:
            for box in res.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                confv = float(box.conf[0].cpu().numpy())
                # cls_name = class_names.get(cls_id, str(cls_id))
                raw_cls = class_names.get(cls_id, str(cls_id))
                cls_name = CLOTHES_CLASS_MAP.get(raw_cls, raw_cls)


                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

                x1 = max(0, min(w - 1, x1))
                x2 = max(0, min(w - 1, x2))
                y1 = max(0, min(h - 1, y1))
                y2 = max(0, min(h - 1, y2))
                if x2 <= x1 or y2 <= y1:
                    continue

                detections.append({
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                    "confidence": confv,
                    "class_id": cls_id,
                    "class_name": cls_name,
                })

                if isinstance(cls_name, str) and cls_name.lower() == "person":
                    person_boxes.append((x1, y1, x2, y2))

        # Recognize faces inside person boxes
        for (px1, py1, px2, py2) in person_boxes:
            pad = 20
            x1 = max(0, px1 - pad)
            y1 = max(0, py1 - pad)
            x2 = min(w - 1, px2 + pad)
            y2 = min(h - 1, py2 + pad)

            person_crop = image[y1:y2, x1:x2]
            if person_crop.size == 0:
                continue

            faces = face_embedding.detect_face_and_crop(person_crop)
            print(f"[nav] person_crop shape: {person_crop.shape}")
            print(f"[nav] faces found in person_crop: {len(faces)}")


            if not faces:
                x_center = (x1 + x2) / 2
                position = get_horizontal_position(x_center, w)
                distance = estimate_distance([x1, y1, x2, y2], h, w)
                persons_result.append({
                    "label": "person",
                    "bbox": [x1, y1, x2, y2],
                    "similarity": None,
                    "position": position,
                    "distance": distance,
                })
                continue

            for f in faces:
                crop = f["crop"]
                fb = f["bbox"]
                abs_bbox = [int(x1 + fb[0]), int(y1 + fb[1]), int(x1 + fb[2]), int(y1 + fb[3])]

                label = "person"
                similarity: Optional[float] = None

                try:
                    emb = face_embedding.generate_embedding(crop)
                    print(f"[nav] embedding shape: {getattr(emb, 'shape', None)}")
                    match = face_embedding.compare_embedding_to_db(emb, db_persons, threshold=0.6)
                    if match:
                        label, similarity = match
                except Exception:
                    traceback.print_exc()

                x_center = (abs_bbox[0] + abs_bbox[2]) / 2
                position = get_horizontal_position(x_center, w)
                distance = estimate_distance(abs_bbox, h, w)

                persons_result.append({
                    "label": label,
                    "bbox": abs_bbox,
                    "similarity": similarity,
                    "position": position,
                    "distance": distance,
                })

        for p in persons_result:
            position = p.get("position", "center")
            distance = p.get("distance", "medium")
            if p["label"] != "person":
                msg = f"{p['label']} is on your {position}, {distance}"
            else:
                msg = f"Person detected on your {position}, {distance}"
            tts_messages.append(msg)

        for msg in tts_messages[:3]:
            try:
                tts.speak(msg)
            except Exception:
                pass

        return {
            "success": True,
            "mode": "object_navigation",
            "detections": detections,
            "persons": persons_result,
            "tts_messages": tts_messages,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# MODE 2: Currency Detection
# ================================================================
@app.post("/detect-currency")
async def detect_currency(file: UploadFile = File(...), confidence: float = 0.25):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_currency_detector()
        results = detector.detect_currency(image_bytes, conf_threshold=confidence)

        tts_msg = "No currency detected" if results.get("count", 0) == 0 else f"Total {results.get('total_amount', 0)} rupees"
        return JSONResponse({"success": True, **results, "tts_message": tts_msg})

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-currency-annotated")
async def detect_currency_annotated(file: UploadFile = File(...), confidence: float = 0.25):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_currency_detector()
        annotated = detector.detect_and_draw(image_bytes, conf_threshold=confidence)

        return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# MODE 3: Color Detection
# ================================================================
@app.post("/detect-color")
async def detect_color(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_color_detector()
        result = detector.detect_color(image_bytes, n_colors=3)

        primary = result.get("primary_color")
        tts_msg = f"Dominant color is {primary.get('name')}" if primary else "No color detected"

        return {"success": True, "mode": "color_detection", "data": result, "tts_message": tts_msg}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-color-simple")
async def detect_color_simple(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_color_detector()
        result = detector.detect_color_simple(image_bytes)

        return {"success": True, "mode": "color_detection_simple", "data": result, "tts_message": result.get("description")}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# MODE 4: Object Detection (COCO)
# ================================================================
@app.post("/detect-objects")
async def detect_objects(file: UploadFile = File(...), confidence: float = 0.25):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        model = _get_nav_detector()
        results = model.predict(image, conf=confidence, iou=0.45, imgsz=640, verbose=False, device="cpu")

        class_names = {}
        if hasattr(model, "model") and hasattr(model.model, "names"):
            class_names = model.model.names
        elif hasattr(model, "names"):
            class_names = model.names

        detections = []
        h, w = image.shape[:2]

        for res in results:
            for box in res.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                confv = float(box.conf[0].cpu().numpy())
                cls_name = class_names.get(cls_id, str(cls_id))

                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
                x1 = max(0, min(w - 1, x1))
                x2 = max(0, min(w - 1, x2))
                y1 = max(0, min(h - 1, y1))
                y2 = max(0, min(h - 1, y2))
                if x2 <= x1 or y2 <= y1:
                    continue

                detections.append({
                    "class_name": cls_name,
                    "class_id": cls_id,
                    "confidence": confv,
                    "bbox": [x1, y1, x2, y2],
                })

        return {"success": True, "mode": "object_detection", "detections": detections, "count": len(detections)}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-objects-annotated")
async def detect_objects_annotated(file: UploadFile = File(...), confidence: float = 0.25):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        model = _get_nav_detector()
        results = model.predict(image, conf=confidence, iou=0.45, imgsz=640, verbose=False, device="cpu")

        annotated = results[0].plot() if len(results) > 0 else image

        # Encode png
        ok, buf = cv2.imencode(".png", annotated)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to encode annotated image")

        return StreamingResponse(io.BytesIO(buf.tobytes()), media_type="image/png")

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/detect-objects-with-color")
# async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
#     """
#     Detect objects using YOLO and estimate color PER object (using bbox crop).
#     Avoids background-dominant color issue.
#     """
#     try:
#         image_bytes = await file.read()
#         if not image_bytes:
#             raise HTTPException(status_code=400, detail="Empty file")

#         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
#         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#         if image is None:
#             raise HTTPException(status_code=400, detail="Invalid image")

#         h, w = image.shape[:2]

#         # 1) YOLO detect
#         model = _get_nav_detector()
#         results = model.predict(
#             image,
#             conf=confidence,
#             iou=0.45,
#             imgsz=640,
#             verbose=False,
#             device="cpu",
#         )

#         # COCO class names
#         class_names = {}
#         if hasattr(model, "model") and hasattr(model.model, "names"):
#             class_names = model.model.names
#         elif hasattr(model, "names"):
#             class_names = model.names

#         # 2) Color detector (your KMeans / mapping)
#         detector = _get_color_detector()

#         detections = []

#         for res in results:
#             for box in res.boxes:
#                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
#                 cls_id = int(box.cls[0].cpu().numpy())
#                 confv = float(box.conf[0].cpu().numpy())
#                 cls_name = class_names.get(cls_id, str(cls_id))

#                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

#                 # clamp
#                 x1 = max(0, min(w - 1, x1))
#                 x2 = max(0, min(w - 1, x2))
#                 y1 = max(0, min(h - 1, y1))
#                 y2 = max(0, min(h - 1, y2))
#                 if x2 <= x1 or y2 <= y1:
#                     continue

#                 # 3) Crop object region (IMPORTANT)
#                 crop = image[y1:y2, x1:x2]
#                 if crop.size == 0:
#                     continue

#                 # Optional: ignore very tiny crops (noise)
#                 crop_area = (x2 - x1) * (y2 - y1)
#                 if crop_area < 32 * 32:
#                     continue

#                 # 4) Run color on crop (NOT whole image)
#                 # Your ColorDetector expects bytes, so encode crop to jpg bytes
#                 ok, buf = cv2.imencode(".jpg", crop)
#                 if not ok:
#                     continue
#                 crop_bytes = buf.tobytes()

#                 color_result = detector.detect_color_simple(crop_bytes)
#                 # expected: {"name": "...", "hex": "...", "rgb": {...}, "description": "..."} (based on your detector)
#                 color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"
#                 color_hex = color_result.get("hex") or None

#                 detections.append({
#                     "class_name": cls_name,
#                     "class_id": cls_id,
#                     "confidence": confv,
#                     "bbox": [x1, y1, x2, y2],
#                     "color": {
#                         "name": color_name,
#                         "hex": color_hex,
#                         "raw": color_result,
#                     }
#                 })

#         # sort by confidence
#         detections.sort(key=lambda d: d["confidence"], reverse=True)

#         # Optional: Build simple TTS message for top 3 objects
#         tts_messages = []
#         for d in detections[:3]:
#             tts_messages.append(f"{d['color']['name']} {d['class_name']}")

#         return {
#             "success": True,
#             "mode": "object_color_detection",
#             "count": len(detections),
#             "detections": detections,
#             "tts_messages": tts_messages,
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-objects-with-color")
async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
    """
    Detect CLOTHING using DeepFashion2 YOLO and estimate color PER object (using bbox crop).
    Speaks like: "green shirt".
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        h, w = image.shape[:2]

        # ✅ 1) YOLO detect (USE CLOTHES MODEL NOW)
        model = _get_clothes_detector()
        results = model.predict(
            image,
            conf=confidence,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device="cpu",
        )

        # clothes class names
        class_names = {}
        if hasattr(model, "model") and hasattr(model.model, "names"):
            class_names = model.model.names
        elif hasattr(model, "names"):
            class_names = model.names

        # ✅ 2) Color detector
        detector = _get_color_detector()
        detections = []

        for res in results:
            for box in res.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                confv = float(box.conf[0].cpu().numpy())
                cls_name = class_names.get(cls_id, str(cls_id))

                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

                # clamp
                x1 = max(0, min(w - 1, x1))
                x2 = max(0, min(w - 1, x2))
                y1 = max(0, min(h - 1, y1))
                y2 = max(0, min(h - 1, y2))
                if x2 <= x1 or y2 <= y1:
                    continue

                # crop object region
                crop = image[y1:y2, x1:x2]
                if crop.size == 0:
                    continue

                # ignore very tiny crops (noise)
                crop_area = (x2 - x1) * (y2 - y1)
                if crop_area < 32 * 32:
                    continue

                ok, buf = cv2.imencode(".jpg", crop)
                if not ok:
                    continue
                crop_bytes = buf.tobytes()

                color_result = detector.detect_color_simple(crop_bytes)
                color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"
                color_hex = color_result.get("hex") or None

                detections.append({
                    "class_name": cls_name,
                    "class_id": cls_id,
                    "confidence": confv,
                    "bbox": [x1, y1, x2, y2],
                    "color": {
                        "name": color_name,
                        "hex": color_hex,
                        "raw": color_result,
                    }
                })

        detections.sort(key=lambda d: d["confidence"], reverse=True)

        # Build TTS message: "green shirt"
        tts_messages = []
        for d in detections[:3]:
            tts_messages.append(f"{d['color']['name']} {d['class_name']}")

        return {
            "success": True,
            "mode": "clothes_color_detection",
            "count": len(detections),
            "detections": detections,
            "tts_messages": tts_messages,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# Clothing Class Mapping (DeepFashion2 → Human Friendly)
# ================================================================
CLOTHES_CLASS_MAP = {
    "short_sleeve_top": "shirt",
    "long_sleeve_top": "shirt",
    "short_sleeve_outwear": "shirt",
    "long_sleeve_outwear": "shirt",
    "vest": "shirt",

    "pants": "pants",
    "shorts": "shorts",
    "skirt": "skirt",
    "dress": "dress",
}
