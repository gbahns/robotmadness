# Design & Architecture

## Technology Decisions

### Primary Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript/JavaScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for multiplayer
- **Styling**: Tailwind CSS
- **State Management**: React Context + Socket.io
- **Deployment**: Vercel (recommended)

### Implementation Notes
- **Current Focus**: Next.js implementation is the active codebase
- **Legacy Code**: Meteor.js implementation exists but should be IGNORED except for:
  - Reusable visual assets (robot sprites, board tiles, etc.)
  - UI/UX flow inspiration
  - Game progression ideas
- **Sync Issues**: Project knowledge base may lag behind latest code changes
- **Game Logic**: Core mechanics implemented in JavaScript/TypeScript

## Architecture Overview

### Project Structure
```
/app                    # Next.js app directory
  /game
    /[roomCode]         # Dynamic game room pages
      page.tsx          # Main game view
      layout.tsx        # Game layout wrapper
  /lobby               # Game lobby/listing
  /api                 # API routes
    /game              # Game-related endpoints
    /socket            # Socket.io initialization

/components
  /game
    Board.tsx          # Main game board
    Card.tsx           # Program card component
    Robot.tsx          # Robot piece
    Timer.tsx          # Turn timer
    Controls.tsx       # Player controls
  /lobby
    GameList.tsx       # Available games
    CreateGame.tsx     # New game form

/lib
  /game
    engine.ts          # Core game logic
    board-elements.ts  # Conveyor, laser, etc.
    cards.ts           # Card management
    types.ts           # TypeScript types
    constants.ts       # Game constants
  /socket
    events.ts          # Socket event handlers
    client.ts          # Socket client setup

/prisma
  schema.prisma        # Database schema
  migrations/          # Database migrations

/public
  /assets
    /robots            # Robot sprites
    /tiles             # Board tile graphics
    /cards             # Card images
    /sounds            # Sound effects
```

### Data Flow Architecture
```
Client (React) <-> Socket.io <-> Server (Next.js API)
                                    |
                                    v
                              PostgreSQL (Prisma)
```

## Development Phases

### Phase 1: Core Gameplay ✓ (In Progress)
- [x] Basic project setup
- [x] Database schema
- [ ] Game room creation/joining
- [ ] Basic board rendering
- [ ] Card dealing and selection UI
- [ ] Movement execution
- [ ] Turn timer implementation
- [ ] Basic collision detection

### Phase 2: Board Elements
- [ ] Conveyor belt system
- [ ] Pusher mechanics
- [ ] Gear implementation
- [ ] Laser calculations
- [ ] Pit hazards
- [ ] Checkpoint system
- [ ] Repair sites

### Phase 3: Multiplayer Polish
- [ ] Smooth animations
- [ ] State reconciliation
- [ ] Disconnect handling
- [ ] Spectator mode
- [ ] Game replay
- [ ] Chat system

### Phase 4: Enhanced Features
- [ ] Multiple board layouts
- [ ] Board editor
- [ ] Option cards
- [ ] AI opponents
- [ ] Tournament mode
- [ ] Statistics tracking

## Key Implementation Areas

### 1. State Management
```typescript
interface GameState {
  id: string;
  roomCode: string;
  players: Map<string, Player>;
  board: Board;
  phase: GamePhase;
  currentRegister: number;
  deck: ProgramCard[];
  discardPile: ProgramCard[];
}
```

### 2. Real-time Synchronization
- Use optimistic updates for responsive UI
- Server authoritative for game logic
- Implement action validation
- Handle network latency gracefully

### 3. Animation System
- Queue animations for smooth playback
- Separate visual state from game state
- Use CSS transitions where possible
- Batch simultaneous movements

### 4. Performance Targets
- Card selection: <100ms response
- Movement animation: 500ms per step
- State sync: <50ms latency
- 60fps during animations

## Database Schema Overview

### Core Tables
- `Game`: Active game sessions
- `Player`: User accounts
- `GamePlayer`: Players in games
- `GameAction`: Action history/replay
- `BoardPreset`: Saved board layouts

### Key Relationships
- Game ↔ Players (many-to-many)
- Game → GameActions (one-to-many)
- Player → Statistics (one-to-one)

## API Design

### REST Endpoints
- `POST /api/game/create` - Create new game
- `POST /api/game/[id]/join` - Join existing game
- `GET /api/game/[id]/state` - Get current state
- `POST /api/game/[id]/action` - Submit action

### Socket Events
- `game:join` - Player joins room
- `game:leave` - Player leaves
- `game:selectCard` - Card selection
- `game:ready` - Ready for next phase
- `game:stateUpdate` - Broadcast state

## Testing Strategy

### Unit Tests
- Game engine logic
- Card dealing algorithms
- Movement calculations
- Collision detection

### Integration Tests
- Socket communication
- Database operations
- Full turn execution
- State synchronization

### E2E Tests
- Complete game flow
- Multiplayer scenarios
- Network failure recovery
- Performance under load

## Development Best Practices

### Code Standards
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error boundaries
- Use ESLint and Prettier

### Git Workflow
- Feature branches
- PR reviews required
- Comprehensive commit messages
- Tag releases

### Performance Guidelines
- Minimize re-renders
- Use React.memo strategically
- Implement virtual scrolling for large lists
- Optimize asset loading

### Debugging Tools
- Redux DevTools for state
- Socket.io admin UI
- Custom game state visualizer
- Performance profiler

## Common Development Tasks

### Adding a New Board Element
1. Define type in `types.ts`
2. Add to board element system
3. Implement activation logic
4. Add visual component
5. Update board editor
6. Write tests

### Creating a New Card Type
1. Add to CardType enum
2. Implement execution logic
3. Create card artwork
4. Add to deck configuration
5. Update UI components
6. Test priority conflicts

### Implementing a Game Rule
1. Locate relevant engine module
2. Implement rule logic
3. Handle edge cases
4. Update state management
5. Add visual feedback
6. Document rule clearly

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Database migrations ready
- [ ] Environment variables set

### Post-deployment
- [ ] Smoke test critical paths
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify socket connections
- [ ] Test across browsers

---

*This guide should be updated as architectural decisions evolve and new patterns emerge.*