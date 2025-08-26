# Laser Firing and Collision Detection Test Suite

## Basic Laser Tests

### 1. Simple Direct Hit
- **Setup**: Robot A at (2,2) facing EAST, Robot B at (4,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes 1 damage

### 2. Laser Miss
- **Setup**: Robot A at (2,2) facing NORTH, Robot B at (4,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes no damage

### 3. Edge of Board
- **Setup**: Robot A at (0,2) facing WEST
- **Action**: Robot A fires laser
- **Expected**: No crash, laser stops at edge

## Wall Blocking Tests

### 4. Wall Blocks Laser
- **Setup**: Robot A at (2,2) facing EAST, wall between (2,2) and (3,2), Robot B at (3,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes no damage (wall blocks)

### 5. Wall Behind Target
- **Setup**: Robot A at (2,2) facing EAST, Robot B at (3,2), wall between (3,2) and (4,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes 1 damage (wall doesn't matter after hit)

## Multiple Robot Tests

### 6. Robot Blocks Laser
- **Setup**: Robot A at (2,2) facing EAST, Robot B at (3,2), Robot C at (4,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes 1 damage, Robot C takes no damage

### 7. Line of Robots
- **Setup**: 4 robots in a line, first one fires
- **Action**: Robot A fires laser
- **Expected**: Only Robot B (next in line) takes damage

## High-Power Laser Tests

### 8. High-Power Through Wall
- **Setup**: Robot A with High-Power Laser at (2,2) facing EAST, wall between (2,2) and (3,2), Robot B at (4,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes 1 damage (laser goes through wall)

### 9. High-Power Against Wall
- **Setup**: Robot A with High-Power Laser at (2,2) facing EAST, wall between (2,2) and (3,2), Robot B at (3,2)
- **Action**: Robot A fires laser
- **Expected**: Robot B takes 1 damage (laser goes through wall immediately in front)

### 10. High-Power Through Robot
- **Setup**: Robot A with High-Power Laser at (2,2) facing EAST, Robot B at (3,2), Robot C at (4,2)
- **Action**: Robot A fires laser
- **Expected**: Both Robot B and Robot C take 1 damage

### 11. High-Power Through Two Walls
- **Setup**: Robot A with High-Power Laser, two walls in path, Robot B behind second wall
- **Action**: Robot A fires laser
- **Expected**: Laser blocked by second wall (can only go through one obstacle)

### 12. High-Power Through Robot Then Wall
- **Setup**: Robot A with High-Power Laser, Robot B, then wall, then Robot C
- **Action**: Robot A fires laser
- **Expected**: Robot B takes damage, laser blocked by wall (already went through one obstacle)

## Shield Option Card Tests

### 13. Shield Blocks Front Damage
- **Setup**: Robot A fires at Robot B who has Shield option card
- **Action**: Robot A fires from front of Robot B
- **Expected**: Robot B takes no damage (Shield blocks first front shot per register)

### 14. Shield Already Used
- **Setup**: Robot B has Shield, already blocked one shot this register
- **Action**: Robot A fires at Robot B from front again
- **Expected**: Robot B takes 1 damage (Shield only blocks first shot)

### 15. Shield Wrong Direction
- **Setup**: Robot B has Shield option card
- **Action**: Robot A fires at Robot B from behind
- **Expected**: Robot B takes 1 damage (Shield only protects front)

## Board Laser Tests

### 16. Board Laser Hit
- **Setup**: Board laser at (5,5) facing NORTH, Robot at (5,3)
- **Action**: Board lasers fire
- **Expected**: Robot takes damage from board laser

### 17. Board Laser Through Multiple
- **Setup**: Board laser, two robots in line
- **Action**: Board lasers fire
- **Expected**: First robot takes damage, second doesn't

### 18. Robot on Laser Mount
- **Setup**: Robot standing on board laser position
- **Action**: Board lasers fire
- **Expected**: Robot takes damage immediately

## Edge Cases

### 19. Diagonal Non-Alignment
- **Setup**: Robot A at (2,2), Robot B at (3,3) (diagonal)
- **Action**: Robot A fires EAST
- **Expected**: Robot B takes no damage (not in line)

### 20. Self Damage Prevention
- **Setup**: Robot at position facing direction
- **Action**: Robot fires laser
- **Expected**: Robot doesn't damage itself

### 21. Dead Robot No Fire
- **Setup**: Dead robot (0 lives) tries to fire
- **Action**: Laser phase
- **Expected**: No laser fired

### 22. Simultaneous Lasers
- **Setup**: Two robots facing each other
- **Action**: Both fire lasers
- **Expected**: Both take damage

## Collision Detection Tests

### 23. Push Into Wall
- **Setup**: Robot A moves into Robot B who is against a wall
- **Action**: Robot A executes Move 1
- **Expected**: Movement blocked, neither robot moves

### 24. Push Off Board
- **Setup**: Robot A at (0,2), Robot B at (1,2)
- **Action**: Robot B executes Move 1 WEST
- **Expected**: Robot A destroyed (pushed off board), Robot B moves to (0,2)

### 25. Chain Push Success
- **Setup**: Three robots in a line with space behind last one
- **Action**: First robot moves forward
- **Expected**: All three robots move one space

### 26. Chain Push Blocked
- **Setup**: Three robots in a line, wall behind last one
- **Action**: First robot moves forward
- **Expected**: No robots move (chain blocked)

### 27. Conveyor Push Collision
- **Setup**: Conveyor belt tries to move robot into occupied space
- **Action**: Conveyor phase
- **Expected**: Robot doesn't move if space occupied

## Performance Tests

### 28. Large Board Laser Trace
- **Setup**: Laser fired across maximum board size (16x12)
- **Action**: Fire laser
- **Expected**: Completes in <10ms

### 29. Multiple Simultaneous Lasers
- **Setup**: 8 robots all firing lasers
- **Action**: All fire at once
- **Expected**: All resolve correctly without race conditions

## Test Implementation Structure

```typescript
describe('Laser Firing System', () => {
  let gameEngine: GameEngine;
  let gameState: ServerGameState;

  beforeEach(() => {
    gameEngine = new GameEngine(mockIo);
    gameState = createTestGameState();
  });

  describe('Basic Laser Mechanics', () => {
    it('should damage robot in direct line', () => {
      // Test 1 implementation
    });

    it('should not damage robot not in line', () => {
      // Test 2 implementation
    });
  });

  describe('High-Power Laser', () => {
    it('should shoot through one wall', () => {
      // Test 8 implementation
    });

    it('should shoot through robot against wall', () => {
      // Test 9 implementation
    });
  });

  describe('Shield Option Card', () => {
    it('should block first front laser per register', () => {
      // Test 13 implementation
    });
  });

  describe('Collision Detection', () => {
    it('should prevent pushing through walls', () => {
      // Test 23 implementation
    });

    it('should handle chain pushing', () => {
      // Test 25 implementation
    });
  });
});
```

## Test Utilities Needed

```typescript
// Helper functions for test setup
function createTestGameState(options?: TestOptions): ServerGameState;
function placeRobot(gameState: ServerGameState, x: number, y: number, direction: Direction, name: string): Player;
function addWall(gameState: ServerGameState, from: Position, to: Position): void;
function giveOptionCard(player: Player, cardType: OptionCardType): void;
function fireRobotLaser(gameEngine: GameEngine, gameState: ServerGameState, shooter: Player): RobotHit[];
function getDamageDealt(gameState: ServerGameState, playerName: string): number;
```

## Coverage Goals
- Line coverage: >95%
- Branch coverage: >90%
- All edge cases documented
- Performance benchmarks established