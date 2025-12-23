# Quick Deployment Checklist

## ✅ Pre-Deployment Verification

### Build & Code Quality
- [x] Build passes without errors
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] No TODO/FIXME comments in production code
- [x] Console.log statements wrapped in dev checks

### Security
- [x] Authentication implemented (JWT sessions)
- [x] Security headers configured
- [x] Rate limiting implemented
- [x] Password hashing (bcrypt)
- [x] Input validation
- [x] Error boundaries
- [x] No hardcoded secrets

### Data Integrity
- [x] Atomic balance updates
- [x] Database transactions
- [x] Error handling

---

## ⚠️ REQUIRED: Before Deploying

### 1. Database Migration (CRITICAL)
```bash
# Update prisma/schema.prisma
datasource db {
  provider = "postgresql"  # Change from "sqlite"
  url      = env("DATABASE_URL")
}

# Then run:
npx prisma generate
npx prisma db push
```

### 2. Environment Variables (CRITICAL)
Set these in your deployment platform:

```env
# Required
DATABASE_URL="postgresql://user:pass@host:port/db"
JWT_SECRET="generate-strong-random-64-char-string"
SESSION_SECRET="generate-strong-random-64-char-string"
DEFAULT_EMAIL="your-email@example.com"
DEFAULT_PASSWORD="your-secure-password"
NODE_ENV="production"

# Optional (for investment features)
ALPHA_VANTAGE_API_KEY=""
FINANCIAL_MODELING_PREP_API_KEY=""
FINNHUB_API_KEY=""
```

### 3. Generate Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 Deployment Steps

1. **Update Prisma Schema** (change sqlite → postgresql)
2. **Set up PostgreSQL Database** (Vercel Postgres, Supabase, Neon, etc.)
3. **Set Environment Variables** in deployment platform
4. **Push Code** to repository
5. **Deploy** to platform (Vercel, etc.)
6. **Run Migrations**: `npx prisma migrate deploy`
7. **Test** login and core functionality

---

## ✅ Post-Deployment Verification

- [ ] Can access login page
- [ ] Can log in with credentials
- [ ] Can create a transaction
- [ ] Balance updates correctly
- [ ] Can view dashboard
- [ ] Rate limiting works (try 6 login attempts)
- [ ] Error pages display correctly
- [ ] HTTPS is enabled

---

## 📝 Notes

- **Rate Limiting**: Currently in-memory. For scale, consider Redis.
- **Sessions**: Stored in database. Consider Redis for high traffic.
- **Single User**: App designed for single-user use currently.

---

**Status:** ✅ Ready for deployment after database migration and environment setup.

