# 🔥 Firebase Setup Guide

## 1. ไปที่ Firebase Console
- เปิด https://console.firebase.google.com/
- สร้างโปรเจ็กต์ใหม่หรือเลือกโปรเจ็กต์ที่มีอยู่

## 2. เปิดใช้งาน Authentication
- คลิก "Authentication" ในเมนูซ้าย
- คลิก "Get started"
- ไปที่แท็บ "Sign-in method"
- เปิดใช้งาน "Email/Password"
- คลิก "Save"

## 3. ดู Firebase Config
- ไปที่ "Project settings" (ไอคอนเฟือง)
- เลื่อนลงไปหา "Your apps"
- คลิก "Web app" หรือ "Add app" > "Web"
- ตั้งชื่อแอป (เช่น "emotion-detection-app")
- คัดลอก Firebase config

## 4. แก้ไขไฟล์ `src/firebase/config.js`

แทนที่ข้อมูลในไฟล์ `src/firebase/config.js` ด้วยข้อมูลจาก Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...", // ใส่ API Key ของคุณ
  authDomain: "your-project.firebaseapp.com", // ใส่ Auth Domain ของคุณ
  projectId: "your-project-id", // ใส่ Project ID ของคุณ
  storageBucket: "your-project.appspot.com", // ใส่ Storage Bucket ของคุณ
  messagingSenderId: "123456789", // ใส่ Messaging Sender ID ของคุณ
  appId: "1:123456789:web:abcdef..." // ใส่ App ID ของคุณ
};
```

## 5. ทดสอบการทำงาน
- รัน `npm start`
- เปิดเบราว์เซอร์ไปที่ http://localhost:3000
- ทดสอบการสมัครสมาชิกและเข้าสู่ระบบ

## 6. ตัวอย่าง Firebase Config
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "emotion-detection-app.firebaseapp.com",
  projectId: "emotion-detection-app",
  storageBucket: "emotion-detection-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## 7. Security Rules (ถ้าต้องการ)
ใน Firebase Console > Firestore Database > Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 8. ตรวจสอบการทำงาน
- เปิด Developer Tools (F12)
- ดู Console ว่ามี error หรือไม่
- ทดสอบการ login/register
- ตรวจสอบว่า user ปรากฏใน Firebase Authentication
