import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function exploreStandingsView() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    // Check if it's actually a view
    const collections = await db.listCollections().toArray();
    const standingsInfo = collections.find(c => c.name === 'standings');
    console.log('=== STANDINGS INFO ===');
    console.log('Type:', standingsInfo?.type);
    // MongoDB views have options, but TypeScript doesn't know about them
    type ViewInfo = { name: string; type: string; options?: { viewOn: string; pipeline: unknown[] } };
    if (standingsInfo && 'options' in standingsInfo) {
      const viewWithOptions = standingsInfo as ViewInfo;
      if (viewWithOptions.options?.viewOn) {
        console.log('View on collection:', viewWithOptions.options.viewOn);
        console.log('\nPipeline:');
        console.log(JSON.stringify(viewWithOptions.options.pipeline, null, 2));
      }
    }
    
    // Get sample documents
    const standingsCollection = db.collection('standings');
    const standings = await standingsCollection.find({}).sort({ weighted_pct: -1 }).toArray();
    
    console.log('\n=== STANDINGS DATA ===');
    console.log(`Total players in standings: ${standings.length}`);
    
    console.log('\n=== STANDINGS STRUCTURE ===');
    if (standings.length > 0) {
      console.log('Fields:', Object.keys(standings[0]));
      
      console.log('\n=== TOP 10 PLAYERS BY WEIGHTED PERCENTAGE ===');
      console.log('Name'.padEnd(15) + 
                  'Games'.padEnd(8) + 
                  'Wins'.padEnd(8) + 
                  'Win%'.padEnd(8) + 
                  'OppDef'.padEnd(10) + 
                  'OppPlayed'.padEnd(12) + 
                  'Weighted%');
      console.log('-'.repeat(70));
      
      for (const player of standings.slice(0, 10)) {
        const winPct = player.games > 0 ? ((player.wins / player.games) * 100).toFixed(1) : '0.0';
        const weightedPct = (player.weighted_pct * 100).toFixed(1);
        
        console.log(
          player.name.padEnd(15) +
          String(player.games).padEnd(8) +
          String(player.wins).padEnd(8) +
          (winPct + '%').padEnd(8) +
          String(player.opponents_defeated).padEnd(10) +
          String(player.opponents_played).padEnd(12) +
          weightedPct + '%'
        );
      }
      
      console.log('\n=== SAMPLE FULL RECORD ===');
      console.log(JSON.stringify(standings[0], null, 2));
      
      // Verify the formula
      console.log('\n=== FORMULA VERIFICATION ===');
      for (const player of standings.slice(0, 3)) {
        const calculatedWeighted = player.opponents_played > 0 
          ? player.opponents_defeated / player.opponents_played
          : 0;
        const matches = Math.abs(calculatedWeighted - player.weighted_pct) < 0.0001;
        
        console.log(`${player.name}:`);
        console.log(`  Stored weighted_pct: ${player.weighted_pct}`);
        console.log(`  Calculated (oppDef/oppPlayed): ${calculatedWeighted}`);
        console.log(`  Formula matches: ${matches ? '✓' : '✗'}`);
      }
      
      // Check totals to verify the 50% preservation
      console.log('\n=== SYSTEM-WIDE STATISTICS ===');
      const totalGames = standings.reduce((sum, p) => sum + p.games, 0);
      const totalWins = standings.reduce((sum, p) => sum + p.wins, 0);
      const totalOppDefeated = standings.reduce((sum, p) => sum + p.opponents_defeated, 0);
      const totalOppPlayed = standings.reduce((sum, p) => sum + p.opponents_played, 0);
      
      console.log(`Total games played (sum): ${totalGames}`);
      console.log(`Total wins: ${totalWins}`);
      console.log(`Total opponents defeated: ${totalOppDefeated}`);
      console.log(`Total opponents played: ${totalOppPlayed}`);
      console.log(`Overall win % (traditional): ${((totalWins / totalGames) * 100).toFixed(1)}%`);
      console.log(`Overall win % (weighted): ${((totalOppDefeated / totalOppPlayed) * 100).toFixed(1)}%`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
  }
}

exploreStandingsView().catch(console.error);