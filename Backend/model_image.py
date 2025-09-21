import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models

# โหลดโมเดล ResNet18 สำหรับ emotion (image)
classes = ["happy", "sad", "angry", "neutral", "surprise", "fear", "disgust"]

model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(classes))
model.load_state_dict(torch.load("resnet18_emotion.pth", map_location="cpu"))
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