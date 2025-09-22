import cv2
import numpy as np
from mtcnn import MTCNN
from torchvision import transforms
from PIL import Image
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

mtcnn_detector = MTCNN()

def detect_with_haar_cascade(img, target_size=(224, 224)):
    """
    Fallback: ใช้ Haar Cascade สำหรับ detect หน้าคนจริง (รับ numpy image)
    """
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
    if len(faces) == 0:
        print("⚠️ ไม่พบหน้าในภาพ (Haar Cascade)")
        return None, None

    print("👤 พบหน้า (Haar Cascade)")
    x, y, w, h = faces[0]

    H, W = img.shape[0], img.shape[1]
    padding = 20
    x1 = max(0, int(x - padding))
    y1 = max(0, int(y - padding))
    x2 = min(W, int(x + w + padding))
    y2 = min(H, int(y + h + padding))

    if x2 <= x1 or y2 <= y1:
        return None, None

    face_crop = img[y1:y2, x1:x2]
    if face_crop.size == 0:
        return None, None
    face_resized = cv2.resize(face_crop, target_size)
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)

    return face_rgb, (int(x), int(y), int(w), int(h))

def detect_and_crop_face(img, target_size=(224, 224), use_anime_detection=True):

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    if use_anime_detection:
        try:
            faces = mtcnn_detector.detect_faces(img_rgb)
            if len(faces) == 0:
                print("⚠️ ไม่พบหน้าในภาพ (MTCNN)")
                return detect_with_haar_cascade(img, target_size)

            face_data = faces[0]
            x, y, w, h = face_data['box']
            confidence = face_data.get('confidence', None)
            if confidence is not None:
                try:
                    print(f"🎭 พบหน้า (MTCNN) - ความมั่นใจ: {confidence:.2f}")
                except Exception:
                    print("🎭 พบหน้า (MTCNN)")

        except Exception as e:
            print(f"⚠️ MTCNN error: {e}")
            print("🔄 เปลี่ยนไปใช้ Haar Cascade")
            return detect_with_haar_cascade(img, target_size)
    else:
        return detect_with_haar_cascade(img, target_size)

    # Crop หน้า (เพิ่ม padding)
    H, W = img_rgb.shape[0], img_rgb.shape[1]
    padding = 30
    x1 = max(0, int(round(x - padding)))
    y1 = max(0, int(round(y - padding)))
    x2 = min(W, int(round(x + w + padding)))
    y2 = min(H, int(round(y + h + padding)))

    if x2 <= x1 or y2 <= y1:
        return None, None

    face_crop = img_rgb[y1:y2, x1:x2]
    if face_crop.size == 0:
        return None, None

    face_resized = cv2.resize(face_crop, target_size)
    return face_resized, (int(x), int(y), int(w), int(h))

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# Convenience wrappers for reuse elsewhere
def crop_face(img, target_size=(224, 224), use_anime_detection=True):
    """
    ครอปใบหน้าจากภาพ numpy (BGR) และปรับขนาดเป็น target_size, คืน (face_rgb, coords)
    """
    return detect_and_crop_face(img, target_size=target_size, use_anime_detection=use_anime_detection)

def to_grayscale_224(face_image):
    """
    แปลงภาพใบหน้า (RGB numpy หรือ BGR ก็ได้) ให้เป็นขาวดำ 3 แชนเนล ขนาด 224x224 (numpy RGB)
    ใช้สำหรับแสดงผลหรือบันทึกภาพหลัง preprocess
    """
    # Ensure RGB numpy
    if isinstance(face_image, np.ndarray):
        if len(face_image.shape) == 3 and face_image.shape[2] == 3:
            # assume RGB already; if comes as BGR from OpenCV, convert before calling this helper
            rgb = cv2.resize(face_image, (224, 224))
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
            gray3 = np.stack([gray, gray, gray], axis=2)
            return gray3
    # Fallback via PIL path
    pil_img = Image.fromarray(face_image)
    pil_gray = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3)
    ])(pil_img)
    return np.array(pil_gray)

def preprocess_face_for_model(face_image, model):
    """
    สร้างเทนเซอร์อินพุตสำหรับโมเดล จากภาพใบหน้า (RGB numpy)
    คืนค่า torch.Tensor บนอุปกรณ์เดียวกับโมเดล
    """
    face_pil = Image.fromarray(face_image)
    img_t = transform(face_pil).unsqueeze(0)
    model_device = next(model.parameters()).device
    return img_t.to(model_device)

def predict_face_image(face_image, model, class_names):
    face_pil = Image.fromarray(face_image)
    img_t = transform(face_pil).unsqueeze(0)
    # Send to the same device as the model to avoid CPU/CUDA mismatch
    model_device = next(model.parameters()).device
    img_t = img_t.to(model_device)
    with torch.no_grad():
        outputs = model(img_t)
        _, pred = torch.max(outputs, 1)
    return class_names[pred.item()]

# === Path-based helpers (for quick local testing/CLI) ===
def detect_and_crop_face_from_path(image_path, target_size=(224, 224)):
    """
    Detect หน้าและ crop จากพาธไฟล์ภาพ โดยใช้ Haar Cascade (ไม่พึ่ง Colab/files.upload)
    คืน (face_rgb_224, (x, y, w, h)) หรือ (None, None) หากไม่พบหน้า
    """
    img = cv2.imread(image_path)
    if img is None:
        return None, None
    return detect_with_haar_cascade(img, target_size=target_size)

def predict_image_from_path(image_path, model, class_names):
    """
    ทำนายอารมณ์จากพาธไฟล์ภาพเต็ม (จะถูก resize+grayscale 224x224 ตาม transform)
    ใช้ device เดียวกับโมเดล
    """
    image = Image.open(image_path).convert('RGB')
    img_t = transform(image).unsqueeze(0)
    model_device = next(model.parameters()).device
    img_t = img_t.to(model_device)
    with torch.no_grad():
        outputs = model(img_t)
        _, pred = torch.max(outputs, 1)
    return class_names[pred.item()]
