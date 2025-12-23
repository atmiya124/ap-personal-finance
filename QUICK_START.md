# 🚀 Quick Start - Deploy in 10 Minutes

## Prerequisites
- GitHub account
- Account on Vercel, Railway, or Render
- 10 minutes

---

## Step 1: Generate Secrets (2 minutes)

```bash
npm run generate:secrets
```

Copy the two secrets that are generated.

---

## Step 2: Update Database (1 minute)

1. Open `prisma/schema.prisma`
2. Change line 9:
   ```prisma
   provider = "postgresql"  # Change from "sqlite"
   ```
3. Save the file

---

## Step 3: Push to GitHub (2 minutes)

```bash
git add .
git commit -m "Ready for production"
git push
```

---

## Step 4: Deploy on Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Add" next to "Environment Variables"
5. Add these variables:

   ```
   DATABASE_URL = (get from Vercel Postgres - see below)
   JWT_SECRET = (paste from Step 1)
   SESSION_SECRET = (paste from Step 1)
   DEFAULT_EMAIL = your-email@example.com
   DEFAULT_PASSWORD = your-secure-password
   NODE_ENV = production
   ```

6. **Set up Database:**
   - In Vercel dashboard, click "Storage"
   - Click "Create Database" → "Postgres"
   - Copy the `POSTGRES_URL` 
   - Go back to Environment Variables
   - Update `DATABASE_URL` with the `POSTGRES_URL` value

7. Click "Deploy"

---

## Step 5: Run Migrations (2 minutes)

After deployment completes:

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Functions"
3. Or use Vercel CLI:
   ```bash
   npx vercel env pull .env.local
   npx prisma migrate deploy
   ```

---

## ✅ Done!

Visit your deployed URL and log in with:
- Email: The `DEFAULT_EMAIL` you set
- Password: The `DEFAULT_PASSWORD` you set

---

## 🆘 Having Issues?

1. **Build fails?** Check the build logs in Vercel
2. **Can't connect to database?** Verify `DATABASE_URL` is correct
3. **Can't log in?** Check that `JWT_SECRET` and `SESSION_SECRET` are set
4. **Tables missing?** Run `npx prisma migrate deploy`

For detailed help, see `DEPLOYMENT_GUIDE.md`

