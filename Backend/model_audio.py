import os
import torch
import torch.nn as nn
import torchaudio
from torchaudio.transforms import MelSpectrogram, MFCC
import torch.nn.functional as F

# Emotion classes matching the CRNN model training
classes = ['anger', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']

# ============================================
# EmotionCRNN Model Definition
# ============================================
class EmotionCRNN(nn.Module):
    def __init__(self, num_classes, hidden_size=128, num_layers=2, rnn_type="GRU"):
        super(EmotionCRNN, self).__init__()

        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, stride=1, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)

        rnn_class = nn.LSTM if rnn_type == "LSTM" else nn.GRU
        self.rnn = rnn_class(
            input_size=32*26,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True
        )

        self.fc1 = nn.Linear(hidden_size*2, 128)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = x.unsqueeze(1)
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        B, C, F, T = x.size()
        x = x.permute(0, 3, 1, 2).contiguous().view(B, T, C*F)
        rnn_out, _ = self.rnn(x)
        out = rnn_out[:, -1, :]
        out = self.dropout(self.relu(self.fc1(out)))
        out = self.fc2(out)
        return out

# ============================================
# Load CRNN Model
# ============================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = EmotionCRNN(num_classes=len(classes), rnn_type="GRU").to(device)

# Robust checkpoint loading for CRNN model
_possible_paths = [
    "emotion_crnn.pth",
    os.path.join("Backend", "emotion_crnn.pth"),
    os.path.join(os.path.dirname(__file__), "emotion_crnn.pth"),
]
_ckpt_path = next((p for p in _possible_paths if os.path.exists(p)), None)

if _ckpt_path is None:
    print("Warning: emotion_crnn.pth not found, model will be randomly initialized")
else:
    try:
        model.load_state_dict(torch.load(_ckpt_path, map_location=device))
        print(f"✅ CRNN model loaded successfully from {_ckpt_path}")
    except Exception as e:
        print(f"Error loading CRNN model: {e}")
        print("Model will be randomly initialized")

model.eval()

# ============================================
# Feature Extraction Transforms
# ============================================
mel_transform = MelSpectrogram(sample_rate=16000, n_mels=64)
mfcc_transform = MFCC(sample_rate=16000, n_mfcc=40)

# ============================================
# Feature Extraction Function
# ============================================
def extract_features(waveform, sample_rate=16000):
    """Extract MelSpectrogram + MFCC features for CRNN model"""
    # Ensure mono (average channels if multiple)
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    # Resample if needed
    if sample_rate != 16000:
        waveform = torchaudio.functional.resample(waveform, sample_rate, 16000)

    # Extract features
    mel = mel_transform(waveform).squeeze(0)  # [64, time]
    mfcc = mfcc_transform(waveform).squeeze(0)  # [40, time]

    # Make time dimension equal
    min_time = min(mel.size(1), mfcc.size(1))
    mel = mel[:, :min_time]
    mfcc = mfcc[:, :min_time]

    # Concatenate features
    features = torch.cat((mel, mfcc), dim=0)  # [104, time]

    # Return [batch, features, time] format
    return features.unsqueeze(0)  # [1, 104, time]

# ============================================
# Prediction Function
# ============================================
def predict_audio(waveform, sr):
    """Predict emotion from audio waveform using CRNN model"""
    try:
        # Extract features
        features = extract_features(waveform, sr).to(device)
        
        # Predict
        with torch.no_grad():
            output = model(features)
            probs = F.softmax(output, dim=1)
            predicted_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_class].item()
        
        return {
            "emotion": classes[predicted_class],
            "confidence": confidence,
            "probabilities": {classes[i]: probs[0][i].item() for i in range(len(classes))}
        }
    except Exception as e:
        print(f"Error in predict_audio: {e}")
        # Fallback to simple prediction
        with torch.no_grad():
            features = extract_features(waveform, sr).to(device)
            output = model(features)
            _, pred = torch.max(output, 1)
        return {
            "emotion": classes[pred.item()],
            "confidence": 0.5,  # Default confidence
            "probabilities": {}
        }
