import torch
import torch.nn as nn
import torchaudio
import torchaudio.transforms as T
from torchvision import models

# Emotion classes จาก TESS หรือ dataset ของคุณ
classes = ["happy", "sad", "angry", "neutral", "surprise", "fear", "disgust"]

model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(classes))
model.load_state_dict(torch.load("resnet18_mfcc128_tess_local.pth", map_location="cpu"))
model.eval()

mfcc_transform = T.MFCC(
    sample_rate=16000,
    n_mfcc=128,
    melkwargs={"n_fft": 400, "hop_length": 160, "n_mels": 128}
)

def preprocess_audio(waveform, sr, max_len=200):
    if sr != 16000:
        waveform = torchaudio.functional.resample(waveform, sr, 16000)

    mfcc = mfcc_transform(waveform)
    mfcc = mfcc.mean(dim=0, keepdim=True)  # mono
    mfcc = mfcc.expand(3, -1, -1)

    if mfcc.shape[2] < max_len:
        pad_amount = max_len - mfcc.shape[2]
        mfcc = nn.functional.pad(mfcc, (0, pad_amount))
    else:
        mfcc = mfcc[:, :, :max_len]

    return mfcc.unsqueeze(0)

def predict_audio(waveform, sr):
    x = preprocess_audio(waveform, sr)
    with torch.no_grad():
        outputs = model(x)
        _, pred = torch.max(outputs, 1)
    return classes[pred.item()]
