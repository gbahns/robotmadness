// gameEngine.js - Server-side game logic

const DIRECTION_VECTORS = {
  0: { x: 0, y: -1 }, // UP
  1: { x: 1, y: 0 },  // RIGHT
  2: { x: 0, y: 1 },  // DOWN
  3: { x: -1, y: 0 }, // LEFT
};

class GameEngine {
  constructor(io) {
    this.io = io;
  }

  // Execute a single register for all players
  async executeRegister(gameState, registerIndex) {
    const roomCode = gameState.roomCode;
    
    // Collect all cards for this register
    const playerCards = [];
    Object.values(gameState.players).forEach(player => {
      const card = player.selectedCards[registerIndex];
      if (card && !player.isPoweredDown) {
        playerCards.push({
          playerId: player.id,
          card: card,
          player: player
        });
      }
    });

    // Sort by priority (higher priority goes first)
    playerCards.sort((a, b) => b.card.priority - a.card.priority);

    // Execute each card in priority order
    for (const { playerId, card, player } of playerCards) {
      await this.executeCard(gameState, player, card);
      
      // Broadcast the move
      this.io.to(roomCode).emit('card-executed', {
        playerId: playerId,
        card: card,
        newPosition: player.position,
        newDirection: player.direction,
      });
      
      // Small delay for visual effect
      await this.delay(500);
    }

    // After all moves, execute board elements
    await this.executeBoardElements(gameState);
  }

  // Execute a single card
  async executeCard(gameState, player, card) {
    switch (card.type) {
      case 'U_TURN':
        player.direction = (player.direction + 2) % 4;
        break;
        
      case 'ROTATE_LEFT':
        player.direction = (player.direction + 3) % 4; // -1 mod 4
        break;
        
      case 'ROTATE_RIGHT':
        player.direction = (player.direction + 1) % 4;
        break;
        
      case 'BACK_UP':
        await this.movePlayer(gameState, player, -1);
        break;
        
      case 'MOVE_1':
        await this.movePlayer(gameState, player, 1);
        break;
        
      case 'MOVE_2':
        await this.movePlayer(gameState, player, 2);
        break;
        
      case 'MOVE_3':
        await this.movePlayer(gameState, player, 3);
        break;
    }
  }

  // Move a player
  async movePlayer(gameState, player, distance) {
    const direction = distance < 0 ? 
      (player.direction + 2) % 4 : // Reverse for backup
      player.direction;
    
    const moves = Math.abs(distance);
    
    for (let i = 0; i < moves; i++) {
      const vector = DIRECTION_VECTORS[direction];
      const newX = player.position.x + vector.x;
      const newY = player.position.y + vector.y;
      
      // Check if move is off the board
      if (newX < 0 || newX >= gameState.board.width || 
          newY < 0 || newY >= gameState.board.height) {
        // Player falls off
        this.respawnPlayer(gameState, player);
        break;
      }
      
      // Check for other robots
      const occupant = this.getPlayerAt(gameState, newX, newY);
      if (occupant) {
        // Try to push the other robot
        const pushed = await this.pushRobot(gameState, occupant, direction);
        if (!pushed) {
          // Can't push, movement stops
          break;
        }
      }
      
      // Move is valid
      player.position.x = newX;
      player.position.y = newY;
    }
  }

  // Push a robot
  async pushRobot(gameState, robot, direction) {
    const vector = DIRECTION_VECTORS[direction];
    const newX = robot.position.x + vector.x;
    const newY = robot.position.y + vector.y;
    
    // Check if push is off the board
    if (newX < 0 || newX >= gameState.board.width || 
        newY < 0 || newY >= gameState.board.height) {
      // Robot falls off
      this.respawnPlayer(gameState, robot);
      return true;
    }
    
    // Check for another robot in the way
    const occupant = this.getPlayerAt(gameState, newX, newY);
    if (occupant) {
      // Try to push that robot too
      const pushed = await this.pushRobot(gameState, occupant, direction);
      if (!pushed) {
        return false; // Can't push
      }
    }
    
    // Push is valid
    robot.position.x = newX;
    robot.position.y = newY;
    return true;
  }

  // Get player at position
  getPlayerAt(gameState, x, y) {
    return Object.values(gameState.players).find(
      p => p.position.x === x && p.position.y === y && p.lives > 0
    );
  }

  // Respawn a player
  respawnPlayer(gameState, player) {
    player.lives--;
    player.damage = 2; // Respawn with 2 damage
    
    if (player.lives <= 0) {
      // Player is out
      console.log(`${player.name} is out of lives!`);
      return;
    }
    
    // Find their starting position
    const playerIndex = Object.keys(gameState.players).indexOf(player.id);
    const startPos = gameState.board.startingPositions[playerIndex % gameState.board.startingPositions.length];
    
    player.position = { ...startPos.position };
    player.direction = startPos.direction;
  }

  // Execute board elements (simplified for now)
  async executeBoardElements(gameState) {
    // Check for checkpoints
    Object.values(gameState.players).forEach(player => {
      const checkpoint = gameState.board.checkpoints.find(
        cp => cp.position.x === player.position.x && 
              cp.position.y === player.position.y
      );
      
      if (checkpoint && checkpoint.number === player.checkpointsVisited + 1) {
        player.checkpointsVisited++;
        console.log(`${player.name} reached checkpoint ${checkpoint.number}!`);
        
        // Check for winner
        if (player.checkpointsVisited === gameState.board.checkpoints.length) {
          gameState.winner = player.name;
          gameState.phase = 'ended';
        }
      }
    });
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GameEngine;