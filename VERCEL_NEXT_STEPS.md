# 🚀 Vercel Deployment - Next Steps

Since you've pushed to GitHub, follow these steps:

---

## Step 1: Create Vercel Account & Import Project (3 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** (use GitHub to sign in - it's easiest)
3. **Click "Add New Project"**
4. **Find your repository** in the list
5. **Click "Import"** next to your repository

**⚠️ Don't click Deploy yet!** We need to set up the database first.

---

## Step 2: Create Vercel Postgres Database (5 minutes)

1. In your Vercel project dashboard, click the **"Storage"** tab (top menu)
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name (e.g., "personal-finance-db")
5. Select a region (choose closest to you)
6. Click **"Create"**
7. Wait 30-60 seconds for database to be created

### Get Your Database URL

1. Once created, click on your database name
2. Go to **"Settings"** tab
3. Scroll to **"Connection String"** section
4. You'll see something like:
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```
5. **Copy this entire string** - this is your `DATABASE_URL`

---

## Step 3: Add Environment Variables (5 minutes)

1. In your Vercel project, go to **"Settings"** tab
2. Click **"Environment Variables"** in the left sidebar
3. Click **"Add New"** for each variable

### Add These Variables:

**1. DATABASE_URL**
- **Name:** `DATABASE_URL`
- **Value:** Paste the connection string from Step 2
- **Environment:** Select "Production" (and Preview/Development if you want)

**2. JWT_SECRET**
- **Name:** `JWT_SECRET`
- **Value:** `533f3c8c9e69f8dd69575b70342f0bf922b1b71a3826b63c4b22a8cd35730a6757afd52942f69310b71d8158e8078c3f1ddac9d451928a605750636ab48735ac`
- **Environment:** Production

**3. SESSION_SECRET**
- **Name:** `SESSION_SECRET`
- **Value:** `b0964c3be9ed35be24c9f385c6755d24d007ca7f26cd34119771403e6abff106e5b8a0d109310814387d085a2dd5a4be7815efb2f795c5605a954b28deec6cc3c`
- **Environment:** Production

**4. DEFAULT_EMAIL**
- **Name:** `DEFAULT_EMAIL`
- **Value:** Your email address (e.g., `your-email@example.com`)
- **Environment:** Production
- ⚠️ **Change this from the default!**

**5. DEFAULT_PASSWORD**
- **Name:** `DEFAULT_PASSWORD`
- **Value:** Your secure password
- **Environment:** Production
- ⚠️ **Change this from the default!**

**6. NODE_ENV**
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environment:** Production

### Optional (for investment features):

**7. ALPHA_VANTAGE_API_KEY** (Optional)
- **Name:** `ALPHA_VANTAGE_API_KEY`
- **Value:** Your API key (or leave empty)
- **Environment:** Production

**8. FINANCIAL_MODELING_PREP_API_KEY** (Optional)
- **Name:** `FINANCIAL_MODELING_PREP_API_KEY`
- **Value:** Your API key (or leave empty)
- **Environment:** Production

**9. FINNHUB_API_KEY** (Optional)
- **Name:** `FINNHUB_API_KEY`
- **Value:** Your API key (or leave empty)
- **Environment:** Production

**After adding each variable, click "Save"**

---

## Step 4: Deploy! (3 minutes)

1. Go to **"Deployments"** tab
2. If you see your repository imported, click **"Deploy"**
3. Wait for deployment to complete (2-5 minutes)

**Watch the build logs** - you should see:
- ✅ Installing dependencies
- ✅ Building Next.js app
- ✅ Generating Prisma Client
- ✅ Build completed successfully

---

## Step 5: Run Database Migrations (3 minutes)

After deployment completes, you need to create the database tables.

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```
   - Follow the prompts to login in your browser

3. **Link your project**:
   ```bash
   vercel link
   ```
   - Select your project from the list
   - Accept all defaults

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

5. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Using Prisma Studio (Alternative)

1. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

2. **Open Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   - This will automatically create tables if they don't exist
   - Open http://localhost:5555 in your browser

---

## Step 6: Test Your Deployment (2 minutes)

1. **Click on your deployment URL** (e.g., `your-app.vercel.app`)
2. **You should see the login page**
3. **Try logging in with:**
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
- Vercel should auto-generate it, but if it fails:
  - Go to Settings → General → Build & Development Settings
  - Add to Build Command: `npm run db:generate && npm run build`

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Clear build cache and redeploy

### Database Connection Issues

**Error: "Can't reach database"**
- Verify `DATABASE_URL` is correct (check in Vercel Storage)
- Ensure database is in same region as your app
- Check database is running in Vercel Storage dashboard

**Error: "Table does not exist"**
- Run migrations: `npx prisma migrate deploy`
- Make sure you pulled env vars first: `vercel env pull .env.local`

### Authentication Issues

**Can't log in**
- Verify `DEFAULT_EMAIL` and `DEFAULT_PASSWORD` match what you set
- Check `JWT_SECRET` and `SESSION_SECRET` are set correctly
- Check browser console for errors
- Try clearing browser cookies

---

## 📝 Quick Reference

**Your Secrets:**
- JWT_SECRET: `533f3c8c9e69f8dd69575b70342f0bf922b1b71a3826b63c4b22a8cd35730a6757afd52942f69310b71d8158e8078c3f1ddac9d451928a605750636ab48735ac`
- SESSION_SECRET: `b0964c3be9ed35be24c9f385c6755d24d007ca7f26cd34119771403e6abff106e5b8a0d109310814387d085a2dd5a4be7815efb2f795c5605a954b28deec6cc3c`

**Commands:**
```bash
# Link to Vercel
vercel login
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

---

**Ready? Start with Step 1 above! 🚀**

