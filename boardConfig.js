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
    { position: { x: 6, y: 5 }, type: 'conveyor_express', direction: 0 },
    { position: { x: 6, y: 4 }, type: 'conveyor_express', direction: 0 },

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
    //{ position: { x: 11, y: 9 }, direction: 3, damage: 1 },  // West-facing laser
    // { position: { x: 5, y: 0 }, direction: 2, damage: 2 }    // South-facing double laser
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

// Export for use in server
module.exports = {
  SAMPLE_BOARD,
  TEST_BOARD,
  BOARD_THEMES
};