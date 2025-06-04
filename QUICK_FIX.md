# 🚨 **IMMEDIATE FIXES NEEDED**

## **1. CREATE `.env.local` FILE**

Create a file called `.env.local` in your project root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_DgTMVpt4Pcn6@ep-billowing-wildflower-a7kwafu1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://neondb_owner:npg_DgTMVpt4Pcn6@ep-billowing-wildflower-a7kwafu1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"

# Development mode (bypass auth for testing)
NODE_ENV="development"
SKIP_AUTH_CHECK="true"

# Clerk (add these later for production)
# CLERK_SECRET_KEY="your_clerk_secret_key"
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
```

## **2. ENABLE PGVECTOR EXTENSION**

Go to your Neon dashboard → SQL Editor → Run this:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## **3. INITIALIZE DATABASE**

Run these commands in your terminal:
```bash
wsl npx prisma migrate deploy
wsl npx prisma db seed
```

## **4. START CLEAN SERVER**

```bash
wsl rm -rf .next
wsl npm run dev
```

## **5. TEST BASIC ENDPOINTS**

```bash
# Test health check
curl http://localhost:3000/api/health

# Test dashboard
curl -I http://localhost:3000/dashboard
```

---

**After you create `.env.local`, run the database commands above and let me know the results!** 