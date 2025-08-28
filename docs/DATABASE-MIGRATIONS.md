# Database Migrations Guide

## Overview
This project uses Prisma Migrate for database schema management. This ensures safe, versioned database changes in production.

## Migration Workflow

### Development

1. **Make schema changes** in `prisma/schema.prisma`

2. **Create a migration**:
   ```bash
   npx prisma migrate dev --name descriptive-migration-name
   ```
   This will:
   - Generate SQL migration files
   - Apply the migration to your local database
   - Regenerate the Prisma Client

3. **Test thoroughly** before committing

### Production (Railway)

Migrations are **automatically applied** during deployment via Railway:
- The `railway.json` configuration runs `npx prisma migrate deploy` on startup
- This safely applies any pending migrations
- No data loss (unlike `db push`)

## Important Commands

### Check migration status
```bash
npx prisma migrate status
```

### Apply migrations without creating new ones
```bash
npx prisma migrate deploy
```

### Reset database (DEVELOPMENT ONLY - Data loss!)
```bash
npx prisma migrate reset
```

### Create migration without applying
```bash
npx prisma migrate dev --create-only
```

## Admin Management

### Grant admin privileges to a user
```bash
# Local development
npx tsx scripts/make-admin.ts user@example.com

# Production (via Railway shell or database client)
UPDATE "User" SET "isAdmin" = true WHERE email = 'user@example.com';
```

## Production Deployment Process

1. **Commit migrations** - Always commit the `prisma/migrations` folder
2. **Push to repository** - Trigger Railway deployment
3. **Automatic migration** - Railway runs `npx prisma migrate deploy`
4. **Verify** - Check application logs for migration success

## Baselining Existing Production Database

If you're switching from `db push` to migrations on an existing production database, you'll encounter this error:
```
Error: P3018
Database error: relation "User" already exists
```

### Solution: Baseline the Database

**Option 1: Using the baseline script**
```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run the baseline script
npx tsx scripts/baseline-production.ts
```

**Option 2: Manual baseline**
```bash
# Mark the initial migration as already applied
npx prisma migrate resolve --applied 000_initial
```

This tells Prisma that the schema already exists and the initial migration should be considered complete.

## Troubleshooting

### "Database schema is not in sync"
- Run `npx prisma migrate dev` locally to create missing migrations

### Migration fails in production
1. Check Railway logs for specific errors
2. Ensure DATABASE_URL is correctly set
3. Verify database connectivity
4. Consider rolling back if critical

### Rollback a migration
```bash
# Note: Prisma doesn't have automatic rollback
# You must create a new migration to undo changes
npx prisma migrate dev --name rollback-feature-x
```

## Best Practices

1. **Always test migrations locally** before deploying
2. **Use descriptive migration names** (e.g., `add-user-admin-field`)
3. **Never use `db push` in production** - it can cause data loss
4. **Backup production database** before major migrations
5. **Review generated SQL** in `prisma/migrations/*/migration.sql`
6. **Don't edit migration files** after they're created
7. **Keep migrations small and focused** - one feature per migration

## Migration History

### 000_initial (Baseline)
- Initial database schema
- All core tables (User, Game, GamePlayer, etc.)
- Authentication tables (Account, Session, etc.)
- Includes `isAdmin` field on User table

## Environment Variables

Required for migrations:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

For production, this is automatically set by Railway.