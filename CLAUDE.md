# Project Context for AI Assistants

## Development Environment

### Development Server
**IMPORTANT:** 
- After running `npm run build`, restart the dev server with `npm run dev` in the background, as the build process interrupts the running dev server.
- **CRITICAL - Dev Server Management:**
  1. **ALWAYS** check if a dev server is already running before starting a new one
  2. Use the `/bashes` command or check background bash sessions to find existing dev servers
  3. Only ONE dev server should be running at a time
  4. Kill any existing dev server with `KillBash` before starting a new one
  5. Always use `run_in_background: true` when starting the dev server
  6. Keep track of the bash session ID to avoid duplicate servers
  7. Common pattern: Check → Kill if exists → Start new

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

### TypeScript Best Practices
- **NEVER use `any` type** - Always specify proper types
- Use union types (e.g., `string | number`) when values can be multiple types
- Define interfaces or type aliases for complex objects
- Properly type function parameters and return values
- If you absolutely need to bypass typing temporarily, use `unknown` instead of `any`

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