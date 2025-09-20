# 🚄 Railway Deployment Guide

## Quick Deploy to Railway

### Step 1: Connect Repository to Railway

1. **Go to Railway**: https://railway.app
2. **Login/Signup** with your GitHub account
3. **New Project** → **Deploy from GitHub repo**
4. **Select Repository**: `getbirdbio/birddash`
5. **Deploy** - Railway will auto-detect Node.js and deploy

### Step 2: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
NODE_ENV=production
JWT_SECRET=birddash_super_secure_jwt_key_production_2025
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DATABASE_URL=./database/birddash.db
```

### Step 3: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. **Generate Domain** or **Custom Domain**
3. Your game will be available at the provided URL

## 🎯 Railway Auto-Detection

Railway will automatically:
- ✅ Detect Node.js project
- ✅ Run `npm install`
- ✅ Execute `npm start`
- ✅ Create SQLite database
- ✅ Serve on assigned port

## 🔧 Manual Railway CLI (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from current directory
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
```

## 🌐 Expected Result

After deployment:
- **Game URL**: `https://your-app.railway.app`
- **API Health**: `https://your-app.railway.app/api/health`
- **Leaderboard**: Fully functional with database
- **Real-time**: Online leaderboards working

## 🐛 Troubleshooting

### Database Issues
- Railway creates persistent volumes automatically
- SQLite file will be stored in `/app/database/`

### Port Issues
- Railway automatically assigns PORT environment variable
- Our server.js reads `process.env.PORT || 3000`

### CORS Issues
- Update ALLOWED_ORIGINS in Railway dashboard
- Use your Railway domain: `https://your-app.railway.app`

## 📊 Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History and rollbacks
- **Health Checks**: Automatic monitoring

---

**Your BirdDash game is ready for Railway deployment!** 🚀
