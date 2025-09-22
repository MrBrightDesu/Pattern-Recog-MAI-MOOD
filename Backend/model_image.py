import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from pathlib import Path
# โหลดโมเดล ResNet18 สำหรับ emotion (image)
# Order aligned with provided reference implementation
classes = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(classes))

# Resolve model file relative to this file, so it works from any CWD
_this_dir = Path(__file__).resolve().parent
_weights_path = _this_dir / "emotion_resnet18.pth"
if not _weights_path.exists():
    raise FileNotFoundError(f"Model weights not found at {_weights_path}. Place 'emotion_resnet18.pth' in the 'Backend' folder.")

model.load_state_dict(torch.load(str(_weights_path), map_location=device))
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def predict_image(img):
    x = transform(img).unsqueeze(0)
    with torch.no_grad():
        outputs = model(x)
        _, pred = torch.max(outputs, 1)
    return classes[pred.item()]