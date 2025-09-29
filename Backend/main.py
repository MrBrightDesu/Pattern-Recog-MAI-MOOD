from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback
import base64
import numpy as np
import cv2
import os
import tempfile
from typing import Optional
import librosa

# Import models (support package or direct)
try:
    from .model_image import model, classes as class_names
    from .utlis import detect_and_crop_face, predict_face_image
    from .model_audio import predict_audio as predict_audio_emotion
except Exception:
    try:
        from Backend.model_image import model, classes as class_names
        from Backend.utlis import detect_and_crop_face, predict_face_image
        from Backend.model_audio import predict_audio as predict_audio_emotion
    except Exception:
        from model_image import model, classes as class_names
        from utlis import detect_and_crop_face, predict_face_image
        from model_audio import predict_audio as predict_audio_emotion

app = FastAPI(title="Emotion Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _save_temp_file(contents: bytes, filename: Optional[str]) -> str:
    """Save uploaded file to a temporary file."""
    suffix = None
    if filename and "." in filename:
        suffix = filename[filename.rfind("."):]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix or ".bin")
    try:
        tmp.write(contents)
        return tmp.name
    finally:
        tmp.close()


# =========================
# Image prediction endpoint
# =========================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
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

        # Encode cropped face
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


# =========================
# Audio prediction endpoint
# =========================
@app.post("/predict-audio")
async def predict_audio(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
            return JSONResponse(content={"error": "Empty audio file"}, status_code=400)

        tmp_path = _save_temp_file(contents, file.filename)
        try:
            import torchaudio
            waveform, sr = torchaudio.load(tmp_path)
            result = predict_audio_emotion(waveform, sr)
            
            # Handle both old string format and new dict format
            if isinstance(result, dict):
                return result
            else:
                return {"emotion": result}
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass

    except Exception as e:
        print("/predict-audio error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


# =========================
# Combined prediction endpoint
# =========================
@app.post("/predict-both")
async def predict_both(image: UploadFile = File(...), audio: UploadFile = File(...)):
    try:
        if image is None or audio is None:
            return JSONResponse(
                content={"error": "Both 'image' and 'audio' files are required"},
                status_code=400,
            )

        # Process image
        image_bytes = await image.read()
        npimg = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse(content={"error": "Invalid image"}, status_code=400)

        face_crop, face_coords = detect_and_crop_face(img, use_anime_detection=False)
        if face_crop is None:
            return JSONResponse(content={"error": "No face detected"}, status_code=404)

        image_emotion = predict_face_image(face_crop, model, class_names)

        # Process audio
        audio_bytes = await audio.read()
        tmp_path = _save_temp_file(audio_bytes, audio.filename)
        try:
            import torchaudio
            waveform, sr = torchaudio.load(tmp_path)
            audio_result = predict_audio_emotion(waveform, sr)
            
            # Handle both old string format and new dict format
            if isinstance(audio_result, dict):
                audio_emotion = audio_result["emotion"]
            else:
                audio_emotion = audio_result
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass

        # Simple fusion
        if image_emotion == audio_emotion:
            final_emotion = image_emotion
            confidence = 0.9
        else:
            final_emotion = image_emotion
            confidence = 0.6

        # Encode cropped face
        try:
            face_bgr = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
            ok, buf = cv2.imencode(".jpg", face_bgr)
            crop_b64 = base64.b64encode(buf.tobytes()).decode("utf-8") if ok else None
        except Exception:
            crop_b64 = None

        return {
            "emotion": final_emotion,
            "image_emotion": image_emotion,
            "audio_emotion": audio_emotion,
            "confidence": confidence,
            "face_coords": {
                "x": int(face_coords[0]),
                "y": int(face_coords[1]),
                "w": int(face_coords[2]),
                "h": int(face_coords[3]),
            },
            "face_crop_image": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None,
        }

    except Exception as e:
        print("/predict-both error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


# =========================
# Health check
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)