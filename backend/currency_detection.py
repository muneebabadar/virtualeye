import cv2
import numpy as np
from PIL import Image
import io

import tensorflow as tf
Interpreter = tf.lite.Interpreter


class CurrencyDetector:
    def __init__(self, model_path='assets/yolo26-obb-tflite.tflite'):
        self.interpreter = Interpreter(model_path=model_path, num_threads=4)
        self.interpreter.allocate_tensors()

        self.input_details  = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        self._input_dtype = self.input_details[0]['dtype']
        self._input_shape = self.input_details[0]['shape']  # [1, 640, 640, 3]
        self._model_h     = int(self._input_shape[1])
        self._model_w     = int(self._input_shape[2])

        out_shape         = self.output_details[0]['shape']  # [1, 300, 7]
        self._det_cols    = int(out_shape[2])

        self.class_names = self._load_labels(
            model_path.replace('.tflite', '_labels.txt')
        ) or {
            0: '10',
            1: '100',
            2: '1000',
            3: '20',
            4: '50',
            5: '500',
            6: '5000',
        }

        print(f"[CurrencyDetector] Loaded: {model_path}")
        print(f"  Input  : {self._input_shape}  {self._input_dtype}")
        print(f"  Output : {out_shape}")
        print(f"  Classes: {list(self.class_names.values())}")

    # ══════════════════════════════════════════════════════════════════════════
    #  Public API
    # ══════════════════════════════════════════════════════════════════════════

    def detect_currency(self, image_bytes, conf_threshold=0.25):
        image, image_np = self._image_from_bytes(image_bytes)
        detections      = self._run_inference(image_np, conf_threshold)
        total_amount    = sum(d['value'] for d in detections if d['value'])
        return {
            'detections':   detections,
            'count':        len(detections),
            'total_amount': total_amount,
            'image_size':   {'width': image.width, 'height': image.height}
        }

    def detect_and_draw(self, image_bytes, conf_threshold=0.25):
        image, image_np = self._image_from_bytes(image_bytes)
        detections      = self._run_inference(image_np, conf_threshold)
        canvas          = image_np.copy()
        for det in detections:
            canvas = self._draw_detection(canvas, det)
        buf = io.BytesIO()
        Image.fromarray(canvas).save(buf, format='PNG')
        buf.seek(0)
        return buf.getvalue()

    # ══════════════════════════════════════════════════════════════════════════
    #  Inference
    # ══════════════════════════════════════════════════════════════════════════

    def _run_inference(self, image_np: np.ndarray, conf_threshold: float):
        orig_h, orig_w = image_np.shape[:2]

        # 1. Letterbox resize
        input_img, scale, pad_left, pad_top = self._letterbox(
            image_np, self._model_w, self._model_h
        )

        # 2. Normalize
        if self._input_dtype == np.uint8:
            input_tensor = input_img.astype(np.uint8)
        else:
            input_tensor = (input_img / 255.0).astype(np.float32)
        input_tensor = np.expand_dims(input_tensor, 0)  # (1,640,640,3)

        # 3. Run
        self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
        self.interpreter.invoke()
        raw = self.interpreter.get_tensor(self.output_details[0]['index'])

        # 4. Parse
        return self._parse_output(raw, conf_threshold, orig_w, orig_h, scale, pad_left, pad_top)

    # ══════════════════════════════════════════════════════════════════════════
    #  Parser — confirmed layout: [cx, cy, w, h, conf, class_id, angle]
    #           all coords normalized to [0, 1]
    # ══════════════════════════════════════════════════════════════════════════

    def _parse_output(self, raw, conf_threshold, orig_w, orig_h, scale, pad_left, pad_top):
        dets  = np.squeeze(raw, axis=0)      # (300, 7)
        confs = dets[:, 4]
        dets  = dets[confs >= conf_threshold]

        if len(dets) == 0:
            return []

        results = []
        for row in dets:
            # Coords are normalized → convert to letterbox pixel space first
            cx_lb = float(row[0]) * self._model_w
            cy_lb = float(row[1]) * self._model_h
            w_lb  = float(row[2]) * self._model_w
            h_lb  = float(row[3]) * self._model_h

            confidence = float(row[4])
            class_id   = int(round(float(row[5])))
            angle_rad  = float(row[6]) if self._det_cols >= 7 else 0.0

            # Remove letterbox padding + scale to original image coords
            cx = (cx_lb - pad_left) / scale
            cy = (cy_lb - pad_top)  / scale
            w  = w_lb  / scale
            h  = h_lb  / scale

            x1 = max(0.0,          cx - w / 2)
            y1 = max(0.0,          cy - h / 2)
            x2 = min(float(orig_w), cx + w / 2)
            y2 = min(float(orig_h), cy + h / 2)

            if x2 <= x1 or y2 <= y1:
                continue

            corners        = self._obb_to_corners(cx, cy, w, h, angle_rad)
            class_name     = self.class_names.get(class_id, f'class_{class_id}')
            currency_value = self._extract_value(class_name)

            results.append({
                'class':      class_name,
                'class_id':   class_id,
                'confidence': round(confidence, 4),
                'value':      currency_value,
                'bbox': {
                    'x1': round(x1, 2), 'y1': round(y1, 2),
                    'x2': round(x2, 2), 'y2': round(y2, 2)
                },
                'obb': {
                    'cx':        round(cx, 2),
                    'cy':        round(cy, 2),
                    'width':     round(w,  2),
                    'height':    round(h,  2),
                    'angle_rad': round(angle_rad, 6),
                    'corners':   corners.tolist()
                }
            })

        return results

    # ══════════════════════════════════════════════════════════════════════════
    #  Helpers
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def _letterbox(img, target_w, target_h):
        h, w    = img.shape[:2]
        scale   = min(target_w / w, target_h / h)
        new_w   = int(round(w * scale))
        new_h   = int(round(h * scale))
        pad_l   = (target_w - new_w) // 2
        pad_t   = (target_h - new_h) // 2
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        canvas  = np.full((target_h, target_w, 3), 114, dtype=np.uint8)
        canvas[pad_t:pad_t + new_h, pad_l:pad_l + new_w] = resized
        return canvas, scale, pad_l, pad_t

    @staticmethod
    def _obb_to_corners(cx, cy, w, h, angle_rad):
        cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
        hw, hh   = w / 2, h / 2
        offsets  = np.array([[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]], dtype=np.float32)
        rot      = np.array([[cos_a, -sin_a],[sin_a, cos_a]])
        return (offsets @ rot.T) + np.array([cx, cy])

    def _draw_detection(self, img, det):
        COLORS = [
            (255,56,56),(255,157,151),(255,112,31),(255,178,29),
            (207,210,49),(72,249,10),(146,204,23)
        ]
        color   = COLORS[det['class_id'] % len(COLORS)]
        corners = np.array(det['obb']['corners'], dtype=np.int32)
        cv2.polylines(img, [corners], isClosed=True, color=color, thickness=2)

        label = f"{det['class']} {det['confidence']:.0%}"
        if det['value']:
            label += f" Rs{det['value']}"

        x1 = int(det['bbox']['x1'])
        y1 = int(det['bbox']['y1'])
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(img, (x1, y1 - th - 6), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, label, (x1+2, y1-4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,255,255), 2)
        return img

    @staticmethod
    def _extract_value(class_name):
        try:
            return int(''.join(filter(str.isdigit, class_name)))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _image_from_bytes(image_bytes):
        image    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)
        return image, image_np

    @staticmethod
    def _load_labels(path):
        try:
            with open(path) as f:
                return {i: l.strip() for i, l in enumerate(f) if l.strip()}
        except FileNotFoundError:
            return {}