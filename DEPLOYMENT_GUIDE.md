# 🚀 FinEx v3 - Vercel Deployment Guide

## Quick Deploy (Recommended)

### Step 1: Import from GitHub
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub account: `thisisausernamethisis`
4. Import repository: `finex`
5. Select branch: `phase5b/T-172_cjs_to_esm`

### Step 2: Configure Environment Variables
Add these environment variables in Vercel dashboard:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_DgTMVpt4Pcn6@ep-billowing-wildflower-a7kwafu1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# Authentication (Clerk - Get from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Cache (Upstash Redis - Optional, FREE tier available)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password

# AI Features (OpenAI - Optional)
OPENAI_API_KEY=sk-your_openai_key_here

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 3: Deploy Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

### Step 4: Deploy!
Click "Deploy" and wait for the build to complete (~2-3 minutes)

## 🔧 Service Setup Guide

### 1. Clerk Authentication (FREE)
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create new application: "FinEx v3"
3. Copy the publishable and secret keys
4. Add to Vercel environment variables

### 2. Neon Database (Already Configured)
✅ Your database is already connected and configured
- Host: ep-billowing-wildflower-a7kwafu1-pooler.ap-southeast-2.aws.neon.tech
- Database: neondb
- Schema: Synced and ready

### 3. Upstash Redis (Optional - FREE)
1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection URL
4. Add to Vercel environment variables

### 4. OpenAI API (Optional)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Add to Vercel environment variables

## 🎯 Post-Deployment Checklist

After deployment, test these endpoints:

- ✅ Health Check: `https://your-app.vercel.app/api/health`
- ✅ Dashboard: `https://your-app.vercel.app/dashboard`
- ✅ Matrix Analysis: `https://your-app.vercel.app/api/matrix/calculate`
- ✅ Analytics: `https://your-app.vercel.app/api/analytics/advanced`

## 💰 Cost Breakdown

### FREE Tier (Recommended to Start)
- **Vercel**: FREE (Hobby plan)
- **Neon PostgreSQL**: FREE (0.5GB storage)
- **Clerk Auth**: FREE (10,000 MAU)
- **Upstash Redis**: FREE (10,000 requests/day)
- **Total**: $0/month

### Production Scale
- **Vercel Pro**: $20/month
- **Neon Scale**: $19/month
- **OpenAI API**: $5-20/month
- **Total**: $44-59/month

## 🚨 Troubleshooting

### Build Fails?
1. Check environment variables are set
2. Verify branch is `phase5b/T-172_cjs_to_esm`
3. Review build logs in Vercel dashboard

### Runtime Errors?
1. Check database connection (DATABASE_URL)
2. Verify Clerk keys are correct
3. Test health endpoint: `/api/health`

### Performance Issues?
1. Enable Redis caching
2. Upgrade to Vercel Pro for better edge performance
3. Monitor with Vercel Analytics

## 🎉 Success!

Once deployed, your FinEx v3 system will be live with:

- ✅ Real-time portfolio analysis
- ✅ AI-powered asset categorization  
- ✅ Advanced analytics dashboard
- ✅ Production monitoring
- ✅ Enterprise-grade security

Access your live application at: `https://your-app.vercel.app` 