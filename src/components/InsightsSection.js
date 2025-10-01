import React from 'react';
import { TrendingUp, TrendingDown, Lightbulb, Target, Heart, AlertCircle } from 'lucide-react';

const InsightsSection = ({ data, stats }) => {
  // วิเคราะห์ข้อมูลและสร้างคำแนะนำ
  const generateInsights = (data, stats) => {
    const insights = [];
    
    if (data.length === 0) {
      return [
        {
          type: 'info',
          icon: <Lightbulb className="insight-icon" />,
          title: 'เริ่มต้นการวิเคราะห์อารมณ์',
          description: 'ลองใช้ฟีเจอร์วิเคราะห์อารมณ์เพื่อดูข้อมูลเชิงลึกเกี่ยวกับอารมณ์ของคุณ',
          action: 'ไปที่หน้า Emotion Detection'
        }
      ];
    }

    // วิเคราะห์แนวโน้มอารมณ์
    const recentData = data.slice(0, 7); // 7 ข้อมูลล่าสุด
    const olderData = data.slice(7, 14); // 7 ข้อมูลก่อนหน้า
    
    if (recentData.length >= 3 && olderData.length >= 3) {
      const recentAvg = recentData.reduce((sum, item) => sum + (item.confidence || 0), 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, item) => sum + (item.confidence || 0), 0) / olderData.length;
      const trend = recentAvg - olderAvg;
      
      if (Math.abs(trend) > 0.1) {
        insights.push({
          type: trend > 0 ? 'positive' : 'warning',
          icon: trend > 0 ? <TrendingUp className="insight-icon" /> : <TrendingDown className="insight-icon" />,
          title: trend > 0 ? 'ความมั่นใจเพิ่มขึ้น' : 'ความมั่นใจลดลง',
          description: trend > 0 
            ? `ความมั่นใจในการวิเคราะห์อารมณ์ของคุณเพิ่มขึ้น ${(trend * 100).toFixed(1)}% ในช่วงล่าสุด`
            : `ความมั่นใจในการวิเคราะห์อารมณ์ของคุณลดลง ${Math.abs(trend * 100).toFixed(1)}% ในช่วงล่าสุด`,
          action: trend > 0 ? 'ทำได้ดี! ต่อไปลองใช้โหมดเสียง' : 'ลองใช้โหมดภาพเพื่อความแม่นยำมากขึ้น'
        });
      }
    }

    // วิเคราะห์ความสม่ำเสมอ
    const streakDays = stats.streakDays;
    if (streakDays >= 7) {
      insights.push({
        type: 'positive',
        icon: <Target className="insight-icon" />,
        title: 'ความสม่ำเสมอดีเยี่ยม!',
        description: `คุณทำกิจกรรมติดต่อกัน ${streakDays} วันแล้ว นี่เป็นสัญญาณที่ดีของการดูแลตัวเอง`,
        action: 'รักษาความสม่ำเสมอต่อไป'
      });
    } else if (streakDays >= 3) {
      insights.push({
        type: 'info',
        icon: <Target className="insight-icon" />,
        title: 'กำลังสร้างนิสัยที่ดี',
        description: `คุณทำกิจกรรมติดต่อกัน ${streakDays} วันแล้ว ลองตั้งเป้าหมายให้ครบ 7 วัน`,
        action: 'ตั้งเป้าหมาย 7 วันติดต่อกัน'
      });
    } else if (data.length > 0) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="insight-icon" />,
        title: 'เพิ่มความสม่ำเสมอ',
        description: 'ลองทำกิจกรรมวิเคราะห์อารมณ์ทุกวันเพื่อสร้างนิสัยที่ดี',
        action: 'ตั้งเป้าหมายทำทุกวัน'
      });
    }

    // วิเคราะห์อารมณ์ที่พบบ่อย
    const emotionCounts = {};
    data.forEach(item => {
      emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    });
    
    const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );
    
    const emotionPercentage = ((emotionCounts[mostCommonEmotion] / data.length) * 100).toFixed(1);
    
    if (emotionPercentage > 50) {
      const emotionAdvice = {
        'Happy': 'คุณเป็นคนอารมณ์ดี! ลองแบ่งปันความสุขให้คนรอบข้าง',
        'Sad': 'หากรู้สึกเศร้าบ่อย ลองหาคนคุยหรือทำกิจกรรมที่ชอบ',
        'Angry': 'หากรู้สึกโกรธบ่อย ลองฝึกการหายใจหรือออกกำลังกาย',
        'Neutral': 'อารมณ์เป็นกลางดี แต่ลองหาสิ่งที่ทำให้คุณตื่นเต้น',
        'Fearful': 'หากรู้สึกกลัวบ่อย ลองพูดคุยกับคนที่ไว้ใจได้',
        'Surprised': 'คุณเป็นคนเปิดรับสิ่งใหม่ๆ ดีมาก!',
        'Disgusted': 'หากรู้สึกรังเกียจบ่อย ลองหาสาเหตุและจัดการกับมัน'
      };
      
      insights.push({
        type: emotionPercentage > 70 ? 'warning' : 'info',
        icon: <Heart className="insight-icon" />,
        title: `อารมณ์ ${mostCommonEmotion} พบ ${emotionPercentage}%`,
        description: emotionAdvice[mostCommonEmotion] || 'ลองสังเกตอารมณ์ของคุณให้มากขึ้น',
        action: 'ลองทำกิจกรรมที่ช่วยปรับอารมณ์'
      });
    }

    // วิเคราะห์ความหลากหลายของอารมณ์
    const uniqueEmotions = Object.keys(emotionCounts).length;
    if (uniqueEmotions === 1 && data.length > 3) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="insight-icon" />,
        title: 'อารมณ์ไม่หลากหลาย',
        description: 'คุณมีอารมณ์เดียวตลอด ลองทำกิจกรรมที่หลากหลายเพื่อกระตุ้นอารมณ์ใหม่ๆ',
        action: 'ลองกิจกรรมใหม่ๆ'
      });
    } else if (uniqueEmotions >= 4) {
      insights.push({
        type: 'positive',
        icon: <Heart className="insight-icon" />,
        title: 'อารมณ์หลากหลายดีมาก!',
        description: `คุณมีอารมณ์ ${uniqueEmotions} แบบ นี่แสดงว่าคุณมีความยืดหยุ่นทางอารมณ์ดี`,
        action: 'รักษาความหลากหลายนี้ไว้'
      });
    }

    // วิเคราะห์ความถี่ในการใช้งาน
    const weeklyActivity = stats.completedThisWeek;
    if (weeklyActivity === 0) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="insight-icon" />,
        title: 'ยังไม่มีการใช้งานสัปดาห์นี้',
        description: 'ลองเริ่มต้นด้วยการวิเคราะห์อารมณ์วันละครั้ง',
        action: 'เริ่มวิเคราะห์อารมณ์วันนี้'
      });
    } else if (weeklyActivity >= 5) {
      insights.push({
        type: 'positive',
        icon: <TrendingUp className="insight-icon" />,
        title: 'ใช้งานสม่ำเสมอดีมาก!',
        description: `คุณทำกิจกรรม ${weeklyActivity} ครั้งในสัปดาห์นี้ นี่เป็นนิสัยที่ดี`,
        action: 'รักษาความสม่ำเสมอต่อไป'
      });
    }

    return insights;
  };

  const insights = generateInsights(data, stats);

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getInsightBgColor = (type) => {
    switch (type) {
      case 'positive':
        return 'rgba(16, 185, 129, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };

  return (
    <div className="insights-section">
      <div className="section-header">
        <h3>ข้อมูลเชิงลึกและคำแนะนำ</h3>
        <p>AI วิเคราะห์ข้อมูลของคุณและให้คำแนะนำส่วนตัว</p>
      </div>
      
      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className="insight-card"
            style={{ 
              borderColor: getInsightColor(insight.type),
              backgroundColor: getInsightBgColor(insight.type)
            }}
          >
            <div className="insight-header">
              <div 
                className="insight-icon-wrapper"
                style={{ color: getInsightColor(insight.type) }}
              >
                {insight.icon}
              </div>
              <h4>{insight.title}</h4>
            </div>
            
            <p className="insight-description">{insight.description}</p>
            
            <div className="insight-action">
              <span className="action-text">{insight.action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsSection;

