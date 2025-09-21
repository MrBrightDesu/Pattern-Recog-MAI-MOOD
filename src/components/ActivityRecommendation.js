import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, MapPin, Users, Heart } from 'lucide-react';
import './ActivityRecommendation.css';

const ActivityRecommendation = ({ emotion, onActivityCompleted, onBackToDetection }) => {
  const [completedActivities, setCompletedActivities] = useState(new Set());

  const activityRecommendations = {
    Happy: [
      {
        id: 1,
        title: 'เดินเล่นในสวนสาธารณะ',
        description: 'ออกไปสูดอากาศบริสุทธิ์และชื่นชมธรรมชาติ',
        duration: '30-60 นาที',
        location: 'สวนสาธารณะใกล้บ้าน',
        participants: 'คนเดียวหรือกับเพื่อน',
        category: 'outdoor',
        icon: '🚶‍♀️'
      },
      {
        id: 2,
        title: 'วาดรูปหรือระบายสี',
        description: 'ใช้ความคิดสร้างสรรค์ในการสร้างงานศิลปะ',
        duration: '45-90 นาที',
        location: 'บ้านหรือคาเฟ่',
        participants: 'คนเดียว',
        category: 'creative',
        icon: '🎨'
      },
      {
        id: 3,
        title: 'โทรหาเพื่อนสนิท',
        description: 'แบ่งปันความสุขและสร้างความสัมพันธ์ที่ดี',
        duration: '20-40 นาที',
        location: 'ที่ไหนก็ได้',
        participants: '2 คน',
        category: 'social',
        icon: '📞'
      }
    ],
    Sad: [
      {
        id: 4,
        title: 'ฟังเพลงที่ชอบ',
        description: 'ให้เพลงช่วยเยียวยาจิตใจ',
        duration: '30-60 นาที',
        location: 'บ้านหรือที่เงียบสงบ',
        participants: 'คนเดียว',
        category: 'music',
        icon: '🎵'
      },
      {
        id: 5,
        title: 'เขียนไดอารี่',
        description: 'ระบายความรู้สึกผ่านการเขียน',
        duration: '20-40 นาที',
        location: 'บ้าน',
        participants: 'คนเดียว',
        category: 'writing',
        icon: '📝'
      },
      {
        id: 6,
        title: 'ออกกำลังกายเบาๆ',
        description: 'การออกกำลังกายช่วยเพิ่มสารเอ็นดอร์ฟิน',
        duration: '30-45 นาที',
        location: 'บ้านหรือยิม',
        participants: 'คนเดียว',
        category: 'exercise',
        icon: '🧘‍♀️'
      }
    ],
    Angry: [
      {
        id: 7,
        title: 'วิ่งหรือออกกำลังกายหนัก',
        description: 'ปลดปล่อยพลังงานและความเครียด',
        duration: '45-60 นาที',
        location: 'สวนสาธารณะหรือยิม',
        participants: 'คนเดียว',
        category: 'exercise',
        icon: '🏃‍♂️'
      },
      {
        id: 8,
        title: 'ทำความสะอาดบ้าน',
        description: 'ใช้พลังงานในการทำกิจกรรมที่เป็นประโยชน์',
        duration: '60-90 นาที',
        location: 'บ้าน',
        participants: 'คนเดียว',
        category: 'productive',
        icon: '🧹'
      },
      {
        id: 9,
        title: 'ฝึกหายใจลึกๆ',
        description: 'การหายใจช่วยให้ใจสงบและผ่อนคลาย',
        duration: '10-20 นาที',
        location: 'ที่เงียบสงบ',
        participants: 'คนเดียว',
        category: 'mindfulness',
        icon: '🫁'
      }
    ],
    Surprised: [
      {
        id: 10,
        title: 'ลองทำอาหารใหม่',
        description: 'ทดลองทำเมนูที่ยังไม่เคยทำ',
        duration: '60-120 นาที',
        location: 'บ้าน',
        participants: 'คนเดียวหรือกับครอบครัว',
        category: 'cooking',
        icon: '👨‍🍳'
      },
      {
        id: 11,
        title: 'ไปเที่ยวสถานที่ใหม่',
        description: 'สำรวจสถานที่ที่ยังไม่เคยไป',
        duration: '2-4 ชั่วโมง',
        location: 'สถานที่ใหม่',
        participants: 'คนเดียวหรือกับเพื่อน',
        category: 'adventure',
        icon: '🗺️'
      }
    ],
    Fearful: [
      {
        id: 12,
        title: 'พูดคุยกับคนที่ไว้ใจ',
        description: 'แบ่งปันความกังวลกับคนใกล้ตัว',
        duration: '30-60 นาที',
        location: 'ที่สบายใจ',
        participants: '2 คน',
        category: 'social',
        icon: '💬'
      },
      {
        id: 13,
        title: 'ทำกิจกรรมที่คุ้นเคย',
        description: 'ทำสิ่งที่ทำให้รู้สึกปลอดภัยและสบายใจ',
        duration: '30-60 นาที',
        location: 'บ้าน',
        participants: 'คนเดียว',
        category: 'comfort',
        icon: '🏠'
      }
    ],
    Disgusted: [
      {
        id: 14,
        title: 'ทำความสะอาดและจัดระเบียบ',
        description: 'สร้างสภาพแวดล้อมที่สะอาดและเป็นระเบียบ',
        duration: '60-90 นาที',
        location: 'บ้าน',
        participants: 'คนเดียว',
        category: 'productive',
        icon: '🧽'
      }
    ],
    Neutral: [
      {
        id: 15,
        title: 'อ่านหนังสือที่สนใจ',
        description: 'ใช้เวลากับหนังสือที่อยากอ่าน',
        duration: '45-90 นาที',
        location: 'บ้านหรือคาเฟ่',
        participants: 'คนเดียว',
        category: 'reading',
        icon: '📚'
      },
      {
        id: 16,
        title: 'เรียนรู้ทักษะใหม่',
        description: 'พัฒนาตนเองด้วยทักษะใหม่ๆ',
        duration: '60-120 นาที',
        location: 'บ้าน',
        participants: 'คนเดียว',
        category: 'learning',
        icon: '🎓'
      }
    ]
  };

  const activities = activityRecommendations[emotion?.name] || [];

  const handleActivityComplete = (activity) => {
    setCompletedActivities(prev => new Set([...prev, activity.id]));
    onActivityCompleted(activity);
  };

  const getCategoryColor = (category) => {
    const colors = {
      outdoor: '#10B981',
      creative: '#8B5CF6',
      social: '#3B82F6',
      music: '#F59E0B',
      writing: '#6B7280',
      exercise: '#EF4444',
      productive: '#059669',
      mindfulness: '#06B6D4',
      cooking: '#F97316',
      adventure: '#84CC16',
      comfort: '#A78BFA',
      reading: '#6366F1',
      learning: '#EC4899'
    };
    return colors[category] || '#6B7280';
  };

  return (
    <div className="activity-recommendation">
      <div className="recommendation-header">
        <button className="back-btn" onClick={onBackToDetection}>
          <ArrowLeft className="back-icon" />
          กลับไปตรวจจับอารมณ์
        </button>
        
        <div className="emotion-result">
          <div className="emotion-display">
            <span className="emotion-emoji">{emotion?.emoji}</span>
            <div className="emotion-info">
              <h2>อารมณ์: {emotion?.name}</h2>
              <p>ความมั่นใจ: {Math.round(emotion?.confidence * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h3>กิจกรรมที่แนะนำสำหรับคุณ</h3>
        <p>เลือกกิจกรรมที่เหมาะสมกับอารมณ์ปัจจุบันของคุณ</p>
        
        <div className="activities-grid">
          {activities.map(activity => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-meta">
                  <span 
                    className="activity-category"
                    style={{ backgroundColor: getCategoryColor(activity.category) }}
                  >
                    {activity.category}
                  </span>
                  {completedActivities.has(activity.id) && (
                    <CheckCircle className="completed-icon" />
                  )}
                </div>
              </div>
              
              <h4 className="activity-title">{activity.title}</h4>
              <p className="activity-description">{activity.description}</p>
              
              <div className="activity-details">
                <div className="detail-item">
                  <Clock className="detail-icon" />
                  <span>{activity.duration}</span>
                </div>
                <div className="detail-item">
                  <MapPin className="detail-icon" />
                  <span>{activity.location}</span>
                </div>
                <div className="detail-item">
                  <Users className="detail-icon" />
                  <span>{activity.participants}</span>
                </div>
              </div>
              
              {!completedActivities.has(activity.id) ? (
                <button 
                  className="complete-btn"
                  onClick={() => handleActivityComplete(activity)}
                >
                  <CheckCircle className="btn-icon" />
                  ทำกิจกรรมนี้
                </button>
              ) : (
                <div className="completed-status">
                  <CheckCircle className="completed-icon" />
                  <span>เสร็จสิ้นแล้ว</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {completedActivities.size > 0 && (
        <div className="completion-celebration">
          <Heart className="celebration-icon" />
          <h4>ยินดีด้วย! คุณได้ทำกิจกรรมแล้ว {completedActivities.size} กิจกรรม</h4>
          <p>การทำกิจกรรมจริงจะช่วยให้สุขภาพจิตของคุณดีขึ้น</p>
        </div>
      )}
    </div>
  );
};

export default ActivityRecommendation;
