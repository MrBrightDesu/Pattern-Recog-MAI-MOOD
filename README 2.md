# MAI Mood Coach: AI-driven Emotion Recognition for Real-Life Engagement

## เกี่ยวกับโปรเจค

MAI Mood Coach เป็นเว็บแอปพลิเคชันที่ใช้ AI ในการวิเคราะห์อารมณ์ของผู้ใช้จากภาพใบหน้าและน้ำเสียง (multimodal emotion recognition) แล้วแนะนำกิจกรรมที่เหมาะสมในโลกจริง เพื่อช่วยดูแลสุขภาพจิตและลดการใช้โซเชียลมีเดียที่ไม่ก่อประโยชน์

## ฟีเจอร์หลัก

### 1. ตรวจจับอารมณ์ (Emotion Detection)
- รองรับการตรวจจับอารมณ์จากกล้องและเสียง
- วิเคราะห์อารมณ์ 7 ประเภท: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- แสดงความมั่นใจในการวิเคราะห์

### 2. แนะนำกิจกรรม (Activity Recommendations)
- แนะนำกิจกรรมที่เหมาะสมกับอารมณ์ปัจจุบัน
- กิจกรรมหลากหลายประเภท: outdoor, creative, social, music, writing, exercise
- แสดงรายละเอียดกิจกรรม: ระยะเวลา, สถานที่, จำนวนผู้เข้าร่วม
- ระบบติดตามการทำกิจกรรม

### 3. ชุมชนส่งกำลังใจ (Community Board)
- บอร์ดชุมชนเชิงบวกที่เน้นการส่งกำลังใจ
- แชร์ประสบการณ์การทำกิจกรรม
- ระบบ like และ comment
- สถิติชุมชน

### 4. โปรไฟล์ผู้ใช้ (User Profile)
- แสดงสถิติการใช้งาน
- ประวัติอารมณ์
- ความสำเร็จและรางวัล
- กราฟแสดงแนวโน้มอารมณ์

## เทคโนโลยีที่ใช้

- **Frontend**: React 18
- **Styling**: CSS3 with modern features (backdrop-filter, grid, flexbox)
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)

## การติดตั้งและรัน

1. ติดตั้ง dependencies:
```bash
npm install
```

2. รันแอปพลิเคชัน:
```bash
npm start
```

3. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## โครงสร้างโปรเจค

```
src/
├── components/
│   ├── Header.js                 # Navigation header
│   ├── Header.css
│   ├── EmotionDetection.js       # Emotion detection interface
│   ├── EmotionDetection.css
│   ├── ActivityRecommendation.js # Activity recommendation cards
│   ├── ActivityRecommendation.css
│   ├── CommunityBoard.js         # Community board
│   ├── CommunityBoard.css
│   ├── Profile.js               # User profile
│   └── Profile.css
├── App.js                       # Main app component
├── App.css
├── index.js                     # Entry point
└── index.css                    # Global styles
```

## ฟีเจอร์ที่พัฒนาแล้ว (Mock-up)

### ✅ ตรวจจับอารมณ์
- หน้าจอเลือกโหมดการตรวจจับ (กล้อง/เสียง/ทั้งสอง)
- จำลองการตรวจจับอารมณ์
- แสดงผลลัพธ์พร้อมความมั่นใจ

### ✅ แนะนำกิจกรรม
- แสดงกิจกรรมตามอารมณ์ที่ตรวจจับได้
- ระบบติดตามการทำกิจกรรม
- การ์ดกิจกรรมที่สวยงาม

### ✅ ชุมชน
- บอร์ดแชร์ประสบการณ์
- ระบบ like และ comment
- สถิติชุมชน

### ✅ โปรไฟล์
- สถิติการใช้งาน
- ประวัติอารมณ์
- ระบบความสำเร็จ

## การออกแบบ UI/UX

- **Color Scheme**: Gradient background (purple to blue)
- **Design Style**: Modern, clean, with glassmorphism effects
- **Responsive**: รองรับทุกขนาดหน้าจอ
- **Accessibility**: ใช้สีและ contrast ที่เหมาะสม
- **Thai Language**: รองรับภาษาไทยเต็มรูปแบบ

## ข้อมูลจำลอง (Mock Data)

แอปพลิเคชันใช้ข้อมูลจำลองสำหรับ:
- อารมณ์ที่ตรวจจับได้
- กิจกรรมแนะนำ
- โพสต์ในชุมชน
- สถิติผู้ใช้

## การพัฒนาต่อ

สำหรับการพัฒนาจริง ควรเพิ่ม:
1. **Backend API**: สำหรับเก็บข้อมูลผู้ใช้และอารมณ์
2. **AI Integration**: เชื่อมต่อกับ AI model จริง
3. **Camera/Audio**: ใช้ WebRTC สำหรับการตรวจจับจริง
4. **Database**: เก็บข้อมูลผู้ใช้และสถิติ
5. **Authentication**: ระบบล็อกอิน
6. **Push Notifications**: แจ้งเตือนกิจกรรม

## ทีมพัฒนา

- นายจิรฐา วงศ์สมบูรณ์ - 6520501000
- นายชยุต ฤกษ์ปรีชาชาญ - 6520501018
- นายธัญชนิต ธันยกิจธาดา – 6520503347
- นายธีราธร อุดมศิลป์ – 6520503363

## License

MIT License
