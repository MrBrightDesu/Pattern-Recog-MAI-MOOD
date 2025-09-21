import React, { useState } from 'react';
import Header from './components/Header';
import EmotionDetection from './components/EmotionDetection';
import ActivityRecommendation from './components/ActivityRecommendation';
import CommunityBoard from './components/CommunityBoard';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('detection');
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: 'ผู้ใช้',
    moodHistory: [],
    completedActivities: []
  });

  const handleEmotionDetected = (emotion) => {
    setDetectedEmotion(emotion);
    setCurrentView('recommendations');
  };

  const handleActivityCompleted = (activity) => {
    setUserProfile(prev => ({
      ...prev,
      completedActivities: [...prev.completedActivities, activity]
    }));
  };

  return (
    <div className="App">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="main-content">
        {currentView === 'detection' && (
          <EmotionDetection onEmotionDetected={handleEmotionDetected} />
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
    </div>
  );
}

export default App;
