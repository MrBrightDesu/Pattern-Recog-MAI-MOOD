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
# Support running as a package (Backend.main) or from inside Backend directory
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
def run_audio_model(waveform, sr):
    """
    Run the audio emotion prediction model.
    """
    return predict_audio_emotion(waveform, sr) 


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

<<<<<<< HEAD
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
=======
>>>>>>> main

def _save_temp_file(contents: bytes, filename: Optional[str]) -> str:
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
# Audio model inference (handled by model_audio.MFCC)
# =========================

# =========================
# FastAPI endpoints
# =========================
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
=======
>>>>>>> bright
>>>>>>> main
@app.post("/predict-audio")
async def predict_audio(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
            return JSONResponse(content={"error": "Empty file"}, status_code=400)

        # Write to a temp file for torchaudio to load reliably across platforms
        import tempfile, os
        import torchaudio
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            waveform, sr = torchaudio.load(tmp_path)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        try:
            emotion = predict_audio_emotion(waveform, sr)
        except Exception as pred_e:
            print("audio prediction error:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"audio_prediction_failed: {pred_e}"}, status_code=500)

        return {"emotion": emotion}
    except Exception as e:
        print("/predict-audio error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)
=======
>>>>>>> main
            return JSONResponse(content={"error": "Empty audio file"}, status_code=400)

        # Save to temp
        tmp_path = _save_temp_file(contents, file.filename)

        try:
            # Load audio
            import torchaudio
            waveform, sr = torchaudio.load(tmp_path)

            # ✅ ใช้โมเดลจริงจาก model_audio.py
            prediction = predict_audio_emotion(waveform, sr)

            return {
                "filename": file.filename,
                "prediction": prediction,   # จะได้เป็น "sad" / "happy" ฯลฯ
            }
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass
    except Exception as e:
        print("/predict-audio error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/predict-both")
async def predict_both(image: UploadFile = File(None), audio: UploadFile = File(None)):
    try:
        if image is None or audio is None:
            return JSONResponse(
                content={"error": "Both 'image' and 'audio' files are required"},
                status_code=400,
            )

        # ================== Process image ==================
        image_bytes = await image.read()
        npimg = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse(content={"error": "Invalid image"}, status_code=400)

        face_crop, face_coords = detect_and_crop_face(img, use_anime_detection=False)
        if face_crop is None:
            return JSONResponse(content={"error": "No face detected"}, status_code=404)

        image_emotion = predict_face_image(face_crop, model, class_names)

        # ================== Process audio ==================
        audio_bytes = await audio.read()
        tmp_path = _save_temp_file(audio_bytes, audio.filename)
        try:
            import torchaudio
            waveform, sr = torchaudio.load(tmp_path)
            audio_emotion = predict_audio_emotion(waveform, sr)
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass

        # ================== Fusion ==================
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
            "face_crop_image": f"data:image/jpeg;base64,{crop_b64}"
            if crop_b64
            else None,
        }

    except Exception as e:
        print("/predict-both error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
<<<<<<< HEAD
=======
            return JSONResponse(content={"error": "Empty file"}, status_code=400)

        # Write to a temp file for torchaudio to load reliably across platforms
        import tempfile, os
        import torchaudio
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            waveform, sr = torchaudio.load(tmp_path)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        try:
            emotion = predict_audio_emotion(waveform, sr)
        except Exception as pred_e:
            print("audio prediction error:\n" + traceback.format_exc())
            return JSONResponse(content={"error": f"audio_prediction_failed: {pred_e}"}, status_code=500)

        return {"emotion": emotion}
    except Exception as e:
        print("/predict-audio error:\n" + traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)
>>>>>>> Stashed changes
=======
>>>>>>> bright
>>>>>>> main
