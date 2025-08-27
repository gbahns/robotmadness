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

async function checkWinners() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    const gamesCollection = db.collection('games');
    const games = await gamesCollection.find({}).toArray();
    
    console.log(`Total games: ${games.length}\n`);
    
    // Check winner field values
    const winnerValues = new Map<string, number>();
    const gamesWithoutWinner = [];
    const gamesWithEmptyWinner = [];
    
    for (const game of games) {
      if (game.winner === undefined || game.winner === null) {
        gamesWithoutWinner.push(game);
      } else if (game.winner === '') {
        gamesWithEmptyWinner.push(game);
      } else {
        const count = winnerValues.get(game.winner) || 0;
        winnerValues.set(game.winner, count + 1);
      }
    }
    
    console.log('=== WINNER FIELD ANALYSIS ===');
    console.log(`Games without winner field: ${gamesWithoutWinner.length}`);
    console.log(`Games with empty string winner: ${gamesWithEmptyWinner.length}`);
    console.log(`Games with actual winner value: ${winnerValues.size > 0 ? Array.from(winnerValues.values()).reduce((a, b) => a + b, 0) : 0}`);
    
    if (gamesWithEmptyWinner.length > 0) {
      console.log('\n=== SAMPLE GAMES WITH EMPTY WINNER ===');
      for (const game of gamesWithEmptyWinner.slice(0, 5)) {
        console.log(`- "${game.name}" (${game._id}): winner="${game.winner}" (empty string)`);
      }
    }
    
    console.log('\n=== WINNER VALUES BREAKDOWN ===');
    const sortedWinners = Array.from(winnerValues.entries()).sort((a, b) => b[1] - a[1]);
    for (const [winner, count] of sortedWinners) {
      console.log(`"${winner}": ${count} games`);
    }
    
    // Now check SQLite to see what we have
    console.log('\n=== SQLITE DATABASE CHECK ===');
    const sqliteUsers = await prisma.user.findMany();
    const usernameMap = new Map<string, string>();
    for (const user of sqliteUsers) {
      usernameMap.set(user.username.toLowerCase(), user.id);
    }
    
    console.log(`Total users in SQLite: ${sqliteUsers.length}`);
    
    // Check which winners can't be found
    const winnersNotFound = [];
    for (const [winner] of winnerValues) {
      if (!usernameMap.has(winner.toLowerCase())) {
        winnersNotFound.push(winner);
      }
    }
    
    if (winnersNotFound.length > 0) {
      console.log('\n=== WINNERS NOT FOUND IN SQLITE USERS ===');
      console.log(winnersNotFound);
    }
    
    // Check for case sensitivity issues
    console.log('\n=== CHECKING CASE SENSITIVITY ===');
    for (const game of games) {
      if (game.winner && game.winner !== '') {
        const exactMatch = await prisma.user.findFirst({
          where: { username: game.winner }
        });
        // SQLite doesn't support case-insensitive mode, use manual comparison
        const allUsers = await prisma.user.findMany();
        const caseInsensitiveMatch = allUsers.find(u => 
          u.username.toLowerCase() === game.winner.toLowerCase()
        );
        
        if (!exactMatch && caseInsensitiveMatch) {
          console.log(`Case mismatch: MongoDB="${game.winner}" SQLite="${caseInsensitiveMatch.username}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

checkWinners().catch(console.error);