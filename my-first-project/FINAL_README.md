# 🔄 CS316 Barter Platform - Final Project

> Солилцооны цахим платформ - Бараа, үйлчилгээний солилцооны систем

[![Tests](https://github.com/Davaa1101/CS316/actions/workflows/ci.yml/badge.svg)](https://github.com/Davaa1101/CS316/actions)
[![Deployment](https://img.shields.io/badge/deployment-active-success)](https://cs-316.vercel.app)

## 📋 Агуулга

- [Төслийн тухай](#төслийн-тухай)
- [Багийн гишүүд](#багийн-гишүүд)
- [Технологийн стек](#технологийн-стек)
- [Суулгах заавар](#суулгах-заавар)
- [Ашиглах заавар](#ашиглах-заавар)
- [API Баримтжуулалт](#api-баримтжуулалт)
- [Туршилт](#туршилт)
- [Deployment](#deployment)
- [Түгээмэл асуултууд](#түгээмэл-асуултууд)

## 🎯 Төслийн тухай

**CS316 Barter Platform** нь бараа, үйлчилгээг мөнгөгүйгээр солилцох боломж олгодог цахим платформ юм. Хэрэглэгчид өөрсдийн барааг оруулж, бусдын бараатай солилцох санал илгээж, харилцан тохиролцох боломжтой.

### Гол боломжууд

✅ **Хэрэглэгчийн удирдлага**
- Бүртгэл, нэвтрэх, профайл засах
- JWT-based authentication
- Password reset functionality

✅ **Барааны удирдлага**
- Бараа нэмэх, засах, устгах
- Зургийн хуулалт (multiple images)
- Хайлт, шүүлт, pagination
- Категорийн систем

✅ **Солилцооны систем**
- Санал илгээх, хүлээн авах
- Санал зөвшөөрөх/татгалзах
- Солилцооны төлөв хянах
- Түүх хадгалах

✅ **Харилцаа холбоо**
- Real-time чат систем
- Мэдэгдэл систем
- Хэрэглэгчийн үнэлгээ

✅ **Админ панел**
- Хэрэглэгчийн удирдлага
- Контентын модераци
- Системийн статистик

## 👥 Багийн гишүүд

| Нэр | Үүрэг | GitHub | Хувь нэмэр |
|-----|-------|--------|-----------|
| Davaa | Full Stack Developer | [@Davaa1101](https://github.com/Davaa1101) | Backend API, Authentication, Testing |

## 🛠 Технологийн стек

### Backend
- **Runtime:** Node.js v20.17.0
- **Framework:** Express.js 4.18.2
- **Database:** MongoDB Atlas (Mongoose 8.0.3)
- **Authentication:** JWT (jsonwebtoken 9.0.2), bcrypt 2.4.3
- **Security:** Helmet 7.1.0, express-rate-limit 7.1.5
- **Validation:** express-validator 7.0.1
- **File Upload:** Multer 1.4.5

### Frontend
- **Library:** React 18.2.0
- **Routing:** React Router DOM 6.8.0
- **HTTP Client:** Axios 1.3.0
- **UI Framework:** Bootstrap 5.3.0
- **Icons:** Font Awesome 6.4.0

### Testing
- **Framework:** Jest 30.2.0
- **API Testing:** Supertest 7.1.4
- **Coverage:** Jest Coverage Reports

### DevOps
- **CI/CD:** GitHub Actions
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway
- **Database:** MongoDB Atlas
- **Version Control:** Git, GitHub

## 📦 Суулгах заавар

### Урьдчилсан шаардлага

```bash
# Node.js болон npm хувилбар шалгах
node --version  # v18.0.0 эсвэл дээш
npm --version   # v9.0.0 эсвэл дээш
```

### 1. Repository татаж авах

```bash
git clone https://github.com/Davaa1101/CS316.git
cd CS316/my-first-project
```

### 2. Backend суулгах

```bash
# Dependencies суулгах
npm install

# Environment variables тохируулах
cp .env.example .env
# .env файлыг засаж өөрийн тохиргоог оруулна
```

**.env файлын агуулга:**
```env
# Node Environment
NODE_ENV=development
PORT=3000

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 3. Frontend суулгах

```bash
cd frontend
npm install

# Frontend environment variables
echo "REACT_APP_API_BASE=http://localhost:3000/api" > .env.local
```

### 4. Database тохируулах

MongoDB Atlas дээр database үүсгэсэн байх ёстой. Эсвэл local MongoDB:

```bash
# Local MongoDB ашиглах бол
MONGODB_URI=mongodb://localhost:27017/barter-platform
```

### 5. Аппликэйшн ажиллуулах

**Backend серверийг асаах:**
```bash
npm run dev  # Development mode (nodemon)
# эсвэл
npm start    # Production mode
```

**Frontend development server:**
```bash
cd frontend
npm start
```

**Хоёуланг нэгэн зэрэг:**
```bash
# Backend: Terminal 1
npm run dev

# Frontend: Terminal 2
cd frontend && npm start
```

Вэб хөтөч дээр `http://localhost:3001` нээнэ.

## 🚀 Ашиглах заавар

### Энгийн хэрэглэгч

#### 1. Бүртгүүлэх
1. `http://localhost:3001/register` хаяг руу орно
2. Нэр, имэйл, нууц үг оруулна
3. Хаяг мэдээлэл (хот, дүүрэг) оруулна
4. "Бүртгүүлэх" товч дарна

#### 2. Нэвтрэх
1. `http://localhost:3001/login` хаяг руу орно
2. Имэйл, нууц үг оруулна
3. "Нэвтрэх" товч дарна

#### 3. Бараа нэмэх
1. Dashboard → "Бараа нэмэх" товч
2. Барааны мэдээлэл бөглөх:
   - Гарчиг, тайлбар
   - Категори сонгох
   - Байдал (шинэ/хуучин)
   - Зураг хуулах (5MB хүртэл)
   - Хайж буй бараа сонгох
3. "Нэмэх" товч дарна

#### 4. Солилцоо хийх
1. Барааны жагсаалт хэсэгт орно
2. Сонирхсон бараагаа сонгоно
3. "Санал илгээх" товч дарна
4. Өөрийн санал болгох барааг сонгоно
5. Мессеж бичиж илгээнэ

#### 5. Профайл засах
1. Профайл цэс → "Профайл засах"
2. Хувийн мэдээлэл өөрчлөх
3. Профайл зураг солих
4. Хадгалах

### Админ хэрэглэгч

#### Админ панел руу нэвтрэх
- URL: `/admin/login`
- Эрх: Admin role шаардлагатай

#### Үндсэн функцууд
1. **Хэрэглэгчийн удирдлага**
   - Жагсаалт харах
   - Эрх өөрчлөх
   - Хэрэглэгч түгжих/тайлах

2. **Контентын модераци**
   - Барааны жагсаалт
   - Санал гомдол шийдвэрлэх
   - Зохисгүй контент устгах

3. **Статистик**
   - Нийт хэрэглэгч
   - Нийт солилцоо
   - Идэвхтэй бараа

## 📡 API Баримтжуулалт

### Base URL
```
Development: http://localhost:3000/api
Production: https://cs316-production.up.railway.app/api
```

### Authentication Endpoints

#### POST /api/auth/register
Шинэ хэрэглэгч бүртгэх

**Request:**
```json
{
  "name": "Бат-Эрдэнэ",
  "email": "user@example.com",
  "password": "Password123",
  "phone": "99119911",
  "location": {
    "city": "Улаанбаатар",
    "district": "Сүхбаатар"
  }
}
```

**Response (201):**
```json
{
  "message": "Амжилттай бүртгэгдлээ!",
  "token": "eyJhbGci...",
  "user": { ... }
}
```

#### POST /api/auth/login
Нэвтрэх

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Items Endpoints

#### GET /api/items
Бүх барааны жагсаалт (pagination)

**Query Parameters:**
- `page` (number): Хуудасны дугаар (default: 1)
- `limit` (number): Хуудас бүрийн тоо (default: 10)
- `category` (string): Категориор шүүх
- `condition` (string): Байдлаар шүүх (new/used)
- `search` (string): Хайлтын үг
- `city` (string): Хот

**Response (200):**
```json
{
  "items": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 48
}
```

#### POST /api/items
Шинэ бараа нэмэх (Authentication шаардлагатай)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Гарчиг
- `description`: Тайлбар
- `category`: Категори
- `condition`: Байдал
- `city`, `district`: Байршил
- `wantedItems`: Хайж буй бараа (JSON)
- `images`: Зургууд (files)

### Offers Endpoints

#### POST /api/offers
Солилцооны санал илгээх

#### GET /api/offers/received
Хүлээн авсан саналууд

#### PUT /api/offers/:id/accept
Санал зөвшөөрөх

Бүрэн API баримтжуулалт: [docs/API.md](docs/API.md)

## 🧪 Туршилт

### Туршилт ажиллуулах

```bash
# Бүх тестүүд
npm test

# Test coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Performance тестүүд
npm run test:performance

# Security тестүүд
npm run test:security

# Бүх туршилт (unit + performance + security)
npm run test:all
```

### Туршилтын статистик

```
Test Suites: 6 passed, 6 total
Tests:       84 passed, 84 total
Coverage:    78.5%
```

**Coverage Breakdown:**
- Statements: 76.12%
- Branches: 65.84%
- Functions: 81.48%
- Lines: 78.55%

### Performance тестийн үр дүн

```
/api/items:              100% success, 4073ms avg
/api/items/categories:   100% success, 3095ms avg
/api/health:             100% success, 19ms avg
```

### Security тестийн үр дүн

✅ SQL Injection: Хамгаалагдсан
✅ XSS: Хамгаалагдсан  
✅ Auth Bypass: Хамгаалагдсан
✅ Rate Limiting: Ажиллаж байна
✅ CORS: Зөв тохируулагдсан

## 🌐 Deployment

### Production URLs

- **Frontend:** https://cs-316.vercel.app
- **Backend API:** https://cs316-production.up.railway.app
- **Database:** MongoDB Atlas

### Deployment Process

#### Frontend (Vercel)
```bash
# Vercel CLI ашиглан
npm install -g vercel
cd frontend
vercel --prod
```

Эсвэл GitHub integration-ээр автомат deploy хийгдэнэ.

#### Backend (Railway)
```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway up
```

Эсвэл GitHub push хийхэд автомат deploy хийгдэнэ.

### Environment Variables

**Vercel (Frontend):**
```
REACT_APP_API_BASE=https://cs316-production.up.railway.app/api
```

**Railway (Backend):**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=https://cs-316.vercel.app
PORT=3000
```

### CI/CD Pipeline

GitHub Actions workflows:
- ✅ `ci.yml` - Lint, тест, build
- ✅ `cd-production.yml` - Production deploy
- ✅ `cd-staging.yml` - Staging deploy

## ❓ Түгээмэл асуултууд

### Нууц үгээ мартсан бол?

1. Нэвтрэх хуудас дээр "Нууц үгээ мартсан уу?" дарна
2. Имэйл хаягаа оруулна
3. Имэйл дээрээ сэргээх линк ирнэ
4. Линк дээр дарж шинэ нууц үг тохируулна

### Зураг хуулахад алдаа гардаг?

Зургийн шаардлага:
- **Формат:** JPG, PNG, GIF
- **Хэмжээ:** 5MB-аас бага
- **Тоо:** Нэг удаад 5 хүртэл зураг

### Бараа устгах боломжтой юу?

Тийм, өөрийн барааг устгаж болно:
1. "Миний бараа" хэсэг рүү орно
2. Устгах барааг сонгоно
3. "Устгах" товч дарна
4. Баталгаажуулна

### Солилцоо цуцлах боломжтой юу?

Тийм, санал илгээсэн хүн цуцлах боломжтой:
- Хүлээгдэж байгаа саналыг "Татах" товч дарж цуцална
- Зөвшөөрөгдсөн саналыг цуцлах боломжгүй

### Системд хандах эрх шаардлагатай API endpoints?

Бараа нэмэх, засах, устгах, санал илгээх зэрэг үйлдэлд JWT токен шаардлагатай.

Header-т `Authorization: Bearer {token}` оруулна.

## 🔗 Холбоосууд

- [GitHub Repository](https://github.com/Davaa1101/CS316)
- [Live Demo](https://cs-316.vercel.app)
- [API Documentation](docs/API.md)
- [Project Report](docs/PROJECT_REPORT.md)
