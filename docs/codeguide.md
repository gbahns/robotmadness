# RoboRally Implementation Guide & Code Patterns

## Implementation Context

This guide provides specific implementation patterns and solutions for common RoboRally game development scenarios. It serves as a companion to the Requirements document.

## Game Engine Core Patterns

### Movement Resolution Pattern
```javascript
// Priority-based movement execution
async executeRegister(gameState, registerIndex) {
  // 1. Collect all programmed moves
  const moves = collectProgrammedMoves(gameState, registerIndex);
  
  // 2. Sort by priority (highest first)
  moves.sort((a, b) => b.card.priority - a.card.priority);
  
  // 3. Execute each move in order
  for (const move of moves) {
    await executeCard(gameState, move.player, move.card);
    emit('card-executed', move);
    await delay(ANIMATION_TIME);
  }
  
  // 4. Activate board elements
  await activateBoardElements(gameState);
}
```

### Collision Detection & Pushing
```javascript
// Robot pushing logic
async pushRobot(gameState, robot, direction) {
  const newPos = calculateNewPosition(robot.position, direction);
  
  // Check boundaries
  if (isOutOfBounds(newPos, gameState.board)) {
    return destroyRobot(gameState, robot);
  }
  
  // Check for another robot
  const occupant = getRobotAt(gameState, newPos);
  if (occupant) {
    // Recursive push
    const pushed = await pushRobot(gameState, occupant, direction);
    if (!pushed) return false; // Can't push chain
  }
  
  // Execute push
  robot.position = newPos;
  return true;
}
```

### Conveyor Belt Chain Resolution
```javascript
// Complex conveyor belt movement
function resolveConveyorBelts(gameState) {
  // Build movement graph
  const movements = new Map(); // destination -> [robots]
  
  // Phase 1: Express belts (2 spaces)
  // Phase 2: All belts (1 space)
  // Handle rotation on curves
  // Resolve conflicts (no movement if multiple to same space)
  
  return validMovements;
}
```

## Common Problem Solutions

### 1. Register Locking with Damage
```javascript
function getLockedRegisters(damage) {
  if (damage <= 4) return [];
  
  const locked = [];
  if (damage >= 9) locked.push(0); // Register 1
  if (damage >= 8) locked.push(1); // Register 2
  if (damage >= 7) locked.push(2); // Register 3
  if (damage >= 6) locked.push(3); // Register 4
  if (damage >= 5) locked.push(4); // Register 5
  
  return locked;
}
```

### 2. Laser Path Calculation
```javascript
function calculateLaserPath(start, direction, board) {
  const path = [];
  let current = { ...start };
  
  while (true) {
    current = moveInDirection(current, direction);
    
    // Check boundaries
    if (isOutOfBounds(current, board)) break;
    
    // Check for walls
    if (hasWallBetween(previous, current, board)) break;
    
    path.push({ ...current });
    
    // Check for robot (blocks laser)
    if (getRobotAt(gameState, current)) break;
  }
  
  return path;
}
```

### 3. Timer Management
```javascript
class TurnTimer {
  constructor(duration, onExpire) {
    this.duration = duration;
    this.onExpire = onExpire;
    this.remaining = duration;
  }
  
  start() {
    this.interval = setInterval(() => {
      this.remaining -= 100;
      this.onUpdate?.(this.remaining);
      
      if (this.remaining <= 0) {
        this.expire();
      }
    }, 100);
  }
  
  expire() {
    clearInterval(this.interval);
    this.onExpire();
  }
}
```

## State Synchronization Patterns

### Optimistic Updates
```javascript
// Client-side
function selectCard(card) {
  // Optimistic UI update
  updateLocalState(card);
  
  // Send to server
  socket.emit('select-card', card, (error) => {
    if (error) {
      // Revert on failure
      revertLocalState();
    }
  });
}

// Server-side validation
socket.on('select-card', (card, callback) => {
  if (!validateCardSelection(gameState, playerId, card)) {
    return callback('Invalid selection');
  }
  
  updateGameState(gameState, playerId, card);
  broadcast('card-selected', { playerId, card });
  callback(null);
});
```

### State Reconciliation
```javascript
// Handle state conflicts
function reconcileState(serverState, localState) {
  // Server state is authoritative
  const reconciled = { ...serverState };
  
  // Preserve local UI state
  reconciled.ui = localState.ui;
  
  // Merge pending actions
  reconciled.pendingActions = validatePendingActions(
    localState.pendingActions,
    serverState
  );
  
  return reconciled;
}
```

## Performance Optimizations

### Animation Batching
```javascript
class AnimationQueue {
  constructor() {
    this.queue = [];
    this.running = false;
  }
  
  add(animation) {
    this.queue.push(animation);
    if (!this.running) this.process();
  }
  
  async process() {
    this.running = true;
    
    while (this.queue.length > 0) {
      const batch = this.getBatch();
      await Promise.all(batch.map(a => a.execute()));
    }
    
    this.running = false;
  }
  
  getBatch() {
    // Group simultaneous animations
    const batch = [];
    const timestamp = this.queue[0]?.timestamp;
    
    while (this.queue[0]?.timestamp === timestamp) {
      batch.push(this.queue.shift());
    }
    
    return batch;
  }
}
```

### Efficient Board Rendering
```javascript
// React component optimization
const BoardTile = memo(({ tile, position }) => {
  // Only re-render if tile data changes
  return (
    <div className={getTileClasses(tile)}>
      {tile.elements.map(element => (
        <BoardElement key={element.id} {...element} />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.tile.type === nextProps.tile.type &&
    prevProps.tile.direction === nextProps.tile.direction
  );
});
```

## Database Schema Patterns

### Game State Persistence
```prisma
model Game {
  id            String   @id @default(cuid())
  roomCode      String   @unique
  state         Json     // Full game state
  phase         GamePhase
  currentTurn   Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  players       Player[]
  actions       GameAction[]
}

model GameAction {
  id            String   @id @default(cuid())
  gameId        String
  playerId      String
  type          ActionType
  data          Json
  timestamp     DateTime @default(now())
  
  game          Game     @relation(fields: [gameId], references: [id])
  player        Player   @relation(fields: [playerId], references: [id])
  
  @@index([gameId, timestamp])
}
```

## Error Handling Patterns

### Graceful Degradation
```javascript
// Network failure handling
async function executeAction(action) {
  try {
    return await serverAction(action);
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      // Queue for retry
      actionQueue.add(action);
      
      // Show offline indicator
      showOfflineMode();
      
      // Continue with local simulation
      return simulateAction(action);
    }
    
    throw error;
  }
}
```

### Recovery Mechanisms
```javascript
// Reconnection logic
socket.on('disconnect', () => {
  startReconnectionTimer();
  preserveGameState();
});

socket.on('reconnect', () => {
  // Request full state sync
  socket.emit('request-sync', gameId, (gameState) => {
    reconcileWithLocalState(gameState);
    resumeGame();
  });
});
```

## Testing Utilities

### Game State Factories
```javascript
// Test data generation
function createTestGameState(options = {}) {
  return {
    players: createTestPlayers(options.playerCount || 2),
    board: createTestBoard(options.boardType || 'simple'),
    gamePhase: options.phase || 'PROGRAMMING',
    currentRegister: 0,
    ...options
  };
}

// Scenario testing
function createCollisionScenario() {
  const state = createTestGameState();
  state.players[0].position = { x: 5, y: 5 };
  state.players[1].position = { x: 6, y: 5 };
  state.players[0].selectedCards[0] = { type: 'MOVE_1', priority: 500 };
  state.players[1].selectedCards[0] = { type: 'MOVE_1', priority: 490 };
  return state;
}
```

## Debugging Helpers

### State Visualization
```javascript
function debugBoard(gameState) {
  const board = Array(12).fill(null).map(() => Array(12).fill('.'));
  
  // Add robots
  Object.values(gameState.players).forEach(player => {
    const symbol = player.name[0].toUpperCase();
    board[player.position.y][player.position.x] = symbol;
  });
  
  // Add elements
  gameState.board.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.type !== 'empty') {
        board[y][x] = TILE_SYMBOLS[tile.type];
      }
    });
  });
  
  console.table(board);
}
```

---

*This guide should be expanded with new patterns and solutions as they are developed.*