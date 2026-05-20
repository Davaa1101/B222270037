# CI/CD Configuration Guide - Barter Platform

## GitHub Actions CI Pipeline

Энэхүү гарын авлага нь Barter Platform төслийн Continuous Integration (CI) тохиргоог тайлбарлана.

## 📋 Агуулга

- [Шаардлагатай зүйлс](#шаардлагатай-зүйлс)
- [GitHub Secrets тохируулах](#github-secrets-тохируулах)
- [CI Pipeline-ийн бүтэц](#ci-pipeline-ийн-бүтэц)
- [Локал дээр туршилт хийх](#локал-дээр-туршилт-хийх)
- [Асуудал шийдвэрлэх](#асуудал-шийдвэрлэх)

## Шаардлагатай зүйлс

### 1. Dependencies суулгах

```bash
# Backend dependencies
npm install --save-dev eslint eslint-plugin-security prettier

# Frontend dependencies
cd frontend
npm install
```

### 2. Environment Variables

CI/CD-д шаардлагатай environment variables:

- `NODE_ENV=test`
- `MONGO_URI_TEST` - Тестийн MongoDB URI
- `JWT_SECRET` - JWT токен үүсгэх түлхүүр

## GitHub Secrets тохируулах

GitHub repository Settings → Secrets and variables → Actions дээр дараах secrets-үүдийг нэмнэ:

### Заавал шаардлагатай Secrets

```
MONGO_URI_TEST=mongodb+srv://username:password@cluster.mongodb.net/barter-test
JWT_SECRET=your-secret-key-here
```

### И-мэйл мэдэгдлийн Secrets (заавал биш)

```
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
NOTIFICATION_EMAIL=team@example.com
```

**Gmail app password үүсгэх:**
1. Google Account → Security
2. 2-Step Verification идэвхжүүлэх
3. App passwords дээр очиж шинэ password үүсгэх
4. Үүсгэсэн passwordоо `MAIL_PASSWORD` secret-д хадгална

### Slack мэдэгдлийн Secrets (заавал биш)

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Slack webhook үүсгэх:**
1. Slack workspace → Apps
2. "Incoming Webhooks" хайж идэвхжүүлэх
3. Webhook URL-г хуулж авах

### Аюулгүй байдлын Secrets (заавал биш)

```
SNYK_TOKEN=your-snyk-token
CODECOV_TOKEN=your-codecov-token
```

## CI Pipeline-ийн бүтэц

### 1. 🔍 Lint Job
Кодын чанар, format шалгах

```yaml
- ESLint алдаа шалгах
- Prettier format шалгах
- Аюулгүй байдлын дүрмүүд
```

### 2. 🧪 Test Job
Нэгжийн тестүүд ажиллуулах

```yaml
- Node.js 18.x, 20.x дээр тест
- Jest coverage тооцоолох
- Test results upload хийх
```

### 3. 🔒 Security Job
Аюулгүй байдлын шалгалт

```yaml
- npm audit ажиллуулах
- Snyk security scan
- ESLint security plugin
- Security reports үүсгэх
```

### 4. 🏗️ Build Job
Build амжилттай эсэх шалгах

```yaml
- Frontend build хийх
- Build artifacts upload
```

### 5. 📧 Notify Job
Мэдэгдэл илгээх

```yaml
- И-мэйл мэдэгдэл (алдаа үед)
- Slack мэдэгдэл (алдаа үед)
- GitHub PR comment
```

### 6. ✅ DoD Check Job
Definition of Done шалгах

```yaml
- Бүх DoD criteria шалгах
- PR дээр comment үүсгэх
- Merge-ready эсэхийг илэрхийлэх
```

## Локал дээр туршилт хийх

### 1. Lint шалгах

```bash
# ESLint ажиллуулах
npx eslint . --ext .js

# Prettier шалгах
npx prettier --check "**/*.{js,json,md}"

# Prettier format хийх
npx prettier --write "**/*.{js,json,md}"
```

### 2. Тест ажиллуулах

```bash
# Бүх тестүүд
npm test

# Coverage-тай
npm run test:coverage

# Watch mode
npm run test:watch
```

### 3. Security scan

```bash
# NPM audit
npm audit

# NPM audit fix
npm audit fix

# High severity засах
npm audit fix --audit-level=high
```

### 4. Build шалгах

```bash
# Frontend build
cd frontend
npm run build

# Backend ажиллах эсэхийг шалгах
cd ..
node server.js
```

## CI Pipeline ажиллах дараалал

```
Push/PR үүсгэх
    ↓
🔍 Lint (ESLint, Prettier)
    ↓
🧪 Test (Jest, Coverage)
    ↓
🔒 Security (npm audit, Snyk)
    ↓
🏗️ Build (Frontend build)
    ↓
✅ DoD Check (PR only)
    ↓
📧 Notifications (алдаа үед)
```

## Workflow trigger хийх

### Автомат ажиллах:

```bash
# main branch руу push
git push origin main

# Pull request үүсгэх
git checkout -b feature/new-feature
git push origin feature/new-feature
# GitHub дээр PR үүсгэх

# develop branch руу push
git push origin develop
```

### Manual trigger:

1. GitHub repository → Actions
2. "CI Pipeline - Barter Platform" сонгох
3. "Run workflow" дарах
4. Branch сонгож "Run workflow" дарах

## CI Badge нэмэх

README.md файлдаа CI status badge нэмнэ:

```markdown
![CI Pipeline](https://github.com/Davaa1101/CS316/workflows/CI%20Pipeline%20-%20Barter%20Platform/badge.svg)
```

## Artifacts харах

CI pipeline дараах artifacts-үүдийг үүсгэнэ:

1. **Test Results** - Jest test results болон coverage reports
2. **Security Reports** - npm audit, Snyk, ESLint security reports
3. **Build Artifacts** - Frontend build файлууд

**Хаанаас харах:**
1. GitHub → Repository → Actions
2. Workflow run дарах
3. Доош scroll хийж "Artifacts" хэсэг харах
4. Download хийх

## Тохиргоо засварлах

### Timeout өөрчлөх

`.github/workflows/ci.yml` файлд:

```yaml
jobs:
  test:
    timeout-minutes: 15  # Default: 10 мин
```

### Node.js version нэмэх

```yaml
strategy:
  matrix:
    node-version: ['18.x', '20.x', '21.x']  # 21.x нэмэх
```

### Test coverage шаардлага

`package.json` файлд:

```json
"jest": {
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 75,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Асуудал шийдвэрлэх

### ❌ Tests failing locally but passing in CI

```bash
# Node modules дахин суулгах
rm -rf node_modules package-lock.json
npm install

# Cache цэвэрлэх
npm cache clean --force

# Тест дахин ажиллуулах
npm test
```

### ❌ ESLint errors

```bash
# ESLint автомат засах
npx eslint . --ext .js --fix

# Prettier format хийх
npx prettier --write "**/*.{js,json,md}"
```

### ❌ Security vulnerabilities

```bash
# Автомат засах
npm audit fix

# Manual засах шаардлагатай
npm audit

# Specific package update
npm update package-name
```

### ❌ Build failing

```bash
# Dependencies шалгах
npm ci

# Frontend build локал дээр туршиж үзэх
cd frontend
npm run build

# Environment variables шалгах
cat .env
```

### ❌ GitHub Actions failing

1. **Logs шалгах:**
   - Actions tab → Failed run → Job дарж logs харах

2. **Secrets шалгах:**
   - Settings → Secrets → Бүх шаардлагатай secrets байгаа эсэх

3. **Permissions:**
   - Settings → Actions → General → Workflow permissions шалгах

## Branch Protection Rules

Production branch-үүдэд хамгаалалт тохируулах:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Дараах сонголтуудыг идэвхжүүлэх:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

**Status checks сонгох:**
- Code Quality Check
- Unit Tests
- Security Scan
- Build Check
- Definition of Done Check

## Хэрэгтэй холбоосууд

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Snyk Documentation](https://docs.snyk.io/)

## Дэмжлэг

Асуудал тулгарвал:
1. GitHub Issues үүсгэх
2. CI logs дэлгэрэнгүй шалгах
3. Documentation уншиж туслах авах

---

**Шинэчилсэн:** 2025-12-17  
**Хувилбар:** 1.0.0  
**Баг:** Barter Platform Development Team
