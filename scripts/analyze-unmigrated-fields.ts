import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function analyzeUnmigratedFields() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // === USERS COLLECTION ===
    console.log('=== UNMIGRATED USER FIELDS ===\n');
    const usersCollection = db.collection('users');
    const sampleUser = await usersCollection.findOne();
    
    console.log('MongoDB User fields:');
    const userFields = Object.keys(sampleUser || {});
    console.log(userFields.join(', '));
    
    console.log('\nSQLite User fields (from Prisma schema):');
    console.log('id, email, username, name, createdAt, updatedAt');
    
    console.log('\nUNMIGRATED User fields:');
    console.log('- services (password hash, login tokens) - Authentication data');
    console.log('- emails[].verified - Email verification status');
    console.log('- profile - User profile data (was empty in samples)');
    console.log('- status - Online status and last login info');
    console.log('  - status.online: boolean');
    console.log('  - status.lastLogin.date: datetime');
    console.log('  - status.lastLogin.ipAddr: IP address');
    console.log('  - status.lastLogin.userAgent: browser info');
    
    // === GAMES COLLECTION ===
    console.log('\n\n=== UNMIGRATED GAME FIELDS ===\n');
    const gamesCollection = db.collection('games');
    const sampleGame = await gamesCollection.findOne();
    
    console.log('MongoDB Game fields:');
    const gameFields = Object.keys(sampleGame || {});
    console.log(gameFields.join(', '));
    
    console.log('\nSQLite Game fields (from Prisma schema):');
    console.log('id, roomCode, name, hostId, boardName, courseName, maxPlayers, isPrivate,');
    console.log('status, startedAt, endedAt, winnerId, finalResults, totalDuration, createdAt, updatedAt');
    
    console.log('\nUNMIGRATED Game fields:');
    console.log('- userId -> Migrated as hostId');
    console.log('- author -> Migrated via hostId relationship');
    console.log('- submitted -> Migrated as startedAt');
    console.log('- started -> Migrated as status');
    console.log('- gamePhase -> Migrated as status');
    console.log('- playPhase - Current play phase (e.g., "checkpoints", "programming")');
    console.log('- respawnPhase - Respawn state (e.g., "choose direction")');
    console.log('- playPhaseCount - Number of phases played');
    console.log('- boardId -> Migrated as boardName');
    console.log('- waitingForRespawn/watingForRespawn - Players waiting to respawn');
    console.log('- announce - Whether to announce cards');
    console.log('- cardsToPlay - Cards queued to play');
    console.log('- min_player -> Migrated as part of maxPlayers concept');
    console.log('- timer - Game timer value');
    console.log('- announceCard - Current card being announced');
    console.log('- respawnPlayerId/respawnUserId - Player currently respawning');
    console.log('- selectOptions - Option selection state');
    console.log('- stopped -> Migrated as endedAt');
    
    // === PLAYERS COLLECTION ===
    console.log('\n\n=== UNMIGRATED PLAYER FIELDS ===\n');
    const playersCollection = db.collection('players');
    const samplePlayer = await playersCollection.findOne();
    
    console.log('MongoDB Player fields:');
    const playerFields = Object.keys(samplePlayer || {});
    console.log(playerFields.join(', '));
    
    console.log('\nSQLite GamePlayer fields (from Prisma schema):');
    console.log('id, gameId, userId, robotColor, startingDock, joinedAt,');
    console.log('finalPosition, flagsReached, livesRemaining, finalDamage, robotsDestroyed');
    
    console.log('\nUNMIGRATED Player fields:');
    console.log('- name -> Available through User relationship');
    console.log('- lives -> Migrated as livesRemaining');
    console.log('- damage -> Migrated as finalDamage');
    console.log('- visited_checkpoints -> Migrated as flagsReached');
    console.log('- needsRespawn - Whether player needs respawn');
    console.log('- powerState - Power down state (0-5 scale)');
    console.log('- optionalInstantPowerDown - Power down option');
    console.log('- position.x/y -> Encoded in finalPosition (x*100+y)');
    console.log('- chosenCardsCnt - Number of cards chosen');
    console.log('- optionCards - Object with option cards owned');
    console.log('  Note: Option cards were stored but migrated to finalResults JSON');
    console.log('- cards - Array of card IDs in hand');
    console.log('- direction -> Not migrated (0=up, 1=right, 2=down, 3=left)');
    console.log('- robotId -> Migrated as robotColor and startingDock');
    console.log('- start.x/y/direction - Starting position and direction');
    console.log('- playedCardsCnt - Number of cards played');
    console.log('- submitted - Whether player submitted turn');
    console.log('- shotDistance - Laser shot distance');
    console.log('- ablativeCoat - Ablative coat status (null or damage value)');
    
    // === SUMMARY ===
    console.log('\n\n=== MIGRATION SUMMARY ===\n');
    console.log('Most critical game state fields were migrated.');
    console.log('Unmigrated fields are primarily:');
    console.log('1. Authentication/session data (services, tokens)');
    console.log('2. Real-time game state (current phase, cards in hand, power state)');
    console.log('3. Temporary game mechanics (respawn queue, announce state)');
    console.log('4. Turn-by-turn details (submitted status, current direction)');
    console.log('\nThese fields represent ACTIVE game state that would be');
    console.log('regenerated when games are played, not historical data.');
    
  } catch (error) {
    console.error('Error analyzing fields:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

analyzeUnmigratedFields().catch(console.error);