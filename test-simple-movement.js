// test-simple-movement.js
// A simpler test to verify basic movement works
// Run with: node test-simple-movement.js

const GameEngine = require('./gameEngine');

// Mock IO
const mockIo = {
  to: () => ({
    emit: () => {}
  })
};

const gameEngine = new GameEngine(mockIo);

// Simple test cases
async function testBasicMovement() {
  console.log('=== TEST 1: Basic Movement ===');
  
  const gameState = {
    roomCode: 'TEST',
    board: {
      width: 12,
      height: 12,
      checkpoints: [],
      startingPositions: []
    },
    players: {
      'p1': {
        id: 'p1',
        name: 'TestBot',
        position: { x: 5, y: 5 },
        direction: 0, // North
        lives: 3,
        damage: 0
      }
    }
  };
  
  // Test MOVE_1 North
  console.log('Before:', gameState.players.p1.position);
  await gameEngine.executeCard(gameState, gameState.players.p1, { type: 'MOVE_1' });
  console.log('After MOVE_1 North:', gameState.players.p1.position);
  console.assert(gameState.players.p1.position.x === 5 && gameState.players.p1.position.y === 4, 'Should move North');
  
  // Test ROTATE_RIGHT
  await gameEngine.executeCard(gameState, gameState.players.p1, { type: 'ROTATE_RIGHT' });
  console.log('After ROTATE_RIGHT:', 'facing', gameState.players.p1.direction);
  console.assert(gameState.players.p1.direction === 1, 'Should face East');
  
  // Test MOVE_2 East
  await gameEngine.executeCard(gameState, gameState.players.p1, { type: 'MOVE_2' });
  console.log('After MOVE_2 East:', gameState.players.p1.position);
  console.assert(gameState.players.p1.position.x === 7 && gameState.players.p1.position.y === 4, 'Should move 2 East');
  
  console.log('✅ Basic movement test passed!\n');
}

async function testPushing() {
  console.log('=== TEST 2: Robot Pushing ===');
  
  const gameState = {
    roomCode: 'TEST',
    board: {
      width: 12,
      height: 12,
      checkpoints: [],
      startingPositions: []
    },
    players: {
      'p1': {
        id: 'p1',
        name: 'Pusher',
        position: { x: 5, y: 5 },
        direction: 1, // East
        lives: 3
      },
      'p2': {
        id: 'p2',
        name: 'Pushed',
        position: { x: 6, y: 5 },
        direction: 0, // North
        lives: 3
      }
    }
  };
  
  console.log('Before push:');
  console.log('  Pusher:', gameState.players.p1.position);
  console.log('  Pushed:', gameState.players.p2.position);
  
  // P1 moves East, should push P2
  await gameEngine.executeCard(gameState, gameState.players.p1, { type: 'MOVE_1' });
  
  console.log('After push:');
  console.log('  Pusher:', gameState.players.p1.position);
  console.log('  Pushed:', gameState.players.p2.position);
  
  console.assert(gameState.players.p1.position.x === 6, 'Pusher should move to x=6');
  console.assert(gameState.players.p2.position.x === 7, 'Pushed should move to x=7');
  
  console.log('✅ Pushing test passed!\n');
}

async function testBoardElements() {
  console.log('=== TEST 3: Board Elements ===');
  
  const { SAMPLE_BOARD } = require('./boardConfig');
  
  const gameState = {
    roomCode: 'TEST',
    board: SAMPLE_BOARD,
    currentRegister: 0,
    players: {
      'p1': {
        id: 'p1',
        name: 'TestBot',
        position: { x: 2, y: 9 }, // On a conveyor!
        direction: 0,
        lives: 3,
        damage: 0,
        checkpointsVisited: 0
      }
    }
  };
  
  console.log('Player on conveyor at:', gameState.players.p1.position);
  
  // Execute board elements
  await gameEngine.executeBoardElements(gameState);
  
  console.log('After conveyor:', gameState.players.p1.position);
  console.assert(gameState.players.p1.position.x === 3, 'Should be moved East by conveyor');
  
  // Test checkpoint
  gameState.players.p1.position = { x: 6, y: 9 }; // Move to checkpoint 1
  await gameEngine.checkCheckpoints(gameState);
  console.log('Checkpoints visited:', gameState.players.p1.checkpointsVisited);
  console.assert(gameState.players.p1.checkpointsVisited === 1, 'Should have visited checkpoint 1');
  
  console.log('✅ Board elements test passed!\n');
}

// Run all tests
async function runAllTests() {
  try {
    await testBasicMovement();
    await testPushing();
    await testBoardElements();
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllTests();