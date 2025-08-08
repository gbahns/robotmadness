// boardConfig.js
// Sample board configuration with various elements

// Simple test board for development
const TEST_BOARD = {
  width: 12,
  height: 12,
  checkpoints: [
    { position: { x: 6, y: 3 }, number: 1 },
    { position: { x: 9, y: 9 }, number: 2 },
    { position: { x: 3, y: 6 }, number: 3 },
  ],
  startingPositions: [
    { position: { x: 1, y: 1 }, direction: 0 },
    { position: { x: 10, y: 1 }, direction: 0 },
    { position: { x: 10, y: 10 }, direction: 0 },
    { position: { x: 1, y: 10 }, direction: 0 },
    { position: { x: 5, y: 5 }, direction: 0 },
    { position: { x: 6, y: 6 }, direction: 0 },
    { position: { x: 3, y: 3 }, direction: 0 },
    { position: { x: 8, y: 8 }, direction: 0 },
  ],
};

const SAMPLE_BOARD = {
  name: "Factory Floor",
  width: 12,
  height: 12,

  // Starting positions for robots
  startingPositions: [
    { position: { x: 1, y: 11 }, direction: 0 },  // North
    { position: { x: 3, y: 11 }, direction: 0 },
    { position: { x: 5, y: 11 }, direction: 0 },
    { position: { x: 7, y: 11 }, direction: 0 },
    { position: { x: 9, y: 11 }, direction: 0 },
    { position: { x: 11, y: 11 }, direction: 0 }
  ],

  // Checkpoints (flags)
  checkpoints: [
    { number: 1, position: { x: 6, y: 9 } },
    { number: 2, position: { x: 9, y: 5 } },
    { number: 3, position: { x: 3, y: 2 } }
  ],

  // Board tiles with special elements
  tiles: [
    // Conveyor belts
    { position: { x: 1, y: 9 }, type: 'conveyor', direction: 2 }, // South
    { position: { x: 3, y: 9 }, type: 'conveyor', direction: 2 }, // South
    { position: { x: 2, y: 8 }, type: 'conveyor', direction: 3 }, // East
    { position: { x: 2, y: 6 }, type: 'conveyor', direction: 1 }, // East
    { position: { x: 3, y: 7 }, type: 'conveyor', direction: 0 }, // North
    { position: { x: 4, y: 6 }, type: 'conveyor', direction: 1 },
    { position: { x: 5, y: 7 }, type: 'conveyor', direction: 0 },
    { position: { x: 6, y: 8 }, type: 'conveyor', direction: 1 },
    { position: { x: 7, y: 9 }, type: 'conveyor', direction: 2 }, // South
    { position: { x: 8, y: 8 }, type: 'conveyor', direction: 3 }, // West
    { position: { x: 9, y: 7 }, type: 'conveyor', direction: 2 },
    { position: { x: 10, y: 6 }, type: 'conveyor', direction: 3 },
    { position: { x: 11, y: 5 }, type: 'conveyor', direction: 0 }, // North
    { position: { x: 0, y: 4 }, type: 'conveyor', direction: 1 }, // East
    { position: { x: 1, y: 3 }, type: 'conveyor', direction: 2 }, // South
    { position: { x: 2, y: 2 }, type: 'conveyor', direction: 3 }, // West
    { position: { x: 4, y: 8 }, type: 'conveyor', direction: 1 },
    { position: { x: 5, y: 9 }, type: 'conveyor', direction: 2, rotate: 'clockwise' }, // South with rotation

    // Express conveyor belts
    { position: { x: 6, y: 6 }, type: 'conveyor_express', direction: 0 }, // North
    { position: { x: 6, y: 5 }, type: 'conveyor_express', direction: 1 }, // East
    { position: { x: 6, y: 4 }, type: 'conveyor_express', direction: 2 }, // South
    { position: { x: 6, y: 3 }, type: 'conveyor_express', direction: 3 }, // West

    // Gears
    // { position: { x: 3, y: 6 }, type: 'gear', rotate: 'clockwise' },
    // { position: { x: 9, y: 6 }, type: 'gear', rotate: 'counterclockwise' },

    // Pushers (active on registers 1, 3, 5)
    { position: { x: 0, y: 5 }, type: 'pusher', direction: 1, registers: [1, 3, 5] },
    { position: { x: 11, y: 7 }, type: 'pusher', direction: 3, registers: [2, 4] },

    // Repair sites
    { position: { x: 2, y: 2 }, type: 'repair' },
    { position: { x: 10, y: 10 }, type: 'repair' },

    // Walls (walls array indicates which directions are blocked)
    { position: { x: 4, y: 4 }, walls: [0, 2] }, // North and South walls
    { position: { x: 5, y: 4 }, walls: [1, 3] }, // East and West walls
    { position: { x: 7, y: 7 }, walls: [0] },    // North wall only

    // Pits (instant death)
    { position: { x: 6, y: 8 }, type: 'pit' },
    { position: { x: 7, y: 8 }, type: 'pit' }
  ],

  // Board lasers
  lasers: [
    { position: { x: 0, y: 3 }, direction: 1, damage: 1 },   // East-facing laser
    { position: { x: 11, y: 7 }, direction: 3, damage: 1 },  // West-facing laser
    { position: { x: 5, y: 0 }, direction: 2, damage: 2 }    // South-facing double laser
  ]
};

// Board themes/layouts
const BOARD_THEMES = {
  simple: {
    name: "Training Ground",
    width: 10,
    height: 10,
    startingPositions: [
      { position: { x: 1, y: 9 }, direction: 0 },
      { position: { x: 3, y: 9 }, direction: 0 },
      { position: { x: 5, y: 9 }, direction: 0 },
      { position: { x: 7, y: 9 }, direction: 0 }
    ],
    checkpoints: [
      { number: 1, position: { x: 5, y: 5 } },
      { number: 2, position: { x: 8, y: 2 } }
    ],
    tiles: [
      // Simple conveyor loop
      { position: { x: 4, y: 5 }, type: 'conveyor', direction: 1 },
      { position: { x: 5, y: 5 }, type: 'conveyor', direction: 1 },
      { position: { x: 6, y: 5 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },
      { position: { x: 6, y: 6 }, type: 'conveyor', direction: 3 },
      { position: { x: 5, y: 6 }, type: 'conveyor', direction: 3 },
      { position: { x: 4, y: 6 }, type: 'conveyor', direction: 0, rotate: 'clockwise' }
    ],
    lasers: []
  },

  chaos: {
    name: "Chaos Factory",
    width: 12,
    height: 12,
    // ... more complex configuration
  }
};

const RISKY_EXCHANGE_BOARD = {
  name: "Risky Exchange",
  width: 12,
  height: 12,
  startingPositions: [
    // Starting positions numbered 1-8 on the board (visible in the image)
    { position: { x: 5, y: 11 }, direction: 0 },
    { position: { x: 3, y: 11 }, direction: 0 },
    { position: { x: 1, y: 11 }, direction: 0 },
    { position: { x: 7, y: 11 }, direction: 0 },
    { position: { x: 9, y: 11 }, direction: 0 },
    { position: { x: 11, y: 11 }, direction: 0 },
    { position: { x: 11, y: 9 }, direction: 3 },
    { position: { x: 11, y: 7 }, direction: 3 },
  ],
  checkpoints: [
    { number: 1, position: { x: 7, y: 1 } },
    { number: 2, position: { x: 9, y: 7 } },
    { number: 3, position: { x: 1, y: 4 } },
  ],
  tiles: [
    // Express conveyor belts (yellow/orange in the image)
    // Horizontal express conveyors across the middle
    { position: { x: 0, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 1, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 2, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 3, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 4, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 5, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 6, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 7, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 8, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 9, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 10, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 11, y: 5 }, type: 'conveyor_express', direction: 1 },

    { position: { x: 0, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 1, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 2, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 3, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 4, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 5, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 6, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 7, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 8, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 9, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 10, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 11, y: 6 }, type: 'conveyor_express', direction: 3 },

    // Vertical express conveyors down the middle
    { position: { x: 5, y: 0 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 1 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 2 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 3 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 4 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 7 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 8 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 9 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 10 }, type: 'conveyor_express', direction: 2 },
    { position: { x: 5, y: 11 }, type: 'conveyor_express', direction: 2 },

    { position: { x: 6, y: 0 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 1 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 2 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 3 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 4 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 7 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 8 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 9 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 10 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 11 }, type: 'conveyor_express', direction: 0 },

    // Regular conveyors (blue in the image)
    // Top left quadrant
    { position: { x: 1, y: 1 }, type: 'conveyor', direction: 1 },
    { position: { x: 2, y: 1 }, type: 'conveyor', direction: 1 },
    { position: { x: 3, y: 1 }, type: 'conveyor', direction: 1 },
    { position: { x: 4, y: 1 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },
    { position: { x: 4, y: 2 }, type: 'conveyor', direction: 2 },
    { position: { x: 4, y: 3 }, type: 'conveyor', direction: 2 },
    { position: { x: 4, y: 4 }, type: 'conveyor', direction: 3, rotate: 'clockwise' },
    { position: { x: 3, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 2, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 1, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 0, y: 4 }, type: 'conveyor', direction: 0, rotate: 'clockwise' },
    { position: { x: 0, y: 3 }, type: 'conveyor', direction: 0 },
    { position: { x: 0, y: 2 }, type: 'conveyor', direction: 0 },
    { position: { x: 0, y: 1 }, type: 'conveyor', direction: 1, rotate: 'clockwise' },

    // Top right quadrant
    { position: { x: 7, y: 1 }, type: 'conveyor', direction: 3 },
    { position: { x: 8, y: 1 }, type: 'conveyor', direction: 3 },
    { position: { x: 9, y: 1 }, type: 'conveyor', direction: 3 },
    { position: { x: 10, y: 1 }, type: 'conveyor', direction: 3 },
    { position: { x: 11, y: 1 }, type: 'conveyor', direction: 2, rotate: 'counterclockwise' },
    { position: { x: 11, y: 2 }, type: 'conveyor', direction: 2 },
    { position: { x: 11, y: 3 }, type: 'conveyor', direction: 2 },
    { position: { x: 11, y: 4 }, type: 'conveyor', direction: 3, rotate: 'counterclockwise' },
    { position: { x: 10, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 9, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 8, y: 4 }, type: 'conveyor', direction: 3 },
    { position: { x: 7, y: 4 }, type: 'conveyor', direction: 0, rotate: 'counterclockwise' },
    { position: { x: 7, y: 3 }, type: 'conveyor', direction: 0 },
    { position: { x: 7, y: 2 }, type: 'conveyor', direction: 0 },

    // Bottom left quadrant
    { position: { x: 0, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 1, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 2, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 3, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 4, y: 7 }, type: 'conveyor', direction: 2, rotate: 'counterclockwise' },
    { position: { x: 4, y: 8 }, type: 'conveyor', direction: 2 },
    { position: { x: 4, y: 9 }, type: 'conveyor', direction: 2 },
    { position: { x: 4, y: 10 }, type: 'conveyor', direction: 3, rotate: 'counterclockwise' },
    { position: { x: 3, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 2, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 1, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 0, y: 10 }, type: 'conveyor', direction: 0, rotate: 'counterclockwise' },
    { position: { x: 0, y: 9 }, type: 'conveyor', direction: 0 },
    { position: { x: 0, y: 8 }, type: 'conveyor', direction: 0 },

    // Bottom right quadrant
    { position: { x: 7, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 8, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 9, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 10, y: 7 }, type: 'conveyor', direction: 1 },
    { position: { x: 11, y: 7 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },
    { position: { x: 11, y: 8 }, type: 'conveyor', direction: 2 },
    { position: { x: 11, y: 9 }, type: 'conveyor', direction: 2 },
    { position: { x: 11, y: 10 }, type: 'conveyor', direction: 3, rotate: 'clockwise' },
    { position: { x: 10, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 9, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 8, y: 10 }, type: 'conveyor', direction: 3 },
    { position: { x: 7, y: 10 }, type: 'conveyor', direction: 0, rotate: 'clockwise' },
    { position: { x: 7, y: 9 }, type: 'conveyor', direction: 0 },
    { position: { x: 7, y: 8 }, type: 'conveyor', direction: 0 },

    // Gears (visible in the corners)
    { position: { x: 2, y: 0 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 9, y: 0 }, type: 'gear', rotate: 'counterclockwise' },
    { position: { x: 0, y: 0 }, type: 'gear', rotate: 'counterclockwise' },
    { position: { x: 11, y: 0 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 2, y: 11 }, type: 'gear', rotate: 'counterclockwise' },
    { position: { x: 9, y: 11 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 0, y: 11 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 11, y: 11 }, type: 'gear', rotate: 'counterclockwise' },

    // Repair sites (wrench symbols visible in the image)
    { position: { x: 3, y: 2 }, type: 'repair' },
    { position: { x: 8, y: 2 }, type: 'repair' },
    { position: { x: 3, y: 9 }, type: 'repair' },
    { position: { x: 8, y: 9 }, type: 'repair' },
  ],
  lasers: [],  // No lasers visible on this board
  walls: []    // Walls would need to be added based on the visual barriers in the image
};

const RISKY_EXCHANGE_BOARD_CLAUDE_1 = {
  name: "Risky Exchange",
  width: 12,
  height: 12,
  startingPositions: [
    // Left side starting positions
    { position: { x: 0, y: 4 }, direction: 1 },
    { position: { x: 0, y: 5 }, direction: 1 },
    { position: { x: 0, y: 6 }, direction: 1 },
    { position: { x: 0, y: 7 }, direction: 1 },
    // Right side starting positions
    { position: { x: 11, y: 4 }, direction: 3 },
    { position: { x: 11, y: 5 }, direction: 3 },
    { position: { x: 11, y: 6 }, direction: 3 },
    { position: { x: 11, y: 7 }, direction: 3 },
  ],
  checkpoints: [
    { number: 1, position: { x: 7, y: 1 } },
    { number: 2, position: { x: 9, y: 7 } },
    { number: 3, position: { x: 1, y: 4 } },
  ],
  tiles: [
    // Express conveyor belts going right on row 5
    { position: { x: 1, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 2, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 3, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 4, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 5, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 6, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 7, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 8, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 9, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 10, y: 5 }, type: 'conveyor_express', direction: 1 },

    // Express conveyor belts going left on row 6
    { position: { x: 1, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 2, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 3, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 4, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 5, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 6, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 7, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 8, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 9, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 10, y: 6 }, type: 'conveyor_express', direction: 3 },

    // Regular conveyors creating loops around the board
    { position: { x: 3, y: 2 }, type: 'conveyor', direction: 1 },
    { position: { x: 4, y: 2 }, type: 'conveyor', direction: 1 },
    { position: { x: 5, y: 2 }, type: 'conveyor', direction: 1 },
    { position: { x: 6, y: 2 }, type: 'conveyor', direction: 1 },
    { position: { x: 7, y: 2 }, type: 'conveyor', direction: 1 },
    { position: { x: 8, y: 2 }, type: 'conveyor', direction: 1, rotate: 'clockwise' },
    { position: { x: 8, y: 3 }, type: 'conveyor', direction: 2 },
    { position: { x: 8, y: 4 }, type: 'conveyor', direction: 2 },

    { position: { x: 3, y: 9 }, type: 'conveyor', direction: 3 },
    { position: { x: 4, y: 9 }, type: 'conveyor', direction: 3 },
    { position: { x: 5, y: 9 }, type: 'conveyor', direction: 3 },
    { position: { x: 6, y: 9 }, type: 'conveyor', direction: 3 },
    { position: { x: 7, y: 9 }, type: 'conveyor', direction: 3 },
    { position: { x: 8, y: 9 }, type: 'conveyor', direction: 3, rotate: 'clockwise' },
    { position: { x: 8, y: 8 }, type: 'conveyor', direction: 0 },
    { position: { x: 8, y: 7 }, type: 'conveyor', direction: 0 },

    { position: { x: 3, y: 3 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },
    { position: { x: 3, y: 4 }, type: 'conveyor', direction: 2 },
    { position: { x: 3, y: 7 }, type: 'conveyor', direction: 0 },
    { position: { x: 3, y: 8 }, type: 'conveyor', direction: 0, rotate: 'clockwise' },

    // Gears
    { position: { x: 2, y: 2 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 9, y: 2 }, type: 'gear', rotate: 'counterclockwise' },
    { position: { x: 2, y: 9 }, type: 'gear', rotate: 'counterclockwise' },
    { position: { x: 9, y: 9 }, type: 'gear', rotate: 'clockwise' },

    // Pits (dangerous areas)
    { position: { x: 0, y: 0 }, type: 'pit' },
    { position: { x: 0, y: 1 }, type: 'pit' },
    { position: { x: 1, y: 0 }, type: 'pit' },
    { position: { x: 0, y: 10 }, type: 'pit' },
    { position: { x: 0, y: 11 }, type: 'pit' },
    { position: { x: 1, y: 11 }, type: 'pit' },
    { position: { x: 10, y: 0 }, type: 'pit' },
    { position: { x: 11, y: 0 }, type: 'pit' },
    { position: { x: 11, y: 1 }, type: 'pit' },
    { position: { x: 10, y: 11 }, type: 'pit' },
    { position: { x: 11, y: 10 }, type: 'pit' },
    { position: { x: 11, y: 11 }, type: 'pit' },

    // Repair sites
    { position: { x: 5, y: 0 }, type: 'repair' },
    { position: { x: 6, y: 0 }, type: 'repair' },
    { position: { x: 5, y: 11 }, type: 'repair' },
    { position: { x: 6, y: 11 }, type: 'repair' },
  ],
  lasers: [
    // Wall lasers creating danger zones
    { position: { x: 4, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 7, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 4, y: 11 }, direction: 0, damage: 1 },
    { position: { x: 7, y: 11 }, direction: 0, damage: 1 },
    { position: { x: 0, y: 3 }, direction: 1, damage: 1 },
    { position: { x: 0, y: 8 }, direction: 1, damage: 1 },
    { position: { x: 11, y: 3 }, direction: 3, damage: 1 },
    { position: { x: 11, y: 8 }, direction: 3, damage: 1 },

    // Cross-fire zone in the middle
    { position: { x: 5, y: 4 }, direction: 2, damage: 2 },
    { position: { x: 6, y: 7 }, direction: 0, damage: 2 },
  ],
  walls: [
    // Walls between tiles (format: {position: {x, y}, side: 0-3})
    // North walls (side 0)
    { position: { x: 2, y: 3 }, side: 0 },
    { position: { x: 9, y: 3 }, side: 0 },
    { position: { x: 2, y: 8 }, side: 0 },
    { position: { x: 9, y: 8 }, side: 0 },

    // East walls (side 1)
    { position: { x: 4, y: 4 }, side: 1 },
    { position: { x: 4, y: 7 }, side: 1 },
    { position: { x: 6, y: 4 }, side: 1 },
    { position: { x: 6, y: 7 }, side: 1 },

    // South walls (side 2)
    { position: { x: 2, y: 3 }, side: 2 },
    { position: { x: 9, y: 3 }, side: 2 },
    { position: { x: 2, y: 8 }, side: 2 },
    { position: { x: 9, y: 8 }, side: 2 },

    // West walls (side 3)
    { position: { x: 5, y: 4 }, side: 3 },
    { position: { x: 5, y: 7 }, side: 3 },
    { position: { x: 7, y: 4 }, side: 3 },
    { position: { x: 7, y: 7 }, side: 3 },
  ]
};

const RISKY_EXCHANGE_BOARD_GEMINI = {
  name: "Risky Exchange",
  width: 12,
  height: 12,
  startingPositions: [
    { position: { x: 0, y: 4 }, direction: 1 },
    { position: { x: 0, y: 5 }, direction: 1 },
    { position: { x: 0, y: 6 }, direction: 1 },
    { position: { x: 0, y: 7 }, direction: 1 },
    { position: { x: 11, y: 4 }, direction: 3 },
    { position: { x: 11, y: 5 }, direction: 3 },
    { position: { x: 11, y: 6 }, direction: 3 },
    { position: { x: 11, y: 7 }, direction: 3 },
  ],
  checkpoints: [
    { number: 1, position: { x: 1, y: 1 } },
    { number: 2, position: { x: 10, y: 1 } },
    { number: 3, position: { x: 10, y: 10 } },
    { number: 4, position: { x: 1, y: 10 } },
  ],
  tiles: [
    // Express conveyors
    { position: { x: 1, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 2, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 3, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 4, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 5, y: 5 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 6, y: 5 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 7, y: 5 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 8, y: 5 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 9, y: 5 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 10, y: 5 }, type: 'conveyor_express', direction: 3 },

    { position: { x: 1, y: 6 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 2, y: 6 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 3, y: 6 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 4, y: 6 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 5, y: 6 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 6, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 7, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 8, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 9, y: 6 }, type: 'conveyor_express', direction: 3 },
    { position: { x: 10, y: 6 }, type: 'conveyor_express', direction: 3 },

    // Gears
    { position: { x: 4, y: 2 }, type: 'gear', rotate: 'counter-clockwise' },
    { position: { x: 7, y: 2 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 4, y: 9 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 7, y: 9 }, type: 'gear', rotate: 'counter-clockwise' },
  ],
  lasers: [
    // Outer wall lasers
    { position: { x: 2, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 4, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 7, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 9, y: 0 }, direction: 2, damage: 1 },

    { position: { x: 2, y: 11 }, direction: 0, damage: 1 },
    { position: { x: 4, y: 11 }, direction: 0, damage: 1 },
    { position: { x: 7, y: 11 }, direction: 0, damage: 1 },
    { position: { x: 9, y: 11 }, direction: 0, damage: 1 },

    // Inner wall lasers (double)
    { position: { x: 5, y: 3 }, direction: 2, damage: 2 },
    { position: { x: 6, y: 3 }, direction: 2, damage: 2 },
    { position: { x: 5, y: 8 }, direction: 0, damage: 2 },
    { position: { x: 6, y: 8 }, direction: 0, damage: 2 },
  ],
};

// Board configuration with multiple lasers for testing
const LASER_TEST_BOARD = {
  name: "Laser Test Arena",
  width: 12,
  height: 10,

  // Starting positions
  startingPositions: [
    { position: { x: 1, y: 8 }, direction: 0 }, // North
    { position: { x: 3, y: 8 }, direction: 0 },
    { position: { x: 5, y: 8 }, direction: 0 },
    { position: { x: 7, y: 8 }, direction: 0 },
    { position: { x: 9, y: 8 }, direction: 0 },
    { position: { x: 10, y: 8 }, direction: 0 }
  ],

  // Checkpoints
  checkpoints: [
    { number: 1, position: { x: 5, y: 5 } },
    { number: 2, position: { x: 8, y: 2 } },
    { number: 3, position: { x: 2, y: 1 } }
  ],

  // Board elements
  tiles: [
    // Conveyor belt path through lasers
    { position: { x: 3, y: 5 }, type: 'conveyor', direction: 1 },
    { position: { x: 4, y: 5 }, type: 'conveyor', direction: 1 },
    { position: { x: 5, y: 5 }, type: 'conveyor', direction: 1 },
    { position: { x: 6, y: 5 }, type: 'conveyor', direction: 1 },
    { position: { x: 7, y: 5 }, type: 'conveyor', direction: 1 },
    { position: { x: 8, y: 5 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },

    // Express conveyor dangerous path
    { position: { x: 1, y: 3 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 2, y: 3 }, type: 'conveyor_express', direction: 1 },
    { position: { x: 3, y: 3 }, type: 'conveyor_express', direction: 1 },

    // Gears
    { position: { x: 6, y: 6 }, type: 'gear', rotate: 'clockwise' },
    { position: { x: 4, y: 2 }, type: 'gear', rotate: 'counterclockwise' },

    // Pits
    { position: { x: 10, y: 5 }, type: 'pit' },
    { position: { x: 11, y: 5 }, type: 'pit' },

    // Repair site
    { position: { x: 0, y: 0 }, type: 'repair' }
  ],

  // Laser configuration - demonstrating all directions and damage levels
  lasers: [
    // North-facing lasers (shooting up)
    { position: { x: 2, y: 9 }, direction: 0, damage: 1 },
    { position: { x: 6, y: 7 }, direction: 0, damage: 2 }, // Double laser

    // East-facing lasers (shooting right)
    { position: { x: 0, y: 3 }, direction: 1, damage: 1 },
    { position: { x: 0, y: 5 }, direction: 1, damage: 1 },
    { position: { x: 0, y: 6 }, direction: 1, damage: 2 }, // Double laser

    // South-facing lasers (shooting down)
    { position: { x: 5, y: 0 }, direction: 2, damage: 1 },
    { position: { x: 8, y: 0 }, direction: 2, damage: 2 }, // Double laser
    { position: { x: 10, y: 1 }, direction: 2, damage: 1 },

    // West-facing lasers (shooting left)
    { position: { x: 11, y: 2 }, direction: 3, damage: 1 },
    { position: { x: 11, y: 4 }, direction: 3, damage: 2 }, // Double laser
    { position: { x: 11, y: 7 }, direction: 3, damage: 1 },

    // Cross-fire zone in the middle
    { position: { x: 3, y: 4 }, direction: 1, damage: 1 },
    { position: { x: 7, y: 4 }, direction: 3, damage: 1 }
  ]
};

// Board themes including the laser test
const BOARD_THEMES_WITH_LASERS = {
  simple: {
    name: "Training Ground",
    width: 10,
    height: 10,
    startingPositions: [
      { position: { x: 1, y: 9 }, direction: 0 },
      { position: { x: 3, y: 9 }, direction: 0 },
      { position: { x: 5, y: 9 }, direction: 0 },
      { position: { x: 7, y: 9 }, direction: 0 }
    ],
    checkpoints: [
      { number: 1, position: { x: 5, y: 5 } },
      { number: 2, position: { x: 8, y: 2 } }
    ],
    tiles: [
      // Simple conveyor loop
      { position: { x: 4, y: 5 }, type: 'conveyor', direction: 1 },
      { position: { x: 5, y: 5 }, type: 'conveyor', direction: 1 },
      { position: { x: 6, y: 5 }, type: 'conveyor', direction: 2, rotate: 'clockwise' },
      { position: { x: 6, y: 6 }, type: 'conveyor', direction: 3 },
      { position: { x: 5, y: 6 }, type: 'conveyor', direction: 3 },
      { position: { x: 4, y: 6 }, type: 'conveyor', direction: 0, rotate: 'clockwise' }
    ],
    lasers: [
      // Simple laser setup
      { position: { x: 2, y: 0 }, direction: 2, damage: 1 },
      { position: { x: 7, y: 9 }, direction: 0, damage: 1 }
    ]
  },

  laserTest: LASER_TEST_BOARD,

  flagFry: {
    name: "Flag Fry",
    width: 10,
    height: 10,
    startingPositions: [
      { position: { x: 2, y: 9 }, direction: 0 },
      { position: { x: 4, y: 9 }, direction: 0 },
      { position: { x: 6, y: 9 }, direction: 0 },
      { position: { x: 8, y: 9 }, direction: 0 }
    ],
    checkpoints: [
      // Checkpoints inside laser crossfire!
      { number: 1, position: { x: 5, y: 5 } },
      { number: 2, position: { x: 2, y: 2 } },
      { number: 3, position: { x: 7, y: 2 } }
    ],
    tiles: [],
    lasers: [
      // Crossing laser beams over checkpoint 1
      { position: { x: 0, y: 5 }, direction: 1, damage: 1 },
      { position: { x: 9, y: 5 }, direction: 3, damage: 1 },
      { position: { x: 5, y: 0 }, direction: 2, damage: 1 },
      { position: { x: 5, y: 9 }, direction: 0, damage: 1 },

      // Double lasers guarding checkpoint 2
      { position: { x: 2, y: 0 }, direction: 2, damage: 2 },
      { position: { x: 0, y: 2 }, direction: 1, damage: 2 },

      // Regular lasers around checkpoint 3
      { position: { x: 7, y: 0 }, direction: 2, damage: 1 },
      { position: { x: 9, y: 2 }, direction: 3, damage: 1 }
    ]
  }
};

// Export for use in server
module.exports = {
  SAMPLE_BOARD,
  TEST_BOARD,
  BOARD_THEMES,
  RISKY_EXCHANGE_BOARD,
  RISKY_EXCHANGE_BOARD_CLAUDE_1,
  RISKY_EXCHANGE_BOARD_GEMINI,
  LASER_TEST_BOARD,
  BOARD_THEMES_WITH_LASERS,
};