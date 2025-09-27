import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Upload, Image, X, Camera, CameraOff, Mic, MicOff, Save, XCircle, Volume2 } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
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
  const [predictMode, setPredictMode] = useState('image'); // 'image', 'audio', 'both'
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioInputRef = useRef(null);
  const { currentUser } = useAuth();

  // ฟังก์ชันสำหรับกำหนดสีตามอารมณ์
  const getEmotionColor = (emotion) => {
    const emotionColors = {
      // อารมณ์บวก - สีส้ม
      'happiness': '#ff6b35',
      'surprise': '#ff8c42',
      
      // อารมณ์ลบ - สีม่วง
      'sadness': '#8b5cf6',
      'anger': '#7c3aed',
      'fear': '#a855f7',
      'disgust': '#9333ea',
      
      // อารมณ์ปกติ - สีฟ้า
      'neutral': '#3b82f6',
      
      // Backward compatibility
      'happy': '#ff6b35',
      'sad': '#8b5cf6',
      'angry': '#7c3aed'
    };
    
    return emotionColors[emotion] || emotionColors['neutral'];
  };

  // ฟังก์ชันสำหรับกำหนด gradient ตามอารมณ์
  const getEmotionGradient = (emotion) => {
    const emotionGradients = {
      // อารมณ์บวก - สีส้ม
      'happiness': 'linear-gradient(135deg, #ff6b35, #ff8c42, #ffa726)',
      'surprise': 'linear-gradient(135deg, #ff8c42, #ffb74d, #ffcc80)',
      
      // อารมณ์ลบ - สีม่วง
      'sadness': 'linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)',
      'anger': 'linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)',
      'fear': 'linear-gradient(135deg, #a855f7, #c084fc, #d8b4fe)',
      'disgust': 'linear-gradient(135deg, #9333ea, #a855f7, #c084fc)',
      
      // อารมณ์ปกติ - สีฟ้า
      'neutral': 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)',
      
      // Backward compatibility
      'happy': 'linear-gradient(135deg, #ff6b35, #ff8c42, #ffa726)',
      'sad': 'linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)',
      'angry': 'linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)'
    };
    
    return emotionGradients[emotion] || emotionGradients['neutral'];
  };

  // ฟังก์ชันสำหรับกำหนด emoji ตามอารมณ์
  const getEmoji = (emotion) => {
    const emotionEmojis = {
      'happiness': '😊',
      'surprise': '😲',
      'sadness': '😢',
      'anger': '😠',
      'fear': '😨',
      'disgust': '🤢',
      'neutral': '😐',
      
      // Backward compatibility
      'happy': '😊',
      'sad': '😢',
      'angry': '😠'
    };
    
    return emotionEmojis[emotion] || '😐';
  };

  const analyzeFile = async (file, audioFile = null) => {
    if (!file && !audioFile) return;
    setIsDetecting(true);
    try {
      const formData = new FormData();
      const apiBase = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
      let endpoint = '/predict';
      
      if (predictMode === 'image' && file) {
        formData.append("file", file);
        endpoint = '/predict';
      } else if (predictMode === 'audio' && audioFile) {
        formData.append("file", audioFile);
        endpoint = '/predict-audio';
      } else if (predictMode === 'both' && file && audioFile) {
        formData.append("image", file);
        formData.append("audio", audioFile);
        endpoint = '/predict-both';
      } else {
        throw new Error('กรุณาเลือกไฟล์ที่เหมาะสมกับโหมดการวิเคราะห์');
      }

      const res = await fetch(`${apiBase}${endpoint}`, { method: "POST", body: formData });
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
        setResult({ 
          emotion: data.emotion, 
          emoji: getEmoji(data.emotion), 
          crop: data.face_crop_image, 
          coords: data.face_coords,
          imageEmotion: data.image_emotion,
          audioEmotion: data.audio_emotion,
          confidence: data.confidence
        });
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
    if (predictMode === 'image' || predictMode === 'both') {
      await analyzeFile(file, audioFile);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioFile(file);
    if (predictMode === 'audio' || predictMode === 'both') {
      await analyzeFile(uploadedFile, file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(file);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
        if (predictMode === 'audio' || predictMode === 'both') {
          analyzeFile(uploadedFile, file);
        }
      };
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
    setSelectedImage(null);
    setResult(null);
    setUploadedFile(null);
    setAudioFile(null);
    setLastResponseJson('');
    stopCamera();
    if (onEmotionChange) onEmotionChange('neutral');
  };

  const handleSave = async () => {
    if (!result || !currentUser) {
      console.error('No result or user to save');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus({ type: 'info', message: 'กำลังบันทึกข้อมูล...' });

      // เตรียมข้อมูลที่จะบันทึก
      const saveData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'ผู้ใช้',
        timestamp: serverTimestamp(),
        predictMode: predictMode,
        emotion: result.emotion,
        confidence: result.confidence || 0,
        imageEmotion: result.imageEmotion || null,
        audioEmotion: result.audioEmotion || null,
        faceCoords: result.coords || null,
        hasImage: !!uploadedFile,
        hasAudio: !!audioFile,
        createdAt: new Date().toISOString(),
        // ข้อมูลเพิ่มเติม
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        }
      };

      // บันทึกข้อมูลเข้า Firestore
      const docRef = await addDoc(collection(db, 'emotionAnalysis'), saveData);
      
      console.log('Document written with ID: ', docRef.id);
      
      setSaveStatus({ 
        type: 'success', 
        message: 'บันทึกข้อมูลสำเร็จ!' 
      });

      // รีเซ็ตสถานะหลังจาก 3 วินาที
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving to Firestore: ', error);
      setSaveStatus({ 
        type: 'error', 
        message: `เกิดข้อผิดพลาด: ${error.message}` 
      });
    } finally {
      setIsSaving(false);
    }
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

      {/* เลือกโหมดการวิเคราะห์ */}
      <div className="predict-mode-selector">
        <h3>เลือกโหมดการวิเคราะห์</h3>
        <div className="mode-options">
          <label className={`mode-option ${predictMode === 'image' ? 'active' : ''}`}>
            <input
              type="radio"
              name="predictMode"
              value="image"
              checked={predictMode === 'image'}
              onChange={(e) => setPredictMode(e.target.value)}
            />
            <Image className="mode-icon" />
            <span>ภาพอย่างเดียว</span>
          </label>
          <label className={`mode-option ${predictMode === 'audio' ? 'active' : ''}`}>
            <input
              type="radio"
              name="predictMode"
              value="audio"
              checked={predictMode === 'audio'}
              onChange={(e) => setPredictMode(e.target.value)}
            />
            <Volume2 className="mode-icon" />
            <span>เสียงอย่างเดียว</span>
          </label>
          <label className={`mode-option ${predictMode === 'both' ? 'active' : ''}`}>
            <input
              type="radio"
              name="predictMode"
              value="both"
              checked={predictMode === 'both'}
              onChange={(e) => setPredictMode(e.target.value)}
            />
            <div className="mode-icons">
              <Camera className="mode-icon" />
              <Volume2 className="mode-icon" />
            </div>
            <span>ทั้งคู่</span>
          </label>
        </div>
      </div>

      {/* โหมดเดียว: กล้อง/อัปโหลดรูป */}

      {/* ส่วนสำหรับภาพ - แสดงเฉพาะเมื่อไม่ใช่โหมดเสียงอย่างเดียว */}
      {predictMode !== 'audio' && (
        <div className="upload-section">
          <h3>อัปโหลดรูปภาพ</h3>
          <div className="upload-container">
          {selectedImage ? (
              <div className="preview-container">
            <img src={selectedImage} alt="preview" className="preview-img" />
                <button 
                  className="remove-btn" 
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
                  <div className="error-message">
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
                  <h4>อัปโหลดรูปภาพ</h4>
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
                  เลือกไฟล์ภาพ
                </label>
                
                {/* คำว่า "หรือเปิดกล้อง" ใต้กรอบอัปโหลด */}
                <div className="upload-alternative">
                  <span className="alternative-text">หรือ</span>
                  <button
                    className="camera-btn-inline"
                    onClick={startCamera}
                    title="เปิดกล้อง"
                  >
                    <Camera className="btn-icon" />
                    เปิดกล้อง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ส่วนสำหรับเสียง */}
      {predictMode === 'audio' && (
        <div className="upload-section">
          <h3>อัปโหลดไฟล์เสียง</h3>
          <div className="upload-container">
            {audioFile ? (
              <div className="preview-container">
                <div className="file-preview">
                  <Volume2 className="file-icon" />
                  <div className="file-info">
                    <h4>ไฟล์เสียง</h4>
                    <p>{audioFile.name}</p>
                  </div>
                </div>
                <button 
                  className="remove-btn" 
                  onClick={() => setAudioFile(null)}
                  title="ลบไฟล์เสียง"
                >
                  <X className="remove-icon" />
                </button>
              </div>
            ) : (
              <div className="upload-area">
                <div className="upload-content">
                  <div className="upload-icon-container">
                    <Volume2 className="upload-icon" />
                    <Upload className="upload-arrow" />
                  </div>
                  <h4>อัปโหลดไฟล์เสียง</h4>
                  <p>ลากและวางไฟล์เสียงที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                  <div className="file-types">
                    <span>รองรับ: WAV, MP3, M4A</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioUpload}
                  className="file-input"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="upload-label">
                  เลือกไฟล์เสียง
                </label>
                
                {/* คำว่า "หรือบันทึกเสียงใหม่" ใต้กรอบอัปโหลด */}
                <div className="upload-alternative">
                  <span className="alternative-text">หรือ</span>
                  <div className="recording-buttons">
                    {!isRecording ? (
                      <button
                        className="record-btn-inline"
                        onClick={startRecording}
                        title="เริ่มบันทึกเสียง"
                      >
                        <Mic className="btn-icon" />
                        บันทึกเสียงใหม่
                      </button>
                    ) : (
                      <button
                        className="stop-record-btn-inline"
                        onClick={stopRecording}
                        title="หยุดบันทึกเสียง"
                      >
                        <MicOff className="btn-icon" />
                        หยุดบันทึก
                      </button>
                    )}
                  </div>
                </div>
                
                {isRecording && (
                  <div className="recording-indicator">
                    <div className="recording-dot"></div>
                    <span>กำลังบันทึกเสียง...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ส่วนสำหรับเสียงในโหมดทั้งคู่ */}
      {predictMode === 'both' && (
        <div className="upload-section">
          <h3>เพิ่มไฟล์เสียง</h3>
          <div className="upload-container">
            {audioFile ? (
              <div className="preview-container">
                <div className="file-preview">
                  <Volume2 className="file-icon" />
                  <div className="file-info">
                    <h4>ไฟล์เสียง</h4>
                    <p>{audioFile.name}</p>
                  </div>
                </div>
                <button 
                  className="remove-btn" 
                  onClick={() => setAudioFile(null)}
                  title="ลบไฟล์เสียง"
                >
                  <X className="remove-icon" />
                </button>
              </div>
            ) : (
              <div className="upload-area">
                <div className="upload-content">
                  <div className="upload-icon-container">
                    <Volume2 className="upload-icon" />
                    <Upload className="upload-arrow" />
                  </div>
                  <h4>อัปโหลดไฟล์เสียง</h4>
                  <p>ลากและวางไฟล์เสียงที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                  <div className="file-types">
                    <span>รองรับ: WAV, MP3, M4A</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioUpload}
                  className="file-input"
                  id="audio-upload-both"
                />
                <label htmlFor="audio-upload-both" className="upload-label">
                  เลือกไฟล์เสียง
                </label>
                
                {/* คำว่า "หรือบันทึกเสียงใหม่" ใต้กรอบอัปโหลด */}
                <div className="upload-alternative">
                  <span className="alternative-text">หรือ</span>
                  <div className="recording-buttons">
                    {!isRecording ? (
                      <button
                        className="record-btn-inline"
                        onClick={startRecording}
                        title="เริ่มบันทึกเสียง"
                      >
                        <Mic className="btn-icon" />
                        บันทึกเสียงใหม่
                      </button>
                    ) : (
                      <button
                        className="stop-record-btn-inline"
                        onClick={stopRecording}
                        title="หยุดบันทึกเสียง"
                      >
                        <MicOff className="btn-icon" />
                        หยุดบันทึก
                      </button>
                    )}
                  </div>
                </div>
                
                {isRecording && (
                  <div className="recording-indicator">
                    <div className="recording-dot"></div>
                    <span>กำลังบันทึกเสียง...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Detection Controls - แสดงเมื่อมีไฟล์ที่เหมาะสมกับโหมด */}
      {((predictMode === 'image' && uploadedFile) || 
        (predictMode === 'audio' && audioFile) || 
        (predictMode === 'both' && uploadedFile && audioFile)) && (
      <div className="detection-controls">
        {!isDetecting ? (
            <button className="start-btn" onClick={() => analyzeFile(uploadedFile, audioFile)}>
            <Play className="btn-icon" />
              วิเคราะห์อารมณ์
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStopDetection}>
            <Pause className="btn-icon" />
              หยุดการวิเคราะห์
            </button>
          )}
          
          {selectedImage && predictMode !== 'audio' && (
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
          
          {predictMode === 'both' && result.imageEmotion && result.audioEmotion ? (
            <div className="combined-results">
              <div className="main-result">
                <h4>ผลรวม</h4>
                <p className="main-emotion">{result.emoji} {result.emotion}</p>
                {result.confidence && (
                  <p className="confidence">ความมั่นใจ: {(result.confidence * 100).toFixed(1)}%</p>
                )}
              </div>
              
              <div className="individual-results">
                <div className="result-item">
                  <h5>จากภาพ</h5>
                  <p>{getEmoji(result.imageEmotion)} {result.imageEmotion}</p>
                </div>
                <div className="result-item">
                  <h5>จากเสียง</h5>
                  <p>{getEmoji(result.audioEmotion)} {result.audioEmotion}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="single-result">
              <p className="main-emotion">{result.emoji} {result.emotion}</p>
              {result.confidence && (
                <p className="confidence">ความมั่นใจ: {(result.confidence * 100).toFixed(1)}%</p>
              )}
            </div>
          )}
          
          {result.crop && (
            <div className="face-crop-container">
              <h4>บริเวณที่ถูกครอป</h4>
              <img src={result.crop} alt="face-crop" className="face-crop-image" />
            </div>
          )}
          
          {/* ปุ่มบันทึก/ยกเลิก */}
          <div className="result-actions">
            <button 
              className={`save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="loading-spinner"></div>
              ) : (
                <Save className="btn-icon" />
              )}
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกผลการวิเคราะห์'}
            </button>
            <button className="cancel-btn" onClick={handleStopDetection}>
              <XCircle className="btn-icon" />
              เริ่มใหม่
            </button>
          </div>
          
          {/* แสดงสถานะการบันทึก */}
          {saveStatus && (
            <div className={`save-status ${saveStatus.type}`}>
              {saveStatus.type === 'success' ? '✅' : saveStatus.type === 'error' ? '❌' : '⏳'} {saveStatus.message}
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
