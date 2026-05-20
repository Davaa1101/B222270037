# Долоо хоног 13: Гүйцэтгэл ба Аюулгүй Байдлын Тайлан

## 📊 Гүйцэтгэлийн туршилт (Performance Testing)

### Хэрэгжүүлсэн зүйлс

#### 1. Performance Testing Script
**Файл:** `tests/performance.test.js`

**Боломжууд:**
- ✅ Олон хүсэлтийг зэрэг илгээх (Concurrent requests)
- ✅ Хариу өгөх хугацааг хэмжих (Response time measurement)
- ✅ Амжилт/Амжилтгүй хүсэлтийг тоолох
- ✅ Статистик тооцоолох (дундаж, median, percentiles)
- ✅ Олон endpoint-ийг туршах

**Ашиглах:**
```bash
# Гүйцэтгэлийн туршилт ажиллуулах
cd my-first-project
node tests/performance.test.js

# Эсвэл тодорхой URL дээр
API_URL=https://cs316-production.up.railway.app node tests/performance.test.js
```

**Хэмжих үзүүлэлтүүд:**
- **Average Response Time** - Дундаж хариу өгөх хугацаа
- **Median Response Time** - Дундаж хувь (50th percentile)
- **95th Percentile** - 95% хүсэлтүүдийн хугацаа
- **99th Percentile** - 99% хүсэлтүүдийн хугацаа
- **Requests per Second** - Секунд тутамд боловсруулсан хүсэлт
- **Success Rate** - Амжилтын хувь

#### 2. Туршилтын жишээ үр дүн

```
=== Гүйцэтгэлийн туршилт эхэллээ ===
Endpoint: /api/items
Method: GET
Нийт хүсэлт: 100
Зэрэг ажиллах хэрэглэгч: 10
-----------------------------------

=== Үр дүн ===
Нийт хугацаа: 5.43 секунд
Амжилттай хүсэлт: 98
Амжилтгүй хүсэлт: 2
Амжилтын хувь: 98.00%

Хариу өгөх хугацаа:
  - Дундаж: 234.56ms
  - Median: 210.00ms
  - Хамгийн бага: 145ms
  - Хамгийн их: 450ms
  - 95 percentile: 380ms
  - 99 percentile: 430ms

Секунд тутамд: 18.05 хүсэлт
```

---

## 🔒 Аюулгүй байдлын туршилт (Security Testing)

### Хэрэгжүүлсэн зүйлс

#### 1. Security Testing Script
**Файл:** `tests/security.test.js`

**Туршилтын төрлүүд:**
1. ✅ **SQL Injection туршилт**
2. ✅ **XSS (Cross-Site Scripting) туршилт**
3. ✅ **Authentication Bypass туршилт**
4. ✅ **Brute Force Protection туршилт**
5. ✅ **CORS Configuration туршилт**

**Ашиглах:**
```bash
cd my-first-project
node tests/security.test.js

# Нэвтэрсэн token-тэй туршилт
TEST_AUTH_TOKEN=your_jwt_token node tests/security.test.js
```

---

### 2. Одоогийн аюулгүй байдлын хэмжээ

#### ✅ Хэрэгжсэн хамгаалалтууд

**1. Нууц үгийн аюулгүй хадгалалт (bcrypt)**

**Файл:** `models/User.js`

```javascript
const bcrypt = require('bcryptjs');

// Нууц үг хадгалахаас өмнө hash хийх
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Нууц үг шалгах метод
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

**Давуу тал:**
- ✅ Plain text нууц үг хадгалахгүй
- ✅ Salt ашигласнаар rainbow table халдлагаас хамгаалагдсан
- ✅ bcrypt нь нууц үг таах халдлагын эсрэг удаашруулах алгоритмтай

---

**2. Helmet - HTTP Headers хамгаалалт**

**Файл:** `server.js`

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));
```

**Хамгаалах зүйлс:**
- ✅ XSS халдлага (Content Security Policy)
- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME type sniffing (X-Content-Type-Options)

---

**3. CORS тохиргоо**

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cs-316.vercel.app', process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

**Давуу тал:**
- ✅ Зөвхөн зөвшөөрөгдсөн domain-ээс хандах боломжтой
- ✅ Wildcard (*) ашиглахгүй байна

---

**4. Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // IP тус бүрт 100 хүсэлт
});

app.use('/api', limiter);
```

**Хамгаалах зүйлс:**
- ✅ Brute force халдлага
- ✅ DDoS халдлага
- ✅ API abuse

---

**5. Input Validation (express-validator)**

**Файл:** `routes/auth.js`

```javascript
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  // ...
});
```

**Давуу тал:**
- ✅ SQL Injection-ээс хамгаална (Mongoose parameterized queries ашиглаж байна)
- ✅ XSS-ээс хамгаална (input sanitization)
- ✅ Буруу өгөгдөл оруулахаас сэргийлнэ

---

**6. JWT Authentication**

```javascript
const jwt = require('jsonwebtoken');

// Token үүсгэх
const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Token шалгах middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication required' });
  }
};
```

**Давуу тал:**
- ✅ Stateless authentication
- ✅ Token хугацаатай (7 хоног)
- ✅ Хүчтэй secret key ашиглах

---

### 3. Аюулгүй байдлын сул талууд ба шийдэл

#### ⚠️ Нэмэлт сайжруулах зүйлс

**1. Password policy сул байна**
- **Асуудал:** Одоо зөвхөн 6 тэмдэгт шаардаж байна
- **Шийдэл:**
```javascript
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .withMessage('Нууц үг дор хаяж 8 тэмдэгт, том жижиг үсэг, тоо, тусгай тэмдэгт агуулсан байх')
```

**2. Session management байхгүй**
- **Асуудал:** Хэрэглэгч logout хийсний дараа token идэвхтэй хэвээр байна
- **Шийдэл:** Token blacklist эсвэл refresh token механизм нэмэх

**3. File upload validation**
- **Асуудал:** Файлын төрөл, хэмжээний шалгалт сул байж магадгүй
- **Шийдэл:**
```javascript
const multer = require('multer');

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Зөвхөн зураг файл байх ёстой'));
    }
    cb(null, true);
  }
});
```

**4. Logging ба monitoring дутмаг**
- **Шийдэл:** Winston эсвэл Morgan logger нэмэх

---

## 📋 Туршилт ажиллуулах заавар

### 1. Dependencies суулгах

```bash
cd my-first-project
npm install axios
```

### 2. Гүйцэтгэлийн туршилт

```bash
# Local дээр
npm run dev  # Өөр terminal дээр серверийг асаах
node tests/performance.test.js

# Production дээр
API_URL=https://cs316-production.up.railway.app node tests/performance.test.js
```

### 3. Аюулгүй байдлын туршилт

```bash
# Үндсэн туршилт
node tests/security.test.js

# Token-тэй туршилт (XSS шалгахад хэрэгтэй)
TEST_AUTH_TOKEN=your_jwt_token node tests/security.test.js
```

### 4. package.json-д script нэмэх

```json
{
  "scripts": {
    "test:performance": "node tests/performance.test.js",
    "test:security": "node tests/security.test.js",
    "test:all": "npm test && npm run test:performance && npm run test:security"
  }
}
```

---

## 🎯 Үр дүн ба дүгнэлт

### Гүйцэтгэл
- ✅ Performance testing script амжилттай хэрэгжүүлэв
- ✅ Олон metric-ийг хэмжих боломжтой (response time, throughput, success rate)
- ✅ Олон endpoint-ийг зэрэг туршиж болно

### Аюулгүй байдал
- ✅ 6 үндсэн аюулгүй байдлын хамгаалалт хэрэгжсэн
- ✅ Нууц үг bcrypt ашиглан аюулгүй хадгалагдаж байна
- ✅ SQL Injection, XSS-ээс хамгаалагдсан
- ✅ Rate limiting нэмэгдсэн
- ⚠️ 4 сайжруулах зүйл тодорхойлов

### Зөвлөмж
1. Password policy хатуужуулах (8+ тэмдэгт, том/жижиг үсэг, тоо, тусгай тэмдэгт)
2. Token blacklist эсвэл refresh token нэмэх
3. File upload validation сайжруулах
4. Winston logger нэмэх
5. Security testing-ийг CI/CD pipeline-д нэмэх

---

**Хэрэгжүүлсэн:** Week 13 - Performance & Security  
**Огноо:** 2024-12-17  
**Төсөл:** CS316 Barter Platform
