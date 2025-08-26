import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

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