#!/usr/bin/env npx tsx
/**
 * Baseline Production Database
 * 
 * This script marks the initial migration as already applied in production
 * without actually running it, since the schema already exists from db push.
 * 
 * Usage:
 * 1. Set DATABASE_URL to your production database
 * 2. Run: npx tsx scripts/baseline-production.ts
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function baselineProduction() {
  console.log('🔧 Baselining production database...\n');
  
  try {
    // Check if we're actually pointing to a database
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Safety check - confirm this is intentional
    if (!databaseUrl.includes('railway') && !databaseUrl.includes('production')) {
      console.log('⚠️  WARNING: DATABASE_URL does not appear to be a production database.');
      console.log(`   URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
      console.log('   Continue only if you are sure this is correct.\n');
      
      if (process.argv[2] !== '--force') {
        console.log('   Run with --force to proceed anyway');
        process.exit(1);
      }
    }
    
    // Check current migration status
    console.log('📊 Checking current migration status...');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY started_at DESC 
        LIMIT 5
      `;
      console.log('Current migrations:', migrations);
    } catch (error) {
      console.log('No migration history found (this is expected if never used migrations before)');
    }
    
    console.log('\n🚀 Marking initial migration as already applied...');
    
    // Use Prisma's baseline command
    const { stdout, stderr } = await execAsync(
      'npx prisma migrate resolve --applied 000_initial',
      { env: { ...process.env } }
    );
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error('Stderr:', stderr);
    
    console.log('\n✅ Production database baselined successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy your application');
    console.log('   2. Future migrations will run automatically');
    console.log('   3. The error about "relation already exists" should be resolved');
    
  } catch (error) {
    console.error('\n❌ Error baselining production:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  baselineProduction().catch(console.error);
}