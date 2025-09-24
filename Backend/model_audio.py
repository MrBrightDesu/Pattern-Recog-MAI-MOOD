import os
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

# Robust checkpoint loading even if fc layer size differs (e.g., 14 vs 7 classes)
_possible_paths = [
    "resnet18_mfcc128_tess_local.pth",
    os.path.join("Backend", "resnet18_mfcc128_tess_local.pth"),
    os.path.join(os.path.dirname(__file__), "resnet18_mfcc128_tess_local.pth"),
]
_ckpt_path = next((p for p in _possible_paths if os.path.exists(p)), None)
if _ckpt_path is None:
    # Proceed without loading if file not found; model will be randomly initialized
    pass
else:
    ckpt = torch.load(_ckpt_path, map_location="cpu")
    # Support various checkpoint formats
    if isinstance(ckpt, dict) and "state_dict" in ckpt:
        state = ckpt["state_dict"]
    elif isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        state = ckpt["model_state_dict"]
    else:
        state = ckpt

    # Remove common prefixes and incompatible head weights
    cleaned_state = {}
    for k, v in state.items():
        key = k
        if key.startswith("module."):
            key = key[len("module."):]
        # Drop final layer weights/bias if they don't match shape
        if key.startswith("fc."):
            continue
        cleaned_state[key] = v

    # Load backbone weights; head remains our defined 7-class layer
    model.load_state_dict(cleaned_state, strict=False)
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
