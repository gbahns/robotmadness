# Production Database Setup Guide

## Option 1: Turso (Recommended - SQLite Compatible)

Turso provides a SQLite-compatible edge database that's perfect for migrating from local SQLite.

### Setup Steps:

1. **Install Turso CLI**
```bash
# Windows (via curl)
curl -sSfL https://get.tur.so/install.sh | bash

# Or via npm
npm install -g @turso/cli
```

2. **Create Turso Account & Database**
```bash
turso auth signup  # or turso auth login
turso db create robotmadness-prod
turso db show robotmadness-prod  # Get your database URL
turso db tokens create robotmadness-prod  # Get auth token
```

3. **Update Environment Variables**
Create `.env.production.local`:
```
DATABASE_URL="libsql://[YOUR-DATABASE].turso.io"
DATABASE_AUTH_TOKEN="[YOUR-AUTH-TOKEN]"
```

4. **Update Prisma Configuration**
Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // Add for Turso:
  directUrl = env("DATABASE_URL")
}
```

5. **Migrate Data from Dev to Production**
```bash
# Export dev database
sqlite3 dev.db .dump > dev_backup.sql

# Import to Turso
turso db shell robotmadness-prod < dev_backup.sql
```

## Option 2: Supabase (PostgreSQL)

If you prefer PostgreSQL for more features:

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Create new project
   - Copy database URL from Settings > Database

2. **Update Schema for PostgreSQL**
```bash
# Change provider in schema.prisma
provider = "postgresql"

# Update .env.production.local
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

3. **Migrate Schema**
```bash
npx prisma migrate deploy --schema ./prisma/schema.prisma
```

4. **Migrate Data**
Use the migration scripts we created, but point to production database.

## Option 3: Deploy with SQLite File

For simplest deployment (works with Vercel, Netlify, etc.):

1. **Use a Persistent Volume**
   - Most platforms support persistent storage
   - SQLite file lives with your app

2. **Copy Production Database**
```bash
# Copy your migrated dev.db as prod.db
cp dev.db prod.db
```

3. **Update Production Config**
```env
DATABASE_URL="file:./prod.db"
```

## Data Migration Script

Here's a universal script to migrate your current data:

```typescript
// scripts/migrate-to-production.ts
import { PrismaClient as DevPrisma } from '@prisma/client';
import { PrismaClient as ProdPrisma } from '@prisma/client';

const devDb = new DevPrisma({
  datasources: { db: { url: 'file:./dev.db' } }
});

const prodDb = new ProdPrisma({
  datasources: { db: { url: process.env.PRODUCTION_DATABASE_URL } }
});

async function migrate() {
  // 1. Migrate Users
  const users = await devDb.user.findMany();
  await prodDb.user.createMany({ data: users, skipDuplicates: true });
  
  // 2. Migrate Games
  const games = await devDb.game.findMany();
  await prodDb.game.createMany({ data: games, skipDuplicates: true });
  
  // 3. Migrate Players
  const players = await devDb.player.findMany();
  await prodDb.player.createMany({ data: players, skipDuplicates: true });
  
  console.log('Migration complete!');
}

migrate()
  .catch(console.error)
  .finally(async () => {
    await devDb.$disconnect();
    await prodDb.$disconnect();
  });
```

## Deployment Platforms

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
# Follow prompts, set environment variables in Vercel dashboard
```

### Railway
- Supports SQLite with persistent volumes
- Built-in PostgreSQL option
- Easy deployment from GitHub

### Render
- Similar to Railway
- Good free tier
- Supports both SQLite and PostgreSQL

## Next Steps

1. Choose your database option (Turso recommended for SQLite compatibility)
2. Set up production database
3. Run migration from dev to production
4. Deploy application
5. Update MongoDB connection to stop using old database