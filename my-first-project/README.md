# Barter Platform

Онлайн солилцооны платформ - Хэрэглэгчид хоорондоо бараа бүтээгдэхүүнээ солилцох зорилгоор бүтээгдсэн веб апп.

## Багийн гишүүд
- Даваа (Product Owner, Full-stack Developer)

## Онцлогууд

### Бүртгэлгүй хэрэглэгч (Зочин)
- Нүүр хуудсан дээр бүх идэвхтэй бартер зарууд харах
- Категори, байршил, түлхүүр үгээр хайх
- Зарын дэлгэрэнгүй мэдээлэл үзэх
- Бүртгүүлэх боломж

### Бүртгэлтэй хэрэглэгч
- Бартер зар нийтлэх
- Өөр хэрэглэгчийн зар дээр санал илгээх  
- Ирсэн саналыг шалгаж хариу өгөх
- Хувийн профайл удирдах
- Идэвхтэй зарууд удирдах
- Гомдол гаргах

### Админ
- Гомдол шийдвэрлэх
- Платформын статистик харах
- Контент модераци хийх
- Хэрэглэгч удирдах
- Категори болон тохиргоо засах

## Технологи

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer
- **File Upload**: Multer
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Security**: Helmet, CORS, Rate Limiting

## Суулгах заавар

### Шаардлага
- Node.js (v14 эсвэл түүнээс дээш)
- MongoDB (v4.4 эсвэл түүнээс дээш)
- npm эсвэл yarn

### Суулгах алхамууд

1. Dependencies суулгах:
```bash
npm install
```

2. Environment файл үүсгэх:
```bash
cp .env.example .env
```

3. `.env` файлыг тохируулах:
- MongoDB холболтын string
- JWT secret key
- Email тохиргоо (Gmail SMTP)
- Бусад тохиргоо

4. MongoDB эхлүүлэх:
```bash
# Windows
net start MongoDB

# macOS/Linux  
sudo systemctl start mongod
```

5. Серверийг эхлүүлэх:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. Вэб хөтчөөр http://localhost:3000 руу орох

## API Documentation

### Authentication
- `POST /api/auth/register` - Бүртгүүлэх
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/verify-email/:token` - Email баталгаажуулах
- `POST /api/auth/forgot-password` - Нууц үг сэргээх
- `POST /api/auth/reset-password/:token` - Нууц үг шинэчлэх

### Items
- `GET /api/items` - Зарууд харах
- `GET /api/items/:id` - Зарын дэлгэрэнгүй
- `POST /api/items` - Зар нийтлэх (Auth шаардлагатай)
- `PUT /api/items/:id` - Зар засах (Auth шаардлагатай)
- `DELETE /api/items/:id` - Зар устгах (Auth шаардлагатай)

### Offers
- `POST /api/offers` - Санал илгээх (Auth шаардлагатай)
- `GET /api/offers/sent` - Илгээсэн саналууд (Auth шаардлагатай)
- `GET /api/offers/received` - Хүлээн авсан саналууд (Auth шаардлагатай)
- `PATCH /api/offers/:id/respond` - Санал дээр хариу өгөх (Auth шаардлагатай)

### Users
- `GET /api/users/profile` - Хувийн профайл (Auth шаардлагатай)
- `PUT /api/users/profile` - Профайл шинэчлэх (Auth шаардлагатай)
- `GET /api/users/dashboard` - Dashboard статистик (Auth шаардлагатай)

### Reports  
- `POST /api/reports` - Гомдол гаргах (Auth шаардлагатай)
- `GET /api/reports/my-reports` - Миний гомдлууд (Auth шаардлагатай)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard (Admin auth шаардлагатай)
- `GET /api/admin/users` - Хэрэглэгчид удирдах (Admin auth шаардлагатай)
- `GET /api/admin/reports` - Гомдлууд удирдах (Admin auth шаардлагатай)

## CI/CD Pipeline
This project uses GitHub Actions for continuous integration.
