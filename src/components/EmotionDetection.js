import React, { useState } from 'react';
import { Camera, Play, Pause, RotateCcw } from 'lucide-react';
import './EmotionDetection.css';

const EmotionDetection = ({ onEmotionDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [lastResponseJson, setLastResponseJson] = useState('');

  const analyzeFile = async (file) => {
    if (!file) return;
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiBase = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/predict`, { method: "POST", body: formData });

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
        try { setLastResponseJson(JSON.stringify(data, null, 2)); } catch {}
      } else {
        const text = await res.text();
        setLastResponseJson(text);
        throw new Error(`Unexpected response (${res.status}): ${text.slice(0, 120)}...`);
      }

      if (!res.ok || data.error) {
        const errMsg = (data && (data.error || data.detail)) ? (data.error || data.detail) : `HTTP ${res.status}`;
        setResult({ emotion: errMsg, emoji: "❌" });
      } else {
        setResult({ emotion: data.emotion, emoji: "😊", crop: data.face_crop_image, coords: data.face_coords });
      }
    } catch (err) {
      console.error(err);
      setResult({ emotion: err.message || "เกิดข้อผิดพลาด", emoji: "⚠️" });
      if (!lastResponseJson) {
        try { setLastResponseJson(JSON.stringify({ error: err.message }, null, 2)); } catch {}
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    await analyzeFile(file);
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
    setSelectedImage(null);
    setResult(null);
  };

  return (
    <div className="emotion-detection">
      <div className="detection-header">
        <h2>ตรวจจับอารมณ์ของคุณ</h2>
        <p>ให้ AI ช่วยวิเคราะห์อารมณ์จากใบหน้าและน้ำเสียงของคุณ</p>
      </div>

      {/* โหมดเดียว: กล้อง/อัปโหลดรูป */}

      <div className="detection-area">
        <div className="camera-preview">
          {selectedImage ? (
            <img src={selectedImage} alt="preview" className="preview-img" />
          ) : (
            <div className="camera-placeholder">
              <Camera className="camera-icon" />
              <p>เลือกรูปเพื่ออัปโหลด</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>
      </div>

      <div className="detection-controls">
        {!isDetecting ? (
          <button className="start-btn" disabled={!uploadedFile} onClick={() => analyzeFile(uploadedFile)}>
            <Play className="btn-icon" />
            วิเคราะห์อีกครั้ง
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStopDetection}>
            <Pause className="btn-icon" />
            หยุดการตรวจจับ
          </button>
        )}
        
        <button className="reset-btn" onClick={handleStopDetection}>
          <RotateCcw className="btn-icon" />
          รีเซ็ต
        </button>
      </div>

      {result && (
        <div className="emotion-result">
          <h3>ผลการวิเคราะห์</h3>
          <p>{result.emoji} {result.emotion}</p>
          {result.crop && (
            <div style={{ marginTop: 12 }}>
              <h4>บริเวณที่ถูกครอป</h4>
              <img src={result.crop} alt="face-crop" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          )}
        </div>
      )}

      {lastResponseJson && (
        <div className="emotion-result" style={{ marginTop: 16 }}>
          <h3>Response JSON (debug)</h3>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8,
            maxHeight: 240, overflow: 'auto', fontSize: 12
          }}>{lastResponseJson}</pre>
        </div>
      )}
    </div>
  );
};

export default EmotionDetection;
