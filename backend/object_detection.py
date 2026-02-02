from ultralytics import YOLO
import numpy as np
from PIL import Image
import io

class ObjectDetector:
    def __init__(self, model_path='assets/yolov8n.pt'):

        """Initialize YOLOv8 object detector with COCO pretrained model"""
        self.model = YOLO(model_path)
        # COCO class names
        self.class_names = self.model.names
        
    def detect_objects(self, image_bytes, conf_threshold=0.25):
        """
        Detect objects in an image
        
        Args:
            image_bytes: Image as bytes
            conf_threshold: Confidence threshold for detections (0-1)
            
        Returns:
            dict: Detection results with bounding boxes, classes, and confidences
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert PIL to numpy array
        image_np = np.array(image)
        
        # Run inference
        results = self.model(image_np, conf=conf_threshold)
        
        detections = []
        image_width, image_height = image.width, image.height
        image_area = image_width * image_height

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.class_names[class_id]

                x_center = (x1 + x2) / 2
                box_area = (x2 - x1) * (y2 - y1)

                detections.append({
                    "class": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2
                    },
                    "position": horizontal_position(x_center, image_width),
                    "distance": estimate_distance(box_area, image_area),
                    "priority": PRIORITY_MAP.get(class_name, 4)
                })

        # sort detections by priority before returning
        detections.sort(key=lambda d: d["priority"])

        return {
            'detections': detections,
            'count': len(detections),
            'image_size': {
                'width': image.width,
                'height': image.height
            }
        }
    
    def detect_and_draw(self, image_bytes, conf_threshold=0.25):
        """
        Detect objects and return annotated image
        
        Args:
            image_bytes: Image as bytes
            conf_threshold: Confidence threshold for detections
            
        Returns:
            bytes: Annotated image as bytes
        """
        # Convert bytes to PIL Image
        # image = Image.open(io.BytesIO(image_bytes))
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        image_np = np.array(image)
        
        # Run inference
        results = self.model(image_np, conf=conf_threshold)
        
        # Draw annotations
        # annotated_img = results[0].plot()
        annotated_img = results[0].plot() if len(results) > 0 else image_np

        
        # Convert back to bytes
        annotated_pil = Image.fromarray(annotated_img)
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


PRIORITY_MAP = {
    "stairs": 1,
    "car": 1,
    "bicycle": 1,
    "person": 2,
    "chair": 3,
    "table": 3,
}
