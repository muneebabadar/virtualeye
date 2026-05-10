# # # # from typing import List, Optional, Tuple
# # # # import os
# # # # import traceback
# # # # import base64
# # # # import io

# # # # import cv2
# # # # import numpy as np
# # # # from fastapi import FastAPI, File, UploadFile, HTTPException, Request
# # # # from fastapi.middleware.cors import CORSMiddleware
# # # # from fastapi.responses import JSONResponse, StreamingResponse
# # # # from pydantic import BaseModel

# # # # from services import face_database, face_embedding, tts

# # # # # If your file is named "colour_detection.py" (British spelling)
# # # # from colour_detection import ColorDetector
# # # # from currency_detection import CurrencyDetector


# # # # # ================================================================
# # # # # App
# # # # # ================================================================
# # # # app = FastAPI(title="V-EYE Unified Backend (All Modes)")

# # # # app.add_middleware(
# # # #     CORSMiddleware,
# # # #     allow_origins=["*"],
# # # #     allow_credentials=True,   # ok for mobile dev
# # # #     allow_methods=["*"],
# # # #     allow_headers=["*"],
# # # # )

# # # # @app.middleware("http")
# # # # async def log_requests(request: Request, call_next):
# # # #     print(f"\n>>> {request.method} {request.url.path}")
# # # #     resp = await call_next(request)
# # # #     print(f"<<< {resp.status_code}\n")
# # # #     return resp


# # # # # ================================================================
# # # # # Paths (FIXED)
# # # # # ================================================================
# # # # _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# # # # _ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")

# # # # _NAV_MODEL_PATH = os.environ.get("NAV_MODEL_PATH", os.path.join(_ASSETS_DIR, "yolov8n.pt"))
# # # # _CURRENCY_MODEL_PATH = os.environ.get("CURRENCY_MODEL_PATH", os.path.join(_ASSETS_DIR, "best.pt"))
# # # # _CLOTHES_MODEL_PATH = os.environ.get(
# # # #     "CLOTHES_MODEL_PATH",
# # # #     os.path.join(_ASSETS_DIR, "clothes_best_v4.pt")
# # # # )


# # # # # ================================================================
# # # # # Pydantic Models
# # # # # ================================================================
# # # # class PersonRegisterRequest(BaseModel):
# # # #     name: str
# # # #     images: List[str]  # Base64 encoded images


# # # # # ================================================================
# # # # # Helper: Decode base64 image to numpy array
# # # # # ================================================================
# # # # def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
# # # #     """
# # # #     Decode base64 string to OpenCV image (BGR).
# # # #     Supports optional data URI prefix: 'data:image/jpeg;base64,...'
# # # #     """
# # # #     try:
# # # #         if "," in base64_str:
# # # #             base64_str = base64_str.split(",", 1)[1]
# # # #         image_data = base64.b64decode(base64_str)
# # # #         nparr = np.frombuffer(image_data, dtype=np.uint8)
# # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #         return image
# # # #     except Exception as e:
# # # #         print(f"[decode_base64_image] Error: {e}")
# # # #         return None


# # # # # ================================================================
# # # # # Helper Functions for Position and Distance
# # # # # ================================================================
# # # # def get_horizontal_position(x_center: float, img_width: int) -> str:
# # # #     if x_center < img_width * 0.33:
# # # #         return "left"
# # # #     elif x_center > img_width * 0.66:
# # # #         return "right"
# # # #     return "center"


# # # # def estimate_distance(bbox: list, img_height: int, img_width: int) -> str:
# # # #     x1, y1, x2, y2 = bbox
# # # #     box_area = (x2 - x1) * (y2 - y1)
# # # #     img_area = img_height * img_width
# # # #     ratio = box_area / img_area if img_area > 0 else 0

# # # #     if ratio > 0.20:
# # # #         return "very_close"
# # # #     elif ratio > 0.08:
# # # #         return "close"
# # # #     elif ratio > 0.03:
# # # #         return "medium"
# # # #     return "far"


# # # # # ================================================================
# # # # # Lazy-loaded detectors (avoid slow startup)
# # # # # ================================================================
# # # # _nav_detector = None
# # # # _color_detector = None
# # # # _currency_detector = None
# # # # _clothes_detector = None


# # # # def _get_nav_detector():
# # # #     """
# # # #     COCO YOLOv8n detector for object navigation + object detection endpoints
# # # #     """
# # # #     global _nav_detector
# # # #     if _nav_detector is None:
# # # #         from ultralytics import YOLO
# # # #         if not os.path.exists(_NAV_MODEL_PATH):
# # # #             raise FileNotFoundError(
# # # #                 f"Navigation model not found at: {_NAV_MODEL_PATH}\n"
# # # #                 f"Put yolov8n.pt inside: {_ASSETS_DIR}\n"
# # # #                 f"OR set NAV_MODEL_PATH env var."
# # # #             )
# # # #         print(f"[nav] Loading navigation YOLO from {_NAV_MODEL_PATH}")
# # # #         _nav_detector = YOLO(_NAV_MODEL_PATH)
# # # #     return _nav_detector


# # # # def _get_color_detector():
# # # #     global _color_detector
# # # #     if _color_detector is None:
# # # #         print("[color] Initializing ColorDetector")
# # # #         _color_detector = ColorDetector()
# # # #     return _color_detector

# # # # def _get_clothes_detector():
# # # #     """
# # # #     DeepFashion2 YOLO model for clothing items (shirt, pants, etc.)
# # # #     """
# # # #     global _clothes_detector
# # # #     if _clothes_detector is None:
# # # #         from ultralytics import YOLO
# # # #         if not os.path.exists(_CLOTHES_MODEL_PATH):
# # # #             raise FileNotFoundError(
# # # #                 f"Clothes model not found at: {_CLOTHES_MODEL_PATH}\n"
# # # #                 f"Put clothing_best_v4.pt inside: {_ASSETS_DIR}\n"
# # # #                 f"OR set CLOTHES_MODEL_PATH env var."
# # # #             )
# # # #         print(f"[clothes] Loading clothes YOLO from {_CLOTHES_MODEL_PATH}")
# # # #         _clothes_detector = YOLO(_CLOTHES_MODEL_PATH)
# # # #         print("[clothes] model names:", _clothes_detector.names)
# # # #     return _clothes_detector


# # # # def _get_currency_detector():
# # # #     global _currency_detector
# # # #     if _currency_detector is None:
# # # #         if not os.path.exists(_CURRENCY_MODEL_PATH):
# # # #             raise FileNotFoundError(
# # # #                 f"Currency model not found at: {_CURRENCY_MODEL_PATH}\n"
# # # #                 f"Put best.pt inside: {_ASSETS_DIR}\n"
# # # #                 f"OR set CURRENCY_MODEL_PATH env var."
# # # #             )
# # # #         print(f"[currency] Loading CurrencyDetector from {_CURRENCY_MODEL_PATH}")
# # # #         _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
# # # #     return _currency_detector


# # # # # ================================================================
# # # # # Root / Health (SAFE, WILL NOT CRASH)
# # # # # ================================================================
# # # # @app.get("/")
# # # # async def root():
# # # #     return {
# # # #         "message": "V-EYE Unified Backend is running",
# # # #         "assets_dir": _ASSETS_DIR,
# # # #         "endpoints": {
# # # #             "health": "/health",
# # # #             "object_navigation_person_recognition": "/object-navigation-detect",
# # # #             "object_detection": "/detect-objects",
# # # #             "object_detection_annotated": "/detect-objects-annotated",
# # # #             "currency_detection": "/detect-currency",
# # # #             "currency_detection_annotated": "/detect-currency-annotated",
# # # #             "color_detection": "/detect-color",
# # # #             "color_detection_simple": "/detect-color-simple",
# # # #             "person_register_base64": "/api/person/register",
# # # #             "person_register_files": "/register-person",
# # # #             "debug_persons": "/debug/persons",
# # # #         },
# # # #     }


# # # # @app.get("/health")
# # # # async def health_check():
# # # #     # Health must NEVER crash. It should always return 200 if server is alive.
# # # #     return {
# # # #         "status": "healthy",
# # # #         "assets_dir": _ASSETS_DIR,
# # # #         "models_present": {
# # # #             "nav_model": os.path.exists(_NAV_MODEL_PATH),
# # # #             "currency_model": os.path.exists(_CURRENCY_MODEL_PATH),
# # # #         },
# # # #         "paths": {
# # # #             "nav_model_path": _NAV_MODEL_PATH,
# # # #             "currency_model_path": _CURRENCY_MODEL_PATH,
# # # #         },
# # # #     }


# # # # # ================================================================
# # # # # DEBUG: persons in DB
# # # # # ================================================================
# # # # @app.get("/debug/persons")
# # # # async def debug_get_persons():
# # # #     try:
# # # #         db_persons = face_database.get_all_persons()
# # # #         result = []
# # # #         for person in db_persons:
# # # #             embeddings_list = person.get("embeddings", [])
# # # #             embeddings_count = len(embeddings_list)

# # # #             first_emb_preview = None
# # # #             if embeddings_count > 0:
# # # #                 first_emb = embeddings_list[0]
# # # #                 first_emb_preview = {
# # # #                     "length": len(first_emb),
# # # #                     "norm": float(np.linalg.norm(np.array(first_emb, dtype=np.float32))),
# # # #                     "first_5": first_emb[:5] if len(first_emb) >= 5 else first_emb,
# # # #                 }

# # # #             result.append(
# # # #                 {
# # # #                     "name": person.get("name"),
# # # #                     "embeddings_count": embeddings_count,
# # # #                     "first_embedding_preview": first_emb_preview,
# # # #                 }
# # # #             )

# # # #         return {"success": True, "total_persons": len(db_persons), "persons": result}

# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         return {
# # # #             "success": False,
# # # #             "error": str(e),
# # # #             "message": "Make sure MongoDB is running at mongodb://localhost:27017",
# # # #         }


# # # # # ================================================================
# # # # # API: Person Registration (JSON base64)
# # # # # ================================================================
# # # # @app.post("/api/person/register")
# # # # async def api_person_register(request: PersonRegisterRequest):
# # # #     try:
# # # #         name = request.name.strip()
# # # #         if not name:
# # # #             raise HTTPException(status_code=400, detail="Name is required")

# # # #         if not request.images or len(request.images) < 1:
# # # #             raise HTTPException(status_code=400, detail="At least 1 image required")

# # # #         print(f"[api_person_register] Registering '{name}' with {len(request.images)} images")

# # # #         embeddings = []
# # # #         for i, base64_str in enumerate(request.images):
# # # #             image = decode_base64_image(base64_str)
# # # #             if image is None:
# # # #                 print(f"[api_person_register] Image {i+1}: Could not decode")
# # # #                 continue

# # # #             faces = face_embedding.detect_face_and_crop(image)
# # # #             if not faces:
# # # #                 print(f"[api_person_register] Image {i+1}: No faces detected")
# # # #                 continue

# # # #             face_crop = faces[0]["crop"]
# # # #             emb = face_embedding.generate_embedding(face_crop)
# # # #             embeddings.append(emb.tolist())
# # # #             print(f"[api_person_register] Image {i+1}: ✓ Extracted embedding")

# # # #         if len(embeddings) == 0:
# # # #             return {"success": False, "error": "no_face_detected", "message": "Could not detect faces in any image"}

# # # #         try:
# # # #             face_database.save_person_profile(name, embeddings)
# # # #             return {"success": True, "name": name, "num_embeddings": len(embeddings), "message": f"Successfully registered {name}"}
# # # #         except face_database.DuplicateName:
# # # #             return {"success": False, "error": "duplicate_name", "message": f"Person '{name}' already exists"}
# # # #         except Exception as db_error:
# # # #             traceback.print_exc()
# # # #             return {"success": False, "error": "database_error", "message": str(db_error)}

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         return {"success": False, "error": "server_error", "message": str(e)}


# # # # # ================================================================
# # # # # Person Registration (files)
# # # # # ================================================================
# # # # @app.post("/register-person")
# # # # async def register_person(name: str, files: List[UploadFile] = File(...)):
# # # #     try:
# # # #         if not name or len(name.strip()) == 0:
# # # #             raise HTTPException(status_code=400, detail="Name is required")

# # # #         if len(files) < 1:
# # # #             raise HTTPException(status_code=400, detail="At least 1 image required")

# # # #         name = name.strip()
# # # #         print(f"[register] Starting registration for '{name}' with {len(files)} images")

# # # #         embeddings = []
# # # #         for i, f in enumerate(files):
# # # #             image_bytes = await f.read()
# # # #             if not image_bytes:
# # # #                 print(f"[register] Image {i+1}: Empty file, skipping")
# # # #                 continue

# # # #             nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #             if image is None:
# # # #                 print(f"[register] Image {i+1}: Invalid image, skipping")
# # # #                 continue

# # # #             faces = face_embedding.detect_face_and_crop(image)
# # # #             if not faces:
# # # #                 print(f"[register] Image {i+1}: No faces detected")
# # # #                 continue

# # # #             face_crop = faces[0]["crop"]
# # # #             emb = face_embedding.generate_embedding(face_crop)
# # # #             embeddings.append(emb.tolist())
# # # #             print(f"[register] Image {i+1}: ✓ Extracted embedding")

# # # #         if len(embeddings) == 0:
# # # #             raise HTTPException(
# # # #                 status_code=400,
# # # #                 detail="Could not extract embeddings. Make sure faces are clearly visible.",
# # # #             )

# # # #         try:
# # # #             face_database.save_person_profile(name, embeddings)
# # # #             return {"success": True, "name": name, "embeddings_count": len(embeddings)}
# # # #         except face_database.DuplicateName:
# # # #             raise HTTPException(status_code=400, detail=f"Person '{name}' already exists in database")

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # # ================================================================
# # # # # MODE 1: Object Navigation + Person Recognition
# # # # # ================================================================
# # # # @app.post("/object-navigation-detect")
# # # # async def object_navigation_detect(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #         if image is None:
# # # #             raise HTTPException(status_code=400, detail="Invalid image")

# # # #         # Optional resize for speed
# # # #         h, w = image.shape[:2]
# # # #         max_dim = 640
# # # #         if max(h, w) > max_dim:
# # # #             scale = max_dim / max(h, w)
# # # #             new_w, new_h = int(w * scale), int(h * scale)
# # # #             image = cv2.resize(image, (new_w, new_h))
# # # #             h, w = image.shape[:2]

# # # #         detections: List[dict] = []
# # # #         persons_result: List[dict] = []
# # # #         tts_messages: List[str] = []

# # # #         # Load DB persons once
# # # #         try:
# # # #             db_persons = face_database.get_all_persons()
# # # #             print(f"[nav] Loaded {len(db_persons)} persons from DB")
# # # #         except Exception:
# # # #             traceback.print_exc()
# # # #             db_persons = []

# # # #         nav_model = _get_nav_detector()
# # # #         results = nav_model.predict(
# # # #             image,
# # # #             conf=confidence,
# # # #             iou=0.45,
# # # #             imgsz=640,
# # # #             verbose=False,
# # # #             device="cpu",
# # # #         )

# # # #         # class names
# # # #         class_names = {}
# # # #         if hasattr(nav_model, "model") and hasattr(nav_model.model, "names"):
# # # #             class_names = nav_model.model.names
# # # #         elif hasattr(nav_model, "names"):
# # # #             class_names = nav_model.names

# # # #         person_boxes: List[Tuple[int, int, int, int]] = []

# # # #         for res in results:
# # # #             for box in res.boxes:
# # # #                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
# # # #                 cls_id = int(box.cls[0].cpu().numpy())
# # # #                 confv = float(box.conf[0].cpu().numpy())
# # # #                 # cls_name = class_names.get(cls_id, str(cls_id))
# # # #                 raw_cls = class_names.get(cls_id, str(cls_id))
# # # #                 cls_name = CLOTHES_CLASS_MAP.get(raw_cls, raw_cls)


# # # #                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

# # # #                 x1 = max(0, min(w - 1, x1))
# # # #                 x2 = max(0, min(w - 1, x2))
# # # #                 y1 = max(0, min(h - 1, y1))
# # # #                 y2 = max(0, min(h - 1, y2))
# # # #                 if x2 <= x1 or y2 <= y1:
# # # #                     continue

# # # #                 detections.append({
# # # #                     "x1": float(x1),
# # # #                     "y1": float(y1),
# # # #                     "x2": float(x2),
# # # #                     "y2": float(y2),
# # # #                     "confidence": confv,
# # # #                     "class_id": cls_id,
# # # #                     "class_name": cls_name,
# # # #                 })

# # # #                 if isinstance(cls_name, str) and cls_name.lower() == "person":
# # # #                     person_boxes.append((x1, y1, x2, y2))

# # # #         # Recognize faces inside person boxes
# # # #         for (px1, py1, px2, py2) in person_boxes:
# # # #             pad = 20
# # # #             x1 = max(0, px1 - pad)
# # # #             y1 = max(0, py1 - pad)
# # # #             x2 = min(w - 1, px2 + pad)
# # # #             y2 = min(h - 1, py2 + pad)

# # # #             person_crop = image[y1:y2, x1:x2]
# # # #             if person_crop.size == 0:
# # # #                 continue

# # # #             faces = face_embedding.detect_face_and_crop(person_crop)
# # # #             print(f"[nav] person_crop shape: {person_crop.shape}")
# # # #             print(f"[nav] faces found in person_crop: {len(faces)}")


# # # #             if not faces:
# # # #                 x_center = (x1 + x2) / 2
# # # #                 position = get_horizontal_position(x_center, w)
# # # #                 distance = estimate_distance([x1, y1, x2, y2], h, w)
# # # #                 persons_result.append({
# # # #                     "label": "person",
# # # #                     "bbox": [x1, y1, x2, y2],
# # # #                     "similarity": None,
# # # #                     "position": position,
# # # #                     "distance": distance,
# # # #                 })
# # # #                 continue

# # # #             for f in faces:
# # # #                 crop = f["crop"]
# # # #                 fb = f["bbox"]
# # # #                 abs_bbox = [int(x1 + fb[0]), int(y1 + fb[1]), int(x1 + fb[2]), int(y1 + fb[3])]

# # # #                 label = "person"
# # # #                 similarity: Optional[float] = None

# # # #                 try:
# # # #                     emb = face_embedding.generate_embedding(crop)
# # # #                     print(f"[nav] embedding shape: {getattr(emb, 'shape', None)}")
# # # #                     match = face_embedding.compare_embedding_to_db(emb, db_persons, threshold=0.6)
# # # #                     if match:
# # # #                         label, similarity = match
# # # #                 except Exception:
# # # #                     traceback.print_exc()

# # # #                 x_center = (abs_bbox[0] + abs_bbox[2]) / 2
# # # #                 position = get_horizontal_position(x_center, w)
# # # #                 distance = estimate_distance(abs_bbox, h, w)

# # # #                 persons_result.append({
# # # #                     "label": label,
# # # #                     "bbox": abs_bbox,
# # # #                     "similarity": similarity,
# # # #                     "position": position,
# # # #                     "distance": distance,
# # # #                 })

# # # #         for p in persons_result:
# # # #             position = p.get("position", "center")
# # # #             distance = p.get("distance", "medium")
# # # #             if p["label"] != "person":
# # # #                 msg = f"{p['label']} is on your {position}, {distance}"
# # # #             else:
# # # #                 msg = f"Person detected on your {position}, {distance}"
# # # #             tts_messages.append(msg)

# # # #         for msg in tts_messages[:3]:
# # # #             try:
# # # #                 tts.speak(msg)
# # # #             except Exception:
# # # #                 pass

# # # #         return {
# # # #             "success": True,
# # # #             "mode": "object_navigation",
# # # #             "detections": detections,
# # # #             "persons": persons_result,
# # # #             "tts_messages": tts_messages,
# # # #         }

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # # ================================================================
# # # # # MODE 2: Currency Detection
# # # # # ================================================================
# # # # @app.post("/detect-currency")
# # # # async def detect_currency(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         detector = _get_currency_detector()
# # # #         results = detector.detect_currency(image_bytes, conf_threshold=confidence)

# # # #         tts_msg = "No currency detected" if results.get("count", 0) == 0 else f"Total {results.get('total_amount', 0)} rupees"
# # # #         return JSONResponse({"success": True, **results, "tts_message": tts_msg})

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # @app.post("/detect-currency-annotated")
# # # # async def detect_currency_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         detector = _get_currency_detector()
# # # #         annotated = detector.detect_and_draw(image_bytes, conf_threshold=confidence)

# # # #         return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # # ================================================================
# # # # # MODE 3: Color Detection
# # # # # ================================================================
# # # # @app.post("/detect-color")
# # # # async def detect_color(file: UploadFile = File(...)):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         detector = _get_color_detector()
# # # #         result = detector.detect_color(image_bytes, n_colors=3)

# # # #         primary = result.get("primary_color")
# # # #         tts_msg = f"Dominant color is {primary.get('name')}" if primary else "No color detected"

# # # #         return {"success": True, "mode": "color_detection", "data": result, "tts_message": tts_msg}

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # @app.post("/detect-color-simple")
# # # # async def detect_color_simple(file: UploadFile = File(...)):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         detector = _get_color_detector()
# # # #         result = detector.detect_color_simple(image_bytes)

# # # #         return {"success": True, "mode": "color_detection_simple", "data": result, "tts_message": result.get("description")}

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # # ================================================================
# # # # # MODE 4: Object Detection (COCO)
# # # # # ================================================================
# # # # @app.post("/detect-objects")
# # # # async def detect_objects(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #         if image is None:
# # # #             raise HTTPException(status_code=400, detail="Invalid image")

# # # #         model = _get_nav_detector()
# # # #         results = model.predict(image, conf=confidence, iou=0.45, imgsz=640, verbose=False, device="cpu")

# # # #         class_names = {}
# # # #         if hasattr(model, "model") and hasattr(model.model, "names"):
# # # #             class_names = model.model.names
# # # #         elif hasattr(model, "names"):
# # # #             class_names = model.names

# # # #         detections = []
# # # #         h, w = image.shape[:2]

# # # #         for res in results:
# # # #             for box in res.boxes:
# # # #                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
# # # #                 cls_id = int(box.cls[0].cpu().numpy())
# # # #                 confv = float(box.conf[0].cpu().numpy())
# # # #                 cls_name = class_names.get(cls_id, str(cls_id))

# # # #                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
# # # #                 x1 = max(0, min(w - 1, x1))
# # # #                 x2 = max(0, min(w - 1, x2))
# # # #                 y1 = max(0, min(h - 1, y1))
# # # #                 y2 = max(0, min(h - 1, y2))
# # # #                 if x2 <= x1 or y2 <= y1:
# # # #                     continue

# # # #                 detections.append({
# # # #                     "class_name": cls_name,
# # # #                     "class_id": cls_id,
# # # #                     "confidence": confv,
# # # #                     "bbox": [x1, y1, x2, y2],
# # # #                 })

# # # #         return {"success": True, "mode": "object_detection", "detections": detections, "count": len(detections)}

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # @app.post("/detect-objects-annotated")
# # # # async def detect_objects_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #         if image is None:
# # # #             raise HTTPException(status_code=400, detail="Invalid image")

# # # #         model = _get_nav_detector()
# # # #         results = model.predict(image, conf=confidence, iou=0.45, imgsz=640, verbose=False, device="cpu")

# # # #         annotated = results[0].plot() if len(results) > 0 else image

# # # #         # Encode png
# # # #         ok, buf = cv2.imencode(".png", annotated)
# # # #         if not ok:
# # # #             raise HTTPException(status_code=500, detail="Failed to encode annotated image")

# # # #         return StreamingResponse(io.BytesIO(buf.tobytes()), media_type="image/png")

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))

# # # # # @app.post("/detect-objects-with-color")
# # # # # async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
# # # # #     """
# # # # #     Detect objects using YOLO and estimate color PER object (using bbox crop).
# # # # #     Avoids background-dominant color issue.
# # # # #     """
# # # # #     try:
# # # # #         image_bytes = await file.read()
# # # # #         if not image_bytes:
# # # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # # #         if image is None:
# # # # #             raise HTTPException(status_code=400, detail="Invalid image")

# # # # #         h, w = image.shape[:2]

# # # # #         # 1) YOLO detect
# # # # #         model = _get_nav_detector()
# # # # #         results = model.predict(
# # # # #             image,
# # # # #             conf=confidence,
# # # # #             iou=0.45,
# # # # #             imgsz=640,
# # # # #             verbose=False,
# # # # #             device="cpu",
# # # # #         )

# # # # #         # COCO class names
# # # # #         class_names = {}
# # # # #         if hasattr(model, "model") and hasattr(model.model, "names"):
# # # # #             class_names = model.model.names
# # # # #         elif hasattr(model, "names"):
# # # # #             class_names = model.names

# # # # #         # 2) Color detector (your KMeans / mapping)
# # # # #         detector = _get_color_detector()

# # # # #         detections = []

# # # # #         for res in results:
# # # # #             for box in res.boxes:
# # # # #                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
# # # # #                 cls_id = int(box.cls[0].cpu().numpy())
# # # # #                 confv = float(box.conf[0].cpu().numpy())
# # # # #                 cls_name = class_names.get(cls_id, str(cls_id))

# # # # #                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

# # # # #                 # clamp
# # # # #                 x1 = max(0, min(w - 1, x1))
# # # # #                 x2 = max(0, min(w - 1, x2))
# # # # #                 y1 = max(0, min(h - 1, y1))
# # # # #                 y2 = max(0, min(h - 1, y2))
# # # # #                 if x2 <= x1 or y2 <= y1:
# # # # #                     continue

# # # # #                 # 3) Crop object region (IMPORTANT)
# # # # #                 crop = image[y1:y2, x1:x2]
# # # # #                 if crop.size == 0:
# # # # #                     continue

# # # # #                 # Optional: ignore very tiny crops (noise)
# # # # #                 crop_area = (x2 - x1) * (y2 - y1)
# # # # #                 if crop_area < 32 * 32:
# # # # #                     continue

# # # # #                 # 4) Run color on crop (NOT whole image)
# # # # #                 # Your ColorDetector expects bytes, so encode crop to jpg bytes
# # # # #                 ok, buf = cv2.imencode(".jpg", crop)
# # # # #                 if not ok:
# # # # #                     continue
# # # # #                 crop_bytes = buf.tobytes()

# # # # #                 color_result = detector.detect_color_simple(crop_bytes)
# # # # #                 # expected: {"name": "...", "hex": "...", "rgb": {...}, "description": "..."} (based on your detector)
# # # # #                 color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"
# # # # #                 color_hex = color_result.get("hex") or None

# # # # #                 detections.append({
# # # # #                     "class_name": cls_name,
# # # # #                     "class_id": cls_id,
# # # # #                     "confidence": confv,
# # # # #                     "bbox": [x1, y1, x2, y2],
# # # # #                     "color": {
# # # # #                         "name": color_name,
# # # # #                         "hex": color_hex,
# # # # #                         "raw": color_result,
# # # # #                     }
# # # # #                 })

# # # # #         # sort by confidence
# # # # #         detections.sort(key=lambda d: d["confidence"], reverse=True)

# # # # #         # Optional: Build simple TTS message for top 3 objects
# # # # #         tts_messages = []
# # # # #         for d in detections[:3]:
# # # # #             tts_messages.append(f"{d['color']['name']} {d['class_name']}")

# # # # #         return {
# # # # #             "success": True,
# # # # #             "mode": "object_color_detection",
# # # # #             "count": len(detections),
# # # # #             "detections": detections,
# # # # #             "tts_messages": tts_messages,
# # # # #         }

# # # # #     except HTTPException:
# # # # #         raise
# # # # #     except Exception as e:
# # # # #         traceback.print_exc()
# # # # #         raise HTTPException(status_code=500, detail=str(e))

# # # # @app.post("/detect-objects-with-color")
# # # # async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
# # # #     """
# # # #     Detect CLOTHING using DeepFashion2 YOLO and estimate color PER object (using bbox crop).
# # # #     Speaks like: "green shirt".
# # # #     """
# # # #     try:
# # # #         image_bytes = await file.read()
# # # #         if not image_bytes:
# # # #             raise HTTPException(status_code=400, detail="Empty file")

# # # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # # #         if image is None:
# # # #             raise HTTPException(status_code=400, detail="Invalid image")

# # # #         h, w = image.shape[:2]

# # # #         # ✅ 1) YOLO detect (USE CLOTHES MODEL NOW)
# # # #         model = _get_clothes_detector()
# # # #         results = model.predict(
# # # #             image,
# # # #             conf=confidence,
# # # #             iou=0.45,
# # # #             imgsz=640,
# # # #             verbose=False,
# # # #             device="cpu",
# # # #         )

# # # #         # clothes class names
# # # #         class_names = {}
# # # #         if hasattr(model, "model") and hasattr(model.model, "names"):
# # # #             class_names = model.model.names
# # # #         elif hasattr(model, "names"):
# # # #             class_names = model.names
# # # #         print("[clothes] model names:", class_names)

# # # #         # ✅ 2) Color detector
# # # #         detector = _get_color_detector()
# # # #         detections = []

# # # #         for res in results:
# # # #             for box in res.boxes:
# # # #                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
# # # #                 cls_id = int(box.cls[0].cpu().numpy())
# # # #                 confv = float(box.conf[0].cpu().numpy())
# # # #                 cls_name = class_names.get(cls_id, str(cls_id))

# # # #                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

# # # #                 # clamp
# # # #                 x1 = max(0, min(w - 1, x1))
# # # #                 x2 = max(0, min(w - 1, x2))
# # # #                 y1 = max(0, min(h - 1, y1))
# # # #                 y2 = max(0, min(h - 1, y2))
# # # #                 if x2 <= x1 or y2 <= y1:
# # # #                     continue

# # # #                 # crop object region
# # # #                 crop = image[y1:y2, x1:x2]
# # # #                 if crop.size == 0:
# # # #                     continue

# # # #                 # ignore very tiny crops (noise)
# # # #                 crop_area = (x2 - x1) * (y2 - y1)
# # # #                 if crop_area < 32 * 32:
# # # #                     continue

# # # #                 ok, buf = cv2.imencode(".jpg", crop)
# # # #                 if not ok:
# # # #                     continue
# # # #                 crop_bytes = buf.tobytes()

# # # #                 color_result = detector.detect_color_simple(crop_bytes)
# # # #                 color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"
# # # #                 color_hex = color_result.get("hex") or None

# # # #                 detections.append({
# # # #                     "class_name": cls_name,
# # # #                     "class_id": cls_id,
# # # #                     "confidence": confv,
# # # #                     "bbox": [x1, y1, x2, y2],
# # # #                     "color": {
# # # #                         "name": color_name,
# # # #                         "hex": color_hex,
# # # #                         "raw": color_result,
# # # #                     }
# # # #                 })

# # # #         detections.sort(key=lambda d: d["confidence"], reverse=True)

# # # #         # Build TTS message: "green shirt"
# # # #         tts_messages = []
# # # #         for d in detections[:3]:
# # # #             tts_messages.append(f"{d['color']['name']} {d['class_name']}")

# # # #         return {
# # # #             "success": True,
# # # #             "mode": "clothes_color_detection",
# # # #             "count": len(detections),
# # # #             "detections": detections,
# # # #             "tts_messages": tts_messages,
# # # #         }

# # # #     except HTTPException:
# # # #         raise
# # # #     except Exception as e:
# # # #         traceback.print_exc()
# # # #         raise HTTPException(status_code=500, detail=str(e))


# # # # # ================================================================
# # # # # Clothing Class Mapping (DeepFashion2 → Human Friendly)
# # # # # ================================================================
# # # # CLOTHES_CLASS_MAP = {
# # # #     "short_sleeve_top": "shirt",
# # # #     "long_sleeve_top": "shirt",
# # # #     "short_sleeve_outwear": "shirt",
# # # #     "long_sleeve_outwear": "shirt",
# # # #     "vest": "shirt",

# # # #     "pants": "pants",
# # # #     "shorts": "shorts",
# # # #     "skirt": "skirt",
# # # #     "dress": "dress",
# # # # }

# # # from typing import List, Optional, Tuple
# # # import os
# # # import traceback
# # # import base64
# # # import io
# # # import inspect

# # # import cv2
# # # import numpy as np
# # # from fastapi import FastAPI, File, UploadFile, HTTPException, Request
# # # from fastapi.middleware.cors import CORSMiddleware
# # # from fastapi.responses import JSONResponse, StreamingResponse
# # # from pydantic import BaseModel

# # # from services import face_database, face_embedding, tts

# # # # Your modules
# # # from colour_detection import ColorDetector
# # # from currency_detection import CurrencyDetector  # colleague uses this too

# # # # Colleague object detection
# # # from object_detection import ObjectDetector, WANTED_COCO_CLASSES


# # # # ================================================================
# # # # App
# # # # ================================================================
# # # app = FastAPI(title="V-EYE Unified Backend (All Modes)")

# # # app.add_middleware(
# # #     CORSMiddleware,
# # #     allow_origins=["*"],
# # #     allow_credentials=True,   # ok for mobile dev
# # #     allow_methods=["*"],
# # #     allow_headers=["*"],
# # # )

# # # @app.middleware("http")
# # # async def log_requests(request: Request, call_next):
# # #     print(f"\n>>> {request.method} {request.url.path}")
# # #     resp = await call_next(request)
# # #     print(f"<<< {resp.status_code}\n")
# # #     return resp


# # # # ================================================================
# # # # Paths
# # # # ================================================================
# # # _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# # # _ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")

# # # # colleague dual-model object detection
# # # _CUSTOM_MODEL_PATH = os.environ.get("CUSTOM_MODEL_PATH", os.path.join(_ASSETS_DIR, "washroom_kitchen_only.pt"))
# # # _COCO_MODEL_PATH   = os.environ.get("COCO_MODEL_PATH",   os.path.join(_ASSETS_DIR, "yolov8n.pt"))

# # # # currency model
# # # _CURRENCY_MODEL_PATH = os.environ.get("CURRENCY_MODEL_PATH", os.path.join(_ASSETS_DIR, "best.pt"))

# # # # YOUR clothes model for clothes+color
# # # _CLOTHES_MODEL_PATH = os.environ.get("CLOTHES_MODEL_PATH", os.path.join(_ASSETS_DIR, "clothes_best_v4.pt"))


# # # # ================================================================
# # # # Pydantic Models
# # # # ================================================================
# # # class PersonRegisterRequest(BaseModel):
# # #     name: str
# # #     images: List[str]  # Base64 encoded images


# # # # ================================================================
# # # # Helpers
# # # # ================================================================
# # # def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
# # #     """Decode base64 string to OpenCV image (BGR). Supports optional data URI prefix."""
# # #     try:
# # #         if "," in base64_str:
# # #             base64_str = base64_str.split(",", 1)[1]
# # #         image_data = base64.b64decode(base64_str)
# # #         nparr = np.frombuffer(image_data, dtype=np.uint8)
# # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # #         return image
# # #     except Exception as e:
# # #         print(f"[decode_base64_image] Error: {e}")
# # #         return None


# # # def get_horizontal_position(x_center: float, img_width: int) -> str:
# # #     if x_center < img_width * 0.33:
# # #         return "left"
# # #     elif x_center > img_width * 0.66:
# # #         return "right"
# # #     return "center"


# # # def estimate_distance(bbox: list, img_height: int, img_width: int) -> str:
# # #     x1, y1, x2, y2 = bbox
# # #     box_area = (x2 - x1) * (y2 - y1)
# # #     img_area = img_height * img_width
# # #     ratio = box_area / img_area if img_area > 0 else 0

# # #     if ratio > 0.20:
# # #         return "very_close"
# # #     elif ratio > 0.08:
# # #         return "close"
# # #     elif ratio > 0.03:
# # #         return "medium"
# # #     return "far"


# # # def _ensure_exists(path: str, label: str):
# # #     if not os.path.exists(path):
# # #         raise FileNotFoundError(f"{label} not found at: {path}\nExpected inside: {_ASSETS_DIR}")


# # # # ================================================================
# # # # Lazy-loaded detectors
# # # # ================================================================
# # # _object_detector = None
# # # _color_detector = None
# # # _currency_detector = None
# # # _clothes_detector = None


# # # def _get_object_detector():
# # #     """Colleague: Dual-model ObjectDetector (custom washroom/kitchen + COCO)"""
# # #     global _object_detector
# # #     if _object_detector is None:
# # #         _ensure_exists(_CUSTOM_MODEL_PATH, "Custom model")
# # #         _ensure_exists(_COCO_MODEL_PATH, "COCO model")
# # #         print(f"[objects] Loading ObjectDetector (custom={_CUSTOM_MODEL_PATH}, coco={_COCO_MODEL_PATH})")
# # #         _object_detector = ObjectDetector(
# # #             custom_model_path=_CUSTOM_MODEL_PATH,
# # #             coco_model_path=_COCO_MODEL_PATH,
# # #         )
# # #     return _object_detector


# # # def _get_color_detector():
# # #     """Your color detector"""
# # #     global _color_detector
# # #     if _color_detector is None:
# # #         print("[color] Initializing ColorDetector")
# # #         _color_detector = ColorDetector()
# # #     return _color_detector


# # # # def _get_currency_detector():
# # # #     """
# # # #     CurrencyDetector robust init:
# # # #     - Try CurrencyDetector(model_path=...)
# # # #     - If class does NOT accept args (your earlier error), fall back to CurrencyDetector()
# # # #     """
# # # #     global _currency_detector
# # # #     if _currency_detector is None:
# # # #         _ensure_exists(_CURRENCY_MODEL_PATH, "Currency model")
# # # #         print(f"[currency] Initializing CurrencyDetector (model={_CURRENCY_MODEL_PATH})")

# # # #         try:
# # # #             _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
# # # #         except TypeError:
# # # #             # fallback for: CurrencyDetector() takes no arguments
# # # #             _currency_detector = CurrencyDetector()

# # # #             # If the object supports setting a path attribute, try:
# # # #             for attr in ["model_path", "MODEL_PATH", "path"]:
# # # #                 if hasattr(_currency_detector, attr):
# # # #                     try:
# # # #                         setattr(_currency_detector, attr, _CURRENCY_MODEL_PATH)
# # # #                     except Exception:
# # # #                         pass

# # # #         # Optional: print classes if present
# # # #         if hasattr(_currency_detector, "class_names"):
# # # #             print("[currency] class_names loaded:", getattr(_currency_detector, "class_names", None))

# # # #     return _currency_detector

# # # def _get_currency_detector():
# # #     """
# # #     Always ensure detector.model is loaded.
# # #     Works whether CurrencyDetector expects model_path or not.
# # #     """
# # #     global _currency_detector
# # #     if _currency_detector is None:
# # #         _ensure_exists(_CURRENCY_MODEL_PATH, "Currency model")
# # #         print(f"[currency] Initializing CurrencyDetector (model={_CURRENCY_MODEL_PATH})")

# # #         # 1) Try normal constructor
# # #         try:
# # #             _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
# # #         except TypeError:
# # #             # 2) Fallback: no-arg constructor
# # #             _currency_detector = CurrencyDetector()

# # #         # 3) GUARANTEE model exists
# # #         if not hasattr(_currency_detector, "model") or _currency_detector.model is None:
# # #             from ultralytics import YOLO
# # #             print("[currency] CurrencyDetector had no .model -> loading YOLO directly")
# # #             _currency_detector.model = YOLO(_CURRENCY_MODEL_PATH)

# # #         # Optional: ensure class_names exists if your UI needs it
# # #         if not hasattr(_currency_detector, "class_names") or not getattr(_currency_detector, "class_names", None):
# # #             try:
# # #                 _currency_detector.class_names = _currency_detector.model.names
# # #             except Exception:
# # #                 pass

# # #     return _currency_detector

# # # def _get_clothes_detector():
# # #     """YOLO clothes model for clothes+color endpoint: clothes_best_v4.pt"""
# # #     global _clothes_detector
# # #     if _clothes_detector is None:
# # #         _ensure_exists(_CLOTHES_MODEL_PATH, "Clothes model")
# # #         from ultralytics import YOLO
# # #         print(f"[clothes] Loading clothes YOLO from {_CLOTHES_MODEL_PATH}")
# # #         _clothes_detector = YOLO(_CLOTHES_MODEL_PATH)
# # #         print("[clothes] model names:", getattr(_clothes_detector, "names", None))
# # #         print("USING CLOTHES MODEL:", _CLOTHES_MODEL_PATH)
# # #     print("MODEL NAMES:", _clothes_detector.names)
# # #     return _clothes_detector


# # # # ================================================================
# # # # Root / Health
# # # # ================================================================
# # # @app.get("/")
# # # async def root():
# # #     return {
# # #         "message": "V-EYE Unified Backend is running",
# # #         "assets_dir": _ASSETS_DIR,
# # #         "endpoints": {
# # #             "health": "/health",

# # #             # modes
# # #             "object_navigation_person_recognition": "/object-navigation-detect",
# # #             "object_detection": "/detect-objects",
# # #             "object_detection_annotated": "/detect-objects-annotated",
# # #             "currency_detection": "/detect-currency",
# # #             "currency_detection_annotated": "/detect-currency-annotated",
# # #             "color_detection": "/detect-color",
# # #             "color_detection_simple": "/detect-color-simple",

# # #             # IMPORTANT: your app calls this
# # #             "clothes_with_color": "/detect-objects-with-color",

# # #             # people
# # #             "person_register_base64": "/api/person/register",
# # #             "person_register_files": "/register-person",
# # #             "debug_persons": "/debug/persons",
# # #             "classes": "/classes",
# # #         },
# # #     }


# # # @app.get("/health")
# # # async def health_check():
# # #     return {
# # #         "status": "healthy",
# # #         "assets_dir": _ASSETS_DIR,
# # #         "models_present": {
# # #             "custom_model": os.path.exists(_CUSTOM_MODEL_PATH),
# # #             "coco_model": os.path.exists(_COCO_MODEL_PATH),
# # #             "currency_model": os.path.exists(_CURRENCY_MODEL_PATH),
# # #             "clothes_model": os.path.exists(_CLOTHES_MODEL_PATH),
# # #         },
# # #         "paths": {
# # #             "custom_model_path": _CUSTOM_MODEL_PATH,
# # #             "coco_model_path": _COCO_MODEL_PATH,
# # #             "currency_model_path": _CURRENCY_MODEL_PATH,
# # #             "clothes_model_path": _CLOTHES_MODEL_PATH,
# # #         },
# # #     }


# # # # ================================================================
# # # # DEBUG: persons in DB
# # # # ================================================================
# # # @app.get("/debug/persons")
# # # async def debug_get_persons():
# # #     try:
# # #         db_persons = face_database.get_all_persons()
# # #         result = []
# # #         for person in db_persons:
# # #             embeddings_list = person.get("embeddings", [])
# # #             embeddings_count = len(embeddings_list)

# # #             first_emb_preview = None
# # #             if embeddings_count > 0:
# # #                 first_emb = embeddings_list[0]
# # #                 first_emb_preview = {
# # #                     "length": len(first_emb),
# # #                     "norm": float(np.linalg.norm(np.array(first_emb, dtype=np.float32))),
# # #                     "first_5": first_emb[:5] if len(first_emb) >= 5 else first_emb,
# # #                 }

# # #             result.append(
# # #                 {
# # #                     "name": person.get("name"),
# # #                     "embeddings_count": embeddings_count,
# # #                     "first_embedding_preview": first_emb_preview,
# # #                 }
# # #             )

# # #         return {"success": True, "total_persons": len(db_persons), "persons": result}

# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         return {
# # #             "success": False,
# # #             "error": str(e),
# # #             "message": "Make sure MongoDB is running at mongodb://localhost:27017",
# # #         }


# # # # ================================================================
# # # # API: Person Registration (JSON base64)
# # # # ================================================================
# # # @app.post("/api/person/register")
# # # async def api_person_register(request: PersonRegisterRequest):
# # #     try:
# # #         name = request.name.strip()
# # #         if not name:
# # #             raise HTTPException(status_code=400, detail="Name is required")
# # #         if not request.images or len(request.images) < 1:
# # #             raise HTTPException(status_code=400, detail="At least 1 image required")

# # #         print(f"[api_person_register] Registering '{name}' with {len(request.images)} images")

# # #         embeddings = []
# # #         for i, base64_str in enumerate(request.images):
# # #             image = decode_base64_image(base64_str)
# # #             if image is None:
# # #                 print(f"[api_person_register] Image {i+1}: Could not decode")
# # #                 continue

# # #             faces = face_embedding.detect_face_and_crop(image)
# # #             if not faces:
# # #                 print(f"[api_person_register] Image {i+1}: No faces detected")
# # #                 continue

# # #             face_crop = faces[0]["crop"]
# # #             emb = face_embedding.generate_embedding(face_crop)
# # #             embeddings.append(emb.tolist())
# # #             print(f"[api_person_register] Image {i+1}: ✓ Extracted embedding")

# # #         if len(embeddings) == 0:
# # #             return {"success": False, "error": "no_face_detected", "message": "Could not detect faces in any image"}

# # #         try:
# # #             face_database.save_person_profile(name, embeddings)
# # #             return {"success": True, "name": name, "num_embeddings": len(embeddings), "message": f"Successfully registered {name}"}
# # #         except face_database.DuplicateName:
# # #             return {"success": False, "error": "duplicate_name", "message": f"Person '{name}' already exists"}
# # #         except Exception as db_error:
# # #             traceback.print_exc()
# # #             return {"success": False, "error": "database_error", "message": str(db_error)}

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         return {"success": False, "error": "server_error", "message": str(e)}


# # # # ================================================================
# # # # Person Registration (files)
# # # # ================================================================
# # # @app.post("/register-person")
# # # async def register_person(name: str, files: List[UploadFile] = File(...)):
# # #     try:
# # #         if not name or len(name.strip()) == 0:
# # #             raise HTTPException(status_code=400, detail="Name is required")
# # #         if len(files) < 1:
# # #             raise HTTPException(status_code=400, detail="At least 1 image required")

# # #         name = name.strip()
# # #         print(f"[register] Starting registration for '{name}' with {len(files)} images")

# # #         embeddings = []
# # #         for i, f in enumerate(files):
# # #             image_bytes = await f.read()
# # #             if not image_bytes:
# # #                 print(f"[register] Image {i+1}: Empty file, skipping")
# # #                 continue

# # #             nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # #             if image is None:
# # #                 print(f"[register] Image {i+1}: Invalid image, skipping")
# # #                 continue

# # #             faces = face_embedding.detect_face_and_crop(image)
# # #             if not faces:
# # #                 print(f"[register] Image {i+1}: No faces detected")
# # #                 continue

# # #             face_crop = faces[0]["crop"]
# # #             emb = face_embedding.generate_embedding(face_crop)
# # #             embeddings.append(emb.tolist())
# # #             print(f"[register] Image {i+1}: ✓ Extracted embedding")

# # #         if len(embeddings) == 0:
# # #             raise HTTPException(status_code=400, detail="Could not extract embeddings. Make sure faces are clearly visible.")

# # #         try:
# # #             face_database.save_person_profile(name, embeddings)
# # #             return {"success": True, "name": name, "embeddings_count": len(embeddings)}
# # #         except face_database.DuplicateName:
# # #             raise HTTPException(status_code=400, detail=f"Person '{name}' already exists in database")

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # MODE 1: Object Navigation + Person Recognition
# # # # - detections: colleague ObjectDetector (so "person" comes from COCO)
# # # # - face recognition: your code inside person boxes
# # # # ================================================================
# # # @app.post("/object-navigation-detect")
# # # async def object_navigation_detect(file: UploadFile = File(...), confidence: float = 0.5):
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # #         if image is None:
# # #             raise HTTPException(status_code=400, detail="Invalid image")

# # #         # optional resize for speed
# # #         h, w = image.shape[:2]
# # #         max_dim = 640
# # #         if max(h, w) > max_dim:
# # #             scale = max_dim / max(h, w)
# # #             image = cv2.resize(image, (int(w * scale), int(h * scale)))
# # #             h, w = image.shape[:2]

# # #         detections: List[dict] = []
# # #         persons_result: List[dict] = []
# # #         tts_messages: List[str] = []

# # #         # Load DB persons once
# # #         try:
# # #             db_persons = face_database.get_all_persons()
# # #             print(f"[nav] Loaded {len(db_persons)} persons from DB")
# # #         except Exception:
# # #             traceback.print_exc()
# # #             db_persons = []

# # #         # colleague object detection
# # #         detector = _get_object_detector()
# # #         ok, buf = cv2.imencode(".jpg", image)
# # #         if not ok:
# # #             raise HTTPException(status_code=500, detail="Failed to encode image")

# # #         det_result = detector.detect_objects(buf.tobytes(), conf_threshold=confidence)
# # #         person_boxes: List[Tuple[int, int, int, int]] = []

# # #         for d in det_result.get("detections", []):
# # #             bbox = d.get("bbox", {})
# # #             x1 = int(bbox.get("x1", 0))
# # #             y1 = int(bbox.get("y1", 0))
# # #             x2 = int(bbox.get("x2", 0))
# # #             y2 = int(bbox.get("y2", 0))
# # #             cls_name = d.get("class", "unknown")
# # #             confv = float(d.get("confidence", 0.0))

# # #             # clamp
# # #             x1 = max(0, min(w - 1, x1))
# # #             x2 = max(0, min(w - 1, x2))
# # #             y1 = max(0, min(h - 1, y1))
# # #             y2 = max(0, min(h - 1, y2))
# # #             if x2 <= x1 or y2 <= y1:
# # #                 continue

# # #             detections.append({
# # #                 "x1": float(x1), "y1": float(y1),
# # #                 "x2": float(x2), "y2": float(y2),
# # #                 "confidence": confv,
# # #                 "class_name": cls_name,
# # #             })

# # #             if isinstance(cls_name, str) and cls_name.lower() == "person":
# # #                 person_boxes.append((x1, y1, x2, y2))

# # #         # face recognition inside person boxes
# # #         for (px1, py1, px2, py2) in person_boxes:
# # #             pad = 20
# # #             x1 = max(0, px1 - pad)
# # #             y1 = max(0, py1 - pad)
# # #             x2 = min(w - 1, px2 + pad)
# # #             y2 = min(h - 1, py2 + pad)

# # #             person_crop = image[y1:y2, x1:x2]
# # #             if person_crop.size == 0:
# # #                 continue

# # #             faces = face_embedding.detect_face_and_crop(person_crop)
# # #             if not faces:
# # #                 x_center = (x1 + x2) / 2
# # #                 position = get_horizontal_position(x_center, w)
# # #                 distance = estimate_distance([x1, y1, x2, y2], h, w)
# # #                 persons_result.append({
# # #                     "label": "person",
# # #                     "bbox": [x1, y1, x2, y2],
# # #                     "similarity": None,
# # #                     "position": position,
# # #                     "distance": distance,
# # #                 })
# # #                 continue

# # #             for f in faces:
# # #                 crop = f["crop"]
# # #                 fb = f["bbox"]
# # #                 abs_bbox = [int(x1 + fb[0]), int(y1 + fb[1]), int(x1 + fb[2]), int(y1 + fb[3])]

# # #                 label = "person"
# # #                 similarity: Optional[float] = None
# # #                 try:
# # #                     emb = face_embedding.generate_embedding(crop)
# # #                     match = face_embedding.compare_embedding_to_db(emb, db_persons, threshold=0.6)
# # #                     if match:
# # #                         label, similarity = match
# # #                 except Exception:
# # #                     traceback.print_exc()

# # #                 x_center = (abs_bbox[0] + abs_bbox[2]) / 2
# # #                 position = get_horizontal_position(x_center, w)
# # #                 distance = estimate_distance(abs_bbox, h, w)

# # #                 persons_result.append({
# # #                     "label": label,
# # #                     "bbox": abs_bbox,
# # #                     "similarity": similarity,
# # #                     "position": position,
# # #                     "distance": distance,
# # #                 })

# # #         for p in persons_result:
# # #             position = p.get("position", "center")
# # #             distance = p.get("distance", "medium")
# # #             if p["label"] != "person":
# # #                 msg = f"{p['label']} is on your {position}, {distance}"
# # #             else:
# # #                 msg = f"Person detected on your {position}, {distance}"
# # #             tts_messages.append(msg)

# # #         for msg in tts_messages[:3]:
# # #             try:
# # #                 tts.speak(msg)
# # #             except Exception:
# # #                 pass

# # #         return {
# # #             "success": True,
# # #             "mode": "object_navigation",
# # #             "detections": detections,
# # #             "persons": persons_result,
# # #             "tts_messages": tts_messages,
# # #         }

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # MODE 2: Currency Detection (colleague)
# # # # ================================================================
# # # @app.post("/detect-currency")
# # # async def detect_currency(file: UploadFile = File(...), confidence: float = 0.25):
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_currency_detector()

# # #         # robust call: support different method names
# # #         if hasattr(detector, "detect_currency"):
# # #             results = detector.detect_currency(image_bytes, conf_threshold=confidence)
# # #         else:
# # #             raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_currency()")

# # #         tts_msg = "No currency detected" if results.get("count", 0) == 0 else f"Total {results.get('total_amount', 0)} rupees"
# # #         return JSONResponse({"success": True, **results, "tts_message": tts_msg})

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # @app.post("/detect-currency-annotated")
# # # async def detect_currency_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_currency_detector()

# # #         if hasattr(detector, "detect_and_draw"):
# # #             annotated = detector.detect_and_draw(image_bytes, conf_threshold=confidence)
# # #         else:
# # #             raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_and_draw()")

# # #         return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # MODE 3: Color Detection (your code)
# # # # ================================================================
# # # @app.post("/detect-color")
# # # async def detect_color(file: UploadFile = File(...)):
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_color_detector()
# # #         result = detector.detect_color(image_bytes, n_colors=3)

# # #         primary = result.get("primary_color")
# # #         tts_msg = f"Dominant color is {primary.get('name')}" if primary else "No color detected"

# # #         return {"success": True, "mode": "color_detection", "data": result, "tts_message": tts_msg}

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # @app.post("/detect-color-simple")
# # # async def detect_color_simple(file: UploadFile = File(...)):
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_color_detector()
# # #         result = detector.detect_color_simple(image_bytes)

# # #         return {"success": True, "mode": "color_detection_simple", "data": result, "tts_message": result.get("description")}

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # MODE 4: Object Detection (colleague dual-model)
# # # # ================================================================
# # # @app.post("/detect-objects")
# # # async def detect_objects(file: UploadFile = File(...), confidence: float = 0.25):
# # #     try:
# # #         contents = await file.read()
# # #         if not contents:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_object_detector()
# # #         results = detector.detect_objects(contents, conf_threshold=confidence)

# # #         return JSONResponse({"success": True, **results})

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # @app.post("/detect-objects-annotated")
# # # async def detect_objects_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# # #     try:
# # #         contents = await file.read()
# # #         if not contents:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         detector = _get_object_detector()
# # #         annotated = detector.detect_and_draw(contents, conf_threshold=confidence)

# # #         return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # MODE 5: Clothes + Color (YOUR intent)
# # # # Endpoint name MUST match your app: /detect-objects-with-color
# # # # Uses clothes_best_v4.pt + your ColorDetector on crops
# # # # ================================================================
# # # @app.post("/detect-objects-with-color")
# # # async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
# # #     """
# # #     Clothing + Color:
# # #     - detect clothing using clothes_best_v4.pt
# # #     - compute color per clothing item using your ColorDetector on bbox crop
# # #     """
# # #     try:
# # #         image_bytes = await file.read()
# # #         if not image_bytes:
# # #             raise HTTPException(status_code=400, detail="Empty file")

# # #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# # #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# # #         if image is None:
# # #             raise HTTPException(status_code=400, detail="Invalid image")

# # #         h, w = image.shape[:2]

# # #         def _normalize_clothes_label(label: str) -> str:
# # #             normalized = str(label or "").strip().lower().replace("_", " ")
# # #             label_map = {
# # #                 "trouser": "shalwar",
# # #                 "trousers": "shalwar",
# # #                 "pants": "shalwar",
# # #                 "pant": "shalwar",
# # #                 "scarf": "dupatta",
# # #             }
# # #             return label_map.get(normalized, normalized)

# # #         def _bbox_iou(a: dict, b: dict) -> float:
# # #             ax1, ay1, ax2, ay2 = a["bbox"]["x1"], a["bbox"]["y1"], a["bbox"]["x2"], a["bbox"]["y2"]
# # #             bx1, by1, bx2, by2 = b["bbox"]["x1"], b["bbox"]["y1"], b["bbox"]["x2"], b["bbox"]["y2"]
# # #             inter_x1 = max(ax1, bx1)
# # #             inter_y1 = max(ay1, by1)
# # #             inter_x2 = min(ax2, bx2)
# # #             inter_y2 = min(ay2, by2)
# # #             iw = max(0, inter_x2 - inter_x1)
# # #             ih = max(0, inter_y2 - inter_y1)
# # #             inter = iw * ih
# # #             area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
# # #             area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
# # #             union = area_a + area_b - inter
# # #             return (inter / union) if union > 0 else 0.0

# # #         def _dedupe_same_class(items: list, iou_threshold: float = 0.75) -> list:
# # #             kept = []
# # #             for det in sorted(items, key=lambda d: d["confidence"], reverse=True):
# # #                 duplicate = False
# # #                 for prev in kept:
# # #                     if prev["class_name"] == det["class_name"] and _bbox_iou(prev, det) > iou_threshold:
# # #                         duplicate = True
# # #                         break
# # #                 if not duplicate:
# # #                     kept.append(det)
# # #             return kept

# # #         def _apply_dupatta_shalwar_rules(items: list, image_h: int) -> list:
# # #             if image_h <= 0:
# # #                 return items

# # #             dupatta = [d for d in items if d["class_name"] == "dupatta"]
# # #             shalwar = [d for d in items if d["class_name"] == "shalwar"]

# # #             # If both are present but vertically inverted, swap the names.
# # #             if dupatta and shalwar:
# # #                 top_dupatta = max(dupatta, key=lambda d: d["confidence"])
# # #                 top_shalwar = max(shalwar, key=lambda d: d["confidence"])
# # #                 if top_dupatta["_y_center"] > top_shalwar["_y_center"]:
# # #                     top_dupatta["class_name"], top_shalwar["class_name"] = top_shalwar["class_name"], top_dupatta["class_name"]
# # #                     top_dupatta["class_id"], top_shalwar["class_id"] = top_shalwar["class_id"], top_dupatta["class_id"]

# # #             # If only one exists and geometry is clearly implausible, relabel.
# # #             for d in items:
# # #                 y_ratio = d["_y_center"] / image_h
# # #                 box_w = d["bbox"]["x2"] - d["bbox"]["x1"]
# # #                 box_h = d["bbox"]["y2"] - d["bbox"]["y1"]
# # #                 aspect = (box_w / box_h) if box_h > 0 else 0.0
# # #                 if d["class_name"] == "dupatta" and y_ratio > 0.68 and aspect < 1.2 and d["confidence"] < 0.72:
# # #                     d["class_name"] = "shalwar"
# # #                 elif d["class_name"] == "shalwar" and y_ratio < 0.52 and aspect > 1.25 and d["confidence"] < 0.72:
# # #                     d["class_name"] = "dupatta"

# # #             return items

# # #         def _inner_crop_coords(x1: int, y1: int, x2: int, y2: int, pad_ratio: float = 0.12):
# # #             bw = x2 - x1
# # #             bh = y2 - y1
# # #             padx = int(bw * pad_ratio)
# # #             pady = int(bh * pad_ratio)
# # #             cx1 = min(max(0, x1 + padx), w - 1)
# # #             cy1 = min(max(0, y1 + pady), h - 1)
# # #             cx2 = min(max(0, x2 - padx), w - 1)
# # #             cy2 = min(max(0, y2 - pady), h - 1)
# # #             if cx2 <= cx1 or cy2 <= cy1:
# # #                 return x1, y1, x2, y2
# # #             return cx1, cy1, cx2, cy2

# # #         clothes_model = _get_clothes_detector()
# # #         effective_conf = max(float(confidence), 0.25)
# # #         results = clothes_model.predict(
# # #             image,
# # #             conf=effective_conf,
# # #             iou=0.45,
# # #             imgsz=640,
# # #             verbose=False,
# # #             device="cpu",
# # #         )

# # #         # class names
# # #         class_names = {}
# # #         if hasattr(clothes_model, "model") and hasattr(clothes_model.model, "names"):
# # #             class_names = clothes_model.model.names
# # #         elif hasattr(clothes_model, "names"):
# # #             class_names = clothes_model.names

# # #         color_detector = _get_color_detector()
# # #         detections = []

# # #         for res in results:
# # #             for box in res.boxes:
# # #                 x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
# # #                 cls_id = int(box.cls[0].cpu().numpy())
# # #                 confv = float(box.conf[0].cpu().numpy())
# # #                 raw_cls_name = class_names.get(cls_id, str(cls_id))
# # #                 cls_name = _normalize_clothes_label(raw_cls_name)

# # #                 x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

# # #                 # clamp
# # #                 x1 = max(0, min(w - 1, x1))
# # #                 x2 = max(0, min(w - 1, x2))
# # #                 y1 = max(0, min(h - 1, y1))
# # #                 y2 = max(0, min(h - 1, y2))
# # #                 if x2 <= x1 or y2 <= y1:
# # #                     continue

# # #                 # Keep mild filtering, but do not suppress dupatta too aggressively.
# # #                 if cls_name == "dupatta" and confv < 0.28:
# # #                     continue
# # #                 if cls_name == "shalwar" and confv < 0.33:
# # #                     continue

# # #                 cx1, cy1, cx2, cy2 = _inner_crop_coords(x1, y1, x2, y2)
# # #                 crop = image[cy1:cy2, cx1:cx2]
# # #                 if crop.size == 0:
# # #                     continue

# # #                 # skip tiny crops
# # #                 if (cx2 - cx1) * (cy2 - cy1) < 32 * 32:
# # #                     color_result = {"name": "Unknown", "hex": None, "description": None}
# # #                 else:
# # #                     ok, buf = cv2.imencode(".jpg", crop)
# # #                     color_result = color_detector.detect_color_simple(buf.tobytes()) if ok else {"name": "Unknown"}

# # #                 color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"

# # #                 detections.append({
# # #                     "class_name": cls_name,
# # #                     "class_id": cls_id,
# # #                     "confidence": confv,
# # #                     "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
# # #                     "color": {"name": color_name, "hex": color_result.get("hex"), "raw": color_result},
# # #                     "_y_center": (y1 + y2) / 2.0,
# # #                 })

# # #         detections = _dedupe_same_class(detections)
# # #         detections = _apply_dupatta_shalwar_rules(detections, h)
# # #         detections.sort(key=lambda d: d["confidence"], reverse=True)
# # #         for d in detections:
# # #             d.pop("_y_center", None)
# # #         tts_messages = [f"{d['color']['name']} {d['class_name']}" for d in detections[:3]]

# # #         return {
# # #             "success": True,
# # #             "mode": "clothes_with_color",
# # #             "count": len(detections),
# # #             "detections": detections,
# # #             "tts_messages": tts_messages,
# # #         }

# # #     except HTTPException:
# # #         raise
# # #     except Exception as e:
# # #         traceback.print_exc()
# # #         raise HTTPException(status_code=500, detail=str(e))


# # # # ================================================================
# # # # Utility Endpoints
# # # # ================================================================
# # # @app.get("/classes")
# # # async def get_classes():
# # #     detector = _get_object_detector()
# # #     currency = _get_currency_detector()

# # #     currency_classes = []
# # #     if hasattr(currency, "class_names"):
# # #         try:
# # #             currency_classes = list(currency.class_names.values())
# # #         except Exception:
# # #             currency_classes = []

# # #     return {
# # #         "currency_classes": currency_classes,
# # #         "custom_object_classes": list(getattr(detector, "custom_classes", {}).values()),
# # #         "coco_object_classes": list(WANTED_COCO_CLASSES.values()),
# # #     }


# # # if __name__ == "__main__":
# # #     import uvicorn
# # #     uvicorn.run(app, host="0.0.0.0", port=8000)


# # from typing import List, Optional, Tuple
# # import os
# # import traceback
# # import base64
# # import io

# # import cv2
# # import numpy as np
# # from fastapi import FastAPI, File, UploadFile, HTTPException, Request
# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi.responses import JSONResponse, StreamingResponse
# # from pydantic import BaseModel

# # try:
# #     import tensorflow as tf
# # except ImportError:
# #     tf = None

# # from services import face_database, face_embedding, tts

# # # Your modules
# # from colour_detection import ColorDetector
# # from currency_detection import CurrencyDetector  # colleague uses this too

# # # Colleague object detection
# # from object_detection import ObjectDetector, WANTED_COCO_CLASSES


# # # ================================================================
# # # App
# # # ================================================================
# # app = FastAPI(title="V-EYE Unified Backend (All Modes)")

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )


# # @app.middleware("http")
# # async def log_requests(request: Request, call_next):
# #     print(f"\n>>> {request.method} {request.url.path}")
# #     resp = await call_next(request)
# #     print(f"<<< {resp.status_code}\n")
# #     return resp


# # # ================================================================
# # # Paths
# # # ================================================================
# # _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# # _ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")

# # # colleague dual-model object detection
# # _CUSTOM_MODEL_PATH = os.environ.get("CUSTOM_MODEL_PATH", os.path.join(_ASSETS_DIR, "washroom_kitchen_only.pt"))
# # _COCO_MODEL_PATH = os.environ.get("COCO_MODEL_PATH", os.path.join(_ASSETS_DIR, "yolov8n.pt"))

# # # currency model
# # _CURRENCY_MODEL_PATH = os.environ.get("CURRENCY_MODEL_PATH", os.path.join(_ASSETS_DIR, "yolo26-obb-tflite.tflite"))

# # # clothes model: now TFLite
# # _CLOTHES_MODEL_PATH = os.environ.get("CLOTHES_MODEL_PATH", os.path.join(_ASSETS_DIR, "best_float16.tflite"))

# # # IMPORTANT:
# # # Replace these 10 names with the EXACT class order used when you trained/exported the clothes TFLite model.
# # # Example only. If the order is wrong, detections will be mislabeled.
# # CLOTHES_CLASS_NAMES = {
# #     0: "dupatta",
# #     1: "kameez",
# #     2: "shalwar",
# #     3: "shirt",
# #     4: "jacket",
# #     5: "dress",
# #     6: "skirt",
# #     7: "pants",
# #     8: "short",
# #     9: "sweater",
# # }


# # # ================================================================
# # # Pydantic Models
# # # ================================================================
# # class PersonRegisterRequest(BaseModel):
# #     name: str
# #     images: List[str]


# # # ================================================================
# # # Helpers
# # # ================================================================
# # def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
# #     try:
# #         if "," in base64_str:
# #             base64_str = base64_str.split(",", 1)[1]
# #         image_data = base64.b64decode(base64_str)
# #         nparr = np.frombuffer(image_data, dtype=np.uint8)
# #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# #         return image
# #     except Exception as e:
# #         print(f"[decode_base64_image] Error: {e}")
# #         return None


# # def get_horizontal_position(x_center: float, img_width: int) -> str:
# #     if x_center < img_width * 0.33:
# #         return "left"
# #     if x_center > img_width * 0.66:
# #         return "right"
# #     return "center"


# # def estimate_distance(bbox: list, img_height: int, img_width: int) -> str:
# #     x1, y1, x2, y2 = bbox
# #     box_area = (x2 - x1) * (y2 - y1)
# #     img_area = img_height * img_width
# #     ratio = box_area / img_area if img_area > 0 else 0

# #     if ratio > 0.20:
# #         return "very_close"
# #     if ratio > 0.08:
# #         return "close"
# #     if ratio > 0.03:
# #         return "medium"
# #     return "far"


# # def _ensure_exists(path: str, label: str):
# #     if not os.path.exists(path):
# #         raise FileNotFoundError(f"{label} not found at: {path}\nExpected inside: {_ASSETS_DIR}")


# # # ================================================================
# # # Lazy-loaded detectors
# # # ================================================================
# # _object_detector = None
# # _color_detector = None
# # _currency_detector = None
# # _clothes_detector = None


# # def _get_object_detector():
# #     global _object_detector
# #     if _object_detector is None:
# #         _ensure_exists(_CUSTOM_MODEL_PATH, "Custom model")
# #         _ensure_exists(_COCO_MODEL_PATH, "COCO model")
# #         print(f"[objects] Loading ObjectDetector (custom={_CUSTOM_MODEL_PATH}, coco={_COCO_MODEL_PATH})")
# #         _object_detector = ObjectDetector(
# #             custom_model_path=_CUSTOM_MODEL_PATH,
# #             coco_model_path=_COCO_MODEL_PATH,
# #         )
# #     return _object_detector


# # def _get_color_detector():
# #     global _color_detector
# #     if _color_detector is None:
# #         print("[color] Initializing ColorDetector")
# #         _color_detector = ColorDetector()
# #     return _color_detector


# # def _get_currency_detector():
# #     global _currency_detector
# #     if _currency_detector is None:
# #         _ensure_exists(_CURRENCY_MODEL_PATH, "Currency model")
# #         print(f"[currency] Initializing CurrencyDetector (model={_CURRENCY_MODEL_PATH})")

# #         try:
# #             _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
# #         except TypeError:
# #             _currency_detector = CurrencyDetector()

# #         if not hasattr(_currency_detector, "model") or _currency_detector.model is None:
# #             from ultralytics import YOLO
# #             print("[currency] CurrencyDetector had no .model -> loading YOLO directly")
# #             _currency_detector.model = YOLO(_CURRENCY_MODEL_PATH)

# #         if not hasattr(_currency_detector, "class_names") or not getattr(_currency_detector, "class_names", None):
# #             try:
# #                 _currency_detector.class_names = _currency_detector.model.names
# #             except Exception:
# #                 pass

# #     return _currency_detector


# # def _get_clothes_detector():
# #     global _clothes_detector
# #     if _clothes_detector is None:
# #         _ensure_exists(_CLOTHES_MODEL_PATH, "Clothes model")

# #         if tf is None:
# #             raise RuntimeError("TensorFlow is required for TFLite clothes inference. Install with: pip install tensorflow")

# #         print(f"[clothes] Loading TFLite clothes model from {_CLOTHES_MODEL_PATH}")
# #         interpreter = tf.lite.Interpreter(model_path=_CLOTHES_MODEL_PATH)
# #         interpreter.allocate_tensors()

# #         input_details = interpreter.get_input_details()
# #         output_details = interpreter.get_output_details()
# #         input_shape = input_details[0]["shape"]
# #         input_dtype = input_details[0]["dtype"]

# #         _clothes_detector = {
# #             "interpreter": interpreter,
# #             "input_details": input_details,
# #             "output_details": output_details,
# #             "input_shape": input_shape,
# #             "input_dtype": input_dtype,
# #         }

# #         print("[clothes] input details:", input_details)
# #         print("[clothes] output details:", output_details)

# #     return _clothes_detector


# # # ================================================================
# # # TFLite clothes helpers
# # # ================================================================
# # def _preprocess_clothes_image(image: np.ndarray, input_shape, input_dtype):
# #     _, in_h, in_w, _ = input_shape

# #     rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
# #     resized = cv2.resize(rgb, (int(in_w), int(in_h)))

# #     if input_dtype == np.float32:
# #         tensor = resized.astype(np.float32) / 255.0
# #     elif input_dtype == np.uint8:
# #         tensor = resized.astype(np.uint8)
# #     else:
# #         tensor = resized.astype(input_dtype)

# #     tensor = np.expand_dims(tensor, axis=0)

# #     orig_h, orig_w = image.shape[:2]
# #     scale_x = orig_w / float(in_w)
# #     scale_y = orig_h / float(in_h)
# #     return tensor, scale_x, scale_y


# # def _iou_xyxy(box1, box2):
# #     x1 = max(box1[0], box2[0])
# #     y1 = max(box1[1], box2[1])
# #     x2 = min(box1[2], box2[2])
# #     y2 = min(box1[3], box2[3])

# #     inter_w = max(0.0, x2 - x1)
# #     inter_h = max(0.0, y2 - y1)
# #     inter = inter_w * inter_h

# #     area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
# #     area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
# #     union = area1 + area2 - inter
# #     return inter / union if union > 0 else 0.0


# # def _nms_tflite(detections: list, iou_threshold: float = 0.45) -> list:
# #     detections = sorted(detections, key=lambda d: d["confidence"], reverse=True)
# #     kept = []

# #     while detections:
# #         best = detections.pop(0)
# #         kept.append(best)

# #         remaining = []
# #         for det in detections:
# #             same_class = det["class_id"] == best["class_id"]
# #             overlap = _iou_xyxy(det["bbox"], best["bbox"])
# #             if same_class and overlap > iou_threshold:
# #                 continue
# #             remaining.append(det)

# #         detections = remaining

# #     return kept


# # def _parse_tflite_output(output: np.ndarray, class_names: dict, conf_threshold: float, scale_x: float, scale_y: float) -> list:
# #     preds = np.squeeze(output)

# #     if preds.ndim != 2:
# #         print("[clothes] Unexpected output ndim:", preds.ndim, "shape:", preds.shape)
# #         return []

# #     # Your exported model returns shape (300, 6):
# #     # [x1, y1, x2, y2, score, class_id]
# #     detections = []

# #     for row in preds:
# #         if len(row) != 6:
# #             continue

# #         x1, y1, x2, y2, score, class_id = row
# #         confidence = float(score)
# #         class_id = int(round(float(class_id)))

# #         if confidence < conf_threshold:
# #             continue
# #         if class_id not in class_names:
# #             continue

# #         detections.append({
# #             "class_id": class_id,
# #             "class_name": class_names.get(class_id, str(class_id)),
# #             "confidence": confidence,
# #             "bbox": [
# #                 float(x1 * scale_x),
# #                 float(y1 * scale_y),
# #                 float(x2 * scale_x),
# #                 float(y2 * scale_y),
# #             ],
# #         })

# #     return _nms_tflite(detections)


# # # ================================================================
# # # Root / Health
# # # ================================================================
# # @app.get("/")
# # async def root():
# #     return {
# #         "message": "V-EYE Unified Backend is running",
# #         "assets_dir": _ASSETS_DIR,
# #         "endpoints": {
# #             "health": "/health",
# #             "object_navigation_person_recognition": "/object-navigation-detect",
# #             "object_detection": "/detect-objects",
# #             "object_detection_annotated": "/detect-objects-annotated",
# #             "currency_detection": "/detect-currency",
# #             "currency_detection_annotated": "/detect-currency-annotated",
# #             "color_detection": "/detect-color",
# #             "color_detection_simple": "/detect-color-simple",
# #             "clothes_with_color": "/detect-objects-with-color",
# #             "person_register_base64": "/api/person/register",
# #             "person_register_files": "/register-person",
# #             "debug_persons": "/debug/persons",
# #             "classes": "/classes",
# #         },
# #     }


# # @app.get("/health")
# # async def health_check():
# #     return {
# #         "status": "healthy",
# #         "assets_dir": _ASSETS_DIR,
# #         "models_present": {
# #             "custom_model": os.path.exists(_CUSTOM_MODEL_PATH),
# #             "coco_model": os.path.exists(_COCO_MODEL_PATH),
# #             "currency_model": os.path.exists(_CURRENCY_MODEL_PATH),
# #             "clothes_model": os.path.exists(_CLOTHES_MODEL_PATH),
# #         },
# #         "paths": {
# #             "custom_model_path": _CUSTOM_MODEL_PATH,
# #             "coco_model_path": _COCO_MODEL_PATH,
# #             "currency_model_path": _CURRENCY_MODEL_PATH,
# #             "clothes_model_path": _CLOTHES_MODEL_PATH,
# #         },
# #     }


# # # ================================================================
# # # DEBUG: persons in DB
# # # ================================================================
# # @app.get("/debug/persons")
# # async def debug_get_persons():
# #     try:
# #         db_persons = face_database.get_all_persons()
# #         result = []
# #         for person in db_persons:
# #             embeddings_list = person.get("embeddings", [])
# #             embeddings_count = len(embeddings_list)

# #             first_emb_preview = None
# #             if embeddings_count > 0:
# #                 first_emb = embeddings_list[0]
# #                 first_emb_preview = {
# #                     "length": len(first_emb),
# #                     "norm": float(np.linalg.norm(np.array(first_emb, dtype=np.float32))),
# #                     "first_5": first_emb[:5] if len(first_emb) >= 5 else first_emb,
# #                 }

# #             result.append(
# #                 {
# #                     "name": person.get("name"),
# #                     "embeddings_count": embeddings_count,
# #                     "first_embedding_preview": first_emb_preview,
# #                 }
# #             )

# #         return {"success": True, "total_persons": len(db_persons), "persons": result}

# #     except Exception as e:
# #         traceback.print_exc()
# #         return {
# #             "success": False,
# #             "error": str(e),
# #             "message": "Make sure MongoDB is running at mongodb://localhost:27017",
# #         }


# # # ================================================================
# # # API: Person Registration (JSON base64)
# # # ================================================================
# # @app.post("/api/person/register")
# # async def api_person_register(request: PersonRegisterRequest):
# #     try:
# #         name = request.name.strip()
# #         if not name:
# #             raise HTTPException(status_code=400, detail="Name is required")
# #         if not request.images or len(request.images) < 1:
# #             raise HTTPException(status_code=400, detail="At least 1 image required")

# #         print(f"[api_person_register] Registering '{name}' with {len(request.images)} images")

# #         embeddings = []
# #         for i, base64_str in enumerate(request.images):
# #             image = decode_base64_image(base64_str)
# #             if image is None:
# #                 print(f"[api_person_register] Image {i + 1}: Could not decode")
# #                 continue

# #             faces = face_embedding.detect_face_and_crop(image)
# #             if not faces:
# #                 print(f"[api_person_register] Image {i + 1}: No faces detected")
# #                 continue

# #             face_crop = faces[0]["crop"]
# #             emb = face_embedding.generate_embedding(face_crop)
# #             embeddings.append(emb.tolist())
# #             print(f"[api_person_register] Image {i + 1}: ✓ Extracted embedding")

# #         if len(embeddings) == 0:
# #             return {"success": False, "error": "no_face_detected", "message": "Could not detect faces in any image"}

# #         try:
# #             face_database.save_person_profile(name, embeddings)
# #             return {
# #                 "success": True,
# #                 "name": name,
# #                 "num_embeddings": len(embeddings),
# #                 "message": f"Successfully registered {name}",
# #             }
# #         except face_database.DuplicateName:
# #             return {"success": False, "error": "duplicate_name", "message": f"Person '{name}' already exists"}
# #         except Exception as db_error:
# #             traceback.print_exc()
# #             return {"success": False, "error": "database_error", "message": str(db_error)}

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         return {"success": False, "error": "server_error", "message": str(e)}


# # # ================================================================
# # # Person Registration (files)
# # # ================================================================
# # @app.post("/register-person")
# # async def register_person(name: str, files: List[UploadFile] = File(...)):
# #     try:
# #         if not name or len(name.strip()) == 0:
# #             raise HTTPException(status_code=400, detail="Name is required")
# #         if len(files) < 1:
# #             raise HTTPException(status_code=400, detail="At least 1 image required")

# #         name = name.strip()
# #         print(f"[register] Starting registration for '{name}' with {len(files)} images")

# #         embeddings = []
# #         for i, f in enumerate(files):
# #             image_bytes = await f.read()
# #             if not image_bytes:
# #                 print(f"[register] Image {i + 1}: Empty file, skipping")
# #                 continue

# #             nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# #             if image is None:
# #                 print(f"[register] Image {i + 1}: Invalid image, skipping")
# #                 continue

# #             faces = face_embedding.detect_face_and_crop(image)
# #             if not faces:
# #                 print(f"[register] Image {i + 1}: No faces detected")
# #                 continue

# #             face_crop = faces[0]["crop"]
# #             emb = face_embedding.generate_embedding(face_crop)
# #             embeddings.append(emb.tolist())
# #             print(f"[register] Image {i + 1}: ✓ Extracted embedding")

# #         if len(embeddings) == 0:
# #             raise HTTPException(status_code=400, detail="Could not extract embeddings. Make sure faces are clearly visible.")

# #         try:
# #             face_database.save_person_profile(name, embeddings)
# #             return {"success": True, "name": name, "embeddings_count": len(embeddings)}
# #         except face_database.DuplicateName:
# #             raise HTTPException(status_code=400, detail=f"Person '{name}' already exists in database")

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # MODE 1: Object Navigation + Person Recognition
# # # ================================================================
# # @app.post("/object-navigation-detect")
# # async def object_navigation_detect(file: UploadFile = File(...), confidence: float = 0.5):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# #         if image is None:
# #             raise HTTPException(status_code=400, detail="Invalid image")

# #         h, w = image.shape[:2]
# #         max_dim = 640
# #         if max(h, w) > max_dim:
# #             scale = max_dim / max(h, w)
# #             image = cv2.resize(image, (int(w * scale), int(h * scale)))
# #             h, w = image.shape[:2]

# #         detections: List[dict] = []
# #         persons_result: List[dict] = []
# #         tts_messages: List[str] = []

# #         try:
# #             db_persons = face_database.get_all_persons()
# #             print(f"[nav] Loaded {len(db_persons)} persons from DB")
# #         except Exception:
# #             traceback.print_exc()
# #             db_persons = []

# #         detector = _get_object_detector()
# #         ok, buf = cv2.imencode(".jpg", image)
# #         if not ok:
# #             raise HTTPException(status_code=500, detail="Failed to encode image")

# #         det_result = detector.detect_objects(buf.tobytes(), conf_threshold=confidence)
# #         person_boxes: List[Tuple[int, int, int, int]] = []

# #         for d in det_result.get("detections", []):
# #             bbox = d.get("bbox", {})
# #             x1 = int(bbox.get("x1", 0))
# #             y1 = int(bbox.get("y1", 0))
# #             x2 = int(bbox.get("x2", 0))
# #             y2 = int(bbox.get("y2", 0))
# #             cls_name = d.get("class", "unknown")
# #             confv = float(d.get("confidence", 0.0))

# #             x1 = max(0, min(w - 1, x1))
# #             x2 = max(0, min(w - 1, x2))
# #             y1 = max(0, min(h - 1, y1))
# #             y2 = max(0, min(h - 1, y2))
# #             if x2 <= x1 or y2 <= y1:
# #                 continue

# #             detections.append({
# #                 "x1": float(x1), "y1": float(y1),
# #                 "x2": float(x2), "y2": float(y2),
# #                 "confidence": confv,
# #                 "class_name": cls_name,
# #             })

# #             if isinstance(cls_name, str) and cls_name.lower() == "person":
# #                 person_boxes.append((x1, y1, x2, y2))

# #         for (px1, py1, px2, py2) in person_boxes:
# #             pad = 20
# #             x1 = max(0, px1 - pad)
# #             y1 = max(0, py1 - pad)
# #             x2 = min(w - 1, px2 + pad)
# #             y2 = min(h - 1, py2 + pad)

# #             person_crop = image[y1:y2, x1:x2]
# #             if person_crop.size == 0:
# #                 continue

# #             faces = face_embedding.detect_face_and_crop(person_crop)
# #             if not faces:
# #                 x_center = (x1 + x2) / 2
# #                 position = get_horizontal_position(x_center, w)
# #                 distance = estimate_distance([x1, y1, x2, y2], h, w)
# #                 persons_result.append({
# #                     "label": "person",
# #                     "bbox": [x1, y1, x2, y2],
# #                     "similarity": None,
# #                     "position": position,
# #                     "distance": distance,
# #                 })
# #                 continue

# #             for f in faces:
# #                 crop = f["crop"]
# #                 fb = f["bbox"]
# #                 abs_bbox = [int(x1 + fb[0]), int(y1 + fb[1]), int(x1 + fb[2]), int(y1 + fb[3])]

# #                 label = "person"
# #                 similarity: Optional[float] = None
# #                 try:
# #                     emb = face_embedding.generate_embedding(crop)
# #                     match = face_embedding.compare_embedding_to_db(emb, db_persons, threshold=0.6)
# #                     if match:
# #                         label, similarity = match
# #                 except Exception:
# #                     traceback.print_exc()

# #                 x_center = (abs_bbox[0] + abs_bbox[2]) / 2
# #                 position = get_horizontal_position(x_center, w)
# #                 distance = estimate_distance(abs_bbox, h, w)

# #                 persons_result.append({
# #                     "label": label,
# #                     "bbox": abs_bbox,
# #                     "similarity": similarity,
# #                     "position": position,
# #                     "distance": distance,
# #                 })

# #         for p in persons_result:
# #             position = p.get("position", "center")
# #             distance = p.get("distance", "medium")
# #             if p["label"] != "person":
# #                 msg = f"{p['label']} is on your {position}, {distance}"
# #             else:
# #                 msg = f"Person detected on your {position}, {distance}"
# #             tts_messages.append(msg)

# #         for msg in tts_messages[:3]:
# #             try:
# #                 tts.speak(msg)
# #             except Exception:
# #                 pass

# #         return {
# #             "success": True,
# #             "mode": "object_navigation",
# #             "detections": detections,
# #             "persons": persons_result,
# #             "tts_messages": tts_messages,
# #         }

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # MODE 2: Currency Detection
# # # ================================================================
# # @app.post("/detect-currency")
# # async def detect_currency(file: UploadFile = File(...), confidence: float = 0.25):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_currency_detector()

# #         if hasattr(detector, "detect_currency"):
# #             results = detector.detect_currency(image_bytes, conf_threshold=confidence)
# #         else:
# #             raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_currency()")

# #         tts_msg = "No currency detected" if results.get("count", 0) == 0 else f"Total {results.get('total_amount', 0)} rupees"
# #         return JSONResponse({"success": True, **results, "tts_message": tts_msg})

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # @app.post("/detect-currency-annotated")
# # async def detect_currency_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_currency_detector()

# #         if hasattr(detector, "detect_and_draw"):
# #             annotated = detector.detect_and_draw(image_bytes, conf_threshold=confidence)
# #         else:
# #             raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_and_draw()")

# #         return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # MODE 3: Color Detection
# # # ================================================================
# # @app.post("/detect-color")
# # async def detect_color(file: UploadFile = File(...)):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_color_detector()
# #         result = detector.detect_color(image_bytes, n_colors=3)

# #         primary = result.get("primary_color")
# #         tts_msg = f"Dominant color is {primary.get('name')}" if primary else "No color detected"

# #         return {"success": True, "mode": "color_detection", "data": result, "tts_message": tts_msg}

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # @app.post("/detect-color-simple")
# # async def detect_color_simple(file: UploadFile = File(...)):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_color_detector()
# #         result = detector.detect_color_simple(image_bytes)

# #         return {"success": True, "mode": "color_detection_simple", "data": result, "tts_message": result.get("description")}

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # MODE 4: Object Detection
# # # ================================================================
# # @app.post("/detect-objects")
# # async def detect_objects(file: UploadFile = File(...), confidence: float = 0.25):
# #     try:
# #         contents = await file.read()
# #         if not contents:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_object_detector()
# #         results = detector.detect_objects(contents, conf_threshold=confidence)

# #         return JSONResponse({"success": True, **results})

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # @app.post("/detect-objects-annotated")
# # async def detect_objects_annotated(file: UploadFile = File(...), confidence: float = 0.25):
# #     try:
# #         contents = await file.read()
# #         if not contents:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         detector = _get_object_detector()
# #         annotated = detector.detect_and_draw(contents, conf_threshold=confidence)

# #         return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # MODE 5: Clothes + Color using TFLite
# # # ================================================================
# # @app.post("/detect-objects-with-color")
# # async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
# #     try:
# #         image_bytes = await file.read()
# #         if not image_bytes:
# #             raise HTTPException(status_code=400, detail="Empty file")

# #         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
# #         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
# #         if image is None:
# #             raise HTTPException(status_code=400, detail="Invalid image")

# #         h, w = image.shape[:2]

# #         def _normalize_clothes_label(label: str) -> str:
# #             normalized = str(label or "").strip().lower().replace("_", " ")
# #             label_map = {
# #                 "trouser": "shalwar",
# #                 "trousers": "shalwar",
# #                 "pants": "shalwar",
# #                 "pant": "shalwar",
# #                 "scarf": "dupatta",
# #             }
# #             return label_map.get(normalized, normalized)

# #         def _bbox_iou(a: dict, b: dict) -> float:
# #             ax1, ay1, ax2, ay2 = a["bbox"]["x1"], a["bbox"]["y1"], a["bbox"]["x2"], a["bbox"]["y2"]
# #             bx1, by1, bx2, by2 = b["bbox"]["x1"], b["bbox"]["y1"], b["bbox"]["x2"], b["bbox"]["y2"]
# #             inter_x1 = max(ax1, bx1)
# #             inter_y1 = max(ay1, by1)
# #             inter_x2 = min(ax2, bx2)
# #             inter_y2 = min(ay2, by2)
# #             iw = max(0, inter_x2 - inter_x1)
# #             ih = max(0, inter_y2 - inter_y1)
# #             inter = iw * ih
# #             area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
# #             area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
# #             union = area_a + area_b - inter
# #             return (inter / union) if union > 0 else 0.0

# #         def _dedupe_same_class(items: list, iou_threshold: float = 0.75) -> list:
# #             kept = []
# #             for det in sorted(items, key=lambda d: d["confidence"], reverse=True):
# #                 duplicate = False
# #                 for prev in kept:
# #                     if prev["class_name"] == det["class_name"] and _bbox_iou(prev, det) > iou_threshold:
# #                         duplicate = True
# #                         break
# #                 if not duplicate:
# #                     kept.append(det)
# #             return kept

# #         def _apply_dupatta_shalwar_rules(items: list, image_h: int) -> list:
# #             if image_h <= 0:
# #                 return items

# #             dupatta = [d for d in items if d["class_name"] == "dupatta"]
# #             shalwar = [d for d in items if d["class_name"] == "shalwar"]

# #             if dupatta and shalwar:
# #                 top_dupatta = max(dupatta, key=lambda d: d["confidence"])
# #                 top_shalwar = max(shalwar, key=lambda d: d["confidence"])
# #                 if top_dupatta["_y_center"] > top_shalwar["_y_center"]:
# #                     top_dupatta["class_name"], top_shalwar["class_name"] = top_shalwar["class_name"], top_dupatta["class_name"]
# #                     top_dupatta["class_id"], top_shalwar["class_id"] = top_shalwar["class_id"], top_dupatta["class_id"]

# #             for d in items:
# #                 y_ratio = d["_y_center"] / image_h
# #                 box_w = d["bbox"]["x2"] - d["bbox"]["x1"]
# #                 box_h = d["bbox"]["y2"] - d["bbox"]["y1"]
# #                 aspect = (box_w / box_h) if box_h > 0 else 0.0
# #                 if d["class_name"] == "dupatta" and y_ratio > 0.68 and aspect < 1.2 and d["confidence"] < 0.72:
# #                     d["class_name"] = "shalwar"
# #                 elif d["class_name"] == "shalwar" and y_ratio < 0.52 and aspect > 1.25 and d["confidence"] < 0.72:
# #                     d["class_name"] = "dupatta"

# #             return items

# #         def _inner_crop_coords(x1: int, y1: int, x2: int, y2: int, pad_ratio: float = 0.12):
# #             bw = x2 - x1
# #             bh = y2 - y1
# #             padx = int(bw * pad_ratio)
# #             pady = int(bh * pad_ratio)
# #             cx1 = min(max(0, x1 + padx), w - 1)
# #             cy1 = min(max(0, y1 + pady), h - 1)
# #             cx2 = min(max(0, x2 - padx), w - 1)
# #             cy2 = min(max(0, y2 - pady), h - 1)
# #             if cx2 <= cx1 or cy2 <= cy1:
# #                 return x1, y1, x2, y2
# #             return cx1, cy1, cx2, cy2

# #         clothes_model = _get_clothes_detector()
# #         effective_conf = max(float(confidence), 0.3)

# #         interpreter = clothes_model["interpreter"]
# #         input_details = clothes_model["input_details"]
# #         output_details = clothes_model["output_details"]
# #         input_shape = clothes_model["input_shape"]
# #         input_dtype = clothes_model["input_dtype"]

# #         input_tensor, scale_x, scale_y = _preprocess_clothes_image(image, input_shape, input_dtype)

# #         interpreter.set_tensor(input_details[0]["index"], input_tensor)
# #         interpreter.invoke()

# #         output = interpreter.get_tensor(output_details[0]["index"])

# #         print("input shape:", input_shape)
# #         print("input dtype:", input_dtype)
# #         print("output shape:", output.shape)
# #         print("output dtype:", output.dtype)
# #         print("first 20 values:", output.flatten()[:20])

# #         raw_detections = _parse_tflite_output(
# #             output=output,
# #             class_names=CLOTHES_CLASS_NAMES,
# #             conf_threshold=effective_conf,
# #             scale_x=scale_x,
# #             scale_y=scale_y,
# #         )

# #         color_detector = _get_color_detector()
# #         detections = []

# #         for det in raw_detections:
# #             x1, y1, x2, y2 = map(int, det["bbox"])
# #             cls_id = int(det["class_id"])
# #             confv = float(det["confidence"])
# #             raw_cls_name = det["class_name"]
# #             cls_name = _normalize_clothes_label(raw_cls_name)

# #             x1 = max(0, min(w - 1, x1))
# #             x2 = max(0, min(w - 1, x2))
# #             y1 = max(0, min(h - 1, y1))
# #             y2 = max(0, min(h - 1, y2))
# #             if x2 <= x1 or y2 <= y1:
# #                 continue

# #             if cls_name == "dupatta" and confv < 0.28:
# #                 continue
# #             if cls_name == "shalwar" and confv < 0.33:
# #                 continue

# #             cx1, cy1, cx2, cy2 = _inner_crop_coords(x1, y1, x2, y2)
# #             crop = image[cy1:cy2, cx1:cx2]
# #             if crop.size == 0:
# #                 continue

# #             if (cx2 - cx1) * (cy2 - cy1) < 32 * 32:
# #                 color_result = {"name": "Unknown", "hex": None, "description": None}
# #             else:
# #                 ok, buf = cv2.imencode(".jpg", crop)
# #                 color_result = color_detector.detect_color_simple(buf.tobytes()) if ok else {"name": "Unknown"}

# #             color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"

# #             detections.append({
# #                 "class_name": cls_name,
# #                 "class_id": cls_id,
# #                 "confidence": confv,
# #                 "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
# #                 "color": {"name": color_name, "hex": color_result.get("hex"), "raw": color_result},
# #                 "_y_center": (y1 + y2) / 2.0,
# #             })

# #         detections = _dedupe_same_class(detections)
# #         detections = _apply_dupatta_shalwar_rules(detections, h)
# #         detections.sort(key=lambda d: d["confidence"], reverse=True)
# #         for d in detections:
# #             d.pop("_y_center", None)

# #         print("num raw detections:", len(raw_detections))
# #         print("first 5 raw detections:", raw_detections[:5])
# #         print("final detections:", detections[:5])

# #         tts_messages = [f"{d['color']['name']} {d['class_name']}" for d in detections[:3]]

# #         return {
# #             "success": True,
# #             "mode": "clothes_with_color",
# #             "count": len(detections),
# #             "detections": detections,
# #             "tts_messages": tts_messages,
# #         }

# #     except HTTPException:
# #         raise
# #     except Exception as e:
# #         traceback.print_exc()
# #         raise HTTPException(status_code=500, detail=str(e))


# # # ================================================================
# # # Utility Endpoints
# # # ================================================================
# # @app.get("/classes")
# # async def get_classes():
# #     detector = _get_object_detector()
# #     currency = _get_currency_detector()

# #     currency_classes = []
# #     if hasattr(currency, "class_names"):
# #         try:
# #             currency_classes = list(currency.class_names.values())
# #         except Exception:
# #             currency_classes = []

# #     return {
# #         "currency_classes": currency_classes,
# #         "custom_object_classes": list(getattr(detector, "custom_classes", {}).values()),
# #         "coco_object_classes": list(WANTED_COCO_CLASSES.values()),
# #         "clothes_classes": list(CLOTHES_CLASS_NAMES.values()),
# #     }


# # if __name__ == "__main__":
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8000)

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
from pydantic import BaseModel, Field
from PIL import Image
try:
    import tensorflow as tf
except ImportError:
    tf = None

from services import face_database, face_embedding, tts
from services.face_database import DuplicateName, save_person_profile, get_all_persons
from services.face_embedding import (
    detect_faces_with_landmarks,
    generate_embedding,
    compare_embedding_to_db,
)
from services.face_guidance import build_guidance_response
# Your modules
from colour_detection import ColorDetector
from currency_detection import CurrencyDetector  # colleague uses this too

# Colleague object detection
from object_detection import ObjectDetector, WANTED_COCO_CLASSES

import threading
# ================================================================
# App
# ================================================================
app = FastAPI(title="V-EYE Unified Backend (All Modes)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
# Paths
# ================================================================
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ASSETS_DIR = os.path.join(_BACKEND_DIR, "assets")

# colleague dual-model object detection
_CUSTOM_MODEL_PATH = os.environ.get("CUSTOM_MODEL_PATH", os.path.join(_ASSETS_DIR, "final_object_detection.tflite"))
_COCO_MODEL_PATH   = os.environ.get("COCO_MODEL_PATH",   os.path.join(_ASSETS_DIR, "coco_yolo26n_int8.tflite"))

# currency model
_CURRENCY_MODEL_PATH = os.environ.get("CURRENCY_MODEL_PATH", os.path.join(_ASSETS_DIR, "yolo26-obb-tflite.tflite"))

# clothes model: now TFLite
_CLOTHES_MODEL_PATH = os.environ.get("CLOTHES_MODEL_PATH", os.path.join(_ASSETS_DIR, "best_float16.tflite"))

# IMPORTANT:
# Replace these 10 names with the EXACT class order used when you trained/exported the clothes TFLite model.
# Example only. If the order is wrong, detections will be mislabeled.
CLOTHES_CLASS_NAMES = {
    0: "dupatta",
    1: "kameez",
    2: "shalwar",
    3: "shirt",
    4: "jacket",
    5: "dress",
    6: "skirt",
    7: "pants",
    8: "short",
    9: "sweater",
}


# ================================================================
# Pydantic Models
# ================================================================
class LegacyPersonRegisterRequest(BaseModel):
    name: str
    images: List[str]

class FaceGuideRequest(BaseModel):
    imageBase64: str
    requiredAngle: Optional[str] = None
    capturedAngles: List[str] = Field(default_factory=list)


class PersonRegisterRequest(BaseModel):
    name: str
    imageBase64List: List[str]
    capturedAngles: List[str] = Field(default_factory=list)
    imagePaths: List[str] = Field(default_factory=list)


class PersonRecognizeRequest(BaseModel):
    imageBase64: str
    threshold: float = 0.6

# ================================================================
# Helpers
# ================================================================
def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
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


def get_horizontal_position(x_center: float, img_width: int) -> str:
    if x_center < img_width * 0.33:
        return "left"
    if x_center > img_width * 0.66:
        return "right"
    return "center"


def estimate_distance(bbox: list, img_height: int, img_width: int) -> str:
    x1, y1, x2, y2 = bbox
    box_area = (x2 - x1) * (y2 - y1)
    img_area = img_height * img_width
    ratio = box_area / img_area if img_area > 0 else 0

    if ratio > 0.20:
        return "very_close"
    if ratio > 0.08:
        return "close"
    if ratio > 0.03:
        return "medium"
    return "far"


def _ensure_exists(path: str, label: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"{label} not found at: {path}\nExpected inside: {_ASSETS_DIR}")


# ================================================================
# Lazy-loaded detectors
# ================================================================
_object_detector = None
_color_detector = None
_currency_detector = None
_clothes_detector = None


def _get_object_detector():
    global _object_detector
    if _object_detector is None:
        _ensure_exists(_CUSTOM_MODEL_PATH, "Custom model")
        _ensure_exists(_COCO_MODEL_PATH, "COCO model")
        print(f"[objects] Loading ObjectDetector (custom={_CUSTOM_MODEL_PATH}, coco={_COCO_MODEL_PATH})")
        _object_detector = ObjectDetector(
            custom_model_path=_CUSTOM_MODEL_PATH,
            coco_model_path=_COCO_MODEL_PATH,
        )
    return _object_detector


def _get_color_detector():
    global _color_detector
    if _color_detector is None:
        print("[color] Initializing ColorDetector")
        _color_detector = ColorDetector()
    return _color_detector


def _get_currency_detector():
    global _currency_detector
    if _currency_detector is None:
        _ensure_exists(_CURRENCY_MODEL_PATH, "Currency model")
        print(f"[currency] Initializing CurrencyDetector (model={_CURRENCY_MODEL_PATH})")

        try:
            _currency_detector = CurrencyDetector(model_path=_CURRENCY_MODEL_PATH)
        except TypeError:
            _currency_detector = CurrencyDetector()

        if not hasattr(_currency_detector, "model") or _currency_detector.model is None:
            from ultralytics import YOLO
            print("[currency] CurrencyDetector had no .model -> loading YOLO directly")
            _currency_detector.model = YOLO(_CURRENCY_MODEL_PATH)

        if not hasattr(_currency_detector, "class_names") or not getattr(_currency_detector, "class_names", None):
            try:
                _currency_detector.class_names = _currency_detector.model.names
            except Exception:
                pass

    return _currency_detector


def _get_clothes_detector():
    global _clothes_detector
    if _clothes_detector is None:
        _ensure_exists(_CLOTHES_MODEL_PATH, "Clothes model")

        if tf is None:
            raise RuntimeError("TensorFlow is required for TFLite clothes inference. Install with: pip install tensorflow")

        print(f"[clothes] Loading TFLite clothes model from {_CLOTHES_MODEL_PATH}")
        interpreter = tf.lite.Interpreter(model_path=_CLOTHES_MODEL_PATH)
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        input_shape = input_details[0]["shape"]
        input_dtype = input_details[0]["dtype"]

        _clothes_detector = {
            "interpreter": interpreter,
            "input_details": input_details,
            "output_details": output_details,
            "input_shape": input_shape,
            "input_dtype": input_dtype,
        }

        print("[clothes] input details:", input_details)
        print("[clothes] output details:", output_details)

    return _clothes_detector


# ================================================================
# TFLite clothes helpers
# ================================================================
# def _preprocess_clothes_image(image: np.ndarray, input_shape, input_dtype):
#     _, in_h, in_w, _ = input_shape

#     rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#     resized = cv2.resize(rgb, (int(in_w), int(in_h)))

#     if input_dtype == np.float32:
#         tensor = resized.astype(np.float32) / 255.0
#     elif input_dtype == np.uint8:
#         tensor = resized.astype(np.uint8)
#     else:
#         tensor = resized.astype(input_dtype)

#     tensor = np.expand_dims(tensor, axis=0)

#     orig_h, orig_w = image.shape[:2]
#     scale_x = orig_w / float(in_w)
#     scale_y = orig_h / float(in_h)
#     return tensor, scale_x, scale_y

def _preprocess_clothes_image(image: np.ndarray, input_shape, input_dtype):
    _, in_h, in_w, _ = input_shape

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (int(in_w), int(in_h)))

    if input_dtype == np.float32:
        tensor = resized.astype(np.float32) / 255.0
    elif input_dtype == np.uint8:
        tensor = resized.astype(np.uint8)
    else:
        tensor = resized.astype(input_dtype)

    tensor = np.expand_dims(tensor, axis=0)
    return tensor

def _iou_xyxy(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter = inter_w * inter_h

    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0


def _nms_tflite(detections: list, iou_threshold: float = 0.45) -> list:
    detections = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    kept = []

    while detections:
        best = detections.pop(0)
        kept.append(best)

        remaining = []
        for det in detections:
            same_class = det["class_id"] == best["class_id"]
            overlap = _iou_xyxy(det["bbox"], best["bbox"])
            if same_class and overlap > iou_threshold:
                continue
            remaining.append(det)

        detections = remaining

    return kept


# def _parse_tflite_output(output: np.ndarray, class_names: dict, conf_threshold: float, scale_x: float, scale_y: float) -> list:
#     preds = np.squeeze(output)

#     if preds.ndim != 2:
#         print("[clothes] Unexpected output ndim:", preds.ndim, "shape:", preds.shape)
#         return []

#     # Your exported model returns shape (300, 6):
#     # [x1, y1, x2, y2, score, class_id]
#     detections = []

#     for row in preds:
#         if len(row) != 6:
#             continue

#         x1, y1, x2, y2, score, class_id = row
#         confidence = float(score)
#         class_id = int(round(float(class_id)))

#         if confidence < conf_threshold:
#             continue
#         if class_id not in class_names:
#             continue

#         detections.append({
#             "class_id": class_id,
#             "class_name": class_names.get(class_id, str(class_id)),
#             "confidence": confidence,
#             "bbox": [
#                 float(x1 * scale_x),
#                 float(y1 * scale_y),
#                 float(x2 * scale_x),
#                 float(y2 * scale_y),
#             ],
#         })

#     return _nms_tflite(detections)

def _parse_tflite_output(output, class_names, conf_threshold, orig_w, orig_h):
    preds = np.squeeze(output)

    if preds.ndim == 1:
        preds = np.expand_dims(preds, axis=0)

    detections = []

    for row in preds:
        if len(row) != 6:
            continue

        x1, y1, x2, y2, score, class_id = row
        confidence = float(score)
        class_id = int(round(float(class_id)))

        if confidence < conf_threshold:
            continue
        if class_id not in class_names:
            continue

        # normalized coords (0..1) -> original image pixels
        x1 = float(x1) * orig_w
        y1 = float(y1) * orig_h
        x2 = float(x2) * orig_w
        y2 = float(y2) * orig_h

        detections.append({
            "class_id": class_id,
            "class_name": class_names.get(class_id, str(class_id)),
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2],
        })

    return _nms_tflite(detections)



def get_largest_face(faces: List[dict]):
    if not faces:
        return None

    return sorted(
        faces,
        key=lambda f: (f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]),
        reverse=True,
    )[0]
# ================================================================
# Root / Health
# ================================================================
@app.post("/face-registration-guide")
async def face_registration_guide(payload: FaceGuideRequest):
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {
                "ok": False,
                "faceDetected": False,
                "shouldCapture": False,
                "stable": False,
                "distance": "good",
                "position": "centered",
                "angle": "unknown",
                "duplicateAngle": False,
                "nextRequiredAngle": payload.requiredAngle,
                "message": "Invalid image.",
            }

        faces = detect_faces_with_landmarks(image)
        print("[face-registration-guide] faces found:", len(faces))

        largest_face = get_largest_face(faces)
        if largest_face is not None:
            print("[face-registration-guide] bbox:", largest_face.get("bbox"))
            print("[face-registration-guide] landmarks:", largest_face.get("landmarks"))

        result = build_guidance_response(
            frame_shape=image.shape[:2],
            face=largest_face,
            required_angle=payload.requiredAngle,
            captured_angles=payload.capturedAngles,
        )

        print("[face-registration-guide] result:", result)
        return result

    except Exception as e:
        print("[face-registration-guide] error:", e)
        traceback.print_exc()
        return {
            "ok": False,
            "faceDetected": False,
            "shouldCapture": False,
            "stable": False,
            "distance": "good",
            "position": "centered",
            "angle": "unknown",
            "duplicateAngle": False,
            "nextRequiredAngle": payload.requiredAngle,
            "message": "Guide service unavailable.",
        }
    
@app.post("/register-person")
async def register_person(payload: PersonRegisterRequest):
    try:
        name = payload.name.strip()
        if not name:
            return {"ok": False, "message": "Name is required."}

        if not payload.imageBase64List:
            return {"ok": False, "message": "No images received."}

        embeddings: List[List[float]] = []

        for idx, image_base64 in enumerate(payload.imageBase64List):
            try:
                image = decode_base64_image(image_base64)
                if image is None:
                    print(f"[register-person] Invalid image {idx}")
                    continue
                faces = detect_faces_with_landmarks(image)
                largest_face = get_largest_face(faces)

                if largest_face is None:
                    print(f"[register-person] No face found in image {idx}")
                    continue

                # face_crop = largest_face["crop"]
                # embedding = generate_embedding(face_crop)
                # embeddings.append(embedding.tolist())
                face_crop = largest_face["crop"]
                crop_landmarks = largest_face.get("crop_landmarks")

                if face_crop.shape[0] < 60 or face_crop.shape[1] < 60:
                    print(f"[register-person] Face too small in image {idx}")
                    continue

                # if face_embedding.is_blurry(face_crop):
                #     print(f"[register-person] Blurry face in image {idx}")
                #     continue

                embedding = generate_embedding(face_crop, crop_landmarks)
                embeddings.append(embedding.tolist())

            except Exception as inner_e:
                print(f"[register-person] Failed on image {idx}: {inner_e}")
                continue

        if not embeddings:
            return {
                "ok": False,
                "message": "No valid face images found for registration."
            }

        doc = save_person_profile(
            name=name,
            embeddings=embeddings,
            captured_angles=payload.capturedAngles,
            image_paths=payload.imagePaths,
        )

        return {
            "ok": True,
            "message": "Person registered successfully.",
            "person_id": str(doc["_id"]),
            "name": doc["name"],
            "embedding_count": len(embeddings),
            "captured_angles": doc.get("captured_angles", []),
        }

    except DuplicateName as e:
        return {"ok": False, "message": str(e)}

    except Exception as e:
        print("[register-person] error:", e)
        return {"ok": False, "message": "Registration failed."}


@app.post("/recognize-person")
async def recognize_person(payload: PersonRecognizeRequest):
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {
                "ok": False,
                "message": "Invalid image.",
                "name": None,
                "similarity": None,
    }
        faces = detect_faces_with_landmarks(image)
        largest_face = get_largest_face(faces)

        if largest_face is None:
            return {
                "ok": False,
                "message": "No face detected.",
                "name": None,
                "similarity": None,
            }

        # face_crop = largest_face["crop"]
        # embedding = generate_embedding(face_crop)
        face_crop = largest_face["crop"]
        crop_landmarks = largest_face.get("crop_landmarks")
        embedding = generate_embedding(face_crop, crop_landmarks)

        db_persons = get_all_persons()
        if not db_persons:
            return {
                "ok": False,
                "message": "No registered persons found in database.",
                "name": None,
                "similarity": None,
            }

        match = compare_embedding_to_db(
            emb=embedding,
            db_persons=db_persons,
            threshold=payload.threshold,
        )

        if match is None:
            return {
                "ok": True,
                "message": "No matching person found.",
                "name": None,
                "similarity": None,
                "bbox": largest_face["bbox"],
            }

        matched_name, similarity = match

        return {
            "ok": True,
            "message": "Person recognized successfully.",
            "name": matched_name,
            "similarity": similarity,
            "bbox": largest_face["bbox"],
        }

    except Exception as e:
        print("[recognize-person] error:", e)
        return {
            "ok": False,
            "message": "Recognition failed.",
            "name": None,
            "similarity": None,
        }
    
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
            "clothes_with_color": "/detect-objects-with-color",
            "person_register_base64": "/api/person/register",
            "person_register_base64_legacy": "/api/person/register",
            "person_register_json": "/register-person",
            "person_register_files": "/register-person-files",
            "debug_persons": "/debug/persons",
            "classes": "/classes",
        },
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "assets_dir": _ASSETS_DIR,
        "models_present": {
            "custom_model": os.path.exists(_CUSTOM_MODEL_PATH),
            "coco_model": os.path.exists(_COCO_MODEL_PATH),
            "currency_model": os.path.exists(_CURRENCY_MODEL_PATH),
            "clothes_model": os.path.exists(_CLOTHES_MODEL_PATH),
        },
        "paths": {
            "custom_model_path": _CUSTOM_MODEL_PATH,
            "coco_model_path": _COCO_MODEL_PATH,
            "currency_model_path": _CURRENCY_MODEL_PATH,
            "clothes_model_path": _CLOTHES_MODEL_PATH,
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
async def api_person_register(request: LegacyPersonRegisterRequest):
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
                print(f"[api_person_register] Image {i + 1}: Could not decode")
                continue

            # faces = face_embedding.detect_face_and_crop(image)
            # if not faces:
            #     print(f"[api_person_register] Image {i + 1}: No faces detected")
            #     continue

            # face_crop = faces[0]["crop"]
            # emb = face_embedding.generate_embedding(face_crop)
            # embeddings.append(emb.tolist())
            # print(f"[api_person_register] Image {i + 1}: ✓ Extracted embedding")
            faces = detect_faces_with_landmarks(image)
            if not faces:
                print(f"[api_person_register] Image {i + 1}: No faces detected")
                continue

            largest_face = get_largest_face(faces)
            if largest_face is None:
                print(f"[api_person_register] Image {i + 1}: No usable face found")
                continue

            face_crop = largest_face["crop"]
            crop_landmarks = largest_face.get("crop_landmarks")

            if face_crop.shape[0] < 60 or face_crop.shape[1] < 60:
                print(f"[api_person_register] Image {i + 1}: Face too small")
                continue

            # if face_embedding.is_blurry(face_crop):
            #     print(f"[api_person_register] Image {i + 1}: Blurry face")
            #     continue

            emb = generate_embedding(face_crop, crop_landmarks)
            embeddings.append(emb.tolist())
            print(f"[api_person_register] Image {i + 1}: ✓ Extracted aligned embedding")
        if len(embeddings) == 0:
            return {"success": False, "error": "no_face_detected", "message": "Could not detect faces in any image"}

        try:
            face_database.save_person_profile(name, embeddings)
            return {
                "success": True,
                "name": name,
                "num_embeddings": len(embeddings),
                "message": f"Successfully registered {name}",
            }
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
@app.post("/register-person-files")
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
                print(f"[register] Image {i + 1}: Empty file, skipping")
                continue

            nparr = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                print(f"[register] Image {i + 1}: Invalid image, skipping")
                continue

            # faces = face_embedding.detect_face_and_crop(image)
            # if not faces:
            #     print(f"[register] Image {i + 1}: No faces detected")
            #     continue

            # face_crop = faces[0]["crop"]
            # emb = face_embedding.generate_embedding(face_crop)
            # embeddings.append(emb.tolist())
            # print(f"[register] Image {i + 1}: ✓ Extracted embedding")
            faces = detect_faces_with_landmarks(image)
            if not faces:
                print(f"[register] Image {i + 1}: No faces detected")
                continue

            largest_face = get_largest_face(faces)
            if largest_face is None:
                print(f"[register] Image {i + 1}: No usable face found")
                continue

            face_crop = largest_face["crop"]
            crop_landmarks = largest_face.get("crop_landmarks")

            if face_crop.shape[0] < 60 or face_crop.shape[1] < 60:
                print(f"[register] Image {i + 1}: Face too small")
                continue

            # if face_embedding.is_blurry(face_crop):
            #     print(f"[register] Image {i + 1}: Blurry face")
            #     continue

            emb = generate_embedding(face_crop, crop_landmarks)
            embeddings.append(emb.tolist())
            print(f"[register] Image {i + 1}: ✓ Extracted aligned embedding")
        if len(embeddings) == 0:
            raise HTTPException(status_code=400, detail="Could not extract embeddings. Make sure faces are clearly visible.")

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
async def object_navigation_detect(file: UploadFile = File(...), confidence: float = 0.5):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        h, w = image.shape[:2]
        max_dim = 640
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            image = cv2.resize(image, (int(w * scale), int(h * scale)))
            h, w = image.shape[:2]

        detections: List[dict] = []
        persons_result: List[dict] = []
        tts_messages: List[str] = []

        try:
            db_persons = face_database.get_all_persons()
            print(f"[nav] Loaded {len(db_persons)} persons from DB")
        except Exception:
            traceback.print_exc()
            db_persons = []

        detector = _get_object_detector()
        ok, buf = cv2.imencode(".jpg", image)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to encode image")

        det_result = detector.detect_objects(
            buf.tobytes(),
            custom_conf=0.45,   # was 0.50 — raises bar for roti ki dalya etc.
            coco_conf=0.55      # was 0.50 — raises bar for person specifically
        )
        person_boxes: List[Tuple[int, int, int, int]] = []

        for d in det_result.get("detections", []):
            bbox = d.get("bbox", {})
            x1 = int(bbox.get("x1", 0))
            y1 = int(bbox.get("y1", 0))
            x2 = int(bbox.get("x2", 0))
            y2 = int(bbox.get("y2", 0))
            cls_name = d.get("class", "unknown")
            confv = float(d.get("confidence", 0.0))

            x1 = max(0, min(w - 1, x1))
            x2 = max(0, min(w - 1, x2))
            y1 = max(0, min(h - 1, y1))
            y2 = max(0, min(h - 1, y2))
            if x2 <= x1 or y2 <= y1:
                continue

            detections.append({
                "x1": float(x1), "y1": float(y1),
                "x2": float(x2), "y2": float(y2),
                "confidence": confv,
                "class_name": cls_name,
            })

            if isinstance(cls_name, str) and cls_name.lower() == "person":
                person_boxes.append((x1, y1, x2, y2))

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
                    #emb = face_embedding.generate_embedding(crop)
                    emb = face_embedding.generate_embedding(crop, f.get("crop_landmarks"))
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

        def _speak_async(messages):
            for msg in messages[:3]:
                try:
                    tts.speak(msg)
                except Exception:
                    pass

        threading.Thread(target=_speak_async, args=(tts_messages,), daemon=True).start()

        # immediately returns without waiting for speech
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

        if hasattr(detector, "detect_currency"):
            results = detector.detect_currency(image_bytes, conf_threshold=confidence)
        else:
            raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_currency()")

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

        if hasattr(detector, "detect_and_draw"):
            annotated = detector.detect_and_draw(image_bytes, conf_threshold=confidence)
        else:
            raise HTTPException(status_code=500, detail="CurrencyDetector missing detect_and_draw()")

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
# async def detect_color_simple(file: UploadFile = File(...)):
#     try:
#         image_bytes = await file.read()
#         if not image_bytes:
#             raise HTTPException(status_code=400, detail="Empty file")

#         detector = _get_color_detector()
#         result = detector.detect_color_simple(image_bytes)

#         return {"success": True, "mode": "color_detection_simple", "data": result, "tts_message": result.get("description")}

#     except HTTPException:
#         raise
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

def detect_color_simple(self, image_bytes, bbox=None, history_key="default"):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image.thumbnail((640, 640))
    image_np = np.array(image)

    if bbox is not None:
        region = self._crop_to_box(image_np, bbox)
        if region is None:
            return None
        region = self._extract_inner_region(region, shrink_ratio=0.35, drop_top_ratio=0.12)
    else:
        region = self._extract_center_region(image_np)

    filtered_pixels = self._extract_reliable_pixels(region)
    rgb = self._get_dominant_rgb(filtered_pixels, max_clusters=3)

    dark_override = self._force_dark_override(filtered_pixels)
    if dark_override is not None:
        raw_color = dark_override
    else:
        raw_color = self._get_simple_color_name(rgb, pixels=filtered_pixels)

    # Keep history only for debugging / optional future use,
    # but do NOT let history change the current frame's label.
    history = self.color_history[history_key]
    history.append(raw_color)
    stable_color = Counter(history).most_common(1)[0][0]

    return {
        "rgb": rgb,
        "hex": self._rgb_to_hex(rgb),
        "name": raw_color,          # <-- FIX: keep name tied to current rgb/hex
        "raw_name": raw_color,
        "stable_name": stable_color,
        "used_bbox": bbox is not None
    }


# ================================================================
# MODE 4: Object Detection
# ================================================================
@app.post("/detect-objects")
async def detect_objects(file: UploadFile = File(...), confidence: float = 0.45):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_object_detector()
        results = detector.detect_objects(
        contents,
        custom_conf=confidence,   # ← was conf_threshold=confidence
        coco_conf=confidence      # ← add this
    )

        return JSONResponse({"success": True, **results})

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-objects-annotated")
async def detect_objects_annotated(file: UploadFile = File(...), confidence: float = 0.45):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        detector = _get_object_detector()
        annotated = detector.detect_and_draw(
        contents,
        custom_conf=confidence,   # ← was conf_threshold=confidence
        coco_conf=confidence      # ← add this
    )

        return StreamingResponse(io.BytesIO(annotated), media_type="image/png")

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# MODE 5: Clothes + Color using TFLite
# ================================================================
# @app.post("/detect-objects-with-color")
# async def detect_objects_with_color(file: UploadFile = File(...), confidence: float = 0.25):
#     try:
#         image_bytes = await file.read()
#         if not image_bytes:
#             raise HTTPException(status_code=400, detail="Empty file")

#         nparr = np.frombuffer(image_bytes, dtype=np.uint8)
#         image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#         if image is None:
#             raise HTTPException(status_code=400, detail="Invalid image")

#         h, w = image.shape[:2]

#         def _normalize_clothes_label(label: str) -> str:
#             normalized = str(label or "").strip().lower().replace("_", " ")
#             label_map = {
#                 "trouser": "shalwar",
#                 "trousers": "shalwar",
#                 "pants": "shalwar",
#                 "pant": "shalwar",
#                 "scarf": "dupatta",
#             }
#             return label_map.get(normalized, normalized)

#         def _bbox_iou(a: dict, b: dict) -> float:
#             ax1, ay1, ax2, ay2 = a["bbox"]["x1"], a["bbox"]["y1"], a["bbox"]["x2"], a["bbox"]["y2"]
#             bx1, by1, bx2, by2 = b["bbox"]["x1"], b["bbox"]["y1"], b["bbox"]["x2"], b["bbox"]["y2"]
#             inter_x1 = max(ax1, bx1)
#             inter_y1 = max(ay1, by1)
#             inter_x2 = min(ax2, bx2)
#             inter_y2 = min(ay2, by2)
#             iw = max(0, inter_x2 - inter_x1)
#             ih = max(0, inter_y2 - inter_y1)
#             inter = iw * ih
#             area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
#             area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
#             union = area_a + area_b - inter
#             return (inter / union) if union > 0 else 0.0

#         def _dedupe_same_class(items: list, iou_threshold: float = 0.75) -> list:
#             kept = []
#             for det in sorted(items, key=lambda d: d["confidence"], reverse=True):
#                 duplicate = False
#                 for prev in kept:
#                     if prev["class_name"] == det["class_name"] and _bbox_iou(prev, det) > iou_threshold:
#                         duplicate = True
#                         break
#                 if not duplicate:
#                     kept.append(det)
#             return kept

#         def _apply_dupatta_shalwar_rules(items: list, image_h: int) -> list:
#             if image_h <= 0:
#                 return items

#             dupatta = [d for d in items if d["class_name"] == "dupatta"]
#             shalwar = [d for d in items if d["class_name"] == "shalwar"]

#             if dupatta and shalwar:
#                 top_dupatta = max(dupatta, key=lambda d: d["confidence"])
#                 top_shalwar = max(shalwar, key=lambda d: d["confidence"])
#                 if top_dupatta["_y_center"] > top_shalwar["_y_center"]:
#                     top_dupatta["class_name"], top_shalwar["class_name"] = top_shalwar["class_name"], top_dupatta["class_name"]
#                     top_dupatta["class_id"], top_shalwar["class_id"] = top_shalwar["class_id"], top_dupatta["class_id"]

#             for d in items:
#                 y_ratio = d["_y_center"] / image_h
#                 box_w = d["bbox"]["x2"] - d["bbox"]["x1"]
#                 box_h = d["bbox"]["y2"] - d["bbox"]["y1"]
#                 aspect = (box_w / box_h) if box_h > 0 else 0.0
#                 if d["class_name"] == "dupatta" and y_ratio > 0.68 and aspect < 1.2 and d["confidence"] < 0.72:
#                     d["class_name"] = "shalwar"
#                 elif d["class_name"] == "shalwar" and y_ratio < 0.52 and aspect > 1.25 and d["confidence"] < 0.72:
#                     d["class_name"] = "dupatta"

#             return items

#         def _inner_crop_coords(x1: int, y1: int, x2: int, y2: int, pad_ratio: float = 0.12):
#             bw = x2 - x1
#             bh = y2 - y1
#             padx = int(bw * pad_ratio)
#             pady = int(bh * pad_ratio)
#             cx1 = min(max(0, x1 + padx), w - 1)
#             cy1 = min(max(0, y1 + pady), h - 1)
#             cx2 = min(max(0, x2 - padx), w - 1)
#             cy2 = min(max(0, y2 - pady), h - 1)
#             if cx2 <= cx1 or cy2 <= cy1:
#                 return x1, y1, x2, y2
#             return cx1, cy1, cx2, cy2

#         clothes_model = _get_clothes_detector()
#         effective_conf = max(float(confidence), 0.3)

#         interpreter = clothes_model["interpreter"]
#         input_details = clothes_model["input_details"]
#         output_details = clothes_model["output_details"]
#         input_shape = clothes_model["input_shape"]
#         input_dtype = clothes_model["input_dtype"]

#         #input_tensor, scale_x, scale_y = _preprocess_clothes_image(image, input_shape, input_dtype)
#         input_tensor = _preprocess_clothes_image(image, input_shape, input_dtype)
        
#         interpreter.set_tensor(input_details[0]["index"], input_tensor)
#         interpreter.invoke()

#         output = interpreter.get_tensor(output_details[0]["index"])

#         print("input shape:", input_shape)
#         print("input dtype:", input_dtype)
#         print("output shape:", output.shape)
#         print("output dtype:", output.dtype)
#         print("first 20 values:", output.flatten()[:20])

#         # raw_detections = _parse_tflite_output(
#         #     output=output,
#         #     class_names=CLOTHES_CLASS_NAMES,
#         #     conf_threshold=effective_conf,
#         #     scale_x=scale_x,
#         #     scale_y=scale_y,
#         # )
#         raw_detections = _parse_tflite_output(
#             output=output,
#             class_names=CLOTHES_CLASS_NAMES,
#             conf_threshold=effective_conf,
#             orig_w=w,
#             orig_h=h,
#         )

#         color_detector = _get_color_detector()
#         detections = []

#         for det in raw_detections:
#             x1, y1, x2, y2 = map(int, det["bbox"])
#             cls_id = int(det["class_id"])
#             confv = float(det["confidence"])
#             raw_cls_name = det["class_name"]
#             cls_name = _normalize_clothes_label(raw_cls_name)

#             x1 = max(0, min(w - 1, x1))
#             x2 = max(0, min(w - 1, x2))
#             y1 = max(0, min(h - 1, y1))
#             y2 = max(0, min(h - 1, y2))
#             if x2 <= x1 or y2 <= y1:
#                 continue

#             if cls_name == "dupatta" and confv < 0.28:
#                 continue
#             if cls_name == "shalwar" and confv < 0.33:
#                 continue

#             cx1, cy1, cx2, cy2 = _inner_crop_coords(x1, y1, x2, y2)
#             crop = image[cy1:cy2, cx1:cx2]
#             if crop.size == 0:
#                 continue

#             if (cx2 - cx1) * (cy2 - cy1) < 32 * 32:
#                 color_result = {"name": "Unknown", "hex": None, "description": None}
#             else:
#                 ok, buf = cv2.imencode(".jpg", crop)
#                 color_result = color_detector.detect_color_simple(buf.tobytes()) if ok else {"name": "Unknown"}

#             color_name = color_result.get("name") or color_result.get("color_name") or "Unknown"

#             detections.append({
#                 "class_name": cls_name,
#                 "class_id": cls_id,
#                 "confidence": confv,
#                 "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                 "color": {"name": color_name, "hex": color_result.get("hex"), "raw": color_result},
#                 "_y_center": (y1 + y2) / 2.0,
#             })

#         detections = _dedupe_same_class(detections)
#         detections = _apply_dupatta_shalwar_rules(detections, h)
#         detections.sort(key=lambda d: d["confidence"], reverse=True)
#         for d in detections:
#             d.pop("_y_center", None)

#         print("num raw detections:", len(raw_detections))
#         print("first 5 raw detections:", raw_detections[:5])
#         print("final detections:", detections[:5])

#         # tts_messages = [f"{d['color']['name']} {d['class_name']}" for d in detections[:3]]
#         tts_messages = [d["color"]["name"] for d in detections[:3]]
#         return {
#             "success": True,
#             "mode": "clothes_with_color",
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
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        nparr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        h, w = image.shape[:2]

        def _normalize_clothes_label(label: str) -> str:
            normalized = str(label or "").strip().lower().replace("_", " ")
            label_map = {
                "trouser": "shalwar",
                "trousers": "shalwar",
                "pants": "shalwar",
                "pant": "shalwar",
                "scarf": "dupatta",
            }
            return label_map.get(normalized, normalized)

        def _bbox_iou(a: dict, b: dict) -> float:
            ax1, ay1, ax2, ay2 = a["bbox"]["x1"], a["bbox"]["y1"], a["bbox"]["x2"], a["bbox"]["y2"]
            bx1, by1, bx2, by2 = b["bbox"]["x1"], b["bbox"]["y1"], b["bbox"]["x2"], b["bbox"]["y2"]
            inter_x1 = max(ax1, bx1)
            inter_y1 = max(ay1, by1)
            inter_x2 = min(ax2, bx2)
            inter_y2 = min(ay2, by2)
            iw = max(0, inter_x2 - inter_x1)
            ih = max(0, inter_y2 - inter_y1)
            inter = iw * ih
            area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
            area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
            union = area_a + area_b - inter
            return (inter / union) if union > 0 else 0.0

        def _dedupe_same_class(items: list, iou_threshold: float = 0.75) -> list:
            kept = []
            for det in sorted(items, key=lambda d: d["confidence"], reverse=True):
                duplicate = False
                for prev in kept:
                    if prev["class_name"] == det["class_name"] and _bbox_iou(prev, det) > iou_threshold:
                        duplicate = True
                        break
                if not duplicate:
                    kept.append(det)
            return kept

        def _apply_dupatta_shalwar_rules(items: list, image_h: int) -> list:
            if image_h <= 0:
                return items

            dupatta = [d for d in items if d["class_name"] == "dupatta"]
            shalwar = [d for d in items if d["class_name"] == "shalwar"]

            if dupatta and shalwar:
                top_dupatta = max(dupatta, key=lambda d: d["confidence"])
                top_shalwar = max(shalwar, key=lambda d: d["confidence"])
                if top_dupatta["_y_center"] > top_shalwar["_y_center"]:
                    top_dupatta["class_name"], top_shalwar["class_name"] = top_shalwar["class_name"], top_dupatta["class_name"]
                    top_dupatta["class_id"], top_shalwar["class_id"] = top_shalwar["class_id"], top_dupatta["class_id"]

            for d in items:
                y_ratio = d["_y_center"] / image_h
                box_w = d["bbox"]["x2"] - d["bbox"]["x1"]
                box_h = d["bbox"]["y2"] - d["bbox"]["y1"]
                aspect = (box_w / box_h) if box_h > 0 else 0.0
                if d["class_name"] == "dupatta" and y_ratio > 0.68 and aspect < 1.2 and d["confidence"] < 0.72:
                    d["class_name"] = "shalwar"
                elif d["class_name"] == "shalwar" and y_ratio < 0.52 and aspect > 1.25 and d["confidence"] < 0.72:
                    d["class_name"] = "dupatta"

            return items

        def _inner_crop_coords(x1: int, y1: int, x2: int, y2: int, pad_ratio: float = 0.12):
            bw = x2 - x1
            bh = y2 - y1
            padx = int(bw * pad_ratio)
            pady = int(bh * pad_ratio)
            cx1 = min(max(0, x1 + padx), w - 1)
            cy1 = min(max(0, y1 + pady), h - 1)
            cx2 = min(max(0, x2 - padx), w - 1)
            cy2 = min(max(0, y2 - pady), h - 1)
            if cx2 <= cx1 or cy2 <= cy1:
                return x1, y1, x2, y2
            return cx1, cy1, cx2, cy2

        clothes_model = _get_clothes_detector()
        effective_conf = max(float(confidence), 0.3)

        interpreter = clothes_model["interpreter"]
        input_details = clothes_model["input_details"]
        output_details = clothes_model["output_details"]
        input_shape = clothes_model["input_shape"]
        input_dtype = clothes_model["input_dtype"]

        input_tensor = _preprocess_clothes_image(image, input_shape, input_dtype)

        interpreter.set_tensor(input_details[0]["index"], input_tensor)
        interpreter.invoke()

        output = interpreter.get_tensor(output_details[0]["index"])

        raw_detections = _parse_tflite_output(
            output=output,
            class_names=CLOTHES_CLASS_NAMES,
            conf_threshold=effective_conf,
            orig_w=w,
            orig_h=h,
        )

        color_detector = _get_color_detector()
        detections = []

        for det in raw_detections:
            x1, y1, x2, y2 = map(int, det["bbox"])
            cls_id = int(det["class_id"])
            confv = float(det["confidence"])
            raw_cls_name = det["class_name"]
            cls_name = _normalize_clothes_label(raw_cls_name)

            x1 = max(0, min(w - 1, x1))
            x2 = max(0, min(w - 1, x2))
            y1 = max(0, min(h - 1, y1))
            y2 = max(0, min(h - 1, y2))
            if x2 <= x1 or y2 <= y1:
                continue

            if cls_name == "dupatta" and confv < 0.28:
                continue
            if cls_name == "shalwar" and confv < 0.33:
                continue

            cx1, cy1, cx2, cy2 = _inner_crop_coords(x1, y1, x2, y2)
            crop = image[cy1:cy2, cx1:cx2]
            if crop.size == 0:
                continue

            if (cx2 - cx1) * (cy2 - cy1) < 32 * 32:
                color_result = {
                    "name": "Unknown",
                    "hex": None,
                    "visible_colors": [],
                }
            else:
                ok, buf = cv2.imencode(".jpg", crop)
                color_result = (
                    color_detector.detect_color_simple(
                        buf.tobytes(),
                        history_key=f"{cls_name}_{x1}_{y1}_{x2}_{y2}",
                        max_colors=5,
                    )
                    if ok else
                    {"name": "Unknown", "hex": None, "visible_colors": []}
                )

            color_name = color_result.get("name") or "Unknown"
            visible_colors = color_result.get("visible_colors", [])

            detections.append({
                "class_name": cls_name,
                "class_id": cls_id,
                "confidence": confv,
                "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "color": {
                    "name": color_name,
                    "hex": color_result.get("hex"),
                    "visible_colors": visible_colors,
                    "raw": color_result,
                },
                "_y_center": (y1 + y2) / 2.0,
            })

        detections = _dedupe_same_class(detections)
        detections = _apply_dupatta_shalwar_rules(detections, h)
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        for d in detections:
            d.pop("_y_center", None)

        print("num raw detections:", len(raw_detections))
        print("first 5 raw detections:", raw_detections[:5])
        print("final detections:", detections[:5])

        tts_messages = []
        for d in detections[:3]:
            color_list = d["color"].get("visible_colors", [])
            color_names = [c["name"] for c in color_list[:5] if c.get("name")]
            if color_names:
                msg = ", ".join(color_names)
            else:
                msg = d["color"].get("name", "Unknown")
            tts_messages.append(msg)

        return {
            "success": True,
            "mode": "clothes_with_color",
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
# Utility Endpoints
# ================================================================
@app.get("/classes")
async def get_classes():
    detector = _get_object_detector()
    currency = _get_currency_detector()

    currency_classes = []
    if hasattr(currency, "class_names"):
        try:
            currency_classes = list(currency.class_names.values())
        except Exception:
            currency_classes = []

    return {
        "currency_classes": currency_classes,
        "custom_object_classes": list(getattr(detector, "custom_classes", {}).values()),
        "coco_object_classes": list(WANTED_COCO_CLASSES.values()),
        "clothes_classes": list(CLOTHES_CLASS_NAMES.values()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

