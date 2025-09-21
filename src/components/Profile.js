import React, { useState } from 'react';
import { User, Calendar, Activity, Heart, TrendingUp, Award, Target } from 'lucide-react';
import './Profile.css';

const Profile = ({ userProfile }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year

  const mockMoodHistory = [
    { date: '2024-01-15', emotion: 'Happy', confidence: 0.85, activity: 'เดินเล่นในสวน' },
    { date: '2024-01-14', emotion: 'Neutral', confidence: 0.72, activity: 'อ่านหนังสือ' },
    { date: '2024-01-13', emotion: 'Sad', confidence: 0.68, activity: 'ฟังเพลง' },
    { date: '2024-01-12', emotion: 'Angry', confidence: 0.75, activity: 'ออกกำลังกาย' },
    { date: '2024-01-11', emotion: 'Happy', confidence: 0.91, activity: 'วาดรูป' },
    { date: '2024-01-10', emotion: 'Neutral', confidence: 0.78, activity: 'ทำอาหาร' },
    { date: '2024-01-09', emotion: 'Surprised', confidence: 0.82, activity: 'ลองทำอาหารใหม่' }
  ];

  const mockStats = {
    totalActivities: 24,
    completedThisWeek: 5,
    averageMood: 7.2,
    streakDays: 7,
    favoriteActivity: 'เดินเล่นในสวน',
    mostCommonEmotion: 'Happy'
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      Happy: '#10B981',
      Sad: '#3B82F6',
      Angry: '#EF4444',
      Surprised: '#F59E0B',
      Fearful: '#8B5CF6',
      Disgusted: '#6B7280',
      Neutral: '#6B7280'
    };
    return colors[emotion] || '#6B7280';
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      Happy: '😊',
      Sad: '😢',
      Angry: '😠',
      Surprised: '😲',
      Fearful: '😨',
      Disgusted: '🤢',
      Neutral: '😐'
    };
    return emojis[emotion] || '😐';
  };

  const periodOptions = [
    { value: 'week', label: 'สัปดาห์นี้' },
    { value: 'month', label: 'เดือนนี้' },
    { value: 'year', label: 'ปีนี้' }
  ];

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="user-info">
          <div className="avatar">
            <User className="avatar-icon" />
          </div>
          <div className="user-details">
            <h2>{userProfile.name}</h2>
            <p>สมาชิก MAI Mood Coach</p>
            <div className="user-stats">
              <span className="stat-badge">
                <Calendar className="stat-icon" />
                เข้าร่วม {mockStats.streakDays} วัน
              </span>
              <span className="stat-badge">
                <Activity className="stat-icon" />
                ทำกิจกรรม {mockStats.totalActivities} ครั้ง
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <Heart className="stat-icon" />
              <h3>อารมณ์เฉลี่ย</h3>
            </div>
            <div className="stat-value">
              <span className="value-number">{mockStats.averageMood}</span>
              <span className="value-label">/ 10</span>
            </div>
            <div className="stat-trend">
              <TrendingUp className="trend-icon" />
              <span>ดีขึ้น 15% จากสัปดาห์ที่แล้ว</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Target className="stat-icon" />
              <h3>กิจกรรมสัปดาห์นี้</h3>
            </div>
            <div className="stat-value">
              <span className="value-number">{mockStats.completedThisWeek}</span>
              <span className="value-label">/ 7 เป้าหมาย</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(mockStats.completedThisWeek / 7) * 100}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Award className="stat-icon" />
              <h3>กิจกรรมโปรด</h3>
            </div>
            <div className="stat-value">
              <span className="value-text">{mockStats.favoriteActivity}</span>
            </div>
            <div className="stat-detail">
              <span>ทำบ่อยที่สุด</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Heart className="stat-icon" />
              <h3>อารมณ์ที่พบบ่อย</h3>
            </div>
            <div className="stat-value">
              <span className="emotion-display">
                {getEmotionEmoji(mockStats.mostCommonEmotion)}
                <span>{mockStats.mostCommonEmotion}</span>
              </span>
            </div>
            <div className="stat-detail">
              <span>ในช่วง 7 วันที่ผ่านมา</span>
            </div>
          </div>
        </div>

        <div className="mood-history">
          <div className="section-header">
            <h3>ประวัติอารมณ์</h3>
            <div className="period-selector">
              {periodOptions.map(option => (
                <button
                  key={option.value}
                  className={`period-btn ${selectedPeriod === option.value ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="history-list">
            {mockMoodHistory.map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-date">
                  <Calendar className="date-icon" />
                  <span>{new Date(entry.date).toLocaleDateString('th-TH')}</span>
                </div>
                
                <div className="history-emotion">
                  <span 
                    className="emotion-badge"
                    style={{ backgroundColor: getEmotionColor(entry.emotion) }}
                  >
                    {getEmotionEmoji(entry.emotion)} {entry.emotion}
                  </span>
                  <span className="confidence">
                    ความมั่นใจ: {Math.round(entry.confidence * 100)}%
                  </span>
                </div>
                
                <div className="history-activity">
                  <Activity className="activity-icon" />
                  <span>{entry.activity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="achievements">
          <h3>ความสำเร็จ</h3>
          <div className="achievement-grid">
            <div className="achievement-item completed">
              <Award className="achievement-icon" />
              <div className="achievement-content">
                <h4>ผู้เริ่มต้น</h4>
                <p>ทำกิจกรรมครั้งแรก</p>
              </div>
            </div>
            
            <div className="achievement-item completed">
              <Heart className="achievement-icon" />
              <div className="achievement-content">
                <h4>นักวิ่ง</h4>
                <p>ทำกิจกรรม 5 ครั้งติดต่อกัน</p>
              </div>
            </div>
            
            <div className="achievement-item completed">
              <TrendingUp className="achievement-icon" />
              <div className="achievement-content">
                <h4>ผู้พัฒนาตนเอง</h4>
                <p>อารมณ์ดีขึ้น 3 วันติดต่อกัน</p>
              </div>
            </div>
            
            <div className="achievement-item">
              <Target className="achievement-icon" />
              <div className="achievement-content">
                <h4>ผู้เชี่ยวชาญ</h4>
                <p>ทำกิจกรรม 30 ครั้ง</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
