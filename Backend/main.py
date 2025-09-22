from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import numpy as np
import cv2

from Backend.model_image import model, classes as class_names
from Backend.utlis import detect_and_crop_face, predict_face_image

app = FastAPI(title="Emotion Detection API")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # อ่านไฟล์ที่อัพโหลด
        contents = await file.read()
        npimg = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(content={"error": "Invalid image"}, status_code=400)

        # Detect & crop face
        face_crop, face_coords = detect_and_crop_face(img, use_anime_detection=True)
        if face_crop is None:
            return JSONResponse(content={"error": "No face detected"}, status_code=404)

        # Predict emotion
        emotion = predict_face_image(face_crop, model, class_names)

        return {
            "emotion": emotion,
            "face_coords": {
                "x": int(face_coords[0]),
                "y": int(face_coords[1]),
                "w": int(face_coords[2]),
                "h": int(face_coords[3]),
            }
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)