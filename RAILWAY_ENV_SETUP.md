# Railway Deployment Guide
# Copy-paste these into Railway: Settings → Variables → Raw Editor

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://Davaa:fJD7O91OlRiRZOWw@cluster0.x6zwbmy.mongodb.net/barter-platform?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=ae1c5bd0e9aaa15a345baff0318123da6e3567c2bdb5a8e222b17249c5f9471992833a1acfea984fb0eaf701c06f2a5c10d61d1c846b8b74bf08a8e6e6c5a175
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://cs-316.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## How to add to Railway:

### Method 1: Raw Editor (Fastest)
1. Go to your Railway project
2. Settings → Variables
3. Click "Raw Editor" button
4. Copy ALL lines above (between ```)
5. Paste into the editor
6. Click "Save"

### Method 2: One by one
Add each variable individually:
- Click "+ New Variable"
- Enter variable name and value
- Repeat for all variables

## After adding variables:
1. Railway will automatically redeploy
2. Copy your Railway URL (e.g., https://cs316-production.up.railway.app)
3. Go to Vercel → Settings → Environment Variables
4. Update/Add:
   - Name: `REACT_APP_API_BASE`
   - Value: `https://your-railway-url.up.railway.app/api` (add /api!)
5. Redeploy Vercel

## Your Configuration:
✅ Database: MongoDB Atlas (Cluster0)
✅ JWT Secret: Securely generated (128 characters)
✅ Frontend: https://cs-316.vercel.app
✅ Backend: Will be Railway URL after deployment

## Security Notes:
⚠️ MongoDB password visible: fJD7O91OlRiRZOWw
⚠️ Keep JWT_SECRET secure - never commit to git
⚠️ Use .env.production only for reference, don't commit
✅ All secrets are in Railway environment (secure)
