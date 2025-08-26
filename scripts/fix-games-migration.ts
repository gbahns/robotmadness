import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function fixGamesMigration() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // Get BOTH collections
    const gamesCollection = db.collection('games');
    const gamesViewCollection = db.collection('games_view');
    
    // Get all games from the main games collection (has userId)
    const mongoGames = await gamesCollection.find({}).toArray();
    console.log(`Found ${mongoGames.length} games in games collection\n`);
    
    // Create a map of game ID to games_view data (has players detail)
    const gamesViewMap = new Map();
    const gamesViewData = await gamesViewCollection.find({}).toArray();
    for (const gameView of gamesViewData) {
      gamesViewMap.set(gameView._id, gameView);
    }
    
    // Clear existing games and players in SQLite
    console.log('Clearing existing games and players in SQLite...');
    await prisma.gamePlayer.deleteMany();
    await prisma.game.deleteMany();
    
    let migratedGames = 0;
    let migratedPlayers = 0;
    let skippedGames = 0;
    let gamesWithHost = 0;
    let gamesWithWinner = 0;
    
    for (const mongoGame of mongoGames) {
      try {
        // Get the detailed game view data
        const gameView = gamesViewMap.get(mongoGame._id) || {};
        
        // Host ID is directly from games collection
        const hostId = mongoGame.userId || null;
        if (hostId) gamesWithHost++;
        
        // Find winner user ID by username
        let winnerId = null;
        if (mongoGame.winner) {
          const winnerUser = await prisma.user.findFirst({
            where: { 
              OR: [
                { username: mongoGame.winner },
                { name: mongoGame.winner }
              ]
            }
          });
          winnerId = winnerUser?.id || null;
          if (winnerId) gamesWithWinner++;
        }
        
        // Calculate game duration
        let totalDuration = null;
        if (mongoGame.submitted && mongoGame.stopped) {
          totalDuration = Math.floor((mongoGame.stopped - mongoGame.submitted) / 1000); // in seconds
        }
        
        // Build final results from players data in games_view
        let finalResults = null;
        if (gameView.players && Array.isArray(gameView.players)) {
          finalResults = gameView.players.map((p: any) => ({
            playerId: p.userId,
            playerName: p.name,
            position: p.visited_checkpoints || 0,
            flags: p.visited_checkpoints || 0,
            finalDamage: p.damage || 0,
            lives: p.lives || 0,
            robotId: p.robotId
          }));
        }
        
        // Board ID to name mapping
        const BOARD_NAMES: Record<number, string> = {
          1: 'Cross',
          2: 'Exchange',
          3: 'Island',
          4: 'Vault', 
          5: 'Spin Zone',
          6: 'Chess',
          7: 'Chop Shop',
          8: 'Laser Maze',
          9: 'Cannery Row',
          10: 'Flood Zone',
          11: 'Gear Box',
          12: 'Blast Furnace',
          22: 'Custom Board',
        };
        
        // Create game in SQLite
        const gameData = {
          id: mongoGame._id,
          roomCode: mongoGame._id, // Use game ID as room code
          name: mongoGame.name || `Game ${mongoGame._id.substring(0, 8)}`,
          hostId: hostId, // Now properly set from games collection
          boardName: BOARD_NAMES[mongoGame.boardId] || `Board ${mongoGame.boardId}`,
          courseName: null, // Courses weren't tracked in old system
          maxPlayers: mongoGame.max_player || 8,
          isPrivate: false, // Privacy wasn't tracked
          startedAt: mongoGame.submitted ? new Date(mongoGame.submitted) : null,
          endedAt: mongoGame.stopped ? new Date(mongoGame.stopped) : null,
          winnerId: winnerId,
          finalResults: finalResults,
          totalDuration: totalDuration,
          createdAt: mongoGame.submitted ? new Date(mongoGame.submitted) : new Date(),
          updatedAt: mongoGame.stopped ? new Date(mongoGame.stopped) : new Date()
        };
        
        const createdGame = await prisma.game.create({ data: gameData });
        migratedGames++;
        
        // Migrate players for this game (from games_view)
        if (gameView.players && Array.isArray(gameView.players)) {
          for (const mongoPlayer of gameView.players) {
            try {
              // Check if user exists in SQLite
              const userExists = await prisma.user.findUnique({
                where: { id: mongoPlayer.userId }
              });
              
              if (!userExists) {
                console.log(`  ⚠ Skipping player ${mongoPlayer.name} - user not found`);
                continue;
              }
              
              const ROBOT_COLORS = [
                'red', 'blue', 'green', 'yellow', 
                'orange', 'purple', 'pink', 'cyan'
              ];
              
              const playerData = {
                id: mongoPlayer._id,
                gameId: createdGame.id,
                userId: mongoPlayer.userId,
                robotColor: ROBOT_COLORS[parseInt(mongoPlayer.robotId) || 0] || 'red',
                startingDock: (parseInt(mongoPlayer.robotId) || 0) + 1, // Convert 0-based to 1-based
                joinedAt: new Date(mongoGame.submitted || Date.now()),
                finalPosition: mongoPlayer.position ? 
                  (mongoPlayer.position.x * 100 + mongoPlayer.position.y) : null, // Encode position
                flagsReached: mongoPlayer.visited_checkpoints || 0,
                livesRemaining: mongoPlayer.lives || 0,
                finalDamage: mongoPlayer.damage || 0,
                robotsDestroyed: 0 // Not tracked in old system
              };
              
              await prisma.gamePlayer.create({ data: playerData });
              migratedPlayers++;
              
            } catch (playerError: any) {
              console.log(`  ⚠ Error migrating player ${mongoPlayer.name}:`, playerError.message);
            }
          }
        }
        
        console.log(`✓ Migrated game: ${gameData.name} (host: ${hostId ? 'yes' : 'no'}, winner: ${winnerId ? 'yes' : 'no'})`);
        
      } catch (error: any) {
        skippedGames++;
        console.log(`✗ Skipped game due to error:`, error.message);
        console.log('  Game data:', { id: mongoGame._id, name: mongoGame.name });
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`- Successfully migrated: ${migratedGames} games`);
    console.log(`- Successfully migrated: ${migratedPlayers} players`);
    console.log(`- Games with host: ${gamesWithHost}`);
    console.log(`- Games with winner: ${gamesWithWinner}`);
    console.log(`- Skipped: ${skippedGames} games`);
    
    // Verify migration
    const sqliteGameCount = await prisma.game.count();
    const sqlitePlayerCount = await prisma.gamePlayer.count();
    const sqliteGamesWithHost = await prisma.game.count({ where: { hostId: { not: null } } });
    const sqliteGamesWithWinner = await prisma.game.count({ where: { winnerId: { not: null } } });
    
    console.log(`\nVerification:`);
    console.log(`Total games in SQLite: ${sqliteGameCount}`);
    console.log(`Total game players in SQLite: ${sqlitePlayerCount}`);
    console.log(`Games with host in SQLite: ${sqliteGamesWithHost}`);
    console.log(`Games with winner in SQLite: ${sqliteGamesWithWinner}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

// Run the migration
fixGamesMigration().catch(console.error);