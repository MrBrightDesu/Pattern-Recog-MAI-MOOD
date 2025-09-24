import React, { useState } from 'react';
import EmotionDetection from './EmotionDetection';
import FirebaseEmotionDetection from './FirebaseEmotionDetection';

const EmotionDetectionWrapper = ({ onEmotionDetected, currentEmotion, onEmotionChange }) => {
  const [useFirebase, setUseFirebase] = useState(false);

  const toggleMode = () => {
    setUseFirebase(!useFirebase);
  };

  return (
    <div className="emotion-detection-wrapper">
      {/* ปุ่มสลับโหมด */}
      <div className="mode-toggle-section">
        <button 
          className={`mode-toggle-btn ${!useFirebase ? 'active' : ''}`}
          onClick={() => setUseFirebase(false)}
        >
          💾 Local Mode
        </button>
        <button 
          className={`mode-toggle-btn ${useFirebase ? 'active' : ''}`}
          onClick={() => setUseFirebase(true)}
        >
          🔥 Firebase Mode
        </button>
      </div>

      {/* แสดงคำแนะนำ */}
      <div className="mode-info">
        {useFirebase ? (
          <div className="firebase-info">
            <h3>🔥 Firebase Mode (ฟรี!)</h3>
            <p>• บันทึกข้อมูลไป Firebase Firestore (ไม่ต้องเสียเงิน)</p>
            <p>• เก็บรูปภาพเป็น Base64 ใน Firestore</p>
            <p>• ต้องตั้งค่า Firebase ให้ถูกต้องก่อนใช้งาน</p>
            <p>• ข้อมูลจะถูกเก็บไว้ในระบบ Cloud</p>
          </div>
        ) : (
          <div className="local-info">
            <h3>💾 Local Mode</h3>
            <p>• บันทึกข้อมูลใน Local Storage และดาวน์โหลด JSON</p>
            <p>• ทำงานได้ทันทีไม่ต้องตั้งค่าอะไร</p>
            <p>• ข้อมูลจะถูกเก็บไว้ในเบราว์เซอร์</p>
          </div>
        )}
      </div>

      {/* แสดงคอมโพเนนต์ตามโหมดที่เลือก */}
      {useFirebase ? (
        <FirebaseEmotionDetection 
          onEmotionDetected={onEmotionDetected}
          currentEmotion={currentEmotion}
          onEmotionChange={onEmotionChange}
        />
      ) : (
        <EmotionDetection 
          onEmotionDetected={onEmotionDetected}
          currentEmotion={currentEmotion}
          onEmotionChange={onEmotionChange}
        />
      )}
    </div>
  );
};

export default EmotionDetectionWrapper;
