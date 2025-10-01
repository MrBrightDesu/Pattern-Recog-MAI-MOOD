import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyActivityChart = ({ data }) => {
  // สร้างข้อมูลสำหรับ 7 วันที่ผ่านมา
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('th-TH', { weekday: 'short' }),
        count: 0
      });
    }
    
    return days;
  };

  const last7Days = getLast7Days();
  
  // นับจำนวนกิจกรรมในแต่ละวัน
  data.forEach(item => {
    const itemDate = item.date;
    const dayIndex = last7Days.findIndex(day => day.date === itemDate);
    if (dayIndex !== -1) {
      last7Days[dayIndex].count++;
    }
  });

  const chartData = {
    labels: last7Days.map(day => day.dayName),
    datasets: [
      {
        label: 'จำนวนกิจกรรม',
        data: last7Days.map(day => day.count),
        backgroundColor: last7Days.map(day => 
          day.count > 0 
            ? 'rgba(16, 185, 129, 0.8)' 
            : 'rgba(107, 114, 128, 0.3)'
        ),
        borderColor: last7Days.map(day => 
          day.count > 0 
            ? 'rgb(16, 185, 129)' 
            : 'rgb(107, 114, 128)'
        ),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'กิจกรรมรายสัปดาห์',
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
        displayColors: false,
        callbacks: {
          title: function(context) {
            const dayIndex = context[0].dataIndex;
            const day = last7Days[dayIndex];
            const fullDate = new Date(day.date).toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            return fullDate;
          },
          label: function(context) {
            const count = context.parsed.y;
            if (count === 0) {
              return 'ไม่มีกิจกรรม';
            } else if (count === 1) {
              return '1 กิจกรรม';
            } else {
              return `${count} กิจกรรม`;
            }
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
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11
          },
          callback: function(value) {
            return value === 0 ? '0' : value;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        }
      }
    }
  };

  // คำนวณสถิติ
  const totalActivities = last7Days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = last7Days.filter(day => day.count > 0).length;
  const averagePerDay = (totalActivities / 7).toFixed(1);
  const mostActiveDay = last7Days.reduce((max, day) => 
    day.count > max.count ? day : max
  );

  return (
    <div className="chart-container weekly-activity-chart">
      <div className="chart-wrapper">
        <Bar data={chartData} options={options} />
      </div>
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">รวมทั้งสัปดาห์:</span>
          <span className="stat-value">{totalActivities} กิจกรรม</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">วันที่มีกิจกรรม:</span>
          <span className="stat-value">{activeDays}/7 วัน</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">เฉลี่ยต่อวัน:</span>
          <span className="stat-value">{averagePerDay} ครั้ง</span>
        </div>
        {mostActiveDay.count > 0 && (
          <div className="stat-item">
            <span className="stat-label">วันที่ทำมากที่สุด:</span>
            <span className="stat-value">
              {mostActiveDay.dayName} ({mostActiveDay.count} ครั้ง)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyActivityChart;
