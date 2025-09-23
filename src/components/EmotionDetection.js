import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Upload, Image, X } from 'lucide-react';
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
    setUploadedFile(null);
    setLastResponseJson('');
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
            <div className="image-preview-container">
              <img src={selectedImage} alt="preview" className="preview-img" />
              <button 
                className="remove-image-btn" 
                onClick={handleStopDetection}
                title="ลบรูปภาพ"
              >
                <X className="remove-icon" />
              </button>
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-content">
                <div className="upload-icon-container">
                  <Image className="upload-icon" />
                  <Upload className="upload-arrow" />
                </div>
                <h3>อัปโหลดรูปภาพ</h3>
                <p>ลากและวางรูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                <div className="file-types">
                  <span>รองรับ: JPG, PNG, GIF</span>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-label">
                เลือกไฟล์
              </label>
            </div>
          )}
        </div>
      </div>

      {uploadedFile && (
        <div className="detection-controls">
          {!isDetecting ? (
            <button className="start-btn" onClick={() => analyzeFile(uploadedFile)}>
              <Play className="btn-icon" />
              วิเคราะห์อารมณ์
            </button>
          ) : (
            <button className="stop-btn" onClick={handleStopDetection}>
              <Pause className="btn-icon" />
              หยุดการวิเคราะห์
            </button>
          )}
          
          <button className="reset-btn" onClick={handleStopDetection}>
            <RotateCcw className="btn-icon" />
            เริ่มใหม่
          </button>
        </div>
      )}

      {result && (
        <div className="emotion-result">
          <h3>ผลการวิเคราะห์</h3>
          <p>{result.emoji} {result.emotion}</p>
          {result.crop && (
            <div className="face-crop-container">
              <h4>บริเวณที่ถูกครอป</h4>
              <img src={result.crop} alt="face-crop" className="face-crop-image" />
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
