import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_ELO = 1500;
const K_FACTOR = 24;

function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function calculateNewElo(currentElo: number, expectedScore: number, actualScore: number, kFactor: number): number {
  return currentElo + kFactor * (actualScore - expectedScore);
}

async function debugElo() {
  try {
    // Get first few games
    const games = await prisma.game.findMany({
      where: { winnerId: { not: null } },
      include: {
        players: { include: { user: true } },
        winner: true
      },
      orderBy: { createdAt: 'asc' },
      take: 5
    });
    
    const eloRatings = new Map<string, number>();
    
    // Initialize all players
    for (const game of games) {
      for (const player of game.players) {
        if (!player.user || eloRatings.has(player.userId)) continue;
        eloRatings.set(player.userId, INITIAL_ELO);
        console.log(`Initialized ${player.user.username}: ${INITIAL_ELO}`);
      }
    }
    
    console.log('\n--- Processing Games ---');
    
    for (const game of games) {
      console.log(`\nGame ${game.id}: ${game.players.length} players, winner: ${game.winner?.username}`);
      
      const gamePlayerData = game.players
        .filter(p => p.user)
        .map(player => ({
          userId: player.userId,
          username: player.user!.username,
          currentElo: eloRatings.get(player.userId)!,
          isWinner: game.winnerId === player.userId
        }));
      
      console.log('Players:', gamePlayerData.map(p => `${p.username}(${p.currentElo})`).join(', '));
      
      // Calculate average opponent ELO for each player
      for (const player of gamePlayerData) {
        const opponentElos = gamePlayerData
          .filter(p => p.userId !== player.userId)
          .map(p => p.currentElo);
        
        if (opponentElos.length === 0) {
          console.log(`  ${player.username}: No opponents? Skipping`);
          continue;
        }
        
        const avgOpponentElo = opponentElos.reduce((a, b) => a + b, 0) / opponentElos.length;
        const expectedScore = calculateExpectedScore(player.currentElo, avgOpponentElo);
        const actualScore = player.isWinner ? 1 : 0;
        const newElo = calculateNewElo(player.currentElo, expectedScore, actualScore, K_FACTOR);
        
        console.log(`  ${player.username}: avgOpp=${avgOpponentElo.toFixed(0)}, exp=${expectedScore.toFixed(3)}, act=${actualScore}, new=${newElo.toFixed(0)}`);
        
        if (isNaN(newElo)) {
          console.log('    ERROR: NaN detected!');
          console.log('    currentElo:', player.currentElo);
          console.log('    opponentElos:', opponentElos);
          console.log('    avgOpponentElo:', avgOpponentElo);
          console.log('    expectedScore:', expectedScore);
        } else {
          eloRatings.set(player.userId, newElo);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugElo().catch(console.error);