import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, MapPin, Users, Heart } from 'lucide-react';
import './ActivityRecommendation.css';
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";
const db = getFirestore();

const ActivityRecommendation = ({ emotion, onActivityCompleted, onBackToDetection }) => {
  const [completedActivities, setCompletedActivities] = useState(new Set());

  // 🎯 เพิ่มกิจกรรมให้ครบ 10 ต่ออารมณ์
  const activityRecommendations = {
    Happy: [
      { id: 1, title: 'เดินเล่นในสวนสาธารณะ', description: 'ออกไปสูดอากาศบริสุทธิ์และชื่นชมธรรมชาติ', duration: '30-60 นาที', location: 'สวนสาธารณะใกล้บ้าน', participants: 'คนเดียวหรือกับเพื่อน', category: 'outdoor', icon: '🚶‍♀️' },
      { id: 2, title: 'วาดรูปหรือระบายสี', description: 'ใช้ความคิดสร้างสรรค์ในการสร้างงานศิลปะ', duration: '45-90 นาที', location: 'บ้านหรือคาเฟ่', participants: 'คนเดียว', category: 'creative', icon: '🎨' },
      { id: 3, title: 'โทรหาเพื่อนสนิท', description: 'แบ่งปันความสุขและสร้างความสัมพันธ์ที่ดี', duration: '20-40 นาที', location: 'ที่ไหนก็ได้', participants: '2 คน', category: 'social', icon: '📞' },
      { id: 4, title: 'เล่นดนตรี', description: 'แสดงออกทางดนตรีด้วยเครื่องดนตรีที่คุณชอบ', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียวหรือกลุ่ม', category: 'music', icon: '🎸' },
      { id: 5, title: 'ทำอาหารที่ชอบ', description: 'สร้างเมนูอร่อยเพื่อให้ตัวเองหรือครอบครัว', duration: '60 นาที', location: 'บ้าน', participants: 'คนเดียวหรือครอบครัว', category: 'cooking', icon: '🍳' },
      { id: 6, title: 'เล่นกีฬา', description: 'ออกกำลังกายสนุกๆ เช่น ฟุตบอล บาสเกตบอล', duration: '60 นาที', location: 'สนามกีฬา', participants: 'กลุ่ม', category: 'exercise', icon: '⚽' },
      { id: 7, title: 'ดูหนังตลก', description: 'หัวเราะกับหนังหรือซีรีส์โปรด', duration: '90-120 นาที', location: 'บ้านหรือโรงหนัง', participants: 'คนเดียวหรือเพื่อน', category: 'entertainment', icon: '🎬' },
      { id: 8, title: 'ปลูกต้นไม้', description: 'ใช้เวลาสนุกกับธรรมชาติและการดูแลต้นไม้', duration: '30-60 นาที', location: 'สวนหรือระเบียง', participants: 'คนเดียว', category: 'outdoor', icon: '🌱' },
      { id: 9, title: 'เล่นเกม', description: 'สนุกกับเกมโปรด', duration: '30-90 นาที', location: 'บ้าน', participants: 'คนเดียวหรือเพื่อน', category: 'entertainment', icon: '🎮' },
      { id: 10, title: 'ถ่ายรูป', description: 'เก็บภาพความสุขไว้เป็นความทรงจำ', duration: '30-60 นาที', location: 'ที่ไหนก็ได้', participants: 'คนเดียวหรือเพื่อน', category: 'creative', icon: '📸' }
    ],
    Sad: [
      { id: 11, title: 'ฟังเพลงที่ชอบ', description: 'ให้เพลงช่วยเยียวยาจิตใจ', duration: '30-60 นาที', location: 'บ้านหรือที่เงียบสงบ', participants: 'คนเดียว', category: 'music', icon: '🎵' },
      { id: 12, title: 'เขียนไดอารี่', description: 'ระบายความรู้สึกผ่านการเขียน', duration: '20-40 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'writing', icon: '📝' },
      { id: 13, title: 'ออกกำลังกายเบาๆ', description: 'การออกกำลังกายช่วยเพิ่มสารเอ็นดอร์ฟิน', duration: '30-45 นาที', location: 'บ้านหรือยิม', participants: 'คนเดียว', category: 'exercise', icon: '🧘‍♀️' },
      { id: 14, title: 'นั่งสมาธิ', description: 'ฝึกจิตใจให้สงบด้วยการทำสมาธิ', duration: '15-30 นาที', location: 'ที่เงียบสงบ', participants: 'คนเดียว', category: 'mindfulness', icon: '🧘' },
      { id: 15, title: 'โทรหาเพื่อน', description: 'พูดคุยกับคนที่ไว้ใจ', duration: '20-40 นาที', location: 'ที่ไหนก็ได้', participants: '2 คน', category: 'social', icon: '📱' },
      { id: 16, title: 'ดูหนังหรือซีรีส์', description: 'ผ่อนคลายกับหนังโปรด', duration: '90-120 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'entertainment', icon: '🎥' },
      { id: 17, title: 'วาดรูป', description: 'ใช้ศิลปะในการระบายความรู้สึก', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'creative', icon: '🎨' },
      { id: 18, title: 'ออกไปเดินช้าๆ', description: 'เดินเล่นอย่างสงบเพื่อปลดปล่อยความเศร้า', duration: '30 นาที', location: 'สวนสาธารณะ', participants: 'คนเดียว', category: 'outdoor', icon: '🚶' },
      { id: 19, title: 'ทำอาหารง่ายๆ', description: 'ให้ความสุขเล็กๆ จากอาหาร', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'cooking', icon: '🥗' },
      { id: 20, title: 'นอนพักผ่อน', description: 'พักฟื้นร่างกายและจิตใจ', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'comfort', icon: '🛌' }
    ],
    Angry: [
      { id: 21, title: 'วิ่งหรือออกกำลังกายหนัก', description: 'ปลดปล่อยพลังงานและความเครียด', duration: '45-60 นาที', location: 'สวนสาธารณะหรือยิม', participants: 'คนเดียว', category: 'exercise', icon: '🏃‍♂️' },
      { id: 22, title: 'ทำความสะอาดบ้าน', description: 'ใช้พลังงานในการทำกิจกรรมที่เป็นประโยชน์', duration: '60-90 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'productive', icon: '🧹' },
      { id: 23, title: 'ฝึกหายใจลึกๆ', description: 'การหายใจช่วยให้ใจสงบและผ่อนคลาย', duration: '10-20 นาที', location: 'ที่เงียบสงบ', participants: 'คนเดียว', category: 'mindfulness', icon: '🫁' },
      { id: 24, title: 'ต่อยมวยหรือชกกระสอบทราย', description: 'ระบายความโกรธผ่านการออกกำลังกาย', duration: '30 นาที', location: 'ยิม', participants: 'คนเดียว', category: 'exercise', icon: '🥊' },
      { id: 25, title: 'เขียนสิ่งที่โกรธลงกระดาษ', description: 'ปลดปล่อยอารมณ์ออกมาด้วยการเขียน', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'writing', icon: '✍️' },
      { id: 26, title: 'นั่งสมาธิ', description: 'ทำจิตใจให้สงบลง', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'mindfulness', icon: '🧘‍♂️' },
      { id: 27, title: 'เดินเร็ว', description: 'ออกไปเดินเพื่อปล่อยความโกรธ', duration: '20-30 นาที', location: 'สวนสาธารณะ', participants: 'คนเดียว', category: 'outdoor', icon: '🚶‍♂️' },
      { id: 28, title: 'วาดรูป', description: 'ระบายความรู้สึกผ่านงานศิลปะ', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'creative', icon: '🎨' },
      { id: 29, title: 'เล่นดนตรีจังหวะหนัก', description: 'ปล่อยพลังไปกับดนตรี', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'music', icon: '🥁' },
      { id: 30, title: 'เล่นเกมที่ใช้แรง', description: 'เกม VR หรือเกมกีฬาเพื่อปลดปล่อยพลังงาน', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'entertainment', icon: '🎮' }
    ],
    Surprised: [
      { id: 31, title: 'ลองทำอาหารใหม่', description: 'ทดลองทำเมนูที่ยังไม่เคยทำ', duration: '60-120 นาที', location: 'บ้าน', participants: 'คนเดียวหรือครอบครัว', category: 'cooking', icon: '👨‍🍳' },
      { id: 32, title: 'ไปเที่ยวสถานที่ใหม่', description: 'สำรวจสถานที่ที่ยังไม่เคยไป', duration: '2-4 ชั่วโมง', location: 'สถานที่ใหม่', participants: 'คนเดียวหรือกับเพื่อน', category: 'adventure', icon: '🗺️' },
      { id: 33, title: 'อ่านบทความใหม่ๆ', description: 'หาความรู้ที่ไม่เคยรู้มาก่อน', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'learning', icon: '📖' },
      { id: 34, title: 'เข้าร่วมกิจกรรมไม่คุ้นเคย', description: 'ลองสิ่งใหม่เพื่อสร้างประสบการณ์', duration: '1-2 ชั่วโมง', location: 'ที่จัดกิจกรรม', participants: 'กลุ่ม', category: 'social', icon: '🤝' },
      { id: 35, title: 'ลองเล่นเกมใหม่', description: 'ท้าทายตัวเองด้วยเกมที่ไม่เคยเล่น', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียวหรือเพื่อน', category: 'entertainment', icon: '🎮' },
      { id: 36, title: 'ถ่ายรูปสิ่งที่ไม่เคยเห็น', description: 'เก็บความแปลกใจไว้เป็นภาพ', duration: '30 นาที', location: 'ที่ไหนก็ได้', participants: 'คนเดียว', category: 'creative', icon: '📸' },
      { id: 37, title: 'ลองอาหารใหม่', description: 'ไปชิมอาหารที่ไม่เคยกิน', duration: '1-2 ชั่วโมง', location: 'ร้านอาหาร', participants: 'คนเดียวหรือเพื่อน', category: 'cooking', icon: '🍣' },
      { id: 38, title: 'อ่านหนังสือแนวใหม่', description: 'เลือกแนวที่ไม่เคยอ่านมาก่อน', duration: '1-2 ชั่วโมง', location: 'บ้านหรือคาเฟ่', participants: 'คนเดียว', category: 'reading', icon: '📚' },
      { id: 39, title: 'ลองฟังเพลงแนวใหม่', description: 'เปิดประสบการณ์ดนตรีใหม่', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'music', icon: '🎧' },
      { id: 40, title: 'ลองกิจกรรมผจญภัย', description: 'ปีนเขา, ปั่นจักรยานเสือภูเขา', duration: '2-3 ชั่วโมง', location: 'ธรรมชาติ', participants: 'กลุ่ม', category: 'adventure', icon: '⛰️' }
    ],
    Fearful: [
      { id: 41, title: 'พูดคุยกับคนที่ไว้ใจ', description: 'แบ่งปันความกังวลกับคนใกล้ตัว', duration: '30-60 นาที', location: 'ที่สบายใจ', participants: '2 คน', category: 'social', icon: '💬' },
      { id: 42, title: 'ทำกิจกรรมที่คุ้นเคย', description: 'ทำสิ่งที่ทำให้รู้สึกปลอดภัยและสบายใจ', duration: '30-60 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'comfort', icon: '🏠' },
      { id: 43, title: 'ฟังเพลงสงบๆ', description: 'ช่วยลดความกังวล', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'music', icon: '🎶' },
      { id: 44, title: 'นั่งสมาธิ', description: 'ฝึกสติให้อยู่กับปัจจุบัน', duration: '15-30 นาที', location: 'ที่เงียบสงบ', participants: 'คนเดียว', category: 'mindfulness', icon: '🧘‍♀️' },
      { id: 45, title: 'ดูหนังเบาๆ', description: 'ผ่อนคลายความกลัวด้วยหนัง feel good', duration: '1-2 ชั่วโมง', location: 'บ้าน', participants: 'คนเดียวหรือครอบครัว', category: 'entertainment', icon: '📺' },
      { id: 46, title: 'อ่านหนังสือที่คุ้นเคย', description: 'ให้ความรู้สึกปลอดภัย', duration: '1 ชั่วโมง', location: 'บ้าน', participants: 'คนเดียว', category: 'reading', icon: '📖' },
      { id: 47, title: 'ออกกำลังกายเบาๆ', description: 'เคลื่อนไหวร่างกายเพื่อผ่อนคลายความกลัว', duration: '20-30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'exercise', icon: '🏋️' },
      { id: 48, title: 'ทำอาหารง่ายๆ', description: 'กิจกรรมที่ควบคุมได้ ลดความกลัว', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'cooking', icon: '🥘' },
      { id: 49, title: 'คุยกับสัตว์เลี้ยง', description: 'สร้างความอบอุ่นใจ', duration: '15 นาที', location: 'บ้าน', participants: 'สัตว์เลี้ยง', category: 'comfort', icon: '🐶' },
      { id: 50, title: 'เขียนบันทึก', description: 'ถ่ายทอดความกลัวลงบนกระดาษ', duration: '20 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'writing', icon: '✍️' }
    ],
    Disgusted: [
      { id: 51, title: 'ทำความสะอาดและจัดระเบียบ', description: 'สร้างสภาพแวดล้อมที่สะอาดและเป็นระเบียบ', duration: '60-90 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'productive', icon: '🧽' },
      { id: 52, title: 'อาบน้ำอุ่น', description: 'ทำให้ร่างกายรู้สึกสดชื่น', duration: '20 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'comfort', icon: '🛁' },
      { id: 53, title: 'ฟังเพลงสดชื่น', description: 'ช่วยเปลี่ยนอารมณ์', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'music', icon: '🎵' },
      { id: 54, title: 'ออกกำลังกาย', description: 'ทำให้เหงื่อออกและรู้สึกดีขึ้น', duration: '30 นาที', location: 'บ้านหรือยิม', participants: 'คนเดียว', category: 'exercise', icon: '💪' },
      { id: 55, title: 'เปิดหน้าต่างรับลม', description: 'ให้บ้านถ่ายเทอากาศ', duration: '10 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'comfort', icon: '🌬️' },
      { id: 56, title: 'นั่งสมาธิ', description: 'จัดการอารมณ์ขยะแขยงด้วยสติ', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'mindfulness', icon: '🧘' },
      { id: 57, title: 'ลองอาหารที่สดชื่น', description: 'เช่น ผลไม้รสเปรี้ยว', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'cooking', icon: '🍋' },
      { id: 58, title: 'ดูคลิปตลก', description: 'ช่วยเบี่ยงเบนความรู้สึก', duration: '20 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'entertainment', icon: '😂' },
      { id: 59, title: 'จัดโต๊ะทำงาน', description: 'ให้สภาพแวดล้อมน่าทำงานขึ้น', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'productive', icon: '🪑' },
      { id: 60, title: 'วาด doodle', description: 'ปล่อยอารมณ์ลงบนกระดาษ', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'creative', icon: '✏️' }
    ],
    Neutral: [
      { id: 61, title: 'อ่านหนังสือที่สนใจ', description: 'ใช้เวลากับหนังสือที่อยากอ่าน', duration: '45-90 นาที', location: 'บ้านหรือคาเฟ่', participants: 'คนเดียว', category: 'reading', icon: '📚' },
      { id: 62, title: 'เรียนรู้ทักษะใหม่', description: 'พัฒนาตนเองด้วยทักษะใหม่ๆ', duration: '60-120 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'learning', icon: '🎓' },
      { id: 63, title: 'ทำอาหารง่ายๆ', description: 'เพิ่มความสุขเล็กๆ ในชีวิตประจำวัน', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'cooking', icon: '🍳' },
      { id: 64, title: 'ออกกำลังกาย', description: 'รักษาสุขภาพกายและใจ', duration: '30 นาที', location: 'บ้านหรือยิม', participants: 'คนเดียว', category: 'exercise', icon: '🏋️' },
      { id: 65, title: 'นั่งสมาธิ', description: 'ทำจิตใจให้นิ่ง', duration: '15 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'mindfulness', icon: '🧘' },
      { id: 66, title: 'เล่นดนตรี', description: 'เพลิดเพลินกับเสียงเพลง', duration: '30 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'music', icon: '🎹' },
      { id: 67, title: 'วาดรูป', description: 'ใช้เวลาสร้างงานศิลป์', duration: '45 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'creative', icon: '🎨' },
      { id: 68, title: 'ปลูกต้นไม้', description: 'ดูแลต้นไม้เพื่อผ่อนคลาย', duration: '30 นาที', location: 'สวน', participants: 'คนเดียว', category: 'outdoor', icon: '🌿' },
      { id: 69, title: 'ดูหนัง', description: 'เพลิดเพลินกับภาพยนตร์โปรด', duration: '90 นาที', location: 'บ้าน', participants: 'คนเดียวหรือเพื่อน', category: 'entertainment', icon: '🎬' },
      { id: 70, title: 'เขียนบันทึก', description: 'สะท้อนความคิดประจำวัน', duration: '20 นาที', location: 'บ้าน', participants: 'คนเดียว', category: 'writing', icon: '✍️' }
    ]
  };

  const normalizeEmotion = (emo) => {
    const rawName = (typeof emo === 'string') ? emo : (emo?.name || emo?.emotion || 'Neutral');
    const name = String(rawName).trim();
    const titleName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const emoji = emo?.emoji || {
      Happy: '😊',
      Sad: '😢',
      Angry: '😠',
      Surprised: '😲',
      Fearful: '😨',
      Disgusted: '🤢',
      Neutral: '😐'
    }[titleName] || '🙂';
    const confidence = typeof emo?.confidence === 'number' ? emo.confidence : undefined;
    return { name: titleName, emoji, confidence };
  };

  // 🎯 ฟังก์ชันสุ่มเลือก 5 กิจกรรมจาก 10
  const pickRandomActivities = (activities, count = 5) => {
    const shuffled = [...activities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const norm = normalizeEmotion(emotion);
  const activities = pickRandomActivities(activityRecommendations[norm.name] || activityRecommendations['Neutral'], 5);
  
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
      learning: '#EC4899',
      entertainment: '#FBBF24'
    };
    return colors[category] || '#6B7280';
  };
  const handleActivityComplete = async (activity) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      await addDoc(collection(db, "completedActivities"), {
        userId: user ? user.uid : "guest",  // ถ้ามีระบบล็อกอิน
        activityId: activity.id,
        title: activity.title,
        emotion: norm.name,
        timestamp: serverTimestamp(),
      });

      setCompletedActivities(prev => new Set([...prev, activity.id]));
      onActivityCompleted(activity);
    } catch (error) {
      console.error("Error saving activity:", error);
    }
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
            <span className="emotion-emoji">{norm.emoji}</span>
            <div className="emotion-info">
              <h2>อารมณ์: {norm.name}</h2>
              {typeof norm.confidence === 'number' && (
                <p>ความมั่นใจ: {Math.round(norm.confidence * 100)}%</p>
              )}
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
                  type="button"
                  className="complete-btn"
                  aria-label={`ทำกิจกรรม: ${activity.title}`}
                  onClick={() => handleActivityComplete(activity)}
                >
                  <CheckCircle className="btn-icon" /> ทำกิจกรรมนี้
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
