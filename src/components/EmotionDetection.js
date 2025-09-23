import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Upload, Image, X, Camera, CameraOff } from 'lucide-react';
import './EmotionDetection.css';

const EmotionDetection = ({ onEmotionDetected, currentEmotion, onEmotionChange }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [lastResponseJson, setLastResponseJson] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ฟังก์ชันสำหรับกำหนดสีตามอารมณ์
  const getEmotionColor = (emotion) => {
    const emotionColors = {
      // อารมณ์บวก - สีส้ม
      'happy': '#ff6b35',
      'surprise': '#ff8c42',
      
      // อารมณ์ลบ - สีม่วง
      'sad': '#8b5cf6',
      'angry': '#7c3aed',
      'fear': '#a855f7',
      'disgust': '#9333ea',
      
      // อารมณ์ปกติ - สีฟ้า
      'neutral': '#3b82f6'
    };
    
    return emotionColors[emotion] || emotionColors['neutral'];
  };

  // ฟังก์ชันสำหรับกำหนด gradient ตามอารมณ์
  const getEmotionGradient = (emotion) => {
    const emotionGradients = {
      // อารมณ์บวก - สีส้ม
      'happy': 'linear-gradient(135deg, #ff6b35, #ff8c42, #ffa726)',
      'surprise': 'linear-gradient(135deg, #ff8c42, #ffb74d, #ffcc80)',
      
      // อารมณ์ลบ - สีม่วง
      'sad': 'linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)',
      'angry': 'linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)',
      'fear': 'linear-gradient(135deg, #a855f7, #c084fc, #d8b4fe)',
      'disgust': 'linear-gradient(135deg, #9333ea, #a855f7, #c084fc)',
      
      // อารมณ์ปกติ - สีฟ้า
      'neutral': 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)'
    };
    
    return emotionGradients[emotion] || emotionGradients['neutral'];
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
        if (onEmotionChange) onEmotionChange('neutral'); // รีเซ็ตเป็น neutral เมื่อเกิดข้อผิดพลาด
      } else {
        setResult({ emotion: data.emotion, emoji: "😊", crop: data.face_crop_image, coords: data.face_coords });
        if (onEmotionChange) onEmotionChange(data.emotion); // อัปเดตอารมณ์ปัจจุบัน
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
    stopCamera(); // ปิดกล้องด้วย
    if (onEmotionChange) onEmotionChange('neutral'); // รีเซ็ตอารมณ์เป็น neutral
  };

  // ฟังก์ชันสำหรับเปิดกล้อง
  const startCamera = async () => {
    try {
      setCameraError(null);
      console.log('Starting camera...');
      
      // ปิด stream เดิมถ้ามี
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setIsCameraOpen(true);
      console.log('Camera opened successfully');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(`ไม่สามารถเข้าถึงกล้องได้: ${error.message}`);
    }
  };

  // ฟังก์ชันสำหรับปิดกล้อง
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // ฟังก์ชันสำหรับถ่ายรูป
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Reverse ภาพใน Canvas เพื่อให้เหมือนกล้องหน้าจริง ๆ
      context.save();
      context.scale(-1, 1); // Reverse แนวนอน
      context.drawImage(video, -canvas.width, 0); // วาดภาพที่ตำแหน่งที่ reverse แล้ว
      context.restore();
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setUploadedFile(file);
          setSelectedImage(URL.createObjectURL(blob));
          await analyzeFile(file);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // จัดการ video element เมื่อ stream เปลี่ยน
  useEffect(() => {
    console.log('Stream useEffect triggered, stream:', stream, 'videoRef:', videoRef.current);
    if (stream && videoRef.current) {
      console.log('Setting video srcObject and playing...');
      videoRef.current.srcObject = stream;
      
      // รอให้ video element พร้อมแล้วค่อยเล่น
      const playVideo = () => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            console.log('Video started playing successfully');
          }).catch((error) => {
            console.error('Error playing video:', error);
          });
        }
      };
      
      // ถ้า video พร้อมแล้วให้เล่นเลย
      if (videoRef.current.readyState >= 3) {
        playVideo();
      } else {
        // ถ้ายังไม่พร้อมให้รอ
        videoRef.current.addEventListener('canplay', playVideo, { once: true });
      }
    }
  }, [stream]);

  // จัดการ isCameraOpen state
  useEffect(() => {
    console.log('isCameraOpen changed to:', isCameraOpen);
  }, [isCameraOpen]);

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);


  return (
    <div className="emotion-detection">
      <div className="detection-header">
        <h2>ตรวจจับอารมณ์ของคุณ</h2>
        <p>ให้ AI ช่วยวิเคราะห์อารมณ์จากใบหน้าและน้ำเสียงของคุณ</p>
        {currentEmotion !== 'neutral' && (
          <div className="current-emotion-indicator">
            <span className="emotion-label">อารมณ์ปัจจุบัน:</span>
            <span className="emotion-value">{getEmoji(currentEmotion)} {currentEmotion}</span>
          </div>
        )}
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
          ) : isCameraOpen ? (
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                onLoadedMetadata={() => {
                  console.log('Video loaded metadata');
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setCameraError('เกิดข้อผิดพลาดในการแสดงวิดีโอ');
                }}
                onCanPlay={() => {
                  console.log('Video can play');
                }}
                onPlay={() => {
                  console.log('Video started playing');
                }}
              />
              {cameraError && (
                <div className="camera-error">
                  <p>{cameraError}</p>
                </div>
              )}
              <div className="camera-controls">
                <button
                  className="capture-btn"
                  onClick={capturePhoto}
                  title="ถ่ายรูป"
                >
                  <Camera className="btn-icon" />
                  ถ่ายรูป
                </button>
                <button
                  className="stop-camera-btn"
                  onClick={stopCamera}
                  title="ปิดกล้อง"
                >
                  <CameraOff className="btn-icon" />
                  ปิดกล้อง
                </button>
              </div>
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

      {!selectedImage && !isCameraOpen && (
        <div className="camera-toggle">
          <button
            className="camera-btn"
            onClick={startCamera}
            title="เปิดกล้อง"
          >
            <Camera className="btn-icon" />
            เปิดกล้อง
          </button>
        </div>
      )}

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
          
          {selectedImage && (
            <button 
              className="retake-btn" 
              onClick={async () => {
                console.log('Retake button clicked');
                console.log('Current stream:', stream);
                console.log('Current isCameraOpen:', isCameraOpen);
                
                setSelectedImage(null);
                setUploadedFile(null);
                setResult(null);
                if (onEmotionChange) onEmotionChange('neutral');
                
                // รีเซ็ตกล้องและเปิดใหม่
                console.log('Resetting camera state...');
                setIsCameraOpen(false);
                
                // รอสักครู่แล้วเปิดกล้องใหม่
                setTimeout(async () => {
                  console.log('Starting camera after reset...');
                  await startCamera();
                }, 100);
              }}
              title="ถ่ายซ้ำ"
            >
              <Camera className="btn-icon" />
              ถ่ายซ้ำ
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

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default EmotionDetection;
