# Security Implementation Guide

## Quick Start: Enable Security Features

### Step 1: Update Environment Variables

Create/update `.env.local`:
```env
# Session Security
SESSION_SECRET=generate-a-random-32-character-string-here

# Rate Limiting
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000

# Account Lockout
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MS=1800000

# Default Credentials (remove in production!)
DEFAULT_EMAIL=atmiyapatel024@gmail.com
DEFAULT_PASSWORD=123456
```

### Step 2: Replace Current Files with Secure Versions

1. **Replace login route:**
   ```bash
   # Backup current file
   mv app/api/auth/login/route.ts app/api/auth/login/route.ts.backup
   # Copy secure version
   cp app/api/auth/login/route.secure.ts app/api/auth/login/route.ts
   ```

2. **Replace change password route:**
   ```bash
   mv app/api/auth/change-password/route.ts app/api/auth/change-password/route.ts.backup
   cp app/api/auth/change-password/route.secure.ts app/api/auth/change-password/route.ts
   ```

3. **Replace middleware:**
   ```bash
   mv middleware.ts middleware.ts.backup
   cp middleware.security.ts middleware.ts
   ```

### Step 3: Update Password Validation in Frontend

Update `components/ChangePasswordForm.tsx` to show password requirements:

```typescript
// Add password strength indicator
const [passwordStrength, setPasswordStrength] = useState({ valid: false, errors: [] });

// Validate on password change
useEffect(() => {
  if (newPassword) {
    // Call API to validate or use client-side validation
    fetch('/api/auth/validate-password', {
      method: 'POST',
      body: JSON.stringify({ password: newPassword })
    }).then(res => res.json())
      .then(data => setPasswordStrength(data));
  }
}, [newPassword]);
```

## Security Features Explained

### 1. Rate Limiting
**What it does:** Prevents brute force attacks by limiting login attempts per IP.

**How it works:**
- Tracks attempts per IP address
- Blocks after 5 attempts in 15 minutes
- Returns 429 status with retry information

**Production Note:** Use Redis for distributed rate limiting across multiple servers.

### 2. Account Lockout
**What it does:** Locks accounts after multiple failed login attempts.

**How it works:**
- Tracks failed attempts per user
- Locks account after 5 failed attempts
- Unlocks automatically after 30 minutes
- Resets on successful login

### 3. Strong Password Requirements
**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not a common password

**Implementation:** See `lib/security.ts`

### 4. Secure Session Management
**Improvements:**
- Uses hashed session tokens instead of simple "authenticated" value
- Stores user ID separately for quick access
- HTTP-only cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite protection (prevents CSRF)

### 5. Security Headers
**Headers Added:**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Content-Security-Policy` - Prevents XSS attacks
- `Strict-Transport-Security` - Forces HTTPS
- `Referrer-Policy` - Controls referrer information

### 6. Input Validation & Sanitization
**Protections:**
- Email format validation
- Input length limits
- XSS prevention (removes dangerous characters)
- Trimming and normalization

## Production Deployment Checklist

### Before Deploying:

1. **Environment Variables**
   - [ ] Set strong `SESSION_SECRET` (32+ random characters)
   - [ ] Remove default credentials from code
   - [ ] Use environment variables for all secrets
   - [ ] Never commit `.env.local` to git

2. **Database**
   - [ ] Use PostgreSQL (not SQLite) for production
   - [ ] Enable SSL connections
   - [ ] Set up regular backups
   - [ ] Use connection pooling

3. **HTTPS**
   - [ ] Enable HTTPS (required for secure cookies)
   - [ ] Set up SSL certificate (Let's Encrypt)
   - [ ] Configure HSTS headers
   - [ ] Redirect HTTP to HTTPS

4. **Rate Limiting**
   - [ ] Replace in-memory rate limiting with Redis
   - [ ] Configure appropriate limits
   - [ ] Monitor rate limit hits

5. **Monitoring**
   - [ ] Set up error tracking (Sentry, etc.)
   - [ ] Log failed login attempts
   - [ ] Monitor account lockouts
   - [ ] Set up alerts for suspicious activity

6. **Testing**
   - [ ] Test rate limiting
   - [ ] Test account lockout
   - [ ] Test password strength validation
   - [ ] Test session management
   - [ ] Test security headers

## Advanced Security (Optional)

### Redis Rate Limiting

Install Redis:
```bash
npm install ioredis
```

Create `lib/rate-limit-redis.ts`:
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
) {
  const key = `rate-limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.pexpire(key, windowMs);
  }
  
  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt: Date.now() + windowMs,
  };
}
```

### Two-Factor Authentication (2FA)

Consider adding 2FA for additional security:
- Use `speakeasy` or `otplib` for TOTP
- Store 2FA secrets encrypted
- Provide backup codes
- Require 2FA for sensitive operations

### Password Reset Flow

Implement secure password reset:
- Generate time-limited tokens
- Send reset links via email
- Invalidate tokens after use
- Require email verification

## Monitoring & Alerts

### Key Metrics to Monitor:

1. **Failed Login Attempts**
   - Track per user and per IP
   - Alert on spikes
   - Monitor for patterns

2. **Account Lockouts**
   - Track frequency
   - Identify potential attacks
   - Review legitimate lockouts

3. **Rate Limit Hits**
   - Monitor 429 responses
   - Identify attack patterns
   - Adjust limits if needed

4. **Session Activity**
   - Track active sessions
   - Monitor for anomalies
   - Implement session timeout

## Troubleshooting

### Rate Limiting Not Working
- Check Redis connection (if using Redis)
- Verify rate limit configuration
- Check IP detection (x-forwarded-for header)

### Account Lockouts Too Frequent
- Review `MAX_FAILED_ATTEMPTS` setting
- Check for legitimate failures
- Consider implementing unlock mechanism

### Security Headers Not Applied
- Verify middleware is running
- Check Next.js configuration
- Ensure headers aren't being overridden

## Support

For security issues or questions:
1. Review `SECURITY.md` for detailed information
2. Check implementation in secure route files
3. Test in development before production
4. Monitor logs for security events

