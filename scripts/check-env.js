#!/usr/bin/env node

/**
 * Check if all required environment variables are set
 * Run: node scripts/check-env.js
 */

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'DEFAULT_EMAIL',
  'DEFAULT_PASSWORD',
  'NODE_ENV',
];

const optionalVars = [
  'ALPHA_VANTAGE_API_KEY',
  'FINANCIAL_MODELING_PREP_API_KEY',
  'FINNHUB_API_KEY',
];

console.log('\n🔍 Checking Environment Variables\n');
console.log('='.repeat(60));

let allSet = true;

// Check required variables
console.log('\n✅ Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
      console.log(`  ✓ ${varName}: ${'*'.repeat(20)} (set)`);
    } else {
      console.log(`  ✓ ${varName}: ${value}`);
    }
  } else {
    console.log(`  ✗ ${varName}: NOT SET`);
    allSet = false;
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ ${varName}: set`);
  } else {
    console.log(`  - ${varName}: not set (optional)`);
  }
});

console.log('\n' + '='.repeat(60));

if (allSet) {
  console.log('\n✅ All required environment variables are set!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please set all required variables before deployment.\n');
  process.exit(1);
}

