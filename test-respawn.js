// test-respawn.js
// Run this with: node test-respawn.js

const GameEngine = require('./gameEngine');
const { TEST_BOARD } = require('./boardConfig');

// Create a mock io object
const mockIo = {
  to: () => ({
    emit: (event, data) => {
      console.log(`[EMIT] ${event}:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    }
  })
};

// Create game engine instance
const gameEngine = new GameEngine(mockIo);

// Create a test game state
const testGameState = {
  roomCode: 'TEST_RESPAWN',
  phase: 'executing',
  currentRegister: 0,
  board: TEST_BOARD,
  players: {
    'player1': {
      id: 'player1',
      name: 'TestBot',
      position: { x: 0, y: 0 },
      direction: 3, // Facing West
      lives: 3,
      damage: 0,
      checkpointsVisited: 0,
      selectedCards: [
        { id: 1, type: 'MOVE_1', priority: 500 },
        null, null, null, null
      ],
      isDead: false,
      respawnPosition: { position: { x: 0, y: 0 }, direction: 3 }
    }
  }
};

// Test function
async function runTest() {
  console.log('=== RESPAWN TEST ===\n');

  console.log(`Initial position: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y})`);

  // Execute the first register, which should make the robot fall off
  await gameEngine.executeRegister(testGameState, 0);

  console.log(`Position after register 1: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y})`);
  if (testGameState.players.player1.isDead) {
    console.log('TestBot is correctly marked as dead.');
  } else {
    console.error('TEST FAILED: TestBot should be marked as dead.');
  }

  // Now, simulate the end of the turn by calling respawnDeadRobots
  console.log('\n--- END OF TURN ---');
  gameEngine.respawnDeadRobots(testGameState);

  console.log(`Position after respawn: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y})`);
  if (!testGameState.players.player1.isDead && testGameState.players.player1.position.x === 0 && testGameState.players.player1.position.y === 0) {
    console.log('TestBot has correctly respawned at its starting position.');
  } else {
    console.error('TEST FAILED: TestBot did not respawn correctly.');
  }

  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
runTest().catch(console.error);