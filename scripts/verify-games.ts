import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyGames() {
  try {
    // Get summary statistics
    const gameCount = await prisma.game.count();
    const playerCount = await prisma.gamePlayer.count();
    const userCount = await prisma.user.count();
    
    console.log('=== DATABASE SUMMARY ===');
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Games: ${gameCount}`);
    console.log(`Total Game Players: ${playerCount}`);
    console.log(`Average players per game: ${(playerCount / gameCount).toFixed(2)}\n`);
    
    // Status field has been removed from schema
    console.log('=== GAME STATES ===');
    console.log('Status tracking removed - all games stored with start/end times')
    
    // Get recent games
    console.log('\n=== RECENT GAMES (Last 10) ===');
    const recentGames = await prisma.game.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        host: true,
        winner: true,
        players: true
      }
    });
    
    for (const game of recentGames) {
      const date = game.createdAt.toISOString().split('T')[0];
      const hostName = game.host?.username || 'unknown';
      const winnerName = game.winner?.username || 'none';
      console.log(`${date} - "${game.name}" (${game.players.length} players) - Host: ${hostName}, Winner: ${winnerName}`);
    }
    
    // Get top players by wins
    console.log('\n=== TOP PLAYERS BY WINS ===');
    const topWinners = await prisma.game.groupBy({
      by: ['winnerId'],
      _count: true,
      where: {
        winnerId: { not: null }
      },
      orderBy: {
        _count: {
          winnerId: 'desc'
        }
      },
      take: 10
    });
    
    for (const winner of topWinners) {
      if (winner.winnerId) {
        const user = await prisma.user.findUnique({
          where: { id: winner.winnerId }
        });
        console.log(`${user?.username || 'Unknown'}: ${winner._count} wins`);
      }
    }
    
    // Get players by games played
    console.log('\n=== TOP PLAYERS BY GAMES PLAYED ===');
    const topPlayers = await prisma.gamePlayer.groupBy({
      by: ['userId'],
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });
    
    for (const player of topPlayers) {
      const user = await prisma.user.findUnique({
        where: { id: player.userId }
      });
      console.log(`${user?.username || 'Unknown'}: ${player._count} games played`);
    }
    
    // Check for data integrity
    console.log('\n=== DATA INTEGRITY CHECK ===');
    
    // Games without hosts
    const gamesWithoutHost = await prisma.game.count({
      where: { hostId: null }
    });
    console.log(`Games without host: ${gamesWithoutHost}`);
    
    // Games without players
    const gamesWithoutPlayers = await prisma.game.findMany({
      include: { players: true },
      where: {
        players: {
          none: {}
        }
      }
    });
    console.log(`Games without players: ${gamesWithoutPlayers.length}`);
    
    // Players without valid user
    const allPlayers = await prisma.gamePlayer.findMany({
      include: { user: true }
    });
    const orphanPlayers = allPlayers.filter(p => !p.user);
    console.log(`Orphaned game players: ${orphanPlayers.length}`);
    
  } catch (error) {
    console.error('Error verifying games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyGames().catch(console.error);