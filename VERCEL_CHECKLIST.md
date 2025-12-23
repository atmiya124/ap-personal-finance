# ✅ Vercel Deployment Checklist

Use this checklist to ensure everything is ready for Vercel deployment.

---

## 📦 Pre-Deployment (Do This First)

### Code Preparation
- [x] Prisma schema updated to PostgreSQL ✅ (Already done!)
- [ ] Generate secrets: `npm run generate:secrets`
- [ ] Code committed to git
- [ ] Code pushed to GitHub

### Secrets Generated
- [ ] JWT_SECRET copied
- [ ] SESSION_SECRET copied

---

## 🚀 Vercel Setup

### Account & Project
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported from GitHub

### Database Setup
- [ ] Vercel Postgres database created
- [ ] DATABASE_URL copied from Vercel

### Environment Variables
- [ ] DATABASE_URL set
- [ ] JWT_SECRET set
- [ ] SESSION_SECRET set
- [ ] DEFAULT_EMAIL set (changed from default!)
- [ ] DEFAULT_PASSWORD set (changed from default!)
- [ ] NODE_ENV = production set

### Deployment
- [ ] Initial deployment triggered
- [ ] Build completed successfully
- [ ] Database migrations run

---

## ✅ Post-Deployment Verification

### Functionality Tests
- [ ] Can access login page
- [ ] Can log in with credentials
- [ ] Dashboard loads
- [ ] Can create a transaction
- [ ] Balance updates correctly
- [ ] HTTPS enabled (URL starts with https://)

### Security Tests
- [ ] Rate limiting works (try 6 login attempts)
- [ ] Error pages display correctly
- [ ] Security headers present (check in browser dev tools)

---

## 📝 Quick Commands Reference

```bash
# Generate secrets
npm run generate:secrets

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (after creating repo)
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main

# After deployment - run migrations
vercel login
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

---

**Follow `VERCEL_DEPLOYMENT.md` for detailed step-by-step instructions!**

