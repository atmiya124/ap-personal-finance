#!/usr/bin/env node

/**
 * Generate secure secrets for production deployment
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Secrets for Production\n');
console.log('=' .repeat(60));

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_SECRET:');
console.log(jwtSecret);

// Generate Session Secret
const sessionSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 SESSION_SECRET:');
console.log(sessionSecret);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Copy these secrets and add them to your environment variables');
console.log('⚠️  Keep these secrets secure - never commit them to git!\n');

