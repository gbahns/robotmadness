# RoboRally Board Encoding Guide

## Critical Rules for Accurate Board Encoding

### 1. COUNTING TILES
- Boards are 12x12 (144 tiles total)
- Use the tile separator lines to count positions accurately
- Horizontal separators look like thin gray lines between rows
- Vertical separators look like thin gray lines between columns
- Start counting from 0, not 1
- Double-check positions by counting from both edges

### 2. IDENTIFYING TILE TYPES

#### Empty Tiles
- Plain gray/light colored surface
- No arrows or symbols
- May have walls on edges but the tile itself is empty
- **DEFAULT ASSUMPTION**: If unsure, it's probably empty

#### Conveyor Belts (Yellow/Orange)
- **Yellow/orange colored** tiles with arrows
- Look for clear directional arrows
- Types:
  - UP: Arrow pointing up (↑)
  - DOWN: Arrow pointing down (↓)
  - LEFT: Arrow pointing left (←)
  - RIGHT: Arrow pointing right (→)

#### Express Conveyor Belts (Blue/Darker)
- **Darker/blue colored** tiles with arrows
- Same arrow directions as normal conveyors
- Visually distinct from yellow/orange conveyors

#### Gears
- Circular gear symbol
- Two types:
  - Clockwise (CW): Look for rotation indicator
  - Counter-clockwise (CCW): Look for rotation indicator

#### Pits
- Dark tiles with hazard stripes (yellow/black diagonal stripes)
- Very visually distinct danger zones

#### Repair Sites (Wrenches)
- Wrench or hammer symbol
- Usually on gray background

### 3. WALLS
- **Walls are ON tiles, not between them**
- A wall on (x,y) with side UP means there's a wall on the top edge of that tile
- Walls appear as thick black lines on tile edges
- Common wall positions:
  - Board edges (to prevent falling off)
  - Creating corridors or barriers
  - Around laser sources

### 4. LASERS
- Look for red lines across the board
- Laser source is usually at a wall edge
- Direction is where the laser shoots FROM the source
- Example: Laser at (11,2) shooting LEFT means it originates from the right wall

### 5. SYSTEMATIC APPROACH

#### Step 1: Process Row by Row
Go through each row from 0 to 11, and for each row, examine tiles 0 to 11:
1. First identify all non-empty tiles
2. For each non-empty tile, determine its exact type
3. Note any walls on that tile's edges

#### Step 2: Pattern Recognition
Common patterns to look for:
- Conveyor "highways" - straight lines of conveyors
- Express conveyor lanes (usually blue/darker)
- Symmetric layouts
- Gear pairs (often placed symmetrically)

#### Step 3: Verification
- Count total tiles of each type
- Verify symmetric elements match
- Check that conveyor paths make logical sense
- Ensure walls create proper barriers

### 6. COMMON MISTAKES TO AVOID

1. **Assuming tiles have elements when they're empty**
   - Most tiles are actually empty
   - Only add a tile if you clearly see a conveyor, gear, pit, etc.

2. **Misidentifying conveyor directions**
   - Look carefully at arrow direction
   - UP vs DOWN can be confused - double check

3. **Confusing express vs normal conveyors**
   - Express are blue/darker
   - Normal are yellow/orange

4. **Placing walls between tiles instead of on tiles**
   - Walls are properties of tiles, not separate entities
   - A wall on the UP side of (4,4) blocks movement from (4,4) to (4,3)

5. **Missing pattern boundaries**
   - When a pattern ends (like a line of conveyors), don't extend it
   - Each tile must be verified independently

### 7. EXAMPLE ENCODING PROCESS

For the Exchange board row 0:
1. Start at (0,0): See wrench symbol → REPAIR
2. Move to (1,0): Gray tile → EMPTY (skip)
3. Move to (2,0): Gray tile → EMPTY (skip)
4. Move to (3,0): Yellow tile with up arrow → UP CONVEYOR
5. Move to (4,0): Gray tile → EMPTY (skip)
6. Move to (5,0): Yellow tile with down arrow → DOWN CONVEYOR
7. Continue across...

### 8. VALIDATION CHECKLIST

Before finalizing:
- [ ] Have I looked at all 144 tile positions?
- [ ] Did I only add tiles where I clearly see non-empty elements?
- [ ] Are all conveyor directions correct?
- [ ] Are express conveyors properly distinguished from normal ones?
- [ ] Are walls placed on the correct tiles and edges?
- [ ] Do laser sources and directions make sense?
- [ ] Have I avoided assuming patterns extend beyond what's visible?

### 9. TESTING METHOD

Create a simple visualization to verify:
- Empty tiles: Leave blank or mark with '.'
- Conveyors: Mark with arrows (↑↓←→)
- Express: Mark with double arrows or different color
- Gears: Mark with 'G'
- Pits: Mark with 'X'
- Repairs: Mark with 'R'

This helps quickly spot errors in the encoding.