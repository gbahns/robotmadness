# Project Context for AI Assistants

## Database Migration Instructions

### IMPORTANT: Use Existing Scripts
When performing database migrations, **ALWAYS** check and use the existing TypeScript migration scripts in the `/scripts` folder before creating new ones:

#### MongoDB to PostgreSQL Migration
1. **User Migration**: `scripts/migrate-users.ts`
   - Migrates users from MongoDB to PostgreSQL
   - Maps MongoDB user fields to Prisma schema
   - Preserves user IDs for relationship mapping

2. **Game Migration**: `scripts/migrate-games.ts`
   - Migrates games and game players from MongoDB
   - Uses `games_view` collection for complete data
   - Maps board IDs to names, robot IDs to colors
   - Correctly links hosts and winners

3. **Fix Scripts** (if needed after migration):
   - `scripts/fix-winner-mapping.ts` - Corrects winner relationships
   - `scripts/fix-games-migration.ts` - General game data fixes

#### Field Mappings (MongoDB → PostgreSQL)
- **Users**:
  - Username comes from `players.name` field
  - `players.userId` → `users._id`
  - Email from `users.emails[0].address`
  
- **Games**:
  - `games.userId` → host user ID
  - `games.author` → host username
  - `games.winner` → winner username (lookup user by name)
  
- **Players**:
  - `players.gameId` → `games._id`
  - `players.userId` → `users._id`
  - `players.name` → username

#### Migration Steps
1. Set `DATABASE_URL` in `.env` to target PostgreSQL database
2. Update MongoDB connection string in scripts if needed:
   - Old format: `mongodb://user:pass@shard1,shard2,shard3/db?ssl=true`
   - New format: `mongodb+srv://user:pass@cluster.mongodb.net/db`
3. Run migrations in order:
   ```bash
   npx tsx scripts/migrate-users.ts
   npx tsx scripts/migrate-games.ts
   npx tsx scripts/fix-winner-mapping.ts  # if needed
   ```
4. Verify with: `npx tsx scripts/verify-users.ts` and `verify-games.ts`

## Development Environment

### Development Server
**DEV SERVER MANAGEMENT:** 
- You should manage the development server (`npm run dev`) automatically
- Always kill any existing process on port 3000 before starting: `npx kill-port 3000`
- After running `npm run build`, restart the dev server
- Run the dev server in background mode using `run_in_background: true`
- Check server status with BashOutput tool to ensure it started properly
- IMPORTANT: Always ensure only one instance is running to avoid port conflicts

### Testing and Building
- Use `npm run build` to check for TypeScript errors and build issues
- The project doesn't have a `typecheck` script; use `npm run build` instead
- Lint issues are shown during build but don't block compilation

## Project Architecture

### Tech Stack
- Next.js 15.4.5 with App Router
- TypeScript
- Socket.io for real-time multiplayer
- Tailwind CSS for styling
- Prisma ORM (currently unused but configured)

### Key Directories
- `/app` - Next.js app router pages
- `/components` - React components
- `/lib` - Core game logic and utilities
- `/hooks` - Custom React hooks
- `/server.ts` - Socket.io server implementation

## Code Style Guidelines

### TypeScript Best Practices (STRICT - NO EXCEPTIONS)
- **NEVER use `any` type** - Always specify proper types
  - For errors in catch blocks: `catch (err) { const error = err as Error; }`
  - For event handlers: `(e: React.FormEvent)` or `(e: React.ChangeEvent<HTMLInputElement>)`
  - For unknown objects: Define an interface or use `Record<string, unknown>`
- **NEVER leave unused variables or imports**
  - Remove unused imports immediately
  - If a variable must exist but isn't used, prefix with underscore: `_unusedVar`
  - For catch blocks where error isn't used: `catch { }` (no parameter)
- **ALWAYS use proper null checking**
  - Use optional chaining: `object?.property`
  - Use nullish coalescing: `value ?? defaultValue`
  - Add null checks for nullable types: `if (value) { ... }`
- Use union types (e.g., `string | number`) when values can be multiple types
- Define interfaces or type aliases for complex objects
- Properly type function parameters and return values
- For async functions, specify return type: `async (): Promise<void>`

### Preventing Lint Warnings
Before completing any code changes, ensure:
1. No `any` types exist in the code
2. All imports are used
3. All variables are either used or removed
4. All nullable objects are properly checked
5. Event handlers have proper types
6. Catch blocks handle errors properly without `any`

### Comments
- DO NOT add comments unless explicitly requested by the user
- Keep code self-documenting through clear naming

### UI/UX Principles
- Avoid modal dialogs for game decisions (see `/docs/UX-DESIGN-PRINCIPLES.md`)
- Use inline panels in the sidebar for player decisions
- Keep the game board visible at all times during gameplay

### Refactoring Approach
- When refactoring large components, prioritize:
  1. Extracting custom hooks for business logic
  2. Creating smaller, focused components
  3. Separating concerns (presentation vs logic)

## Current Refactoring Status

The game page (`/app/game/[roomCode]/page.tsx`) is being refactored to improve maintainability:
- ✅ Created `useGameSocket` hook to manage socket events
- 🔄 Additional components to be extracted (see todo list)

## Testing Protocol

1. Check TypeScript compilation: `npm run build`
2. Verify no runtime errors in browser console
3. Test multiplayer functionality with multiple browser tabs
4. Ensure game state syncs properly between clients

## Known Issues & Considerations

- Some ESLint warnings are acceptable (unused vars in WIP features)
- The project uses both client and server components - be mindful of the boundary
- Socket.io events must be properly cleaned up in useEffect returns