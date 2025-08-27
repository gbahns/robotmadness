import { MongoClient } from 'mongodb';

// MongoDB connection - set MONGO_URI environment variable with connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable not set!');
  console.error('Please set MONGO_URI with your MongoDB connection string');
  process.exit(1);
}

async function exploreCollections() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // Explore games collection
    console.log('=== GAMES COLLECTION ===');
    const gamesCollection = db.collection('games');
    const gamesCount = await gamesCollection.countDocuments();
    console.log(`Total games: ${gamesCount}`);
    
    const sampleGame = await gamesCollection.findOne();
    console.log('\nSample game document:');
    console.log(JSON.stringify(sampleGame, null, 2));
    
    // Explore players collection
    console.log('\n\n=== PLAYERS COLLECTION ===');
    const playersCollection = db.collection('players');
    const playersCount = await playersCollection.countDocuments();
    console.log(`Total players: ${playersCount}`);
    
    const samplePlayer = await playersCollection.findOne();
    console.log('\nSample player document:');
    console.log(JSON.stringify(samplePlayer, null, 2));
    
    // Check games_view collection
    console.log('\n\n=== GAMES_VIEW COLLECTION ===');
    const gamesViewCollection = db.collection('games_view');
    const gamesViewCount = await gamesViewCollection.countDocuments();
    console.log(`Total games_view: ${gamesViewCount}`);
    
    const sampleGameView = await gamesViewCollection.findOne();
    if (sampleGameView) {
      console.log('\nSample games_view document:');
      console.log(JSON.stringify(sampleGameView, null, 2));
    }
    
    // Check if there are any relationships
    console.log('\n\n=== CHECKING RELATIONSHIPS ===');
    
    // Get a game with players
    const gameWithPlayers = await gamesCollection.findOne({ playerIds: { $exists: true, $ne: [] } });
    if (gameWithPlayers) {
      console.log('\nGame with players:');
      console.log('Game ID:', gameWithPlayers._id);
      console.log('Player IDs:', gameWithPlayers.playerIds);
      
      if (gameWithPlayers.playerIds && gameWithPlayers.playerIds.length > 0) {
        // Get the corresponding player documents
        const players = await playersCollection.find({ 
          _id: { $in: gameWithPlayers.playerIds } 
        }).toArray();
        console.log('\nCorresponding players:');
        players.forEach(p => {
          console.log(`- Player ${p._id}: ${p.name || p.username || 'unnamed'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error exploring collections:', error);
  } finally {
    await mongoClient.close();
  }
}

exploreCollections().catch(console.error);