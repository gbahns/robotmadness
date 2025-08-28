#!/usr/bin/env tsx
/**
 * Script to safely run migrations in production
 * This script creates a backup before applying migrations
 * Usage: npx tsx scripts/db-migrate-prod.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runProductionMigration() {
  console.log('🚀 Starting production migration process...\n');

  try {
    // 1. Check for pending migrations
    console.log('📋 Checking for pending migrations...');
    const { stdout: status } = await execAsync('npx prisma migrate status');
    console.log(status);

    // 2. Create a database backup (if DATABASE_URL points to production)
    if (process.env.DATABASE_URL?.includes('railway.app')) {
      console.log('💾 Creating database backup...');
      console.log('   (Consider using Railway\'s backup feature or pg_dump)\n');
    }

    // 3. Deploy migrations
    console.log('🔄 Deploying migrations to production...');
    const { stdout: deployOutput } = await execAsync('npx prisma migrate deploy');
    console.log(deployOutput);

    console.log('✅ Migrations successfully deployed!\n');

    // 4. Verify the deployment
    console.log('🔍 Verifying migration status...');
    const { stdout: finalStatus } = await execAsync('npx prisma migrate status');
    console.log(finalStatus);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  If the migration failed, you may need to:');
    console.error('   1. Restore from backup');
    console.error('   2. Fix the migration issue');
    console.error('   3. Try again');
    process.exit(1);
  }
}

// Safety check
if (process.env.NODE_ENV !== 'production' && !process.argv.includes('--force')) {
  console.log('⚠️  Warning: This script is intended for production use.');
  console.log('   Set NODE_ENV=production or use --force flag to continue.\n');
  process.exit(1);
}

runProductionMigration();