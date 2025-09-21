import React, { useState } from 'react';
import { Camera, Mic, Play, Pause, RotateCcw } from 'lucide-react';
import './EmotionDetection.css';

const EmotionDetection = ({ onEmotionDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMode, setDetectionMode] = useState('both'); // 'camera', 'audio', 'both'
  const [mockEmotions] = useState([
    { name: 'Happy', emoji: '😊', confidence: 0.85, color: '#10B981' },
    { name: 'Sad', emoji: '😢', confidence: 0.72, color: '#3B82F6' },
    { name: 'Angry', emoji: '😠', confidence: 0.68, color: '#EF4444' },
    { name: 'Surprised', emoji: '😲', confidence: 0.91, color: '#F59E0B' },
    { name: 'Fearful', emoji: '😨', confidence: 0.45, color: '#8B5CF6' },
    { name: 'Disgusted', emoji: '🤢', confidence: 0.33, color: '#6B7280' },
    { name: 'Neutral', emoji: '😐', confidence: 0.78, color: '#6B7280' }
  ]);

  const handleStartDetection = () => {
    setIsDetecting(true);
    
    // Simulate detection process
    setTimeout(() => {
      const randomEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
      onEmotionDetected(randomEmotion);
      setIsDetecting(false);
    }, 3000);
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
  };

  return (
    <div className="emotion-detection">
      <div className="detection-header">
        <h2>ตรวจจับอารมณ์ของคุณ</h2>
        <p>ให้ AI ช่วยวิเคราะห์อารมณ์จากใบหน้าและน้ำเสียงของคุณ</p>
      </div>

      <div className="detection-modes">
        <button 
          className={`mode-btn ${detectionMode === 'camera' ? 'active' : ''}`}
          onClick={() => setDetectionMode('camera')}
        >
          <Camera className="mode-icon" />
          <span>กล้อง</span>
        </button>
        
        <button 
          className={`mode-btn ${detectionMode === 'audio' ? 'active' : ''}`}
          onClick={() => setDetectionMode('audio')}
        >
          <Mic className="mode-icon" />
          <span>เสียง</span>
        </button>
        
        <button 
          className={`mode-btn ${detectionMode === 'both' ? 'active' : ''}`}
          onClick={() => setDetectionMode('both')}
        >
          <Camera className="mode-icon" />
          <Mic className="mode-icon" />
          <span>ทั้งสอง</span>
        </button>
      </div>

      <div className="detection-area">
        {detectionMode === 'camera' || detectionMode === 'both' ? (
          <div className="camera-preview">
            <div className="camera-placeholder">
              <Camera className="camera-icon" />
              <p>กล้องจะเปิดที่นี่</p>
            </div>
          </div>
        ) : null}

        {detectionMode === 'audio' || detectionMode === 'both' ? (
          <div className="audio-visualizer">
            <div className="audio-waves">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`wave ${isDetecting ? 'active' : ''}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p>พูดอะไรก็ได้เพื่อให้ AI วิเคราะห์อารมณ์</p>
          </div>
        ) : null}
      </div>

      <div className="detection-controls">
        {!isDetecting ? (
          <button className="start-btn" onClick={handleStartDetection}>
            <Play className="btn-icon" />
            เริ่มตรวจจับอารมณ์
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStopDetection}>
            <Pause className="btn-icon" />
            หยุดการตรวจจับ
          </button>
        )}
        
        <button className="reset-btn" onClick={() => setIsDetecting(false)}>
          <RotateCcw className="btn-icon" />
          รีเซ็ต
        </button>
      </div>

      <div className="emotion-preview">
        <h3>อารมณ์ที่สามารถตรวจจับได้</h3>
        <div className="emotion-grid">
          {mockEmotions.map((emotion, index) => (
            <div key={index} className="emotion-card">
              <span className="emotion-emoji">{emotion.emoji}</span>
              <span className="emotion-name">{emotion.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionDetection;
