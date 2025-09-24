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

  // ฟังก์ชันสำหรับกำหนดสีพื้นหลังตามอารมณ์ (แบบ fade)
  const getEmotionBackground = (emotion) => {
    const emotionBackgrounds = {
      // อารมณ์บวก - สีส้ม (แบบ fade)
      'happy': `
        radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 138, 66, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(255, 167, 38, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #ff6b35, #ff8c42, #ffa726)
      `,
      'surprise': `
        radial-gradient(circle at 30% 40%, rgba(255, 140, 66, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, rgba(255, 183, 77, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 20%, rgba(255, 204, 128, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #ff8c42, #ffb74d, #ffcc80)
      `,
      
      // อารมณ์ลบ - สีม่วง (แบบ fade)
      'sad': `
        radial-gradient(circle at 25% 30%, rgba(139, 92, 246, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.7) 0%, transparent 50%),
        linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)
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
