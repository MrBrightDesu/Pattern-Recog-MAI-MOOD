import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Upload, Image, X, Save } from 'lucide-react';
import './EmotionDetection.css';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FirebaseEmotionDetection = ({ onEmotionDetected, currentEmotion, onEmotionChange }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [lastResponseJson, setLastResponseJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // ฟังก์ชันสำหรับกำหนดสีตามอารมณ์
  const getEmotionColor = (emotion) => {
    const emotionColors = {
      'happy': '#ff6b35',
      'surprise': '#ff8c42',
      'sad': '#8b5cf6',
      'angry': '#7c3aed',
      'fear': '#a855f7',
      'disgust': '#9333ea',
      'neutral': '#3b82f6'
    };
    
    return emotionColors[emotion] || emotionColors['neutral'];
  };

  // ฟังก์ชันสำหรับกำหนด emoji ตามอารมณ์
  const getEmoji = (emotion) => {
    const emotionEmojis = {
      'happy': '😊',
      'surprise': '😲',
      'sad': '😢',
      'angry': '😠',
      'fear': '😨',
      'disgust': '🤢',
      'neutral': '😐'
    };
    
    return emotionEmojis[emotion] || '😐';
  };

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
        if (onEmotionChange) onEmotionChange('neutral');
      } else {
        setResult({ emotion: data.emotion, emoji: "😊", crop: data.face_crop_image, coords: data.face_coords });
        if (onEmotionChange) onEmotionChange(data.emotion);
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
    setSaveStatus(null);
    if (onEmotionChange) onEmotionChange('neutral');
  };

  // ฟังก์ชันบันทึกข้อมูลไป Firebase (ใช้ Firestore)
  const handleSaveToFirebase = async () => {
    if (!result || !uploadedFile) {
      setSaveStatus({ type: 'error', message: 'ไม่มีข้อมูลที่จะบันทึก' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // แปลงไฟล์เป็น base64 สำหรับเก็บใน Firestore
      let originalImageBase64 = null;
      try {
        const reader = new FileReader();
        originalImageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        console.log('✅ Original image converted to base64');
      } catch (error) {
        console.warn('❌ Failed to convert original image to base64:', error);
        setSaveStatus({ type: 'error', message: 'แปลงรูปภาพไม่สำเร็จ' });
        return;
      }

      // บันทึกข้อมูลไป Firestore
      const emotionData = {
        emotion: result.emotion,
        faceCoords: result.coords || null,
        timestamp: serverTimestamp(),
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        // เก็บรูปเป็น base64 ใน Firestore
        originalImageBase64: originalImageBase64,
        cropImageBase64: result.crop || null,
        // ข้อมูลเพิ่มเติม
        analysisDate: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        deviceInfo: {
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled
        },
        // ระบุว่าใช้ Firestore แทน Storage
        storageMethod: 'firestore-base64',
        hasImages: !!(originalImageBase64 || result.crop)
      };

      console.log('💾 Saving to Firestore:', emotionData);
      const docRef = await addDoc(collection(db, 'emotionAnalysis'), emotionData);
      
      setSaveStatus({ 
        type: 'success', 
        message: `🎉 บันทึกสำเร็จ! ID: ${docRef.id}` 
      });

      // รีเซ็ตสถานะหลังจาก 5 วินาที
      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);

    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      
      let errorMessage = 'บันทึกไม่สำเร็จ';
      if (error.message.includes('permission')) {
        errorMessage = '❌ ไม่มีสิทธิ์ในการบันทึก - ตรวจสอบ Firebase Rules';
      } else if (error.message.includes('network')) {
        errorMessage = '🌐 ปัญหาเครือข่าย - ลองใหม่อีกครั้ง';
      } else if (error.message.includes('quota')) {
        errorMessage = '📊 เกินโควต้า Firestore - ลองใหม่อีกครั้ง';
      } else {
        errorMessage = `❌ บันทึกไม่สำเร็จ: ${error.message}`;
      }
      
      setSaveStatus({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="emotion-detection">
      <div className="detection-header">
        <h2>🔥 Firebase Emotion Detection</h2>
        <p>ระบบตรวจจับอารมณ์พร้อมบันทึกข้อมูลไป Firebase Firestore</p>
        {currentEmotion !== 'neutral' && (
          <div className="current-emotion-indicator">
            <span className="emotion-label">อารมณ์ปัจจุบัน:</span>
            <span className="emotion-value">{getEmoji(currentEmotion)} {currentEmotion}</span>
          </div>
        )}
      </div>

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
          
          {/* ปุ่มบันทึกไป Firebase */}
          <div className="save-section">
            <button 
              className={`save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSaveToFirebase}
              disabled={isSaving}
            >
              <Save className="btn-icon" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกไป Firebase'}
            </button>
            
            {saveStatus && (
              <div className={`save-status ${saveStatus.type}`}>
                {saveStatus.type === 'success' ? '✅' : saveStatus.type === 'info' ? '🔄' : '❌'} {saveStatus.message}
              </div>
            )}
          </div>
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

export default FirebaseEmotionDetection;
