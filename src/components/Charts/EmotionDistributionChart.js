import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const EmotionDistributionChart = ({ data }) => {
  // นับจำนวนอารมณ์แต่ละประเภท
  const emotionCounts = {};
  data.forEach(item => {
    const emotion = item.emotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  const emotions = Object.keys(emotionCounts);
  const counts = Object.values(emotionCounts);

  const getEmotionColor = (emotion) => {
    const colors = {
      'Happy': '#10B981',
      'Sad': '#3B82F6',
      'Angry': '#EF4444',
      'Surprised': '#F59E0B',
      'Fearful': '#8B5CF6',
      'Disgusted': '#6B7280',
      'Neutral': '#9CA3AF',
      'happy': '#10B981',
      'sad': '#3B82F6',
      'angry': '#EF4444',
      'surprise': '#F59E0B',
      'fear': '#8B5CF6',
      'disgust': '#6B7280',
      'neutral': '#9CA3AF'
    };
    return colors[emotion] || '#6B7280';
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      'Happy': '😊',
      'Sad': '😢',
      'Angry': '😠',
      'Surprised': '😲',
      'Fearful': '😨',
      'Disgusted': '🤢',
      'Neutral': '😐',
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'surprise': '😲',
      'fear': '😨',
      'disgust': '🤢',
      'neutral': '😐'
    };
    return emojis[emotion] || '😐';
  };

  const chartData = {
    labels: emotions.map(emotion => `${getEmotionEmoji(emotion)} ${emotion}`),
    datasets: [
      {
        data: counts,
        backgroundColor: emotions.map(emotion => getEmotionColor(emotion)),
        borderColor: emotions.map(emotion => getEmotionColor(emotion)),
        borderWidth: 2,
        hoverOffset: 10,
        cutout: '60%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#1f2937',
          font: {
            size: 12,
            weight: '500'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'การกระจายของอารมณ์',
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
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} ครั้ง (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    radius: '80%'
  };

  // คำนวณสถิติเพิ่มเติม
  const totalCount = counts.reduce((sum, count) => sum + count, 0);
  const mostCommonEmotion = emotions[counts.indexOf(Math.max(...counts))];
  const mostCommonCount = Math.max(...counts);
  const mostCommonPercentage = ((mostCommonCount / totalCount) * 100).toFixed(1);

  return (
    <div className="chart-container">
      <div className="chart-wrapper">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">อารมณ์ที่พบบ่อยที่สุด:</span>
          <span className="stat-value">
            {getEmotionEmoji(mostCommonEmotion)} {mostCommonEmotion}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">จำนวนครั้ง:</span>
          <span className="stat-value">{mostCommonCount} ครั้ง</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">เปอร์เซ็นต์:</span>
          <span className="stat-value">{mostCommonPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default EmotionDistributionChart;
