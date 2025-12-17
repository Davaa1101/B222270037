# GitHub Actions CI/CD - Quick Setup

## 1. GitHub Secrets тохируулах

### Шаг 1: Repository Settings рүү очих
1. GitHub repository (`Davaa1101/CS316`) рүү очих
2. **Settings** tab дарах
3. Зүүн талын меню: **Secrets and variables** → **Actions**

### Шаг 2: Secrets нэмэх

**New repository secret** товч дарж дараах secrets-үүдийг нэмнэ:

#### А. Заавал шаардлагатай (Database & Auth)

```
Name: MONGO_URI_TEST
Value: mongodb+srv://username:password@cluster.mongodb.net/barter-test?retryWrites=true&w=majority
```

```
Name: JWT_SECRET
Value: your-very-secret-jwt-key-min-32-characters-long
```

#### Б. И-мэйл мэдэгдэл (Optional, гэхдээ санал болгож байна)

**Gmail ашиглах бол:**

1. Gmail Account → Google Account → Security
2. "2-Step Verification" идэвхжүүлэх
3. "App passwords" хайх
4. "Mail" сонгож password үүсгэх
5. Үүссэн 16 оронтой passwordоо хуулах

```
Name: MAIL_SERVER
Value: smtp.gmail.com
```

```
Name: MAIL_PORT
Value: 587
```

```
Name: MAIL_USERNAME
Value: your-email@gmail.com
```

```
Name: MAIL_PASSWORD
Value: abcd efgh ijkl mnop (Google app password)
```

```
Name: NOTIFICATION_EMAIL
Value: team-email@gmail.com
```

#### В. Slack мэдэгдэл (Optional)

Slack Workspace байгаа бол:

1. Slack → Apps → "Incoming Webhooks" хайх
2. "Add to Slack" дарах
3. Channel сонгох (#general эсвэл #deployments)
4. Webhook URL хуулах

```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### Г. Security Tools (Optional, давуу тал)

**Snyk токен үүсгэх:**
1. https://snyk.io рүү очих
2. Sign up / Login
3. Account Settings → API Token
4. Token хуулах

```
Name: SNYK_TOKEN
Value: your-snyk-token-here
```

**Codecov токен (Coverage reports):**
1. https://codecov.io рүү очих
2. Repository нэмэх
3. Token авах

```
Name: CODECOV_TOKEN
Value: your-codecov-token-here
```

## 2. CI Pipeline туршиж үзэх

### Шаг 1: GitHub дээр workflow идэвхжүүлэх

```bash
# Таны локал машин дээр:
cd C:\Users\user\CS316\my-first-project

# Branch шалгах
git status

# Commit хийх
git add .
git commit -m "feat: add CI/CD pipeline with GitHub Actions

- Add GitHub Actions workflow
- Add ESLint and Prettier config
- Add security scanning
- Add email and Slack notifications
- Add DoD compliance check

Closes #8"

# Push хийх
git push origin main
```

### Шаг 2: Actions tab-д очиж харах

1. GitHub repository → **Actions** tab
2. "CI Pipeline - Barter Platform" workflow харагдах ёстой
3. Хамгийн сүүлийн run дарж дэлгэрэнгүй үзэх
4. Бүх jobs-үүд ногоон (✅) болох хүртэл хүлээх

### Шаг 3: Алдаа гарвал

GitHub Actions → Failed run → Job дарж:
- Улаан ✗ байгаа алхмыг хайх
- Logs дэлгэрэнгүй уншиж алдааг олох
- Secret зөв тохируулагдсан эсэхийг шалгах

## 3. Pull Request туршилт

```bash
# Feature branch үүсгэх
git checkout -b feature/test-ci

# Жижиг өөрчлөлт хийх
echo "// Test CI" >> README.md

# Commit
git add .
git commit -m "test: CI pipeline test"

# Push
git push origin feature/test-ci
```

GitHub дээр:
1. "Compare & pull request" товч гарна
2. Pull Request үүсгэх
3. CI автомат ажиллах болно
4. Comment-д DoD check үр дүн гарна

## 4. Локал дээр CI шалгалтууд туршиж үзэх

```bash
# Lint шалгах
npm run lint

# Format шалгах
npm run format:check

# Тест ажиллуулах
npm test

# Coverage
npm run test:coverage

# Security
npm run security

# Бүгдийг нэгэн зэрэг
npm run ci
```

Алдаа гарвал:
```bash
# Lint засах
npm run lint:fix

# Format засах
npm run format

# Security засах
npm audit fix
```

## 5. Шалгах жагсаалт

Бүх зүйл зөв ажиллаж байгаа эсэхийг шалгах:

- [ ] GitHub Secrets бүгд нэмэгдсэн
- [ ] `git push` хийхэд Actions автомат ажиллаж байна
- [ ] Бүх jobs ногоон (✅) болж байна
- [ ] Email мэдэгдэл ирж байна (алдаа гарвал)
- [ ] Slack мэдэгдэл ирж байна (алдаа гарвал)
- [ ] PR үүсгэхэд DoD comment үүсч байна
- [ ] Artifacts (test results, security reports) татаж авах боломжтой

## 6. Тусламж

### GitHub Actions логс харах:
```
Repository → Actions → Workflow run → Job → Step
```

### Secrets засварлах:
```
Repository → Settings → Secrets and variables → Actions → Edit
```

### Workflow засварлах:
```
.github/workflows/ci.yml файлыг засах
```

### Troubleshooting:

**Алдаа: "Secret not found"**
- Settings → Secrets шалгах
- Нэр зөв бичигдсэн эсэх

**Алдаа: "Tests failed"**
- Локал дээр `npm test` ажиллуулж шалгах
- MongoDB URI зөв эсэх

**Алдаа: "Build failed"**
- `npm run build` локал дээр туршиж үзэх
- Dependencies татагдсан эсэх

**Алдаа: "Email not sent"**
- Gmail App Password зөв эсэх
- 2FA идэвхжүүлсэн эсэх
- SMTP settings зөв эсэх

## 7. Next Steps

CI/CD амжилттай ажиллаж байвал:

1. **Branch Protection** нэмэх:
   - Settings → Branches → Add rule
   - "Require status checks to pass"

2. **Auto-deploy** нэмэх:
   - CD pipeline үүсгэх
   - Heroku/Vercel/AWS deploy

3. **Code coverage badge** нэмэх:
   - README.md-д badge нэмэх
   - Codecov ашиглах

4. **Performance testing** нэмэх:
   - Load testing
   - Lighthouse CI

---

**Анхааруулга:** Бүх secrets-үүдийг нууцлал сахиж, хэзээ ч public repository-д commit бүү хий!

**Дэмжлэг:** Асуудал тулгарвал [`docs/CI_SETUP.md`](CI_SETUP.md) уншаарай.
