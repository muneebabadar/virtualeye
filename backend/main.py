from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from currency_detection import CurrencyDetector
from object_detection import ObjectDetector
from colour_detection import ColorDetector

app = FastAPI(title="V-Eye API", description="Currency and Object Detection API")

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detectors
currency_detector = CurrencyDetector('assets/best.pt')  # Your custom currency model
object_detector = ObjectDetector('assets/yolov8n.pt')  # COCO pretrained model
color_detector = ColorDetector()


@app.get("/")
async def root():
    return {
        "message": "V-Eye API is running",
        "version": "1.0.0",
        "endpoints": {
            "currency_detection": "/detect-currency",
            "currency_detection_annotated": "/detect-currency-annotated",
            "object_detection": "/detect-objects",
            "object_detection_annotated": "/detect-objects-annotated",
            "health": "/health",
            "classes": "/classes"
        }
    }

# Currency Detection Endpoints

@app.post("/detect-currency")
async def detect_currency(
    file: UploadFile = File(...),
    confidence: float = 0.25
):
    """
    Detect Pakistani currency in uploaded image
    
    Args:
        file: Image file
        confidence: Confidence threshold (0-1), default 0.25
    """
    try:
        # Read image
        contents = await file.read()
        
        # Detect currency
        results = currency_detector.detect_currency(contents, conf_threshold=confidence)
        
        return JSONResponse({
            'success': True,
            **results
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-currency-annotated")
async def detect_currency_annotated(
    file: UploadFile = File(...),
    confidence: float = 0.25
):
    """
    Detect currency and return annotated image with bounding boxes
    
    Args:
        file: Image file
        confidence: Confidence threshold (0-1), default 0.25
    """
    try:
        # Read image
        contents = await file.read()
        
        # Detect and annotate
        annotated_image = currency_detector.detect_and_draw(contents, conf_threshold=confidence)
        
        return StreamingResponse(
            io.BytesIO(annotated_image),
            media_type="image/png"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Object Detection Endpoints 

@app.post("/detect-objects")
async def detect_objects(
    file: UploadFile = File(...),
    confidence: float = 0.25
):
    """
    Detect objects using YOLOv8 COCO pretrained model
    
    Args:
        file: Image file
        confidence: Confidence threshold (0-1), default 0.25
    """
    try:
        # Read image
        contents = await file.read()
        
        # Detect objects
        results = object_detector.detect_objects(contents, conf_threshold=confidence)
        
        return JSONResponse({
            'success': True,
            **results
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-objects-annotated")
async def detect_objects_annotated(
    file: UploadFile = File(...),
    confidence: float = 0.25
):
    """
    Detect objects and return annotated image with bounding boxes
    
    Args:
        file: Image file
        confidence: Confidence threshold (0-1), default 0.25
    """
    try:
        # Read image
        contents = await file.read()
        
        # Detect and annotate
        annotated_image = object_detector.detect_and_draw(contents, conf_threshold=confidence)
        
        return StreamingResponse(
            io.BytesIO(annotated_image),
            media_type="image/png"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/detect-color")
async def detect_color(file: UploadFile = File(...)):
    """
    Detect dominant colors in an uploaded image
    Returns multiple dominant colors with percentages
    """
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Detect colors
        result = color_detector.detect_color(image_bytes, n_colors=3)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/detect-color-simple")
async def detect_color_simple(file: UploadFile = File(...)):
    """
    Detect single dominant color - optimized for real-time feedback
    Faster processing for continuous camera feed
    """
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Detect primary color
        result = color_detector.detect_color_simple(image_bytes)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Utility Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "currency_detector": True,
            "object_detector": True
        }
    }

@app.get("/classes")
async def get_classes():
    """Get available detection classes for both models"""
    return {
        "currency_classes": list(currency_detector.class_names.values()),
        "object_classes": list(object_detector.class_names.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

