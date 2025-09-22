import cv2
import numpy as np
from mtcnn import MTCNN
from torchvision import transforms
from PIL import Image
import torch

from app.model import model, device, class_names

mtcnn_detector = MTCNN()

def detect_and_crop_face(img, target_size=(224, 224), use_anime_detection=True):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    if use_anime_detection:
        try:
            faces = mtcnn_detector.detect_faces(img_rgb)
            if len(faces) == 0:
                return None, None
            x, y, w, h = faces[0]['box']
        except:
            return None, None
    else:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        if len(faces) == 0:
            return None, None
        x, y, w, h = faces[0]

    padding = 30
    x1 = max(0, x - padding)
    y1 = max(0, y - padding)
    x2 = min(img.shape[1], x + w + padding)
    y2 = min(img.shape[0], y + h + padding)

    face_crop = img_rgb[y1:y2, x1:x2]
    face_resized = cv2.resize(face_crop, target_size)

    return face_resized, (x, y, w, h)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def predict_face_image(face_image, model, class_names):
    face_pil = Image.fromarray(face_image)
    img_t = transform(face_pil).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(img_t)
        _, pred = torch.max(outputs, 1)
    return class_names[pred.item()]
