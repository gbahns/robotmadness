// test-gameEngine.js
// Run this with: node test-gameEngine.js

const GameEngine = require('./gameEngine');
const { SAMPLE_BOARD } = require('./boardConfig');

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
  roomCode: 'TEST123',
  phase: 'executing',
  currentRegister: 0,
  board: SAMPLE_BOARD,
  players: {
    'player1': {
      id: 'player1',
      name: 'Alice',
      position: { x: 2, y: 9 },  // Put Alice on a conveyor belt!
      direction: 0, // Facing North
      lives: 3,
      damage: 0,
      checkpointsVisited: 0,
      selectedCards: [
        { id: 1, type: 'MOVE_1', priority: 500 },
        { id: 2, type: 'ROTATE_RIGHT', priority: 100 },
        { id: 3, type: 'MOVE_2', priority: 700 },
        { id: 4, type: 'ROTATE_LEFT', priority: 90 },
        { id: 5, type: 'MOVE_3', priority: 800 }
      ]
    },
    'player2': {
      id: 'player2',
      name: 'Bob',
      position: { x: 3, y: 6 },  // Put Bob on a gear!
      direction: 1, // Facing East
      lives: 3,
      damage: 0,
      checkpointsVisited: 0,
      selectedCards: [
        { id: 6, type: 'MOVE_2', priority: 680 },
        { id: 7, type: 'U_TURN', priority: 50 },
        { id: 8, type: 'MOVE_1', priority: 510 },
        { id: 9, type: 'BACK_UP', priority: 450 },
        { id: 10, type: 'MOVE_3', priority: 790 }
      ]
    }
  }
};

// Test function
async function runTest() {
  console.log('=== ROBORALLY GAME ENGINE TEST ===\n');
  
  console.log('Initial positions:');
  console.log(`Alice: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y}) facing ${getDirectionName(testGameState.players.player1.direction)}`);
  console.log(`Bob: (${testGameState.players.player2.position.x}, ${testGameState.players.player2.position.y}) facing ${getDirectionName(testGameState.players.player2.direction)}`);
  console.log('');
  
  // Test each register
  for (let i = 0; i < 5; i++) {
    console.log(`\n=== REGISTER ${i + 1} ===`);
    testGameState.currentRegister = i;
    
    // Show what cards will be played
    console.log('Cards being played:');
    Object.values(testGameState.players).forEach(player => {
      const card = player.selectedCards[i];
      console.log(`${player.name}: ${card.type} (priority ${card.priority})`);
    });
    console.log('');
    
    // Execute the register
    await gameEngine.executeRegister(testGameState, i);
    
    // Show results
    console.log('\nPositions after register:');
    console.log(`Alice: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y}) facing ${getDirectionName(testGameState.players.player1.direction)}`);
    console.log(`Bob: (${testGameState.players.player2.position.x}, ${testGameState.players.player2.position.y}) facing ${getDirectionName(testGameState.players.player2.direction)}`);
    
    // Check for special tiles
    checkSpecialTiles(testGameState);
    
    // Add a delay between registers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log(`\nFinal positions:`);
  console.log(`Alice: (${testGameState.players.player1.position.x}, ${testGameState.players.player1.position.y}) facing ${getDirectionName(testGameState.players.player1.direction)}`);
  console.log(`  - Checkpoints visited: ${testGameState.players.player1.checkpointsVisited}`);
  console.log(`  - Damage: ${testGameState.players.player1.damage}`);
  console.log(`  - Lives: ${testGameState.players.player1.lives}`);
  
  console.log(`Bob: (${testGameState.players.player2.position.x}, ${testGameState.players.player2.position.y}) facing ${getDirectionName(testGameState.players.player2.direction)}`);
  console.log(`  - Checkpoints visited: ${testGameState.players.player2.checkpointsVisited}`);
  console.log(`  - Damage: ${testGameState.players.player2.damage}`);
  console.log(`  - Lives: ${testGameState.players.player2.lives}`);
  
  if (testGameState.winner) {
    console.log(`\n🎉 WINNER: ${testGameState.winner}! 🎉`);
  }
}

// Helper function to get direction name
function getDirectionName(dir) {
  const directions = ['North', 'East', 'South', 'West'];
  return directions[dir];
}

// Check what special tiles players are on
function checkSpecialTiles(gameState) {
  Object.values(gameState.players).forEach(player => {
    const tile = gameState.board.tiles?.find(
      t => t.position.x === player.position.x && t.position.y === player.position.y
    );
    
    if (tile) {
      console.log(`  ${player.name} is on a ${tile.type}${tile.rotate ? ` (${tile.rotate})` : ''}`);
    }
    
    const checkpoint = gameState.board.checkpoints?.find(
      cp => cp.position.x === player.position.x && cp.position.y === player.position.y
    );
    
    if (checkpoint) {
      console.log(`  ${player.name} is on checkpoint ${checkpoint.number}!`);
    }
  });
}

// Run the test
runTest().catch(console.error);