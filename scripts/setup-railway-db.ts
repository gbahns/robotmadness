#!/usr/bin/env tsx

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load production environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('postgresql')) {
  console.error('\n❌ DATABASE_URL not found or not PostgreSQL!\n');
  console.error('Please update .env.production with your Railway PostgreSQL connection string.');
  console.error('\nTo get your connection string:');
  console.error('1. Go to Railway dashboard');
  console.error('2. Click on your PostgreSQL service');
  console.error('3. Go to "Connect" tab');
  console.error('4. Copy the DATABASE_URL');
  console.error('\nIt should look like:');
  console.error('DATABASE_URL="postgresql://postgres:password@host.railway.app:port/railway"\n');
  process.exit(1);
}

async function setupProductionDb() {
  console.log('🚀 Setting up Railway PostgreSQL database...\n');
  
  try {
    // 1. Generate Prisma client for PostgreSQL
    console.log('1. Generating Prisma client for PostgreSQL...');
    execSync('npx prisma generate --schema=./prisma/schema.production.prisma', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Prisma client generated\n');
    
    // 2. Push schema to database (creates tables)
    console.log('2. Creating database tables...');
    execSync('npx prisma db push --schema=./prisma/schema.production.prisma --skip-generate', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Database tables created\n');
    
    console.log('✅ Railway PostgreSQL is ready!\n');
    console.log('Next steps:');
    console.log('1. Run: npx tsx scripts/migrate-to-railway.ts');
    console.log('2. This will copy all your data from SQLite to Railway PostgreSQL\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupProductionDb().catch(console.error);