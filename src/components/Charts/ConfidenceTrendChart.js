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

const ConfidenceTrendChart = ({ data, period = 'week' }) => {
  // จัดกลุ่มข้อมูลตามช่วงเวลา
  const groupDataByPeriod = (data, period) => {
    let groupBy;
    
    switch (period) {
      case 'week':
        groupBy = (date) => {
          const d = new Date(date);
          return d.toLocaleDateString('th-TH', { weekday: 'short' });
        };
        break;
      case 'month':
        groupBy = (date) => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        };
        break;
      case 'year':
        groupBy = (date) => {
          const d = new Date(date);
          return d.toLocaleDateString('th-TH', { month: 'short' });
        };
        break;
      default:
        groupBy = (date) => new Date(date).toLocaleDateString('th-TH');
    }
    
    const grouped = {};
    data.forEach(item => {
      const key = groupBy(item.date);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  };

  const groupedData = groupDataByPeriod(data, period);
  const labels = Object.keys(groupedData).sort((a, b) => {
    if (period === 'week') {
      const weekDays = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
      return weekDays.indexOf(a) - weekDays.indexOf(b);
    }
    return new Date(a) - new Date(b);
  });

  const confidenceData = labels.map(label => {
    const dayData = groupedData[label];
    const avgConfidence = dayData.reduce((sum, item) => 
      sum + (item.confidence || 0), 0
    ) / dayData.length;
    return Math.round(avgConfidence * 100);
  });

  // คำนวณค่าเฉลี่ยความมั่นใจ
  const averageConfidence = confidenceData.reduce((sum, val) => sum + val, 0) / confidenceData.length;
  const trend = confidenceData.length > 1 
    ? confidenceData[confidenceData.length - 1] - confidenceData[0]
    : 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'ความมั่นใจ (%)',
        data: confidenceData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
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
        text: `แนวโน้มความมั่นใจ - ${period === 'week' ? 'สัปดาห์นี้' : period === 'month' ? 'เดือนนี้' : 'ปีนี้'}`,
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
            return `ความมั่นใจ: ${context.parsed.y}%`;
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
        min: 0,
        max: 100,
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
            return value + '%';
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
    <div className="chart-container">
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">ความมั่นใจเฉลี่ย:</span>
          <span className="stat-value">{averageConfidence.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">แนวโน้ม:</span>
          <span className={`stat-value ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
            {trend > 0 ? '↗ เพิ่มขึ้น' : trend < 0 ? '↘ ลดลง' : '→ คงที่'} {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">ระดับสูงสุด:</span>
          <span className="stat-value">{Math.max(...confidenceData)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">ระดับต่ำสุด:</span>
          <span className="stat-value">{Math.min(...confidenceData)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceTrendChart;
