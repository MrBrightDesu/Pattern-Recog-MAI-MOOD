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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [predictMode, setPredictMode] = useState('image'); // 'image', 'audio', 'both'
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  // Web Audio API recording states (true WAV without ffmpeg)
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorNodeRef = useRef(null);
  const recordedBuffersRef = useRef([]);
  const recordingSampleRateRef = useRef(44100);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [audioDebug, setAudioDebug] = useState({ durationSec: null, sampleRate: null, sizeKB: null });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioInputRef = useRef(null);
  const { currentUser } = useAuth();

  // ฟังก์ชันสำหรับกำหนดสีตามอารมณ์ (ใช้ฐานสีรวม)
  const getEmotionColor = (emotion) => {
    const e = String(emotion || '').toLowerCase();
    const isPositive = e === 'happiness' || e === 'surprise' || e === 'happy';
    const isNegative = e === 'sadness' || e === 'anger' || e === 'fear' || e === 'disgust' || e === 'sad' || e === 'angry';
    if (isPositive) return '#FBEE95';
    if (isNegative) return '#C0AFE2';
    return '#3b82f6';
  };

  // ฟังก์ชันสำหรับกำหนด gradient ตามอารมณ์ (ใช้ฐานสีรวม)
  const getEmotionGradient = (emotion) => {
    const e = String(emotion || '').toLowerCase();
    const isPositive = e === 'happiness' || e === 'surprise' || e === 'happy';
    const isNegative = e === 'sadness' || e === 'anger' || e === 'fear' || e === 'disgust' || e === 'sad' || e === 'angry';
    if (isPositive) return 'linear-gradient(135deg, #FBEE95, #FFF4B8, #FFFBE0)';
    if (isNegative) return 'linear-gradient(135deg, #C0AFE2, #D7C7EB, #E9DEF5)';
    return 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)';
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
      } else {
        const text = await res.text();
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
      
    } finally {
      setIsDetecting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // ตรวจสอบชนิดของไฟล์ภาพ
    if (!validateFileType(file, 'image')) {
      setSaveStatus({ 
        type: 'error', 
        message: 'ไฟล์ภาพไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ GIF เท่านั้น' 
      });
      // รีเซ็ต input
      e.target.value = '';
      return;
    }
    
    setUploadedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    if (predictMode === 'image' || predictMode === 'both') {
      await analyzeFile(file, audioFile);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // ตรวจสอบชนิดของไฟล์เสียง
    if (!validateFileType(file, 'audio')) {
      setSaveStatus({ 
        type: 'error', 
        message: 'ไฟล์เสียงไม่ถูกต้อง กรุณาเลือกไฟล์ WAV, MP3 หรือ M4A เท่านั้น' 
      });
      // รีเซ็ต input
      e.target.value = '';
      return;
    }
    
    setAudioFile(file);
    // best-effort debug for uploaded audio
    computeAudioDebug(file);
    if (predictMode === 'audio' || predictMode === 'both') {
      await analyzeFile(uploadedFile, file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create AudioContext (sample rate may vary per device)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      recordingSampleRateRef.current = audioContext.sampleRate;
      recordedBuffersRef.current = [];

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        // Clone the buffer to detach from the underlying AudioBuffer
        recordedBuffersRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      mediaStreamRef.current = stream;
      sourceNodeRef.current = source;
      processorNodeRef.current = processor;

      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    try {
      // Disconnect nodes
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }

      // Stop stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Close audio context
      if (audioContextRef.current && typeof audioContextRef.current.close === 'function') {
        audioContextRef.current.close().catch(() => {});
      }

      // Build WAV from recorded float buffers
      const floatBuffers = recordedBuffersRef.current || [];
      const sampleRate = recordingSampleRateRef.current || 44100;

      const wavBlob = buildWavBlobFromFloat32(floatBuffers, sampleRate);
      const file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
      setAudioFile(file);
      computeAudioDebug(file, sampleRate);

      // Cleanup refs
      audioContextRef.current = null;
      mediaStreamRef.current = null;
      sourceNodeRef.current = null;
      processorNodeRef.current = null;
      recordedBuffersRef.current = [];

      if (predictMode === 'audio' || predictMode === 'both') {
        analyzeFile(uploadedFile, file);
      }
    } finally {
      setIsRecording(false);
    }
  };

  // Compute duration, sample rate, and size for audio debug
  const computeAudioDebug = async (file, fallbackSampleRate) => {
    try {
      const sizeKB = Math.round((file.size / 1024) * 10) / 10;
      let sampleRate = fallbackSampleRate || null;
      let durationSec = null;

      const arrayBuffer = await file.arrayBuffer();
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      durationSec = Math.round(audioBuffer.duration * 10) / 10;
      sampleRate = audioBuffer.sampleRate;
      await ctx.close();

      setAudioDebug({ durationSec, sampleRate, sizeKB });
    } catch (e) {
      setAudioDebug({
        durationSec: null,
        sampleRate: fallbackSampleRate || null,
        sizeKB: Math.round((file.size / 1024) * 10) / 10,
      });
    }
  };

  // Build a WAV Blob (PCM 16-bit, mono) from Float32 buffers
  const buildWavBlobFromFloat32 = (float32Buffers, sampleRate) => {
    // Concatenate Float32 chunks
    let totalLength = 0;
    for (const buf of float32Buffers) totalLength += buf.length;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of float32Buffers) {
      merged.set(buf, offset);
      offset += buf.length;
    }

    // Convert Float32 [-1,1] to 16-bit PCM
    const bufferLength = merged.length;
    const pcm16 = new Int16Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      let s = Math.max(-1, Math.min(1, merged[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Create WAV header for mono, 16-bit PCM
    const bytesPerSample = 2;
    const numChannels = 1;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm16.byteLength;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM samples
    let idx = 44;
    for (let i = 0; i < pcm16.length; i++, idx += 2) {
      view.setInt16(idx, pcm16[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
    setSelectedImage(null);
    setResult(null);
    setUploadedFile(null);
    setAudioFile(null);
    
    stopCamera();
    if (onEmotionChange) onEmotionChange('neutral');
  };

  // ฟังก์ชันตรวจสอบชนิดของไฟล์
  const validateFileType = (file, expectedType) => {
    if (!file) return true; // ถ้าไม่มีไฟล์ให้ผ่าน
    
    const fileType = file.type.toLowerCase();
    
    if (expectedType === 'image') {
      return fileType.startsWith('image/') && 
             ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(fileType);
    } else if (expectedType === 'audio') {
      return fileType.startsWith('audio/') && 
             ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/mp4'].includes(fileType);
    }
    
    return false;
  };

  // ฟังก์ชันตรวจสอบว่าสามารถบันทึกได้หรือไม่
  const canSave = () => {
    if (predictMode === 'image') {
      return uploadedFile && validateFileType(uploadedFile, 'image');
    }
    if (predictMode === 'audio') {
      return audioFile && validateFileType(audioFile, 'audio');
    }
    if (predictMode === 'both') {
      return uploadedFile && audioFile && 
             validateFileType(uploadedFile, 'image') && 
             validateFileType(audioFile, 'audio');
    }
    return false;
  };

  // ฟังก์ชันให้เหตุผลที่ปุ่มบันทึกถูกปิดใช้งาน
  const getSaveDisabledReason = () => {
    if (predictMode === 'image') {
      if (!uploadedFile) return 'กรุณาเพิ่มไฟล์ภาพก่อนบันทึก';
      if (!validateFileType(uploadedFile, 'image')) return 'ไฟล์ภาพไม่ถูกต้อง';
    }
    if (predictMode === 'audio') {
      if (!audioFile) return 'กรุณาเพิ่มไฟล์เสียงก่อนบันทึก';
      if (!validateFileType(audioFile, 'audio')) return 'ไฟล์เสียงไม่ถูกต้อง';
    }
    if (predictMode === 'both') {
      // ตรวจสอบไฟล์ภาพก่อน
      if (!uploadedFile) return 'กรุณาเพิ่มไฟล์ภาพก่อนบันทึก';
      if (uploadedFile && !validateFileType(uploadedFile, 'image')) return 'ไฟล์ภาพไม่ถูกต้อง';
      // ตรวจสอบไฟล์เสียง
      if (!audioFile) return 'กรุณาเพิ่มไฟล์เสียงก่อนบันทึก';
      if (audioFile && !validateFileType(audioFile, 'audio')) return 'ไฟล์เสียงไม่ถูกต้อง';
    }
    return '';
  };

  const handleSave = async () => {
    if (!result || !currentUser) {
      console.error('No result or user to save');
      return;
    }

    // ตรวจสอบไฟล์ที่จำเป็นตามโหมดการวิเคราะห์
    if (predictMode === 'image') {
      if (!uploadedFile) {
        setSaveStatus({ 
          type: 'error', 
          message: 'กรุณาเพิ่มไฟล์ภาพก่อนบันทึก' 
        });
        return;
      }
      if (!validateFileType(uploadedFile, 'image')) {
        setSaveStatus({ 
          type: 'error', 
          message: 'ไฟล์ภาพไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ GIF เท่านั้น' 
        });
        return;
      }
    }

    if (predictMode === 'audio') {
      if (!audioFile) {
        setSaveStatus({ 
          type: 'error', 
          message: 'กรุณาเพิ่มไฟล์เสียงก่อนบันทึก' 
        });
        return;
      }
      if (!validateFileType(audioFile, 'audio')) {
        setSaveStatus({ 
          type: 'error', 
          message: 'ไฟล์เสียงไม่ถูกต้อง กรุณาเลือกไฟล์ WAV, MP3 หรือ M4A เท่านั้น' 
        });
        return;
      }
    }

    if (predictMode === 'both') {
      if (!uploadedFile) {
        setSaveStatus({ 
          type: 'error', 
          message: 'กรุณาเพิ่มไฟล์ภาพก่อนบันทึก' 
        });
        return;
      }
      if (!audioFile) {
        setSaveStatus({ 
          type: 'error', 
          message: 'กรุณาเพิ่มไฟล์เสียงก่อนบันทึก' 
        });
        return;
      }
      if (!validateFileType(uploadedFile, 'image')) {
        setSaveStatus({ 
          type: 'error', 
          message: 'ไฟล์ภาพไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ GIF เท่านั้น' 
        });
        return;
      }
      if (!validateFileType(audioFile, 'audio')) {
        setSaveStatus({ 
          type: 'error', 
          message: 'ไฟล์เสียงไม่ถูกต้อง กรุณาเลือกไฟล์ WAV, MP3 หรือ M4A เท่านั้น' 
        });
        return;
      }
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
        // เก็บข้อมูลชนิดของไฟล์
        imageFileType: uploadedFile ? uploadedFile.type : null,
        audioFileType: audioFile ? audioFile.type : null,
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
                    <audio controls src={URL.createObjectURL(audioFile)} style={{ marginTop: 8, width: '100%' }} />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      {audioDebug.sampleRate ? `Sample Rate: ${audioDebug.sampleRate} Hz` : 'Sample Rate: -'}
                      {`  |  Size: ${audioDebug.sizeKB ?? '-'} KB`}
                      {`  |  Duration: ${audioDebug.durationSec ?? '-'} s`}
                    </div>
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
                    <audio controls src={URL.createObjectURL(audioFile)} style={{ marginTop: 8, width: '100%' }} />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      {audioDebug.sampleRate ? `Sample Rate: ${audioDebug.sampleRate} Hz` : 'Sample Rate: -'}
                      {`  |  Size: ${audioDebug.sizeKB ?? '-'} KB`}
                      {`  |  Duration: ${audioDebug.durationSec ?? '-'} s`}
                    </div>
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


      {/* ข้อความแจ้งเตือนสำหรับโหมดทั้งคู่ */}
      {predictMode === 'both' && (!uploadedFile || !audioFile) && (
        <div className="missing-files-warning">
          <div className="warning-content">
            <h4>⚠️ ต้องการไฟล์ครบทั้งสองประเภท</h4>
            <p>กรุณาเพิ่มไฟล์ภาพและไฟล์เสียงเพื่อเริ่มการวิเคราะห์</p>
            <div className="missing-files-list">
              {!uploadedFile && (
                <div className="missing-file-item">
                  <Image className="missing-icon" />
                  <span>ยังไม่มีไฟล์ภาพ</span>
                </div>
              )}
              {!audioFile && (
                <div className="missing-file-item">
                  <Volume2 className="missing-icon" />
                  <span>ยังไม่มีไฟล์เสียง</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ข้อความแจ้งเตือนไฟล์ผิดประเภทสำหรับโหมดทั้งคู่ */}
      {predictMode === 'both' && (uploadedFile || audioFile) && (
        <div className="file-validation-warnings">
          {uploadedFile && !validateFileType(uploadedFile, 'image') && (
            <div className="file-validation-warning error">
              <Image className="warning-icon" />
              <span>ไฟล์ภาพไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ GIF</span>
            </div>
          )}
          {audioFile && !validateFileType(audioFile, 'audio') && (
            <div className="file-validation-warning error">
              <Volume2 className="warning-icon" />
              <span>ไฟล์เสียงไม่ถูกต้อง กรุณาเลือกไฟล์ WAV, MP3 หรือ M4A</span>
            </div>
          )}
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
              disabled={isSaving || !canSave()}
              title={!canSave() ? getSaveDisabledReason() : ''}
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


      

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default EmotionDetection;
