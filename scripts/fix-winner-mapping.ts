import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MONGO_URI = 'mongodb://gbahns:Spank921@droidraces-shard-00-00-zb636.mongodb.net:27017,droidraces-shard-00-01-zb636.mongodb.net:27017,droidraces-shard-00-02-zb636.mongodb.net:27017/droidraces?ssl=true&replicaSet=droidraces-shard-0&authSource=admin';

async function fixWinnerMapping() {
  const mongoClient = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoClient.connect();
    const db = mongoClient.db('droidraces');
    
    const gamesCollection = db.collection('games');
    const mongoGames = await gamesCollection.find({}).toArray();
    
    console.log(`Found ${mongoGames.length} games in MongoDB\n`);
    
    // Create a mapping for special cases
    const winnerMapping: Record<string, string | null> = {
      'marco bahns': 'marco.bahns',  // Space vs dot difference
      'Nobody': null,                 // No winner / tie game
    };
    
    let updatedCount = 0;
    let nobodyCount = 0;
    
    for (const mongoGame of mongoGames) {
      if (!mongoGame.winner || mongoGame.winner === '') {
        continue;
      }
      
      let winnerId = null;
      
      // Check for special mappings first
      if (winnerMapping.hasOwnProperty(mongoGame.winner)) {
        const mappedUsername = winnerMapping[mongoGame.winner];
        if (mappedUsername === null) {
          // "Nobody" won - leave winnerId as null
          nobodyCount++;
          winnerId = null;
        } else {
          // Find user with mapped username
          const user = await prisma.user.findFirst({
            where: { username: mappedUsername }
          });
          winnerId = user?.id || null;
        }
      } else {
        // Try exact match
        const user = await prisma.user.findFirst({
          where: { username: mongoGame.winner }
        });
        winnerId = user?.id || null;
        
        // If no exact match, try case-insensitive
        if (!winnerId) {
          const userCI = await prisma.user.findFirst({
            where: { 
              OR: [
                { username: { equals: mongoGame.winner } },
                { name: { equals: mongoGame.winner } }
              ]
            }
          });
          winnerId = userCI?.id || null;
        }
      }
      
      // Update the game in SQLite
      if (winnerId !== undefined) {
        try {
          await prisma.game.update({
            where: { id: mongoGame._id },
            data: { winnerId: winnerId }
          });
          updatedCount++;
          
          if (winnerId) {
            const user = await prisma.user.findUnique({ where: { id: winnerId } });
            console.log(`✓ Updated game "${mongoGame.name}": winner="${mongoGame.winner}" → ${user?.username || 'unknown'}`);
          } else {
            console.log(`✓ Updated game "${mongoGame.name}": winner="${mongoGame.winner}" → null (Nobody/tie)`);
          }
        } catch (error: any) {
          console.log(`✗ Failed to update game ${mongoGame._id}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n=== UPDATE SUMMARY ===`);
    console.log(`Games updated: ${updatedCount}`);
    console.log(`Games with "Nobody" as winner: ${nobodyCount}`);
    
    // Verify the results
    const totalGames = await prisma.game.count();
    const gamesWithWinner = await prisma.game.count({ 
      where: { winnerId: { not: null } } 
    });
    
    console.log(`\n=== FINAL VERIFICATION ===`);
    console.log(`Total games in SQLite: ${totalGames}`);
    console.log(`Games with winner: ${gamesWithWinner}`);
    console.log(`Games without winner: ${totalGames - gamesWithWinner}`);
    
    // Show winner breakdown
    const winners = await prisma.game.groupBy({
      by: ['winnerId'],
      _count: true,
      where: {
        winnerId: { not: null }
      },
      orderBy: {
        _count: {
          winnerId: 'desc'
        }
      }
    });
    
    console.log(`\n=== WINNER BREAKDOWN ===`);
    for (const winner of winners) {
      if (winner.winnerId) {
        const user = await prisma.user.findUnique({
          where: { id: winner.winnerId }
        });
        console.log(`${user?.username || 'Unknown'}: ${winner._count} wins`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

fixWinnerMapping().catch(console.error);