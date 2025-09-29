import React, { useState, useEffect, useCallback } from 'react';
import { User, Calendar, Activity, Heart, TrendingUp, Award, Target, Loader2 } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import MoodTrendChart from './Charts/MoodTrendChart';
import EmotionDistributionChart from './Charts/EmotionDistributionChart';
import WeeklyActivityChart from './Charts/WeeklyActivityChart';
import ConfidenceTrendChart from './Charts/ConfidenceTrendChart';
import InsightsSection from './InsightsSection';
import './Profile.css';
import './Charts/Charts.css';

const Profile = ({ userProfile }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 วันที่ผ่านมา
    endDate: new Date().toISOString().split('T')[0] // วันนี้
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  const [filteredMoodHistory, setFilteredMoodHistory] = useState([]);
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

  // สร้างตัวเลือกวัน/เดือน/ปี
  const generateDateOptions = () => {
    const years = [];
    const months = [];
    const days = [];
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentDay = new Date().getDate();
    
    // สร้างปี (5 ปีย้อนหลัง)
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    
    // สร้างเดือน
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    monthNames.forEach((name, index) => {
      months.push({ value: index, label: name });
    });
    
    // สร้างวัน (1-31)
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    
    return { years, months, days };
  };

  const { years, months, days } = generateDateOptions();

  // แปลงวันที่เป็นส่วนประกอบ
  const parseDate = (dateString) => {
    const date = new Date(dateString);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate()
    };
  };

  // สร้างวันที่จากส่วนประกอบ
  const createDate = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  // คำนวณสถิติจากข้อมูล
  const calculateStats = useCallback((data) => {
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
  }, []);

  // กรองข้อมูลตามช่วงเวลาที่เลือก
  const filterDataByDateRange = useCallback((data, startDate, endDate) => {
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    });
  }, []);

  // อัปเดตข้อมูลที่กรองแล้วเมื่อช่วงเวลาเปลี่ยน
  useEffect(() => {
    if (moodHistory.length > 0) {
      const filtered = filterDataByDateRange(moodHistory, dateRange.startDate, dateRange.endDate);
      setFilteredMoodHistory(filtered);
      calculateStats(filtered);
    }
  }, [moodHistory, dateRange, filterDataByDateRange, calculateStats]);

  // ดึงข้อมูลจาก Firestore
  const fetchUserData = useCallback(async () => {
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
  }, [currentUser]);

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
  }, [currentUser, fetchUserData]);

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
        {/* Unified Date Range Filter */}
        <div className="date-range-filter">
          <div className="filter-header">
            <div className="filter-icon">📅</div>
            <h3>เลือกช่วงเวลาที่สนใจ</h3>
            <p>ข้อมูลทั้งหมดจะแสดงตามช่วงเวลาที่คุณเลือก</p>
          </div>
          
          <div className="date-selection-container">
            <div className="date-picker-section">
              <div className="date-picker-group">
                <label className="date-picker-label">วันที่เริ่มต้น</label>
                <div className="date-picker-wrapper">
                  <button 
                    className="date-picker-button"
                    onClick={() => setShowStartPicker(!showStartPicker)}
                  >
                    <Calendar className="picker-icon" />
                    {new Date(dateRange.startDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    <span className="picker-arrow">▼</span>
                  </button>
                  
                  {showStartPicker && (
                    <div className="date-picker-dropdown">
                      <div className="dropdown-header">
                        <span className="dropdown-title">เลือกวันที่เริ่มต้น</span>
                        <button 
                          className="dropdown-close"
                          onClick={() => setShowStartPicker(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="date-picker-content">
                        <div className="date-selector">
                          <label>วัน</label>
                          <select 
                            value={parseDate(dateRange.startDate).day}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseDate(dateRange.startDate).year,
                                parseDate(dateRange.startDate).month,
                                parseInt(e.target.value)
                              );
                              setDateRange(prev => ({ ...prev, startDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="date-selector">
                          <label>เดือน</label>
                          <select 
                            value={parseDate(dateRange.startDate).month}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseDate(dateRange.startDate).year,
                                parseInt(e.target.value),
                                parseDate(dateRange.startDate).day
                              );
                              setDateRange(prev => ({ ...prev, startDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {months.map(month => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="date-selector">
                          <label>ปี</label>
                          <select 
                            value={parseDate(dateRange.startDate).year}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseInt(e.target.value),
                                parseDate(dateRange.startDate).month,
                                parseDate(dateRange.startDate).day
                              );
                              setDateRange(prev => ({ ...prev, startDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="date-picker-group">
                <label className="date-picker-label">วันที่สิ้นสุด</label>
                <div className="date-picker-wrapper">
                  <button 
                    className="date-picker-button"
                    onClick={() => setShowEndPicker(!showEndPicker)}
                  >
                    <Calendar className="picker-icon" />
                    {new Date(dateRange.endDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    <span className="picker-arrow">▼</span>
                  </button>
                  
                  {showEndPicker && (
                    <div className="date-picker-dropdown">
                      <div className="dropdown-header">
                        <span className="dropdown-title">เลือกวันที่สิ้นสุด</span>
                        <button 
                          className="dropdown-close"
                          onClick={() => setShowEndPicker(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="date-picker-content">
                        <div className="date-selector">
                          <label>วัน</label>
                          <select 
                            value={parseDate(dateRange.endDate).day}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseDate(dateRange.endDate).year,
                                parseDate(dateRange.endDate).month,
                                parseInt(e.target.value)
                              );
                              setDateRange(prev => ({ ...prev, endDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="date-selector">
                          <label>เดือน</label>
                          <select 
                            value={parseDate(dateRange.endDate).month}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseDate(dateRange.endDate).year,
                                parseInt(e.target.value),
                                parseDate(dateRange.endDate).day
                              );
                              setDateRange(prev => ({ ...prev, endDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {months.map(month => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="date-selector">
                          <label>ปี</label>
                          <select 
                            value={parseDate(dateRange.endDate).year}
                            onChange={(e) => {
                              const newDate = createDate(
                                parseInt(e.target.value),
                                parseDate(dateRange.endDate).month,
                                parseDate(dateRange.endDate).day
                              );
                              setDateRange(prev => ({ ...prev, endDate: newDate }));
                            }}
                            className="date-select"
                          >
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="quick-filters">
              <button
                className="quick-filter-btn"
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
              >
                📅 สัปดาห์นี้
              </button>
              <button
                className="quick-filter-btn"
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
              >
                📆 เดือนนี้
              </button>
              <button
                className="quick-filter-btn"
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
              >
                📊 3 เดือน
              </button>
            </div>
          </div>
          
          <div className="filter-stats">
            <div className="stats-card">
              <div className="stat-item">
                <span className="stat-icon">📈</span>
                <span className="stat-text">แสดงข้อมูล {filteredMoodHistory.length} รายการ</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <span className="stat-text">
                  {new Date(dateRange.startDate).toLocaleDateString('th-TH')} - {new Date(dateRange.endDate).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="quick-stats">
          <div className="quick-stat-card">
            <Heart className="quick-stat-icon" />
            <div className="quick-stat-value">{stats.averageMood}</div>
            <div className="quick-stat-label">อารมณ์เฉลี่ย</div>
            <div className="quick-stat-change positive">
              <TrendingUp className="trend-icon" />
              <span>ความมั่นใจ {stats.averageMood}/10</span>
            </div>
          </div>
          
          <div className="quick-stat-card">
            <Activity className="quick-stat-icon" />
            <div className="quick-stat-value">{stats.totalActivities}</div>
            <div className="quick-stat-label">กิจกรรมทั้งหมด</div>
            <div className="quick-stat-change positive">
              <span>สัปดาห์นี้ {stats.completedThisWeek} ครั้ง</span>
            </div>
          </div>
          
          <div className="quick-stat-card">
            <Target className="quick-stat-icon" />
            <div className="quick-stat-value">{stats.streakDays}</div>
            <div className="quick-stat-label">วันติดต่อกัน</div>
            <div className="quick-stat-change positive">
              <span>ความสม่ำเสมอ</span>
            </div>
          </div>
          
          <div className="quick-stat-card">
            <Award className="quick-stat-icon" />
            <div className="quick-stat-value">
              {getEmotionEmoji(stats.mostCommonEmotion)}
            </div>
            <div className="quick-stat-label">อารมณ์ที่พบบ่อย</div>
            <div className="quick-stat-change neutral">
              <span>{stats.mostCommonEmotion}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-main">
            {/* Mood Trend Chart */}
            <MoodTrendChart data={filteredMoodHistory} />
            
            {/* Weekly Activity Chart */}
            <WeeklyActivityChart data={filteredMoodHistory} />
          </div>
          
          <div className="dashboard-sidebar">
            {/* Emotion Distribution Chart */}
            <EmotionDistributionChart data={filteredMoodHistory} />
            
            {/* Confidence Trend Chart */}
            <ConfidenceTrendChart data={filteredMoodHistory} />
          </div>
        </div>


        {/* Insights Section */}
        <InsightsSection data={filteredMoodHistory} stats={stats} />

        {/* Mood History */}
        <div className="mood-history">
          <div className="section-header">
            <h3>ประวัติอารมณ์ล่าสุด</h3>
            <div className="header-controls">
              <span className="history-count">{filteredMoodHistory.length} รายการ</span>
            </div>
          </div>

          <div className="history-list">
            {filteredMoodHistory.length === 0 ? (
              <div className="no-data">
                <p>ยังไม่มีข้อมูลการวิเคราะห์อารมณ์ในช่วงเวลาที่เลือก</p>
                <p>ลองเปลี่ยนช่วงเวลาหรือวิเคราะห์อารมณ์ใหม่</p>
              </div>
            ) : (
              filteredMoodHistory.slice(0, 10).map((entry, index) => (
                <div key={entry.id || index} className="history-item">
                  <div className="history-main">
                    <div className="history-left">
                      <div className="date-section">
                        <Calendar className="date-icon" />
                        <span className="date-text">{new Date(entry.date).toLocaleDateString('th-TH')}</span>
                      </div>
                      <span className="time-text">
                        {new Date(entry.createdAt?.seconds ? entry.createdAt.seconds * 1000 : entry.createdAt).toLocaleTimeString('th-TH', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span 
                        className="emotion-badge"
                        style={{ backgroundColor: getEmotionColor(entry.emotion) }}
                      >
                        {getEmotionEmoji(entry.emotion)} {entry.emotion}
                      </span>
                    </div>
                    
                    <div className="history-right">
                      <div className="confidence-bar-expanded">
                        <span className="confidence-label">ความมั่นใจ</span>
                        <div className="confidence-progress-large">
                          <div 
                            className="confidence-fill"
                            style={{ 
                              width: `${Math.round((entry.confidence || 0) * 100)}%`,
                              backgroundColor: getEmotionColor(entry.emotion)
                            }}
                          />
                        </div>
                        <span className="confidence-value">{Math.round((entry.confidence || 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="history-details">
                    <div className="detail-item mode-item">
                      <Activity className="activity-icon" />
                      <span className="detail-label">โหมด:</span>
                      <span className="detail-value">{entry.predictMode}</span>
                    </div>
                    {entry.imageEmotion && (
                      <div className="detail-item">
                        <span className="detail-label">ภาพ:</span>
                        <span className="detail-value">{entry.imageEmotion}</span>
                      </div>
                    )}
                    {entry.audioEmotion && (
                      <div className="detail-item">
                        <span className="detail-label">เสียง:</span>
                        <span className="detail-value">{entry.audioEmotion}</span>
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
