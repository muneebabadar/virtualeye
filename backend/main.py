from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import uvicorn
import traceback

# Create FastAPI app
app = FastAPI()

# CORS for mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n>>> Incoming request: {request.method} {request.url.path}")
    print(f">>> Headers: {dict(request.headers)}")
    response = await call_next(request)
    print(f">>> Response status: {response.status_code}\n")
    return response

# Load model
print("Loading model...")
model = YOLO(r"D:\Uni\Sem 7\Capstone\app_model_deploy\backend\best.pt")  
class_names = model.names
print(f"Model loaded! Classes: {list(class_names.values())}")

@app.get("/")
def root():
    print("Root endpoint called")
    return {
        "status": "online",
        "message": "Currency Detection API",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "classes": list(class_names.values())
    }

@app.post("/detect/")
async def detect_objects(file: UploadFile = File(...)):
    print("\n" + "="*50)
    print("INSIDE DETECT ENDPOINT")
    print("="*50)
    
    try:
        print(f"File parameter received: {file}")
        print(f"Filename: {file.filename}")
        print(f"Content-Type: {file.content_type}")
        
        # Read image bytes
        image_bytes = await file.read()
        print(f"Received {len(image_bytes)} bytes")
        
        if len(image_bytes) == 0:
            print("ERROR: Empty file!")
            raise HTTPException(status_code=400, detail="Empty file received")
        
        # Try to decode image
        try:
            nparr = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"ERROR decoding image: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to decode image: {str(e)}")
        
        if image is None:
            print("ERROR: cv2.imdecode returned None!")
            raise HTTPException(status_code=400, detail="Could not decode image - invalid format")
        
        print(f"Image decoded: {image.shape} (H={image.shape[0]}, W={image.shape[1]})")
        
        # Resize if too large
        height, width = image.shape[:2]
        max_dim = 640
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
            print(f"Resized to: {image.shape}")
        
        # Run detection
        print("Running detection...")
        results = model.predict(
            image,
            conf=0.5,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device='cpu'
        )
        
        # Process results
        detections = []
        for result in results[0].boxes:
            x1, y1, x2, y2 = result.xyxy[0].cpu().numpy()
            confidence = float(result.conf[0].cpu().numpy())
            class_id = int(result.cls[0].cpu().numpy())
            
            detections.append({
                "x1": float(x1),
                "y1": float(y1),
                "x2": float(x2),
                "y2": float(y2),
                "confidence": confidence,
                "class_id": class_id,
                "class_name": class_names[class_id]
            })
        
        print(f"✓ Detection complete! Found {len(detections)} objects")
        for det in detections:
            print(f"  → {det['class_name']}: {det['confidence']:.1%}")
        print("="*50 + "\n")
        
        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }
        
    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}")
        raise
    except Exception as e:
        print(f"\n{'='*50}")
        print(f"UNEXPECTED ERROR: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("\n" + "="*50)
    print("CURRENCY DETECTION API")
    print("="*50)
    print("Server: http://0.0.0.0:8000")
    print("Docs: http://0.0.0.0:8000/docs")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)