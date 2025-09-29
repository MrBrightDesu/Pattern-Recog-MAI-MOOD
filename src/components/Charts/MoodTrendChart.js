import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MoodTrendChart = ({ data }) => {
  // สร้างข้อมูลจากข้อมูลที่ส่งมา
  const generateTimeLabels = (data) => {
    if (!data || data.length === 0) return [];
    
    // เอาวันที่จากข้อมูลและเรียงลำดับ
    const dates = [...new Set(data.map(item => item.date))].sort();
    
    return dates.map(date => {
      const d = new Date(date);
      return {
        date: date,
        label: d.toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short' 
        }),
        fullDate: d.toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        })
      };
    });
  };

  const timeLabels = generateTimeLabels(data);
  
  // จัดกลุ่มข้อมูลตามช่วงเวลา
  const groupDataByPeriod = (data, timeLabels) => {
    const grouped = {};
    
    timeLabels.forEach(timeLabel => {
      grouped[timeLabel.date] = [];
    });
    
    data.forEach(item => {
      if (grouped[item.date]) {
        grouped[item.date].push(item);
      }
    });
    
    return grouped;
  };

  const groupedData = groupDataByPeriod(data, timeLabels);
  const labels = timeLabels.map(tl => tl.label);

  // แปลงอารมณ์เป็นตัวเลขสำหรับกราฟ
  const emotionToNumber = (emotion) => {
    const emotionMap = {
      'sad': 1,
      'angry': 2,
      'fear': 3,
      'disgust': 4,
      'neutral': 5,
      'surprise': 6,
      'happy': 7,
      'Sad': 1,
      'Angry': 2,
      'Fearful': 3,
      'Disgusted': 4,
      'Neutral': 5,
      'Surprised': 6,
      'Happy': 7
    };
    return emotionMap[emotion] || 5;
  };

  const moodData = timeLabels.map(timeLabel => {
    const dayData = groupedData[timeLabel.date];
    if (!dayData || dayData.length === 0) {
      return null; // ไม่มีข้อมูลสำหรับวันนั้น
    }
    const avgMood = dayData.reduce((sum, item) => 
      sum + emotionToNumber(item.emotion), 0
    ) / dayData.length;
    return avgMood;
  });

  // คำนวณค่าเฉลี่ยอารมณ์ (เฉพาะวันที่มีข้อมูล)
  const validMoodData = moodData.filter(val => val !== null);
  const averageMood = validMoodData.length > 0 
    ? validMoodData.reduce((sum, val) => sum + val, 0) / validMoodData.length
    : 0;
  const trend = validMoodData.length > 1 
    ? validMoodData[validMoodData.length - 1] - validMoodData[0]
    : 0;

  const getMoodLabel = (value) => {
    if (value >= 6) return 'ดีมาก';
    if (value >= 5) return 'ดี';
    if (value >= 4) return 'ปานกลาง';
    if (value >= 3) return 'ไม่ดี';
    return 'แย่';
  };

  const getMoodColor = (value) => {
    if (value >= 6) return '#10B981';
    if (value >= 5) return '#84CC16';
    if (value >= 4) return '#F59E0B';
    if (value >= 3) return '#EF4444';
    return '#DC2626';
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'ระดับอารมณ์',
        data: moodData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: moodData.map(val => getMoodColor(val)),
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1f2937',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: `แนวโน้มอารมณ์`,
        color: '#1f2937',
        font: {
          size: 16,
          weight: '600'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `อารมณ์: ${getMoodLabel(value)} (${value.toFixed(1)})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          }
        }
      },
      y: {
        min: 1,
        max: 7,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          },
          callback: function(value) {
            return getMoodLabel(value);
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  return (
    <div className="chart-container mood-trend-chart">
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">อารมณ์เฉลี่ย:</span>
          <span className="stat-value" style={{ color: getMoodColor(averageMood) }}>
            {getMoodLabel(averageMood)} ({averageMood.toFixed(1)})
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">แนวโน้ม:</span>
          <span className={`stat-value ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
            {trend > 0 ? '↗ ดีขึ้น' : trend < 0 ? '↘ แย่ลง' : '→ คงที่'} {Math.abs(trend).toFixed(1)}
          </span>
        </div>
        {validMoodData.length > 0 && (
          <>
            <div className="stat-item">
              <span className="stat-label">ระดับสูงสุด:</span>
              <span className="stat-value" style={{ color: getMoodColor(Math.max(...validMoodData)) }}>
                {getMoodLabel(Math.max(...validMoodData))} ({Math.max(...validMoodData).toFixed(1)})
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">ระดับต่ำสุด:</span>
              <span className="stat-value" style={{ color: getMoodColor(Math.min(...validMoodData)) }}>
                {getMoodLabel(Math.min(...validMoodData))} ({Math.min(...validMoodData).toFixed(1)})
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MoodTrendChart;