# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy your Personal Finance Manager on Vercel.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [x] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com) - free)

---

## Step 1: Prepare Your Code (5 minutes)

### 1.1 Generate Secrets

Run this command in your terminal:

```bash
npm run generate:secrets
```

**Copy both secrets** - you'll need them in Step 4.

### 1.2 Verify Database Schema

✅ Already done! Your `prisma/schema.prisma` is set to use PostgreSQL.

### 1.3 Push to GitHub

If you haven't already, push your code:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

---

## Step 2: Create Vercel Account & Project (2 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Sign in with **GitHub** (recommended)
4. Authorize Vercel to access your GitHub repositories

---

## Step 3: Import Your Project (2 minutes)

1. In Vercel dashboard, click **"Add New Project"**
2. Find your repository in the list
3. Click **"Import"** next to your repository
4. Vercel will auto-detect Next.js settings ✅

**Don't click Deploy yet!** We need to set up the database first.

---

## Step 4: Set Up Vercel Postgres Database (5 minutes)

1. In your Vercel project dashboard, click **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name (e.g., "personal-finance-db")
5. Select a region (choose closest to you)
6. Click **"Create"**
7. Wait for database to be created (30-60 seconds)

### Get Database Connection String

1. Once created, click on your database
2. Go to **"Settings"** tab
3. Find **"Connection String"** section
4. You'll see something like:
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```
5. **Copy this entire string** - this is your `DATABASE_URL`

---

## Step 5: Configure Environment Variables (5 minutes)

1. In your Vercel project, go to **"Settings"** tab
2. Click **"Environment Variables"** in the sidebar
3. Click **"Add New"** for each variable below

### Add These Variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `DATABASE_URL` | `postgres://...` | Paste the connection string from Step 4 |
| `JWT_SECRET` | `[from Step 1.1]` | Paste the first secret you generated |
| `SESSION_SECRET` | `[from Step 1.1]` | Paste the second secret you generated |
| `DEFAULT_EMAIL` | `your-email@example.com` | **Change this!** Your login email |
| `DEFAULT_PASSWORD` | `your-secure-password` | **Change this!** Your login password |
| `NODE_ENV` | `production` | Set to production |

### Optional Variables (for investment features):

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `ALPHA_VANTAGE_API_KEY` | `your-key` | Optional - for stock prices |
| `FINANCIAL_MODELING_PREP_API_KEY` | `your-key` | Optional - for company logos |
| `FINNHUB_API_KEY` | `your-key` | Optional - for company logos |

**Important:**
- Make sure **"Production"** is selected for all variables
- You can also add them for "Preview" and "Development" if needed
- Click **"Save"** after adding each variable

---

## Step 6: Deploy! (3 minutes)

1. Go back to **"Deployments"** tab
2. If you haven't deployed yet, click **"Deploy"**
3. If you already deployed, click the **"..."** menu on the latest deployment
4. Select **"Redeploy"** → **"Use Existing Build Cache"** (optional)
5. Wait for deployment to complete (2-5 minutes)

**Watch the build logs** - you should see:
- ✅ Installing dependencies
- ✅ Building Next.js app
- ✅ Generating Prisma Client
- ✅ Build completed successfully

---

## Step 7: Run Database Migrations (3 minutes)

After deployment completes, you need to create the database tables.

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```
   - Select your project
   - Select all defaults

4. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Using Vercel Dashboard (Alternative)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Functions"**
3. Or use the **"Deployments"** tab → Click on a deployment → **"Functions"** tab
4. You can run commands through the Vercel CLI or use their shell

### Option C: Using Prisma Studio (Easiest for first time)

1. Pull environment variables locally:
   ```bash
   vercel env pull .env.local
   ```

2. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

3. This will automatically create tables if they don't exist

---

## Step 8: Verify Deployment (2 minutes)

1. Click on your deployment URL (e.g., `your-app.vercel.app`)
2. You should see the **login page**
3. Try logging in with:
   - Email: The `DEFAULT_EMAIL` you set
   - Password: The `DEFAULT_PASSWORD` you set

### Test Checklist:

- [ ] Login page loads
- [ ] Can log in successfully
- [ ] Dashboard displays
- [ ] Can create a transaction
- [ ] Balance updates correctly
- [ ] URL shows `https://` (SSL enabled)

---

## 🎉 Success!

Your app is now live on Vercel! 

**Your app URL:** `https://your-project-name.vercel.app`

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Prisma Client not generated"**
- Add to Vercel build settings:
  - Build Command: `npm run db:generate && npm run build`
- Or ensure `prisma generate` runs in build

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Clear build cache and redeploy

### Database Connection Issues

**Error: "Can't reach database"**
- Verify `DATABASE_URL` is correct
- Check database is in same region as your app
- Ensure database is running (check Vercel Storage dashboard)

**Error: "Table does not exist"**
- Run migrations: `npx prisma migrate deploy`
- Or use: `npx prisma db push`

### Authentication Issues

**Can't log in**
- Verify `DEFAULT_EMAIL` and `DEFAULT_PASSWORD` match what you set
- Check `JWT_SECRET` and `SESSION_SECRET` are set
- Check browser console for errors
- Try clearing browser cookies

**Sessions expire immediately**
- Verify `JWT_SECRET` is set correctly
- Check that secrets are the same across all environments

### Other Issues

**404 errors on routes**
- Check that middleware is configured correctly
- Verify routes are in `app/` directory

**Rate limiting too strict**
- Adjust limits in `lib/rate-limit.ts`
- Redeploy after changes

---

## 📝 Post-Deployment

### Set Up Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow DNS configuration instructions

### Enable Analytics (Optional)

1. Go to **"Analytics"** tab
2. Enable Vercel Analytics (free tier available)

### Set Up Monitoring (Optional)

- Use Vercel's built-in monitoring
- Or integrate with services like Sentry

---

## 🔄 Updating Your App

After making changes:

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Vercel will automatically:
   - Detect the push
   - Build your app
   - Deploy the new version

3. Check deployment status in Vercel dashboard

---

## 📞 Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Check build logs** in Vercel dashboard
- **Check function logs** for runtime errors

---

**Congratulations! Your Personal Finance Manager is now live! 🎉**

