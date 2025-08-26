import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PlayerStanding {
  userId: string;
  username: string;
  name: string | null;
  gamesPlayed: number;
  gamesWon: number;
  traditionalWinPct: number;
  opponentsPlayed: number;
  opponentsDefeated: number;
  weightedWinPct: number;
  avgOpponentsPerGame: number;
}

async function testDetailedStandings() {
  try {
    console.log('Testing detailed standings calculation...\n');
    
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
    
    console.log(`Processing ${games.length} games...\n`);
    
    // Calculate standings for each player
    const standingsMap = new Map<string, PlayerStanding>();
    
    for (const game of games) {
      const playerCount = game.players.length;
      const opponentsPerPlayer = playerCount - 1; // Each player faces n-1 opponents
      
      console.log(`Game ${game.id}: ${playerCount} players, winner: ${game.winnerId}`);
      
      for (const player of game.players) {
        if (!player.user) {
          console.error(`Player ${player.id} has no user!`);
          continue;
        }
        
        if (!standingsMap.has(player.userId)) {
          standingsMap.set(player.userId, {
            userId: player.userId,
            username: player.user.username,
            name: player.user.name,
            gamesPlayed: 0,
            gamesWon: 0,
            traditionalWinPct: 0,
            opponentsPlayed: 0,
            opponentsDefeated: 0,
            weightedWinPct: 0,
            avgOpponentsPerGame: 0
          });
        }
        
        const standing = standingsMap.get(player.userId)!;
        standing.gamesPlayed++;
        standing.opponentsPlayed += opponentsPerPlayer;
        
        // Check if this player won
        if (game.winnerId === player.userId) {
          standing.gamesWon++;
          standing.opponentsDefeated += opponentsPerPlayer;
          console.log(`  Winner: ${player.user.username} defeated ${opponentsPerPlayer} opponents`);
        }
      }
    }
    
    console.log(`\nCalculated standings for ${standingsMap.size} players`);
    
    // Calculate percentages and averages
    const standings: PlayerStanding[] = [];
    for (const standing of standingsMap.values()) {
      standing.traditionalWinPct = standing.gamesPlayed > 0 
        ? (standing.gamesWon / standing.gamesPlayed) * 100 
        : 0;
      
      standing.weightedWinPct = standing.opponentsPlayed > 0 
        ? (standing.opponentsDefeated / standing.opponentsPlayed) * 100 
        : 0;
      
      standing.avgOpponentsPerGame = standing.gamesPlayed > 0 
        ? standing.opponentsPlayed / standing.gamesPlayed 
        : 0;
      
      standings.push(standing);
    }
    
    // Sort by weighted win percentage by default
    standings.sort((a, b) => b.weightedWinPct - a.weightedWinPct);
    
    console.log('\nTop 5 players:');
    for (const player of standings.slice(0, 5)) {
      console.log(`${player.username}: ${player.weightedWinPct.toFixed(1)}% (${player.gamesWon}/${player.gamesPlayed} games)`);
    }
    
    console.log('\nSuccess! Would return', standings.length, 'player standings');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDetailedStandings().catch(console.error);