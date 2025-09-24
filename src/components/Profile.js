import React, { useState, useEffect } from 'react';
import { User, Calendar, Activity, Heart, TrendingUp, Award, Target, Loader2 } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = ({ userProfile }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [moodHistory, setMoodHistory] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    completedThisWeek: 0,
    averageMood: 0,
    streakDays: 0,
    favoriteActivity: 'ยังไม่มีข้อมูล',
    mostCommonEmotion: 'Neutral'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // ดึงข้อมูลจาก Firestore
  const fetchUserData = async () => {
    if (!currentUser) {
      console.log('No current user found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data for user:', currentUser.uid);
      console.log('Firestore db object:', db);

      // ทดสอบการเชื่อมต่อ Firestore ก่อน
      if (!db) {
        throw new Error('Firestore database not initialized');
      }

      // ใช้ query แบบง่ายที่ไม่ต้องใช้ index
      console.log('Using simple collection query to avoid index requirement');
      const q = collection(db, 'emotionAnalysis');

      console.log('Query created, fetching documents...');
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot received:', querySnapshot.size, 'documents');
      
      const data = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        console.log('Processing document:', doc.id, docData);
        
        // กรองข้อมูลตาม userId ใน client-side
        if (docData.userId === currentUser.uid) {
          data.push({
            id: doc.id,
            ...docData,
            // แปลง timestamp เป็น date string
            date: docData.createdAt ? 
              (docData.createdAt.seconds ? 
                new Date(docData.createdAt.seconds * 1000).toISOString().split('T')[0] :
                new Date(docData.createdAt).toISOString().split('T')[0]
              ) : 
              new Date().toISOString().split('T')[0]
          });
        }
      });

      // เรียงลำดับข้อมูลตามวันที่ล่าสุดก่อน
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // ล่าสุดก่อน
      });

      // จำกัดจำนวนข้อมูลที่แสดง (50 รายการล่าสุด)
      const limitedData = data.slice(0, 50);

      console.log('Processed data:', limitedData);
      
      if (limitedData.length === 0) {
        console.log('No data found for user');
        setMoodHistory([]);
        setStats({
          totalActivities: 0,
          completedThisWeek: 0,
          averageMood: 0,
          streakDays: 0,
          favoriteActivity: 'ยังไม่มีข้อมูล',
          mostCommonEmotion: 'Neutral'
        });
      } else {
        setMoodHistory(limitedData);
        calculateStats(limitedData);
      }
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      console.error('Error details:', err.message, err.code);
      setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // คำนวณสถิติจากข้อมูล
  const calculateStats = (data) => {
    if (data.length === 0) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // ข้อมูลสัปดาห์นี้
    const thisWeekData = data.filter(item => 
      new Date(item.date) >= weekAgo
    );

    // คำนวณอารมณ์เฉลี่ย
    const emotions = data.map(item => item.emotion);
    const emotionCounts = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // คำนวณความมั่นใจเฉลี่ย
    const avgConfidence = data.reduce((sum, item) => 
      sum + (item.confidence || 0), 0
    ) / data.length;

    setStats({
      totalActivities: data.length,
      completedThisWeek: thisWeekData.length,
      averageMood: Math.round(avgConfidence * 10) / 10,
      streakDays: calculateStreakDays(data),
      favoriteActivity: 'ยังไม่มีข้อมูล', // TODO: เพิ่มข้อมูลกิจกรรม
      mostCommonEmotion: mostCommonEmotion
    });
  };

  // คำนวณจำนวนวันที่ทำกิจกรรมติดต่อกัน
  const calculateStreakDays = (data) => {
    if (data.length === 0) return 0;
    
    const dates = data.map(item => new Date(item.date)).sort((a, b) => b - a);
    let streak = 1;
    let currentDate = new Date(dates[0]);
    
    for (let i = 1; i < dates.length; i++) {
      const nextDate = new Date(dates[i]);
      const diffTime = currentDate - nextDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        currentDate = nextDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    console.log('Profile component mounted, currentUser:', currentUser);
    if (currentUser) {
      fetchUserData();
    } else {
      console.log('No current user, setting loading to false');
      setLoading(false);
    }
  }, [currentUser]);

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#10B981',
      sad: '#3B82F6',
      angry: '#EF4444',
      surprise: '#F59E0B',
      fear: '#8B5CF6',
      disgust: '#6B7280',
      neutral: '#6B7280',
      // ภาษาอังกฤษ
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
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐',
      // ภาษาอังกฤษ
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

  if (loading) {
    return (
      <div className="profile">
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile">
        <div className="error-container">
          <p>❌ {error}</p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
            User ID: {currentUser?.uid || 'ไม่พบ'}
          </p>
          <button onClick={fetchUserData} className="retry-btn">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="user-info">
          <div className="avatar">
            <User className="avatar-icon" />
          </div>
          <div className="user-details">
            <h2>{currentUser?.displayName || userProfile.name}</h2>
            <p>สมาชิก MAI Mood Coach</p>
            <div className="user-stats">
              <span className="stat-badge">
                <Calendar className="stat-icon" />
                เข้าร่วม {stats.streakDays} วัน
              </span>
              <span className="stat-badge">
                <Activity className="stat-icon" />
                ทำกิจกรรม {stats.totalActivities} ครั้ง
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
              <span className="value-number">{stats.averageMood}</span>
              <span className="value-label">/ 10</span>
            </div>
            <div className="stat-trend">
              <TrendingUp className="trend-icon" />
              <span>ความมั่นใจเฉลี่ย</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Target className="stat-icon" />
              <h3>กิจกรรมสัปดาห์นี้</h3>
            </div>
            <div className="stat-value">
              <span className="value-number">{stats.completedThisWeek}</span>
              <span className="value-label">ครั้ง</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min((stats.completedThisWeek / 7) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Award className="stat-icon" />
              <h3>กิจกรรมโปรด</h3>
            </div>
            <div className="stat-value">
              <span className="value-text">{stats.favoriteActivity}</span>
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
                {getEmotionEmoji(stats.mostCommonEmotion)}
                <span>{stats.mostCommonEmotion}</span>
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
            {moodHistory.length === 0 ? (
              <div className="no-data">
                <p>ยังไม่มีข้อมูลการวิเคราะห์อารมณ์</p>
                <p>ลองวิเคราะห์อารมณ์ของคุณดูสิ!</p>
              </div>
            ) : (
              moodHistory.map((entry, index) => (
                <div key={entry.id || index} className="history-item">
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
                      ความมั่นใจ: {Math.round((entry.confidence || 0) * 100)}%
                    </span>
                  </div>
                  
                  <div className="history-details">
                    <div className="detail-item">
                      <Activity className="activity-icon" />
                      <span>โหมด: {entry.predictMode}</span>
                    </div>
                    {entry.imageEmotion && (
                      <div className="detail-item">
                        <span>ภาพ: {entry.imageEmotion}</span>
                      </div>
                    )}
                    {entry.audioEmotion && (
                      <div className="detail-item">
                        <span>เสียง: {entry.audioEmotion}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
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
