import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStandingsAPI() {
  try {
    console.log('Testing standings API logic...\n');
    
    // Get all games with players (excluding ties where winnerId is null)
    const games = await prisma.game.findMany({
      where: {
        winnerId: { not: null }  // Exclude ties (games with no winner)
      },
      include: {
        players: {
          include: {
            user: true
          }
        },
        winner: true
      }
    });
    
    console.log(`Found ${games.length} games with winners`);
    
    if (games.length > 0) {
      console.log('\nFirst game structure:');
      const firstGame = games[0];
      console.log('Game ID:', firstGame.id);
      console.log('Winner ID:', firstGame.winnerId);
      console.log('Number of players:', firstGame.players.length);
      
      if (firstGame.players.length > 0) {
        console.log('\nFirst player structure:');
        const firstPlayer = firstGame.players[0];
        console.log('Player ID:', firstPlayer.id);
        console.log('User ID:', firstPlayer.userId);
        console.log('User:', firstPlayer.user);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStandingsAPI().catch(console.error);