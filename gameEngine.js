// gameEngine.js
class GameEngine {
  constructor(io) {
    this.io = io;

    // Direction vectors for movement
    this.DIRECTION_VECTORS = {
      0: { x: 0, y: -1 }, // North
      1: { x: 1, y: 0 },  // East
      2: { x: 0, y: 1 },  // South
      3: { x: -1, y: 0 }  // West
    };
  }

  // Execute a single register (all players' cards for that register)
  async executeRegister(gameState, registerIndex) {
    console.log(`Executing register ${registerIndex + 1}`);

    // Get all programmed cards for this register
    const programmedCards = [];
    Object.entries(gameState.players).forEach(([playerId, player]) => {
      if (player.lives > 0 && player.selectedCards[registerIndex]) {
        programmedCards.push({
          playerId,
          card: player.selectedCards[registerIndex],
          player
        });
      }
    });

    // Sort by priority (highest first)
    programmedCards.sort((a, b) => b.card.priority - a.card.priority);

    // Execute each card in priority order
    for (const { playerId, card, player } of programmedCards) {
      console.log(`Player ${player.name} executes ${card.type} (priority ${card.priority})`);
      await this.executeCard(gameState, player, card);

      // Emit update after each card
      this.io.to(gameState.roomCode).emit('card-executed', {
        playerId,
        card,
        register: registerIndex
      });

      // Small delay for visual effect
      await this.delay(500);
    }

    // After all cards, execute board elements
    await this.executeBoardElements(gameState);
  }

  // Execute a single card
  async executeCard(gameState, player, card) {
    switch (card.type) {
      case 'MOVE_1':
        await this.moveRobot(gameState, player, 1);
        break;
      case 'MOVE_2':
        await this.moveRobot(gameState, player, 2);
        break;
      case 'MOVE_3':
        await this.moveRobot(gameState, player, 3);
        break;
      case 'BACK_UP':
        await this.moveRobot(gameState, player, -1);
        break;
      case 'ROTATE_LEFT':
        player.direction = (player.direction + 3) % 4; // -1 mod 4
        break;
      case 'ROTATE_RIGHT':
        player.direction = (player.direction + 1) % 4;
        break;
      case 'U_TURN':
        player.direction = (player.direction + 2) % 4;
        break;
    }
  }

  // Move a robot
  async moveRobot(gameState, player, distance) {
    // Determine direction (backwards for negative distance)
    const direction = distance < 0 ?
      (player.direction + 2) % 4 : // Reverse for backup
      player.direction;

    const moves = Math.abs(distance);

    for (let i = 0; i < moves; i++) {
      const vector = this.DIRECTION_VECTORS[direction];
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
    const vector = this.DIRECTION_VECTORS[direction];
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

  // Execute board elements
  async executeBoardElements(gameState) {
    console.log('Executing board elements...');

    // 1. Express conveyor belts (move 1 space)
    await this.executeConveyorBelts(gameState, true, false);

    // 2. All conveyor belts (express move again, normal move once)
    await this.executeConveyorBelts(gameState, true, true);

    // 3. Pushers
    await this.executePushers(gameState);

    // 4. Gears
    await this.executeGears(gameState);

    // 5. Lasers
    await this.executeLasers(gameState);

    // 6. Check checkpoints
    await this.checkCheckpoints(gameState);
  }

  // Execute conveyor belts
  async executeConveyorBelts(gameState, includeExpress, includeNormal) {
    const movements = [];

    // Find all players on conveyor belts and calculate their movements
    Object.values(gameState.players).forEach(player => {
      if (player.lives <= 0) return;

      const tile = this.getTileAt(gameState, player.position.x, player.position.y);
      if (!tile) return;

      if ((tile.type === 'conveyor_express' && includeExpress) ||
        (tile.type === 'conveyor' && includeNormal)) {

        const vector = this.DIRECTION_VECTORS[tile.direction];
        const newX = player.position.x + vector.x;
        const newY = player.position.y + vector.y;

        movements.push({
          player,
          from: { x: player.position.x, y: player.position.y },
          to: { x: newX, y: newY },
          fromTile: tile
        });
      }
    });

    // Resolve movements (handle conflicts)
    const resolvedMovements = this.resolveConveyorMovements(gameState, movements);

    // Apply movements
    resolvedMovements.forEach(movement => {
      const { player, to, fromTile } = movement;

      // Check if destination is off the board
      if (to.x < 0 || to.x >= gameState.board.width ||
        to.y < 0 || to.y >= gameState.board.height) {
        this.respawnPlayer(gameState, player);
        return;
      }

      // Move the player
      player.position = { ...to };

      // Check for rotating conveyor
      const toTile = this.getTileAt(gameState, to.x, to.y);
      if (toTile && toTile.rotate &&
        (fromTile.type === 'conveyor' || fromTile.type === 'conveyor_express')) {
        // Rotate the robot
        if (toTile.rotate === 'clockwise') {
          player.direction = (player.direction + 1) % 4;
        } else if (toTile.rotate === 'counterclockwise') {
          player.direction = (player.direction + 3) % 4;
        }
      }
    });
  }

  // Resolve conveyor movements (handle conflicts)
  resolveConveyorMovements(gameState, movements) {
    const resolved = [];
    const destinations = new Map();

    // Group movements by destination
    movements.forEach(movement => {
      const key = `${movement.to.x},${movement.to.y}`;
      if (!destinations.has(key)) {
        destinations.set(key, []);
      }
      destinations.get(key).push(movement);
    });

    // Process each movement
    movements.forEach(movement => {
      const destKey = `${movement.to.x},${movement.to.y}`;
      const conflicts = destinations.get(destKey);

      // Check if there's already a robot at the destination
      const occupant = this.getPlayerAt(gameState, movement.to.x, movement.to.y);

      // If multiple robots trying to move to same space, none move
      if (conflicts.length > 1) {
        return; // Don't add to resolved
      }

      // If there's a robot at destination that's not moving, can't move
      if (occupant && !movements.find(m => m.player.id === occupant.id)) {
        return; // Don't add to resolved
      }

      // Movement is valid
      resolved.push(movement);
    });

    return resolved;
  }

  // Execute pushers
  async executePushers(gameState) {
    // Check register phase to see if pushers are active
    const currentRegister = gameState.currentRegister;

    Object.values(gameState.players).forEach(player => {
      if (player.lives <= 0) return;

      const tile = this.getTileAt(gameState, player.position.x, player.position.y);
      if (!tile || tile.type !== 'pusher') return;

      // Check if pusher is active this register
      if (tile.registers && tile.registers.includes(currentRegister + 1)) {
        // Push the robot
        this.pushRobot(gameState, player, tile.direction);
      }
    });
  }

  // Execute gears
  async executeGears(gameState) {
    Object.values(gameState.players).forEach(player => {
      if (player.lives <= 0) return;

      const tile = this.getTileAt(gameState, player.position.x, player.position.y);
      if (!tile || tile.type !== 'gear') return;

      // Rotate the robot
      if (tile.rotate === 'clockwise') {
        player.direction = (player.direction + 1) % 4;
      } else if (tile.rotate === 'counterclockwise') {
        player.direction = (player.direction + 3) % 4;
      }
    });
  }

  // Execute lasers
  async executeLasers(gameState) {
    const damages = new Map();

    // Board lasers
    if (gameState.board.lasers) {
      gameState.board.lasers.forEach(laser => {
        const hits = this.traceLaser(
          gameState,
          laser.position.x,
          laser.position.y,
          laser.direction,
          laser.damage || 1
        );

        hits.forEach(hit => {
          const current = damages.get(hit.player.id) || 0;
          damages.set(hit.player.id, current + hit.damage);
        });
      });
    }

    // Robot lasers
    Object.values(gameState.players).forEach(player => {
      if (player.lives <= 0) return;

      const vector = this.DIRECTION_VECTORS[player.direction];
      const startX = player.position.x + vector.x;
      const startY = player.position.y + vector.y;

      const hits = this.traceLaser(
        gameState,
        startX,
        startY,
        player.direction,
        1
      );

      hits.forEach(hit => {
        if (hit.player.id !== player.id) { // Don't shoot yourself
          const current = damages.get(hit.player.id) || 0;
          damages.set(hit.player.id, current + hit.damage);
        }
      });
    });

    // Apply damage
    damages.forEach((damage, playerId) => {
      const player = gameState.players[playerId];
      player.damage += damage;
      console.log(`${player.name} takes ${damage} damage!`);

      // Emit damage event for the execution log
      this.io.to(gameState.roomCode).emit('robot-damaged', {
        playerName: player.name,
        damage: damage,
        reason: 'laser'
      });

      // Check if robot is destroyed
      if (player.damage >= 10) {
        console.log(`${player.name} is destroyed!`);
        this.respawnPlayer(gameState, player);
      }
    });
  }

  // Trace a laser path
  traceLaser(gameState, startX, startY, direction, damage) {
    const hits = [];
    const vector = this.DIRECTION_VECTORS[direction];
    let x = startX;
    let y = startY;

    while (x >= 0 && x < gameState.board.width &&
      y >= 0 && y < gameState.board.height) {

      // Check for robot
      const player = this.getPlayerAt(gameState, x, y);
      if (player) {
        hits.push({ player, damage });
        break; // Laser stops at first robot
      }

      // Check for wall
      const tile = this.getTileAt(gameState, x, y);
      if (tile && tile.walls && tile.walls.includes(direction)) {
        break; // Laser blocked by wall
      }

      // Move to next position
      x += vector.x;
      y += vector.y;

      // Check for wall on entry
      const nextTile = this.getTileAt(gameState, x, y);
      if (nextTile && nextTile.walls &&
        nextTile.walls.includes((direction + 2) % 4)) {
        break; // Laser blocked by wall
      }
    }

    return hits;
  }

  // Check checkpoints
  async checkCheckpoints(gameState) {
    Object.values(gameState.players).forEach(player => {
      if (player.lives <= 0) return;

      // Check for checkpoint
      const checkpoint = gameState.board.checkpoints.find(
        cp => cp.position.x === player.position.x &&
          cp.position.y === player.position.y
      );

      if (checkpoint && checkpoint.number === player.checkpointsVisited + 1) {
        player.checkpointsVisited++;
        console.log(`${player.name} reached checkpoint ${checkpoint.number}!`);

        // Update respawn position
        player.respawnPosition = { ...player.position };

        // Check for winner
        if (player.checkpointsVisited === gameState.board.checkpoints.length) {
          gameState.winner = player.name;
          gameState.phase = 'ended';
          console.log(`${player.name} wins the game!`);
        }
      }

      // Check for repair site
      const tile = this.getTileAt(gameState, player.position.x, player.position.y);
      if (tile && (tile.type === 'repair' || tile.type === 'upgrade')) {
        // Update respawn position
        player.respawnPosition = { ...player.position };

        // Repair damage at end of turn (handled elsewhere)
      }
    });
  }

  // Get tile at position
  getTileAt(gameState, x, y) {
    if (!gameState.board.tiles) return null;
    return gameState.board.tiles.find(
      tile => tile.position.x === x && tile.position.y === y
    );
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GameEngine;