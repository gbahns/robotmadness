import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function exploreGamesView() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // Check if it's actually a view
    const collections = await db.listCollections().toArray();
    const gamesViewInfo = collections.find(c => c.name === 'games_view');
    console.log('=== GAMES_VIEW INFO ===');
    console.log('Type:', gamesViewInfo?.type);
    if (gamesViewInfo?.options?.viewOn) {
      console.log('View on collection:', gamesViewInfo.options.viewOn);
      console.log('Pipeline:', JSON.stringify(gamesViewInfo.options.pipeline, null, 2));
    }
    
    // Get a sample document
    const gamesViewCollection = db.collection('games_view');
    const sampleDoc = await gamesViewCollection.findOne();
    
    console.log('\n=== GAMES_VIEW STRUCTURE ===');
    console.log('Fields at root level:');
    console.log(Object.keys(sampleDoc || {}));
    
    console.log('\n=== COMPARISON: GAMES vs GAMES_VIEW ===');
    const gamesCollection = db.collection('games');
    const sampleGame = await gamesCollection.findOne({ _id: sampleDoc?._id });
    
    console.log('\nGAMES collection fields:');
    console.log(Object.keys(sampleGame || {}));
    
    console.log('\nGAMES_VIEW collection fields:');
    console.log(Object.keys(sampleDoc || {}));
    
    console.log('\n=== FIELDS ONLY IN GAMES ===');
    const gamesOnlyFields = Object.keys(sampleGame || {}).filter(
      key => !Object.keys(sampleDoc || {}).includes(key)
    );
    console.log(gamesOnlyFields);
    
    console.log('\n=== FIELDS ONLY IN GAMES_VIEW ===');
    const viewOnlyFields = Object.keys(sampleDoc || {}).filter(
      key => !Object.keys(sampleGame || {}).includes(key)
    );
    console.log(viewOnlyFields);
    
    console.log('\n=== EMBEDDED PLAYERS DATA ===');
    if (sampleDoc?.players && Array.isArray(sampleDoc.players)) {
      console.log(`Number of players: ${sampleDoc.players.length}`);
      console.log('Player fields:');
      console.log(Object.keys(sampleDoc.players[0] || {}));
      
      console.log('\nSample player data:');
      console.log(JSON.stringify(sampleDoc.players[0], null, 2));
    }
    
    // Check what aggregation might be happening
    console.log('\n=== DATA ENRICHMENT CHECK ===');
    console.log('Games collection sample:');
    console.log('- userId:', sampleGame?.userId);
    console.log('- author:', sampleGame?.author);
    console.log('- winner:', sampleGame?.winner);
    
    console.log('\nGames_view collection sample:');
    console.log('- userId:', sampleDoc?.userId);  
    console.log('- author:', sampleDoc?.author);
    console.log('- winner:', sampleDoc?.winner);
    console.log('- players:', sampleDoc?.players?.length);
    console.log('- player_count:', sampleDoc?.player_count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
  }
}

exploreGamesView().catch(console.error);