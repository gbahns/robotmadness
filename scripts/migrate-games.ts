import { MongoClient } from 'mongodb';
import { PrismaClient, GameStatus } from '@prisma/client';

const prisma = new PrismaClient();

const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

// Board ID to name mapping (from the old system)
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
  // Add more board mappings if known
  22: 'Custom Board', // example from the data
};

// Robot ID to color mapping
const ROBOT_COLORS = [
  'red', 'blue', 'green', 'yellow', 
  'orange', 'purple', 'pink', 'cyan'
];

function mapGameStatus(gamePhase: string | undefined): GameStatus {
  if (!gamePhase) return 'WAITING';
  
  const phase = gamePhase.toLowerCase();
  if (phase.includes('ended') || phase.includes('stopped')) return 'COMPLETED';
  if (phase.includes('playing') || phase.includes('started')) return 'IN_PROGRESS';
  if (phase.includes('waiting')) return 'WAITING';
  if (phase.includes('abandoned')) return 'ABANDONED';
  
  return 'COMPLETED'; // default for unknown states
}

async function migrateGames() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // Use games_view collection as it has complete data with players
    const gamesViewCollection = db.collection('games_view');
    const usersCollection = db.collection('users');
    
    // Get all games from games_view
    const mongoGames = await gamesViewCollection.find({}).toArray();
    console.log(`Found ${mongoGames.length} games in MongoDB\n`);
    
    // Clear existing games and players in SQLite
    console.log('Clearing existing games and players in SQLite...');
    await prisma.gamePlayer.deleteMany();
    await prisma.game.deleteMany();
    
    // Get user mapping for host/winner lookups
    const mongoUsers = await usersCollection.find({}).toArray();
    const userIdMap = new Map<string, string>();
    
    for (const user of mongoUsers) {
      // Map MongoDB user ID to SQLite user ID (we preserved the IDs during user migration)
      userIdMap.set(user._id, user._id);
    }
    
    let migratedGames = 0;
    let migratedPlayers = 0;
    let skippedGames = 0;
    
    for (const mongoGame of mongoGames) {
      try {
        // Find host user ID
        const hostId = mongoGame.userId && userIdMap.has(mongoGame.userId) 
          ? mongoGame.userId 
          : null;
        
        // Find winner user ID
        let winnerId = null;
        if (mongoGame.winner) {
          // Winner is stored as username, need to find user
          const winnerUser = await prisma.user.findFirst({
            where: { 
              OR: [
                { username: mongoGame.winner },
                { name: mongoGame.winner }
              ]
            }
          });
          winnerId = winnerUser?.id || null;
        }
        
        // Calculate game duration
        let totalDuration = null;
        if (mongoGame.submitted && mongoGame.stopped) {
          totalDuration = Math.floor((mongoGame.stopped - mongoGame.submitted) / 1000); // in seconds
        }
        
        // Build final results from players data
        let finalResults = null;
        if (mongoGame.players && Array.isArray(mongoGame.players)) {
          finalResults = mongoGame.players.map((p: any) => ({
            playerId: p.userId,
            playerName: p.name,
            position: p.visited_checkpoints || 0,
            flags: p.visited_checkpoints || 0,
            finalDamage: p.damage || 0,
            lives: p.lives || 0,
            robotId: p.robotId
          }));
        }
        
        // Create game in SQLite
        const gameData = {
          id: mongoGame._id,
          roomCode: mongoGame._id, // Use game ID as room code since it wasn't stored separately
          name: mongoGame.name || `Game ${mongoGame._id.substring(0, 8)}`,
          hostId: hostId,
          boardName: BOARD_NAMES[mongoGame.boardId] || `Board ${mongoGame.boardId}`,
          courseName: null, // Courses weren't tracked in old system
          maxPlayers: mongoGame.max_player || 8,
          isPrivate: false, // Privacy wasn't tracked in old system
          status: mapGameStatus(mongoGame.gamePhase),
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
        
        // Migrate players for this game
        if (mongoGame.players && Array.isArray(mongoGame.players)) {
          for (const mongoPlayer of mongoGame.players) {
            try {
              // Check if user exists in SQLite
              const userExists = await prisma.user.findUnique({
                where: { id: mongoPlayer.userId }
              });
              
              if (!userExists) {
                console.log(`  ⚠ Skipping player ${mongoPlayer.name} - user not found`);
                continue;
              }
              
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
        
        console.log(`✓ Migrated game: ${gameData.name} with ${mongoGame.players?.length || 0} players`);
        
      } catch (error: any) {
        skippedGames++;
        console.log(`✗ Skipped game due to error:`, error.message);
        console.log('  Game data:', { id: mongoGame._id, name: mongoGame.name });
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`- Successfully migrated: ${migratedGames} games`);
    console.log(`- Successfully migrated: ${migratedPlayers} players`);
    console.log(`- Skipped: ${skippedGames} games`);
    
    // Verify migration
    const sqliteGameCount = await prisma.game.count();
    const sqlitePlayerCount = await prisma.gamePlayer.count();
    console.log(`\nTotal games now in SQLite: ${sqliteGameCount}`);
    console.log(`Total game players now in SQLite: ${sqlitePlayerCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

// Run the migration
migrateGames().catch(console.error);