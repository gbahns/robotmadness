import { MongoClient } from 'mongodb';

// MongoDB connection - set MONGO_URI environment variable with connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable not set!');
  console.error('Please set MONGO_URI with your MongoDB connection string');
  process.exit(1);
}

async function checkFields() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    const gamesCollection = db.collection('games');
    const totalGames = await gamesCollection.countDocuments();
    
    // Check userId (host) field
    const gamesWithUserId = await gamesCollection.countDocuments({ userId: { $exists: true, $ne: null } });
    const gamesWithAuthor = await gamesCollection.countDocuments({ author: { $exists: true, $ne: null } });
    
    // Check winner field
    const gamesWithWinner = await gamesCollection.countDocuments({ winner: { $exists: true, $ne: null } });
    
    console.log('=== GAMES COLLECTION ANALYSIS ===');
    console.log(`Total games: ${totalGames}`);
    console.log(`Games with userId (host): ${gamesWithUserId} (${((gamesWithUserId/totalGames)*100).toFixed(1)}%)`);
    console.log(`Games with author: ${gamesWithAuthor} (${((gamesWithAuthor/totalGames)*100).toFixed(1)}%)`);
    console.log(`Games with winner: ${gamesWithWinner} (${((gamesWithWinner/totalGames)*100).toFixed(1)}%)`);
    
    // Get sample of games without winner
    console.log('\n=== SAMPLE GAMES WITHOUT WINNER ===');
    const gamesWithoutWinner = await gamesCollection.find({ 
      winner: { $exists: false } 
    }).limit(5).toArray();
    
    for (const game of gamesWithoutWinner) {
      console.log(`- ${game.name} (${game._id}): phase="${game.gamePhase}", stopped=${!!game.stopped}`);
    }
    
    // Get sample of games without userId
    console.log('\n=== SAMPLE GAMES WITHOUT USERID ===');
    const gamesWithoutUserId = await gamesCollection.find({ 
      userId: { $exists: false } 
    }).limit(5).toArray();
    
    for (const game of gamesWithoutUserId) {
      console.log(`- ${game.name} (${game._id}): author="${game.author}"`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
  }
}

checkFields().catch(console.error);