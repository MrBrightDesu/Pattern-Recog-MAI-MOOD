import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import EmotionDetection from './components/EmotionDetection';
import ActivityRecommendation from './components/ActivityRecommendation';
import CommunityBoard from './components/CommunityBoard';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Main App Content Component
function AppContent() {
  const [currentView, setCurrentView] = useState('detection');
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const [userProfile, setUserProfile] = useState({
    name: 'ผู้ใช้',
    moodHistory: [],
    completedActivities: []
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const { currentUser } = useAuth();

  // Reset to detection page when user logs in
  React.useEffect(() => {
    if (currentUser) {
      setCurrentView('detection');
      setDetectedEmotion('neutral');
    }
  }, [currentUser]);

  const handleEmotionDetected = (emotion) => {
    setDetectedEmotion(emotion);
    setCurrentView('recommendations');
  };

  const handleEmotionChange = (emotion) => {
    setDetectedEmotion(emotion);
  };

  // ฟังก์ชันสำหรับกำหนดสีพื้นหลังตามอารมณ์ (แบบ fade) - ใช้โทนรวมตามกลุ่มบวก/ลบ
  const getEmotionBackground = (emotion) => {
<<<<<<< HEAD
    const emotionBackgrounds = {
      // อารมณ์บวก - สีส้ม (แบบ fade)
      'happy': `
        radial-gradient(circle at 20% 50%, rgba(248, 214, 78, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(249, 217, 91, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(245, 194, 119, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #ffdc42ff, #eeb18bff, #ffa726)
      `,
      'surprise': `
        radial-gradient(circle at 30% 40%, rgba(249, 183, 141, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, rgba(255, 183, 77, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 20%, rgba(255, 204, 128, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #ffdc42ff, #ffd84dff, #f9db62ff)
      `,
      
      // อารมณ์ลบ - สีม่วง (แบบ fade)
      'sad': `
        radial-gradient(circle at 25% 30%, rgba(139, 92, 246, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #926aeeff, #a855f7, #c084fc)
      `,
      'angry': `
        radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 60% 40%, rgba(168, 85, 247, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)
      `,
      'fear': `
        radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 60% 40%, rgba(192, 132, 252, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(216, 180, 254, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #a855f7, #c084fc, #d8b4fe)
      `,
      'disgust': `
        radial-gradient(circle at 30% 70%, rgba(147, 51, 234, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 70% 30%, rgba(168, 85, 247, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #9333ea, #a855f7, #c084fc)
      `,
      
      // อารมณ์ปกติ - สีฟ้า (แบบ fade)
      'neutral': `
        radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(96, 165, 250, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)
      `
    };
    
    return emotionBackgrounds[emotion] || emotionBackgrounds['neutral'];
=======
    const e = String(emotion || '').toLowerCase();
    const isPositive = e === 'happy' || e === 'happiness' || e === 'surprise';
    const isNegative = e === 'sad' || e === 'sadness' || e === 'angry' || e === 'anger' || e === 'fear' || e === 'disgust';
    if (isPositive) {
  // ฐานสีเหลืองส้ม pastel สำหรับอารมณ์บวก
        return `
          radial-gradient(circle at 20% 50%, rgba(243, 220, 174, 0.45) 0%, transparent 55%),
          radial-gradient(circle at 80% 20%, hsla(42, 57%, 83%, 0.35) 0%, transparent 55%),
          radial-gradient(circle at 40% 80%, rgba(255, 240, 200, 0.4) 0%, transparent 55%),
          linear-gradient(135deg, #f0a824ff, #eec55dff, #f1d997ff)
        `;
      }

      if (isNegative) {
        // ฐานสีม่วงเข้ม pastel สำหรับอารมณ์ลบ
        return `
          radial-gradient(circle at 25% 30%, rgba(165, 125, 220, 0.45) 0%, transparent 55%),
          radial-gradient(circle at 75% 70%, rgba(180, 140, 230, 0.35) 0%, transparent 55%),
          radial-gradient(circle at 50% 50%, rgba(200, 160, 245, 0.4) 0%, transparent 55%),
          linear-gradient(135deg, #864bd4ff, #B48CEC, #C8A0F5)
        `;
      }

    // neutral เดิม
    return `
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(96, 165, 250, 0.6) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.7) 0%, transparent 50%),
      linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)
    `;
>>>>>>> ten2.5
  };



  const handleActivityCompleted = (activity) => {
    setUserProfile(prev => ({
      ...prev,
      completedActivities: [...prev.completedActivities, activity]
    }));
  };

  // If user is not authenticated, show login/register
  if (!currentUser) {
    return (
      <div className="App">
        {authMode === 'login' ? (
          <Login onToggleMode={() => setAuthMode('register')} />
        ) : (
          <Register onToggleMode={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  // If user is authenticated, show the main app
  return (
    <div 
      className="App"
      style={{
        background: getEmotionBackground(detectedEmotion),
        minHeight: '100vh'
      }}
    >
      <ProtectedRoute>
        <Header currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="main-content">
          {currentView === 'detection' && (
            <EmotionDetection 
              onEmotionDetected={handleEmotionDetected}
              currentEmotion={detectedEmotion}
              onEmotionChange={handleEmotionChange}
            />
          )}
          
          {currentView === 'recommendations' && (
            <ActivityRecommendation 
              emotion={detectedEmotion}
              onActivityCompleted={handleActivityCompleted}
              onBackToDetection={() => setCurrentView('detection')}
            />
          )}
          
          {currentView === 'community' && (
            <CommunityBoard />
          )}
          
          {currentView === 'profile' && (
            <Profile userProfile={userProfile} />
          )}
        </main>
      </ProtectedRoute>
    </div>
  );
}

// Main App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
