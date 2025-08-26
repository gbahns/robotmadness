import { PrismaClient as SqliteClient } from '@prisma/client';
import { PrismaClient as PostgresClient } from '@prisma/client-production';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load production environment variables
const envPath = path.resolve(process.cwd(), '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production file not found!');
  process.exit(1);
}

// Clear any existing DATABASE_URL from .env file and load production
delete process.env.DATABASE_URL;
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env.production:', result.error);
  process.exit(1);
}

console.log('Loaded environment from:', envPath);
const dbUrl = process.env.DATABASE_URL as string | undefined;
console.log('DATABASE_URL starts with:', dbUrl ? (dbUrl as string).substring(0, 40) : 'Not set');

if (!dbUrl || typeof dbUrl !== 'string' || !dbUrl.includes('postgresql')) {
  console.error('\n❌ DATABASE_URL not found or not PostgreSQL!');
  console.error('Current DATABASE_URL:', dbUrl || 'Not set');
  console.error('\nPlease set DATABASE_URL in .env.production with your Railway PostgreSQL connection string');
  process.exit(1);
}

// Source: SQLite (local dev database)
const sqliteDb = new SqliteClient({
  datasources: { 
    db: { 
      url: 'file:./dev.db' 
    } 
  }
});

// Target: PostgreSQL (Railway production)
const postgresDb = new PostgresClient({
  datasources: { 
    db: { 
      url: dbUrl 
    } 
  }
});

async function migrate() {
  console.log('🚀 Starting migration from SQLite to Railway PostgreSQL...\n');
  
  try {
    // Test connections
    console.log('Testing database connections...');
    await sqliteDb.$queryRaw`SELECT 1`;
    console.log('✅ SQLite connection successful');
    
    await postgresDb.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connection successful\n');
    
    // 1. Clear existing production data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing production data...');
    await postgresDb.gamePlayer.deleteMany({});
    await postgresDb.game.deleteMany({});
    await postgresDb.user.deleteMany({});
    console.log('✅ Production database cleared\n');
    
    // 2. Migrate Users
    console.log('Migrating users...');
    const users = await sqliteDb.user.findMany();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      await postgresDb.user.create({
        data: user
      });
    }
    console.log('✅ Users migrated successfully\n');
    
    // 3. Migrate Games
    console.log('Migrating games...');
    const games = await sqliteDb.game.findMany();
    console.log(`Found ${games.length} games to migrate`);
    
    for (const game of games) {
      await postgresDb.game.create({
        data: {
          ...game,
          finalResults: game.finalResults || undefined
        }
      });
    }
    console.log('✅ Games migrated successfully\n');
    
    // 4. Migrate Game Players
    console.log('Migrating game players...');
    const players = await sqliteDb.gamePlayer.findMany();
    console.log(`Found ${players.length} player records to migrate`);
    
    // Migrate in batches to avoid overwhelming the connection
    const batchSize = 50;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await postgresDb.gamePlayer.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`  Migrated ${Math.min(i + batchSize, players.length)}/${players.length} player records`);
    }
    console.log('✅ Game players migrated successfully\n');
    
    // 5. Verify migration
    console.log('Verifying migration...');
    const prodUserCount = await postgresDb.user.count();
    const prodGameCount = await postgresDb.game.count();
    const prodPlayerCount = await postgresDb.gamePlayer.count();
    
    console.log('Production database now contains:');
    console.log(`  - ${prodUserCount} users (expected: ${users.length})`);
    console.log(`  - ${prodGameCount} games (expected: ${games.length})`);
    console.log(`  - ${prodPlayerCount} player records (expected: ${players.length})`);
    
    if (prodUserCount === users.length && 
        prodGameCount === games.length && 
        prodPlayerCount === players.length) {
      console.log('\n✅ Migration completed successfully! 🎉');
    } else {
      console.log('\n⚠️  Migration completed but counts don\'t match. Please verify data.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sqliteDb.$disconnect();
    await postgresDb.$disconnect();
  }
}

// Run the migration
migrate().catch(console.error);