#!/usr/bin/env npx tsx
/**
 * Check Production Database Schema
 * 
 * This script inspects the production database to determine:
 * 1. What tables exist
 * 2. What columns exist (especially isAdmin on User table)
 * 3. Any migration history
 * 4. Compares with expected schema
 * 
 * Usage:
 * DATABASE_URL="your-production-url" npx tsx scripts/check-production-schema.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionSchema() {
  console.log('🔍 Inspecting Production Database Schema\n');
  console.log('=' .repeat(50));
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log(`📊 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@').substring(0, 50)}...`);
    console.log('=' .repeat(50));
    
    // 1. Check what tables exist
    console.log('\n📋 TABLES IN DATABASE:');
    console.log('-' .repeat(30));
    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = ['User', 'Account', 'Session', 'Game', 'GamePlayer', '_prisma_migrations'];
    const actualTableNames = tables.map(t => t.table_name);
    
    for (const table of tables) {
      const status = expectedTables.includes(table.table_name) ? '✅' : '⚠️ ';
      console.log(`${status} ${table.table_name}`);
    }
    
    // Check for missing expected tables
    const missingTables = expectedTables.filter(t => !actualTableNames.includes(t));
    if (missingTables.length > 0) {
      console.log('\n❌ Missing expected tables:', missingTables.join(', '));
    }
    
    // 2. Check User table schema specifically
    console.log('\n👤 USER TABLE SCHEMA:');
    console.log('-' .repeat(30));
    const userColumns = await prisma.$queryRaw<Array<{column_name: string, data_type: string, is_nullable: string}>>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position
    `;
    
    const hasIsAdmin = userColumns.some(col => col.column_name === 'isAdmin');
    
    for (const column of userColumns) {
      const nullable = column.is_nullable === 'YES' ? '?' : '';
      const highlight = column.column_name === 'isAdmin' ? '👉 ' : '   ';
      console.log(`${highlight}${column.column_name}: ${column.data_type}${nullable}`);
    }
    
    if (!hasIsAdmin) {
      console.log('\n⚠️  WARNING: isAdmin column NOT found on User table!');
      console.log('   The database may not have the admin feature migration.');
    }
    
    // 3. Check migration history
    console.log('\n📜 MIGRATION HISTORY:');
    console.log('-' .repeat(30));
    try {
      const migrations = await prisma.$queryRaw<Array<{
        migration_name: string, 
        finished_at: Date | null,
        applied_steps_count: number
      }>>`
        SELECT migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations 
        ORDER BY started_at DESC
      `;
      
      if (migrations.length === 0) {
        console.log('No migrations recorded (database was managed with db push)');
      } else {
        for (const migration of migrations) {
          const status = migration.finished_at ? '✅' : '❌';
          console.log(`${status} ${migration.migration_name} - Steps: ${migration.applied_steps_count}`);
        }
      }
    } catch (error) {
      console.log('No migration history table (_prisma_migrations not found or empty)');
      console.log('This confirms the database was created with db push');
    }
    
    // 4. Check for data
    console.log('\n📊 DATA SUMMARY:');
    console.log('-' .repeat(30));
    const userCount = await prisma.user.count();
    const gameCount = await prisma.game.count();
    const adminCount = await prisma.user.count({ where: { isAdmin: true }});
    
    console.log(`Users: ${userCount} (${adminCount} admins)`);
    console.log(`Games: ${gameCount}`);
    
    // 5. Determine migration state
    console.log('\n🎯 MIGRATION STATE ASSESSMENT:');
    console.log('=' .repeat(50));
    
    if (hasIsAdmin) {
      console.log('✅ Database HAS the isAdmin field');
      console.log('   This means it includes all changes from 000_initial migration');
      console.log('   Safe to baseline at 000_initial');
    } else {
      console.log('❌ Database MISSING the isAdmin field');
      console.log('   You may need to:');
      console.log('   1. Run db push once more to add isAdmin field');
      console.log('   2. Then baseline at 000_initial');
    }
    
    console.log('\n📝 RECOMMENDED ACTION:');
    if (hasIsAdmin) {
      console.log('   npx prisma migrate resolve --applied 000_initial');
    } else {
      console.log('   1. First: npx prisma db push');
      console.log('   2. Then: npx prisma migrate resolve --applied 000_initial');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkProductionSchema().catch(console.error);
}