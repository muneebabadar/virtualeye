# # from ultralytics import YOLO
# # import numpy as np
# # from PIL import Image
# # import io

# # class ObjectDetector:
# #     def __init__(self, model_path='assets/yolov8n.pt'):

# #         """Initialize YOLOv8 object detector with COCO pretrained model"""
# #         self.model = YOLO(model_path)
# #         # COCO class names
# #         self.class_names = self.model.names
        
# #     def detect_objects(self, image_bytes, conf_threshold=0.25):
# #         """
# #         Detect objects in an image
        
# #         Args:
# #             image_bytes: Image as bytes
# #             conf_threshold: Confidence threshold for detections (0-1)
            
# #         Returns:
# #             dict: Detection results with bounding boxes, classes, and confidences
# #         """
# #         # Convert bytes to PIL Image
# #         image = Image.open(io.BytesIO(image_bytes))
        
# #         # Convert PIL to numpy array
# #         image_np = np.array(image)
        
# #         # Run inference
# #         results = self.model(image_np, conf=conf_threshold)
        
# #         detections = []
# #         image_width, image_height = image.width, image.height
# #         image_area = image_width * image_height

# #         for result in results:
# #             for box in result.boxes:
# #                 x1, y1, x2, y2 = box.xyxy[0].tolist()
# #                 confidence = float(box.conf[0])
# #                 class_id = int(box.cls[0])
# #                 class_name = self.class_names[class_id]

# #                 x_center = (x1 + x2) / 2
# #                 box_area = (x2 - x1) * (y2 - y1)

# #                 detections.append({
# #                     "class": class_name,
# #                     "confidence": confidence,
# #                     "bbox": {
# #                         "x1": x1,
# #                         "y1": y1,
# #                         "x2": x2,
# #                         "y2": y2
# #                     },
# #                     "position": horizontal_position(x_center, image_width),
# #                     "distance": estimate_distance(box_area, image_area),
# #                     "priority": PRIORITY_MAP.get(class_name, 4)
# #                 })

# #         # sort detections by priority before returning
# #         detections.sort(key=lambda d: d["priority"])

# #         return {
# #             'detections': detections,
# #             'count': len(detections),
# #             'image_size': {
# #                 'width': image.width,
# #                 'height': image.height
# #             }
# #         }
    
# #     def detect_and_draw(self, image_bytes, conf_threshold=0.25):
# #         """
# #         Detect objects and return annotated image
        
# #         Args:
# #             image_bytes: Image as bytes
# #             conf_threshold: Confidence threshold for detections
            
# #         Returns:
# #             bytes: Annotated image as bytes
# #         """
# #         # Convert bytes to PIL Image
# #         # image = Image.open(io.BytesIO(image_bytes))
# #         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

# #         image_np = np.array(image)
        
# #         # Run inference
# #         results = self.model(image_np, conf=conf_threshold)
        
# #         # Draw annotations
# #         # annotated_img = results[0].plot()
# #         annotated_img = results[0].plot() if len(results) > 0 else image_np

        
# #         # Convert back to bytes
# #         annotated_pil = Image.fromarray(annotated_img)
# #         img_byte_arr = io.BytesIO()
# #         annotated_pil.save(img_byte_arr, format='PNG')
# #         img_byte_arr.seek(0)
        
# #         return img_byte_arr.getvalue()
    
# # def horizontal_position(x_center, img_width):
# #     if x_center < img_width * 0.33:
# #         return "left"
# #     elif x_center > img_width * 0.66:
# #         return "right"
# #     return "center"


# # def estimate_distance(box_area, img_area):
# #     ratio = box_area / img_area
# #     if ratio > 0.20:
# #         return "very_close"
# #     elif ratio > 0.08:
# #         return "close"
# #     elif ratio > 0.03:
# #         return "medium"
# #     return "far"


# # PRIORITY_MAP = {
# #     "stairs": 1,
# #     "car": 1,
# #     "bicycle": 1,
# #     "person": 2,
# #     "chair": 3,
# #     "table": 3,
# # }

# from ultralytics import YOLO
# import numpy as np
# from PIL import Image
# import io

# WANTED_COCO_CLASSES = {
#     0: 'person',
#     56: 'chair',
#     57: 'couch',
#     59: 'bed',
#     60: 'dining table',
#     58: 'potted plant',
#     13: 'bench',
#     61: 'toilet',
#     71: 'sink',
#     72: 'refrigerator',
#     68: 'microwave',
#     69: 'oven',
#     70: 'toaster',
#     62: 'tv',
#     63: 'laptop',
#     64: 'mouse',
#     65: 'remote',
#     66: 'keyboard',
#     67: 'cell phone',
#     39: 'bottle',
#     40: 'wine glass',
#     41: 'cup',
#     42: 'fork',
#     43: 'knife',
#     44: 'spoon',
#     45: 'bowl',
#     73: 'book',
#     74: 'clock',
#     75: 'vase',
#     76: 'scissors',
#     79: 'toothbrush',
#     24: 'backpack',
#     28: 'suitcase',
# }

# PRIORITY_MAP = {
#     "stairs": 1,
#     "car": 1,
#     "bicycle": 1,
#     "person": 2,
#     "chair": 3,
#     "table": 3,
# }

# class ObjectDetector:
#     def __init__(self,
#                  custom_model_path='assets/washroom_kitchen_only.pt',
#                  coco_model_path='assets/yolov8n.pt'):

#         """Initialize YOLOv8 object detector with COCO pretrained model"""
#         self.custom_model = YOLO(custom_model_path)
#         self.coco_model = YOLO(coco_model_path)

#         self.custom_classes = self.custom_model.names
#         self.coco_classes = self.coco_model.names

#     def detect_objects(self, image_bytes, conf_threshold=0.25):
#         """
#         Detect objects in an image
        
#         Args:
#             image_bytes: Image as bytes
#             conf_threshold: Confidence threshold for detections (0-1)
            
#         Returns:
#             dict: Detection results with bounding boxes, classes, and confidences
#         """
#         # Convert bytes to PIL Image
#         image = Image.open(io.BytesIO(image_bytes))
        
#         # Convert PIL to numpy array
#         image_np = np.array(image)
        
#         detections = []
#         image_width, image_height = image.width, image.height
#         image_area = image_width * image_height

#         # Run custom model
#         custom_results = self.custom_model(image_np, conf=conf_threshold)
#         for result in custom_results:
#             for box in result.boxes:
#                 x1, y1, x2, y2 = box.xyxy[0].tolist()
#                 confidence = float(box.conf[0])
#                 class_id = int(box.cls[0])
#                 class_name = self.custom_classes[class_id]

#                 x_center = (x1 + x2) / 2
#                 box_area = (x2 - x1) * (y2 - y1)

#                 detections.append({
#                     "class": class_name,
#                     "confidence": confidence,
#                     "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "position": horizontal_position(x_center, image_width),
#                     "distance": estimate_distance(box_area, image_area),
#                     "priority": PRIORITY_MAP.get(class_name, 4)
#                 })

#         # Run COCO model
#         coco_results = self.coco_model(image_np, conf=conf_threshold)
#         for result in coco_results:
#             for box in result.boxes:
#                 class_id = int(box.cls[0])
#                 if class_id not in WANTED_COCO_CLASSES:
#                     continue
#                 x1, y1, x2, y2 = box.xyxy[0].tolist()
#                 confidence = float(box.conf[0])
#                 class_name = self.coco_classes[class_id]

#                 x_center = (x1 + x2) / 2
#                 box_area = (x2 - x1) * (y2 - y1)

#                 detections.append({
#                     "class": class_name,
#                     "confidence": confidence,
#                     "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "position": horizontal_position(x_center, image_width),
#                     "distance": estimate_distance(box_area, image_area),
#                     "priority": PRIORITY_MAP.get(class_name, 4)
#                 })

#         # sort detections by priority before returning
#         detections.sort(key=lambda d: d["priority"])

#         return {
#             'detections': detections,
#             'count': len(detections),
#             'image_size': {
#                 'width': image.width,
#                 'height': image.height
#             }
#         }
    
#     def detect_and_draw(self, image_bytes, conf_threshold=0.25):
#         """
#         Detect objects and return annotated image
        
#         Args:
#             image_bytes: Image as bytes
#             conf_threshold: Confidence threshold for detections
            
#         Returns:
#             bytes: Annotated image as bytes
#         """
#         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#         image_np = np.array(image)

#         # Run custom model and draw
#         custom_results = self.custom_model(image_np, conf=conf_threshold)
#         annotated_img = custom_results[0].plot() if len(custom_results) > 0 else image_np

#         # Run COCO model and draw on top
#         from ultralytics.utils.plotting import Annotator
#         coco_results = self.coco_model(annotated_img, conf=conf_threshold)
#         annotator = Annotator(annotated_img)
#         for result in coco_results:
#             for box in result.boxes:
#                 class_id = int(box.cls[0])
#                 if class_id not in WANTED_COCO_CLASSES:
#                     continue
#                 xyxy = box.xyxy[0].tolist()
#                 conf = float(box.conf[0])
#                 label = f"{WANTED_COCO_CLASSES[class_id]} {conf:.2f}"
#                 annotator.box_label(xyxy, label)
#         annotated_img = annotator.result()

#         # Convert back to bytes
#         annotated_pil = Image.fromarray(annotated_img)
#         img_byte_arr = io.BytesIO()
#         annotated_pil.save(img_byte_arr, format='PNG')
#         img_byte_arr.seek(0)
        
#         return img_byte_arr.getvalue()
    

# def horizontal_position(x_center, img_width):
#     if x_center < img_width * 0.33:
#         return "left"
#     elif x_center > img_width * 0.66:
#         return "right"
#     return "center"


# def estimate_distance(box_area, img_area):
#     ratio = box_area / img_area
#     if ratio > 0.20:
#         return "very_close"
#     elif ratio > 0.08:
#         return "close"
#     elif ratio > 0.03:
#         return "medium"
#     return "far"
import numpy as np
from PIL import Image
import io
import tensorflow as tf
import hashlib

WANTED_COCO_CLASSES = {
    0: 'person',
    56: 'chair',
    57: 'couch',
    59: 'bed',
    60: 'dining table',
    61: 'toilet',
    71: 'sink',
    72: 'refrigerator',
    68: 'microwave',
    69: 'oven',
    62: 'tv',
    63: 'laptop',
    65: 'remote',
    66: 'keyboard',
    67: 'cell phone',
    39: 'bottle',
    41: 'cup',
    42: 'fork',
    43: 'knife',
    44: 'spoon',
    45: 'bowl',
    73: 'book',
    74: 'clock',
    76: 'scissors',
    79: 'toothbrush',
    24: 'backpack',
}

# Fix — align with your actual classes
PRIORITY_MAP = {
    # Priority 1 — immediate danger, announce first
    "stairs":           1,
    "door":             1,
    "gas cylinder":     1,

    # Priority 2 — nearby people/obstacles
    "person":           2,

    # Priority 3 — common navigation objects
    "bucket":           3,
    "pedestal fan":     3,
    "charpai":          3,
    "water gallon":     3,

}

# Add this near your PRIORITY_MAP
PER_CLASS_CONF = {
    # COCO — keep high (lots of training data, very confident)
    "person":           0.70,
    "tawwa":            0.6,
    # Custom — safety critical, keep low

    "stairs":           0.35,
    "door":             0.35,
    "chair":            0.35,
    "gas cylinder":     0.35,   # ← was 0.45, lower it

    # Custom — was detecting late, lower these
    "stove":            0.35,
    "microwave":        0.35,
    "refrigerator":     0.35,
    
    "water dispenser":  0.35,
    "pateela":          0.38,
    "hotpot":           0.38,
    "kettle":           0.38,

    # Custom — were false firing, keep high
    "bowl":             0.70,
    "roti ki dalya":    0.70,
    "charpai":          0.65,
    "hawan Dasta":      0.65,
    
}
DEFAULT_CONF = 0.50

CUSTOM_CLASS_NAMES = {
    0:  'bucket',
    1:  'charpai',
    2:  'door',
    3:  'gas cylinder',
    4:  'hairbrush',
    5:  'hawan Dasta',
    6:  'hotpot',
    7:  'kettle',
    8:  'mug',
    9:  'muslim_shower',
    10: 'pateela',
    11: 'pedestal fan',
    12: 'pressure cooker',
    13: 'roti ki dalya',
    14: 'shower',
    15: 'sinc',
    16: 'stairs',
    17: 'stove',
    18: 'tap',
    19: 'tawwa',
    20: 'toilet',
    21: 'water dispenser',
    22: 'water gallon',
}

class TFLiteModel:
    """Wrapper for a single TFLite model"""
    def __init__(self, model_path):
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()

        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        # Get expected input shape: [1, H, W, C]
        self.input_shape = self.input_details[0]['shape']
        self.input_h = self.input_shape[1]
        self.input_w = self.input_shape[2]
        self.is_int8 = self.input_details[0]['dtype'] == np.uint8

    def preprocess(self, image_np):
        """Resize and normalize image for TFLite input"""
        img = Image.fromarray(image_np).resize((self.input_w, self.input_h))
        img = np.array(img, dtype=np.float32)

        if self.is_int8:
            # INT8 model expects uint8 input
            img = np.clip(img, 0, 255).astype(np.uint8)
        else:
            img /= 255.0  # normalize to [0, 1]

        return np.expand_dims(img, axis=0)  # add batch dim

    def run(self, image_np):
        """Run inference and return raw output"""
        input_data = self.preprocess(image_np)
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()

        # YOLO TFLite output: [1, num_detections, 6] (x1,y1,x2,y2,conf,class)
        output = self.interpreter.get_tensor(self.output_details[0]['index'])
        return output[0]  # shape: (num_detections, 6)


class ObjectDetector:
    def __init__(self,
                 custom_model_path='assets/final_object_detection.tflite',
                 coco_model_path='assets/coco_yolo26n_int8.tflite'):

        self.custom_model = TFLiteModel(custom_model_path)
        self.coco_model = TFLiteModel(coco_model_path)
        
        # ── Frame hash caching (skip redundant inference) ────────────────────────
        self._last_hash = None
        self._last_result = None

    def _parse_detections(self, raw_output, class_names, conf_threshold,
                       image_width, image_height, wanted_classes=None):
        image_area = image_width * image_height
        detections = []

        for det in raw_output:
            x1, y1, x2, y2, confidence, class_id = det
            class_id = int(class_id)

            if confidence < conf_threshold:
                continue

            if wanted_classes is not None and class_id not in wanted_classes:
                continue

            class_name = class_names.get(class_id, f"class_{class_id}")

            # ── Per-class threshold override ──────────────────────────────────────
            required_conf = PER_CLASS_CONF.get(class_name, DEFAULT_CONF)
            if confidence < required_conf:
                continue

            # Denormalize
            x1 = float(x1) * image_width
            y1 = float(y1) * image_height
            x2 = float(x2) * image_width
            y2 = float(y2) * image_height

            x_center = (x1 + x2) / 2
            box_area = (x2 - x1) * (y2 - y1)

            detections.append({
                "class":      class_name,
                "confidence": float(confidence),
                "bbox":       {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "position":   horizontal_position(x_center, image_width),
                "distance":   estimate_distance(box_area, image_area),
                "priority":   PRIORITY_MAP.get(class_name, 4)
            })

        return detections

    def detect_objects(self, image_bytes,
                   custom_conf=0.45,
                   coco_conf=0.50):

        # ── Quick hash check — if frame barely changed, return cached result ─────
        frame_hash = hashlib.md5(image_bytes[:2048]).hexdigest()  # only hash first 2KB
        
        if frame_hash == self._last_hash and self._last_result:
            return self._last_result  # instant return, no inference

        self._last_hash = frame_hash

    # ── These lines must be inside the function ───────────────────────────────
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)
        image_width, image_height = image.width, image.height

        detections = []

        # Run custom model
        custom_output = self.custom_model.run(image_np)
        detections += self._parse_detections(
            custom_output, CUSTOM_CLASS_NAMES,
            custom_conf, image_width, image_height
        )

        # Run COCO model
        coco_output = self.coco_model.run(image_np)
        detections += self._parse_detections(
            coco_output, WANTED_COCO_CLASSES,
            coco_conf, image_width, image_height,
            wanted_classes=set(WANTED_COCO_CLASSES.keys())
        )

        detections.sort(key=lambda d: d["priority"])

        result = {
            'detections': detections,
            'count': len(detections),
            'image_size': {'width': image_width, 'height': image_height}
        }
        
        self._last_result = result
        return result

    def detect_and_draw(self, image_bytes, custom_conf=0.45, coco_conf=0.50):
        import cv2

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)
        image_width, image_height = image.width, image.height

        result = self.detect_objects(image_bytes, custom_conf, coco_conf)

        # Draw boxes
        annotated = image_np.copy()
        for det in result['detections']:
            b = det['bbox']
            x1, y1, x2, y2 = int(b['x1']), int(b['y1']), int(b['x2']), int(b['y2'])
            label = f"{det['class']} {det['confidence']:.2f}"
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, label, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        annotated_pil = Image.fromarray(annotated)
        img_byte_arr = io.BytesIO()
        annotated_pil.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        return img_byte_arr.getvalue()


def horizontal_position(x_center, img_width):
    if x_center < img_width * 0.33:
        return "left"
    elif x_center > img_width * 0.66:
        return "right"
    return "center"


def estimate_distance(box_area, img_area):
    ratio = box_area / img_area
    if ratio > 0.20:
        return "very_close"
    elif ratio > 0.08:
        return "close"
    elif ratio > 0.03:
        return "medium"
    return "far"