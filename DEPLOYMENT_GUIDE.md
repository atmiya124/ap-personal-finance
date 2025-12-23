# Step-by-Step Deployment Guide

This guide will help you deploy your Personal Finance Manager application to production.

---

## 🎯 Quick Start (5 Steps)

### Step 1: Choose Your Hosting Platform

**Recommended Options:**
- **Vercel** (Easiest for Next.js) - [vercel.com](https://vercel.com)
- **Railway** - [railway.app](https://railway.app)
- **Render** - [render.com](https://render.com)
- **Fly.io** - [fly.io](https://fly.io)

### Step 2: Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended if using Vercel)**
1. Go to your Vercel project
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string

**Option B: Supabase (Free tier available)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)

**Option C: Neon (Free tier available)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

**Option D: Railway**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the connection string

### Step 3: Update Prisma Schema

1. Open `prisma/schema.prisma`
2. Change line 9 from:
   ```prisma
   provider = "sqlite"
   ```
   to:
   ```prisma
   provider = "postgresql"
   ```

3. Save the file

### Step 4: Generate Secrets

Run these commands in your terminal to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET (can be same as JWT_SECRET or different)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output - you'll need these in Step 5.

### Step 5: Set Environment Variables

In your hosting platform, add these environment variables:

```env
# Database (from Step 2)
DATABASE_URL="postgresql://user:password@host:port/database"

# Secrets (from Step 4)
JWT_SECRET="paste-your-generated-secret-here"
SESSION_SECRET="paste-your-generated-secret-here"

# User Credentials (CHANGE THESE!)
DEFAULT_EMAIL="your-email@example.com"
DEFAULT_PASSWORD="your-secure-password-here"

# Environment
NODE_ENV="production"

# Optional: Investment API Keys
ALPHA_VANTAGE_API_KEY=""
FINANCIAL_MODELING_PREP_API_KEY=""
FINNHUB_API_KEY=""
```

---

## 🚀 Deployment Steps by Platform

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add all variables from Step 5 above
   - Make sure to select "Production" environment

4. **Set Up Database**
   - In Vercel dashboard, go to Storage
   - Create Postgres database
   - Copy the `POSTGRES_URL` (this is your `DATABASE_URL`)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

6. **Run Migrations**
   - After deployment, go to your project's terminal/SSH
   - Or use Vercel CLI:
     ```bash
     npx vercel env pull .env.local
     npx prisma migrate deploy
     ```

### Railway Deployment

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add PostgreSQL**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

3. **Set Environment Variables**
   - Go to Variables tab
   - Add all variables from Step 5 (except DATABASE_URL - it's auto-set)

4. **Deploy**
   - Railway will auto-deploy on push
   - Or click "Deploy Now"

5. **Run Migrations**
   - In Railway dashboard, open the database service
   - Go to "Connect" tab
   - Use the connection string to run:
     ```bash
     npx prisma migrate deploy
     ```

### Render Deployment

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Add PostgreSQL**
   - Click "New" → "PostgreSQL"
   - Copy the connection string

4. **Set Environment Variables**
   - In your web service settings
   - Add all variables from Step 5

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy

6. **Run Migrations**
   - Use Render's shell or SSH
   - Run: `npx prisma migrate deploy`

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Can access the login page
- [ ] Can log in with your credentials
- [ ] Can create a transaction
- [ ] Balance updates correctly
- [ ] Dashboard displays data
- [ ] Rate limiting works (try 6 login attempts - should be blocked)
- [ ] HTTPS is enabled (check URL starts with https://)
- [ ] Error pages work (try accessing a non-existent page)

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Run `npm install` locally
- Make sure `node_modules` is committed (it shouldn't be, but check)
- Clear `.next` folder and rebuild

**Error: "Prisma Client not generated"**
- Add to build command: `npm run db:generate && npm run build`
- Or run `npx prisma generate` before build

### Database Connection Issues

**Error: "Can't reach database"**
- Check `DATABASE_URL` is correct
- Verify database is running
- Check firewall/network settings
- For Vercel: Make sure database is in same region

**Error: "Table does not exist"**
- Run migrations: `npx prisma migrate deploy`
- Or: `npx prisma db push`

### Authentication Issues

**Can't log in**
- Verify `DEFAULT_EMAIL` and `DEFAULT_PASSWORD` are set correctly
- Check `JWT_SECRET` and `SESSION_SECRET` are set
- Check browser console for errors

**Sessions expire immediately**
- Verify `JWT_SECRET` is set and consistent
- Check session cleanup isn't running too frequently

---

## 📞 Need More Help?

1. Check the error logs in your hosting platform
2. Check browser console for client-side errors
3. Verify all environment variables are set
4. Make sure database migrations have run
5. Check that PostgreSQL is accessible from your hosting platform

---

## 🎉 Success!

Once everything is working:
- ✅ Your app is live!
- ✅ Bookmark your production URL
- ✅ Set up monitoring (optional)
- ✅ Consider setting up backups for your database

**Congratulations on deploying your Personal Finance Manager!** 🚀

