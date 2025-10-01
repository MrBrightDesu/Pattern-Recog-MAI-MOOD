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
    from .model_audio import predict_audio as predict_audio_emotion, classes as audio_classes
except Exception:
    try:
        from Backend.model_image import model, classes as class_names
        from Backend.utlis import detect_and_crop_face, predict_face_image
        from Backend.model_audio import predict_audio as predict_audio_emotion, classes as audio_classes
    except Exception:
        from model_image import model, classes as class_names
        from utlis import detect_and_crop_face, predict_face_image
        from model_audio import predict_audio as predict_audio_emotion, classes as audio_classes

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


def _map_emotion_classes(image_emotion: str, audio_emotion: str) -> tuple:
    """Map emotion classes from different models to a common format."""
    # Mapping from image classes to common classes
    image_mapping = {
        'angry': 'anger',
        'disgust': 'disgust', 
        'fear': 'fear',
        'happy': 'happiness',
        'neutral': 'neutral',
        'sad': 'sadness',
        'surprise': 'surprise'
    }
    
    # Audio classes are already in common format
    mapped_image_emotion = image_mapping.get(image_emotion, image_emotion)
    return mapped_image_emotion, audio_emotion


def _weighted_fusion(image_result: dict, audio_result: dict, audio_weight: float = 0.7) -> dict:
    """Combine image and audio predictions with audio priority when emotions differ."""
    # Get image emotion and probabilities
    image_emotion = image_result["emotion"]
    image_probabilities = image_result.get("probabilities", {})
    image_confidence = image_result.get("confidence", 0.5)
    
    # Get audio emotion and probabilities
    audio_emotion = audio_result["emotion"]
    audio_probabilities = audio_result.get("probabilities", {})
    audio_confidence = audio_result.get("confidence", 0.5)
    
    # Map emotions to common classes
    mapped_image_emotion, mapped_audio_emotion = _map_emotion_classes(image_emotion, audio_emotion)
    
    # Check if emotions are the same
    if mapped_image_emotion == mapped_audio_emotion:
        # Same emotion - use normal weighted fusion with higher confidence
        final_emotion = mapped_audio_emotion
        final_confidence = min(0.95, (audio_confidence + image_confidence) / 2)  # Average confidence when both agree
        fusion_method = "agreement"
    else:
        # Different emotions - prioritize audio
        final_emotion = mapped_audio_emotion
        final_confidence = audio_confidence * 0.9  # Slightly reduce confidence due to disagreement
        fusion_method = "audio_priority"
    
    # Create weighted probabilities for transparency using actual probabilities
    all_emotions = ['anger', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']
    weighted_probs = {}
    
    for emotion in all_emotions:
        # Get actual probabilities from both models
        audio_prob = audio_probabilities.get(emotion, 0.0)
        
        # Map image probability from image classes to common classes
        image_prob = 0.0
        for img_emotion, img_prob in image_probabilities.items():
            mapped_img_emotion, _ = _map_emotion_classes(img_emotion, emotion)
            if mapped_img_emotion == emotion:
                image_prob = img_prob
                break
        
        # Apply weights based on fusion method
        if fusion_method == "agreement":
            # When emotions agree, use balanced weights
            weighted_probs[emotion] = (audio_prob * 0.6) + (image_prob * 0.4)
        else:
            # When emotions differ, heavily favor audio
            weighted_probs[emotion] = (audio_prob * 0.85) + (image_prob * 0.15)
    
    return {
        "emotion": final_emotion,
        "confidence": final_confidence,
        "image_emotion": mapped_image_emotion,
        "audio_emotion": mapped_audio_emotion,
        "image_confidence": image_confidence,
        "audio_confidence": audio_confidence,
        "fusion_method": fusion_method,
        "weighted_probabilities": weighted_probs
    }


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
            result = predict_face_image(face_crop, model, class_names)
            # Handle both old string format and new dict format
            if isinstance(result, dict):
                emotion = result["emotion"]
                confidence = result.get("confidence", 0.5)
                probabilities = result.get("probabilities", {})
            else:
                emotion = result
                confidence = 0.5
                probabilities = {}
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
            "confidence": confidence,
            "probabilities": probabilities,
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

        # Detect & crop face
        try:
            face_crop, face_coords = detect_and_crop_face(img, use_anime_detection=False)
        except Exception as det_e:
            print("face detection error in predict-both:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"face_detection_failed: {det_e}"}, status_code=500)
        
        if face_crop is None:
            return JSONResponse(content={"error": "No face detected"}, status_code=404)

        # Predict image emotion
        try:
            image_result = predict_face_image(face_crop, model, class_names)
            # Ensure image_result is in dict format
            if not isinstance(image_result, dict):
                image_result = {"emotion": image_result, "confidence": 0.5, "probabilities": {}}
        except Exception as pred_e:
            print("image prediction error in predict-both:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"image_prediction_failed: {pred_e}"}, status_code=500)

        # Process audio using the new CRNN model
        audio_bytes = await audio.read()
        tmp_path = _save_temp_file(audio_bytes, audio.filename)
        try:
            import torchaudio
            waveform, sr = torchaudio.load(tmp_path)
            audio_result = predict_audio_emotion(waveform, sr)
            
            # Ensure audio_result is in dict format with probabilities
            if not isinstance(audio_result, dict):
                audio_result = {"emotion": audio_result, "confidence": 0.5, "probabilities": {}}
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass

        # Use weighted fusion with audio priority (70% audio, 30% image)
        fusion_result = _weighted_fusion(image_result, audio_result, audio_weight=0.7)

        # Encode cropped face
        try:
            face_bgr = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
            ok, buf = cv2.imencode(".jpg", face_bgr)
            crop_b64 = base64.b64encode(buf.tobytes()).decode("utf-8") if ok else None
        except Exception:
            crop_b64 = None

        return {
            "emotion": fusion_result["emotion"],
            "confidence": fusion_result["confidence"],
            "image_emotion": fusion_result["image_emotion"],
            "audio_emotion": fusion_result["audio_emotion"],
            "image_confidence": fusion_result["image_confidence"],
            "audio_confidence": fusion_result["audio_confidence"],
            "fusion_method": fusion_result["fusion_method"],
            "weighted_probabilities": fusion_result["weighted_probabilities"],
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