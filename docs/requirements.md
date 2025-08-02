# Requirements

## Project Overview
This document defines the core game requirements for the RoboRally online game based on the official board game rules. It serves as the authoritative source for game mechanics and rules implementation.

## Game Overview
- **Players**: 2-8 players
- **Objective**: Be the first robot to reach all checkpoints in sequential order
- **Core Mechanic**: Program robots with movement cards, then watch chaos ensue as all robots execute simultaneously
- **Theme**: Robots racing through a dangerous factory filled with hazards

## Core Game Rules

### Game Setup
1. Each player selects a robot and receives:
   - 3 lives (or 4 for 5+ player games)
   - Starting position on the board
   - Program sheet for tracking damage
2. Place numbered checkpoints on the board according to the chosen course
3. Shuffle the program deck

### Turn Structure

#### 1. Programming Phase (30 seconds)
- Each player receives cards: 9 minus current damage
- Players select 5 cards to fill their registers (1-5)
- Registers lock based on damage:
  - 5 damage: Register 5 locked
  - 6 damage: Registers 4-5 locked
  - 7 damage: Registers 3-5 locked
  - 8 damage: Registers 2-5 locked
  - 9 damage: All registers locked
- Players may announce power down for NEXT turn

#### 2. Execution Phase
For each register (1-5):
1. All players reveal their programmed card simultaneously
2. Execute cards in priority order (highest first)
3. Activate board elements in sequence
4. Fire lasers (robots and board)
5. Touch checkpoints/flags

#### 3. Cleanup Phase
- Repair robots on repair sites (remove all damage)
- Handle power downs (remove all damage, skip next turn)
- Deal new cards for next turn

### Program Cards (84 total)

| Card Type | Quantity | Priority Range | Effect |
|-----------|----------|----------------|---------|
| U-Turn | 6 | 10-60 | Rotate 180° |
| Rotate Left | 18 | 70-410 | Rotate 90° counter-clockwise |
| Rotate Right | 18 | 80-420 | Rotate 90° clockwise |
| Back Up | 6 | 430-480 | Move 1 space backward |
| Move 1 | 18 | 490-650 | Move 1 space forward |
| Move 2 | 12 | 670-780 | Move 2 spaces forward |
| Move 3 | 6 | 790-840 | Move 3 spaces forward |

### Robot Interactions

#### Movement and Pushing
- Robots cannot share spaces
- Moving into another robot pushes it
- Pushed robots can push other robots (chain reaction)
- Robots cannot be pushed through walls
- Robots pushed off the board are destroyed

#### Priority Resolution
- Higher priority numbers move first
- When robots would move to the same space simultaneously, neither moves
- Priority only matters for determining order, not for resolving conflicts

### Board Elements (activate in order)

#### 1. Express Conveyor Belts
- Move robots 1 space in the belt's direction
- Activate before normal conveyor belts

#### 2. Conveyor Belts (Express + Normal)
- Move robots 1 space in the belt's direction
- Curved belts rotate robots 90° when moving onto them from specific directions
- Robots moved by belts don't push other robots (they both stay)

#### 3. Pushers
- Activate on specific registers (varies by pusher)
- Push robots 1 space in the pusher's direction
- Can push robots off the board or into hazards

#### 4. Gears
- Rotate robots 90° in the indicated direction
- Do not move robots

#### 5. Lasers
- Board lasers fire in straight lines until hitting a wall or robot
- Each robot fires a laser forward
- Each laser hit = 1 damage
- Lasers fire simultaneously (all damage applied at once)

### Damage and Destruction

#### Taking Damage
- 1 laser hit = 1 damage token
- Falling off the board = destruction
- Falling into pit = destruction
- Maximum 9 damage tokens

#### Effects of Damage
- Reduces cards dealt: 9 minus current damage
- Locks registers at 5+ damage
- At 10 damage: robot is destroyed

#### Destruction
- Lose 1 life
- Respawn at last touched checkpoint or starting position
- Start with 2 damage tokens
- At 0 lives: eliminated from game

### Victory Conditions
- First robot to touch all checkpoints in order wins
- Checkpoints must be touched in numerical sequence
- Touching checkpoints out of order has no effect
- Archive location updates when touching checkpoints

### Special Rules

#### Power Down
- Must announce during programming phase
- Takes effect NEXT turn
- Robot doesn't receive or program cards that turn
- Removes all damage at start of turn
- Robot can still be moved by board elements and other robots

#### Option Cards (Advanced)
- Not part of base game implementation
- Add special abilities and equipment
- Planned for future enhancement

### Timer Rules
- 30 seconds for programming phase
- If time expires:
  - Unplaced cards are randomly assigned to empty registers
  - Locked registers keep their cards
- No time limit on execution phase

## Course Configurations

### Beginner Course
- 2-3 checkpoints
- Minimal lasers
- Few pits
- Simple conveyor belt patterns

### Standard Course
- 3-4 checkpoints
- Moderate hazards
- Complex conveyor patterns
- Multiple crossing paths

### Expert Course
- 4-6 checkpoints
- Many hazards
- Express conveyor highways
- Tight spaces and bottlenecks

## Rule Clarifications

### Edge Cases
1. **Conveyor Conflicts**: If conveyors would move robots to the same space, neither moves
2. **Pushing Chains**: Resolve pushing from the pushing robot outward
3. **Laser Timing**: All lasers fire simultaneously after movement
4. **Checkpoint Saves**: Archive marker updates immediately upon touching
5. **Respawn Blocking**: If respawn location is occupied, respawn adjacent

### Tournament Rules
- Best of 3 races
- Rotate starting positions
- Standard timer enforcement
- No takebacks on card placement

---

*Based on RoboRally official rules (2005 Avalon Hill edition by Richard Garfield)*