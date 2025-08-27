import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MongoDB connection - set MONGO_URI environment variable with connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable not set!');
  console.error('Please set MONGO_URI with your MongoDB connection string');
  process.exit(1);
}

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
      userIdMap.set(user._id.toString(), user._id.toString());
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
          id: mongoGame._id.toString(),
          roomCode: mongoGame._id.toString(), // Use game ID as room code since it wasn't stored separately
          name: (mongoGame.name || `Game ${mongoGame._id.toString().substring(0, 8)}`) as string,
          hostId: hostId as string | null,
          boardName: BOARD_NAMES[mongoGame.boardId] || `Board ${mongoGame.boardId}`,
          courseName: null, // Courses weren't tracked in old system
          maxPlayers: (mongoGame.max_player || 8) as number,
          isPrivate: false, // Privacy wasn't tracked in old system
          startedAt: mongoGame.submitted ? new Date(mongoGame.submitted) : null,
          endedAt: mongoGame.stopped ? new Date(mongoGame.stopped) : null,
          winnerId: winnerId,
          finalResults: finalResults || undefined,
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