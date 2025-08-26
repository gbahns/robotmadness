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

async function calculateWeightedStandings() {
  try {
    console.log('Calculating weighted standings...\n');
    
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
    
    console.log(`Processing ${games.length} games (excluding ties)...\n`);
    
    // Calculate standings for each player
    const standingsMap = new Map<string, PlayerStanding>();
    
    for (const game of games) {
      const playerCount = game.players.length;
      const opponentsPerPlayer = playerCount - 1; // Each player faces n-1 opponents
      
      for (const player of game.players) {
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
        }
      }
    }
    
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
    
    // Sort by weighted win percentage
    standings.sort((a, b) => b.weightedWinPct - a.weightedWinPct);
    
    // Display results
    console.log('=== WEIGHTED STANDINGS ===\n');
    console.log(
      'Rank'.padEnd(6) +
      'Player'.padEnd(15) +
      'Games'.padEnd(8) +
      'Wins'.padEnd(7) +
      'Trad%'.padEnd(8) +
      'OppDef'.padEnd(8) +
      'OppPlay'.padEnd(9) +
      'Weight%'.padEnd(9) +
      'AvgOpp'
    );
    console.log('-'.repeat(80));
    
    let rank = 1;
    for (const standing of standings) {
      console.log(
        String(rank++).padEnd(6) +
        standing.username.padEnd(15) +
        String(standing.gamesPlayed).padEnd(8) +
        String(standing.gamesWon).padEnd(7) +
        (standing.traditionalWinPct.toFixed(1) + '%').padEnd(8) +
        String(standing.opponentsDefeated).padEnd(8) +
        String(standing.opponentsPlayed).padEnd(9) +
        (standing.weightedWinPct.toFixed(1) + '%').padEnd(9) +
        standing.avgOpponentsPerGame.toFixed(1)
      );
    }
    
    // Verify the system maintains 50% overall
    console.log('\n=== SYSTEM VERIFICATION ===\n');
    const totalGamesPlayed = standings.reduce((sum, s) => sum + s.gamesPlayed, 0);
    const totalGamesWon = standings.reduce((sum, s) => sum + s.gamesWon, 0);
    const totalOpponentsPlayed = standings.reduce((sum, s) => sum + s.opponentsPlayed, 0);
    const totalOpponentsDefeated = standings.reduce((sum, s) => sum + s.opponentsDefeated, 0);
    
    console.log(`Total player-games: ${totalGamesPlayed}`);
    console.log(`Total wins: ${totalGamesWon}`);
    console.log(`Traditional win %: ${((totalGamesWon / totalGamesPlayed) * 100).toFixed(1)}%`);
    console.log();
    console.log(`Total opponents played: ${totalOpponentsPlayed}`);
    console.log(`Total opponents defeated: ${totalOpponentsDefeated}`);
    console.log(`Weighted win % (should be ~50%): ${((totalOpponentsDefeated / totalOpponentsPlayed) * 100).toFixed(1)}%`);
    
    // The weighted percentage should be close to 50% because:
    // - In each game, if there are N players, the winner defeats N-1 opponents
    // - Each of the N-1 losers gets 1 loss (was defeated by 1 opponent)
    // - Total defeats given out = N-1 (by the winner)
    // - Total defeats received = N-1 (1 each by losers)
    // - This maintains balance across all games
    
    console.log('\n=== TOP 5 BY TRADITIONAL WIN % ===');
    const byTraditional = [...standings].sort((a, b) => b.traditionalWinPct - a.traditionalWinPct);
    for (const standing of byTraditional.slice(0, 5)) {
      console.log(`${standing.username.padEnd(15)} ${standing.traditionalWinPct.toFixed(1)}% (${standing.gamesWon}/${standing.gamesPlayed})`);
    }
    
    console.log('\n=== TOP 5 BY WEIGHTED WIN % ===');
    for (const standing of standings.slice(0, 5)) {
      console.log(`${standing.username.padEnd(15)} ${standing.weightedWinPct.toFixed(1)}% (${standing.opponentsDefeated}/${standing.opponentsPlayed})`);
    }
    
    // Show the difference the weighting makes
    console.log('\n=== BIGGEST DIFFERENCES (Weighted vs Traditional) ===');
    const differences = standings.map(s => ({
      ...s,
      difference: s.weightedWinPct - s.traditionalWinPct
    })).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    for (const standing of differences.slice(0, 5)) {
      const sign = standing.difference >= 0 ? '+' : '';
      console.log(
        `${standing.username.padEnd(15)} ` +
        `Trad: ${standing.traditionalWinPct.toFixed(1)}% ` +
        `Weight: ${standing.weightedWinPct.toFixed(1)}% ` +
        `(${sign}${standing.difference.toFixed(1)}%)`
      );
    }
    
  } catch (error) {
    console.error('Error calculating standings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateWeightedStandings().catch(console.error);