from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback
import base64
import numpy as np
import cv2

# Support running as a package (Backend.main) or from inside Backend directory
try:
    from .model_image import model, classes as class_names
    from .utlis import detect_and_crop_face, predict_face_image
except Exception:
    try:
        from Backend.model_image import model, classes as class_names
        from Backend.utlis import detect_and_crop_face, predict_face_image
    except Exception:
        from model_image import model, classes as class_names
        from utlis import detect_and_crop_face, predict_face_image

app = FastAPI(title="Emotion Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # อ่านไฟล์ที่อัพโหลด
        contents = await file.read()
        if not contents:
            return JSONResponse(content={"error": "Empty file"}, status_code=400)

        npimg = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(content={"error": "Invalid image"}, status_code=400)

        # Detect & crop face
        try:
            face_crop, face_coords = detect_and_crop_face(img, use_anime_detection=False)
        except Exception as det_e:
            print("face detection error:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"face_detection_failed: {det_e}"}, status_code=500)
        if face_crop is None:
            return JSONResponse(content={"error": "No face detected"}, status_code=404)

        # Predict emotion
        try:
            emotion = predict_face_image(face_crop, model, class_names)
        except Exception as pred_e:
            print("prediction error:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"prediction_failed: {pred_e}"}, status_code=500)

        # Encode cropped face (RGB -> BGR for OpenCV encode)
        try:
            face_bgr = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
            ok, buf = cv2.imencode('.jpg', face_bgr)
            crop_b64 = base64.b64encode(buf.tobytes()).decode('utf-8') if ok else None
        except Exception:
            crop_b64 = None

        return {
            "emotion": emotion,
            "face_coords": {
                "x": int(face_coords[0]),
                "y": int(face_coords[1]),
                "w": int(face_coords[2]),
                "h": int(face_coords[3]),
            },
            "face_crop_image": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None
        }
    except Exception as e:
        print("/predict error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)