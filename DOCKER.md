# MAI Mood Coach - Docker Guide

## 🐳 การใช้งาน Docker

### ไฟล์ Docker ที่สร้างไว้

1. **Dockerfile** - สำหรับ production build
2. **Dockerfile.dev** - สำหรับ development mode
3. **docker-compose.yml** - สำหรับ production deployment
4. **docker-compose.dev.yml** - สำหรับ development environment
5. **docker-scripts.sh** - Script สำหรับจัดการ Docker

### 🚀 วิธีรันแอปพลิเคชัน

#### วิธีที่ 1: ใช้ Docker Commands

```bash
# สร้าง Docker image
docker build -t mai-mood-coach .

# รัน container
docker run -d -p 3000:3000 --name mai-mood-coach-app mai-mood-coach

# ดู logs
docker logs mai-mood-coach-app

# หยุด container
docker stop mai-mood-coach-app
docker rm mai-mood-coach-app
```

#### วิธีที่ 2: ใช้ Docker Compose

```bash
# รัน production mode
docker-compose up -d

# รัน development mode
docker-compose -f docker-compose.dev.yml up --build

# หยุด services
docker-compose down
docker-compose -f docker-compose.dev.yml down
```

#### วิธีที่ 3: ใช้ Script (แนะนำ)

```bash
# ให้สิทธิ์ไฟล์ script
chmod +x docker-scripts.sh

# ดูคำสั่งที่ใช้ได้
./docker-scripts.sh

# สร้าง image
./docker-scripts.sh build

# รัน production
./docker-scripts.sh run

# รัน development
./docker-scripts.sh run-dev

# หยุดแอปพลิเคชัน
./docker-scripts.sh stop

# ดู logs
./docker-scripts.sh logs

# ลบทุกอย่าง
./docker-scripts.sh clean
```

### 📊 สถานะปัจจุบัน

✅ **แอปพลิเคชันกำลังทำงานอยู่!**

- **URL**: http://localhost:3000
- **Container ID**: a342c5fdfbac
- **Status**: Running
- **Port**: 3000

### 🔧 คำสั่งที่มีประโยชน์

```bash
# ดู container ที่กำลังทำงาน
docker ps

# ดู logs แบบ real-time
docker logs -f mai-mood-coach-app

# เข้าไปใน container
docker exec -it mai-mood-coach-app sh

# ดูการใช้ resource
docker stats mai-mood-coach-app

# ลบ image
docker rmi mai-mood-coach

# ลบทุกอย่างที่ไม่ได้ใช้
docker system prune -a
```

### 🛠️ Development Mode

สำหรับการพัฒนาที่ต้องการ hot reload:

```bash
# รัน development mode
docker-compose -f docker-compose.dev.yml up --build

# หรือใช้ script
./docker-scripts.sh run-dev
```

Development mode จะ:
- Mount source code เข้า container
- รัน `npm start` แทน production build
- รองรับ hot reload
- ใช้ port 3000 เหมือนกัน

### 📁 ไฟล์ที่เกี่ยวข้อง

- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration
- `.dockerignore` - ไฟล์ที่ต้อง ignore
- `docker-scripts.sh` - Management script

### ⚠️ หมายเหตุ

1. **Port 3000** ต้องว่างก่อนรัน
2. **Docker** ต้องติดตั้งและทำงานอยู่
3. **Memory** ควรมีอย่างน้อย 2GB สำหรับ build
4. **Network** ต้องเชื่อมต่ออินเทอร์เน็ตสำหรับ download dependencies

### 🎯 การเข้าถึงแอปพลิเคชัน

เปิดเบราว์เซอร์ไปที่: **http://localhost:3000**

แอปพลิเคชันจะแสดงหน้าจอ MAI Mood Coach พร้อมฟีเจอร์ทั้งหมด:
- ตรวจจับอารมณ์
- แนะนำกิจกรรม
- ชุมชนส่งกำลังใจ
- โปรไฟล์ผู้ใช้
