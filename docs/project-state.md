# Project State - Last Updated: August 2 2025

## Working Features (DO NOT MODIFY WITHOUT EXPLICIT PERMISSION)

### ✅ Core Infrastructure
- **Server Setup**: `server.js` with Socket.io - WORKING
- **Next.js App**: Pages and routing - WORKING
- **WebSocket Connection**: Client-server communication - WORKING

### ✅ Game Management
- **Create Game**: Players can create new games with room codes
- **Join Game**: Players can join existing games
- **Player ID Persistence**: Using sessionStorage
- **Host Management**: First player is host, transfers on leave

### ✅ UI Components
- **Board Display**: 12x12 grid, 50px tiles, gray background
- **Player Status Panels**: Shows lives (hearts), health bar, checkpoints
- **Timer Component**: Visual countdown with color changes
- **Card Component**: Displays card type, priority, and visual design
- **Robot Component**: Directional indicator, player colors

### ✅ Game State
- **Board Structure**: width, height, tiles, checkpoints, startingPositions
- **Player Structure**: position, direction, damage, lives, cards
- **Phase Management**: waiting, programming, executing, ended

## Known Issues / Not Yet Implemented

### 🔧 Needs Work
- **Card Selection**: Click to select not working properly
- **Card Drag & Drop**: Not functioning
- **Register Slot Selection**: Needs fixing
- **Submit Validation**: Not checking if all registers filled

### ❌ Not Implemented
- **Execution Phase**: No movement or board element execution
- **Game Engine**: `gameEngine.js` exists but not integrated
- **Board Elements**: Conveyors, lasers, pushers, etc.
- **Animations**: Intentionally disabled
- **Database**: Using in-memory storage only
- **Rejoin**: Players can't rejoin after disconnect

## Architecture Decisions (LOCKED - DO NOT CHANGE)

### Server Architecture
- **Main File**: `/server.ts` (TypeScript with tsx runtime)
- **Game Engine**: `/lib/game/gameEngine.ts` - TypeScript implementation
- **Port**: 3000
- **Storage**: In-memory Map for games
- **Docking Bay Size**: 4x12 ALWAYS
- **Board Size**: 12x12 grid ALWAYS
- **Course Size**: 1 Docking Bay and 1 or 2 Factory Floor Boards
- **Tile Size**: 50px ALWAYS

### Client Architecture  
- **Framework**: Next.js App Router
- **State Management**: Server authoritative via Socket.io
- **Styling**: Tailwind CSS only
- **Component Library**: Custom only (no external UI libs)

### Game Rules (Per Requirements)
- **Players**: 2-8 players
- **Lives**: 3 per player
- **Damage**: 10 = death
- **Registers**: 5 (locked with 5+ damage)
- **Cards**: 9 dealt (minus damage)
- **Timer**: 30 seconds for programming

## Current Development Rules

### DO NOT
1. Add animations or transitions
2. Change board dimensions
3. Restructure server.js
4. Add external dependencies without discussion
5. Implement "nice to have" features before core gameplay
6. Delete working code (comment out instead)
7. Make large changes without testing small pieces

### DO
1. Ask before modifying working features
2. Make incremental changes
3. Test after each change
4. Preserve existing functionality
5. Focus on one feature at a time
6. Create backups before major changes

## Feature Flags
```javascript
const FEATURES = {
  ANIMATIONS: false,          // DO NOT ENABLE
  BOARD_ELEMENTS: false,      // DO NOT ENABLE  
  ADVANCED_UI: false,         // DO NOT ENABLE
  DATABASE: false,            // DO NOT ENABLE
  SOUND_EFFECTS: false,       // DO NOT ENABLE
};
```

## Current Focus Priority
1. Fix card selection (click to place in register)
2. Fix register slot selection UI
3. Implement submit validation
4. Add proper error messages
5. ONLY THEN: Move to execution phase

## Files Status

### ✅ Working - Do Not Restructure
- `/server.js`
- `/components/game/Board.tsx`
- `/components/game/Robot.tsx`
- `/components/game/PlayerStatus.tsx`
- `/components/game/Timer.tsx`
- `/lib/socket.ts`

### 🔧 Needs Work
- `/app/game/[roomCode]/page.tsx` - Card selection logic
- `/components/game/ProgramRegisters.tsx` - Slot selection
- `/components/game/Card.tsx` - Click handling

### ❌ Not Integrated
- `/gameEngine.js` - Exists but not connected
- `/boardConfig.js` - Exists but minimal use

## Testing Checklist
Before ANY commit:
- [ ] Can create a game?
- [ ] Can join a game?
- [ ] Does board display?
- [ ] Do players show in sidebar?
- [ ] Can start game as host?
- [ ] Are cards dealt?
- [ ] No console errors?
- [ ] No TypeScript errors?

## Recovery Procedures
If something breaks:
1. Check this document for what should work
2. Revert to last known working state
3. Make smaller changes
4. Test each change individually
5. Update this document when fixing

---
*This document is the source of truth for project state. Update after each session.*