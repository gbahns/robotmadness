import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  eloRating: number;
  peakElo: number;
  lowestElo: number;
}

// ELO calculation helpers
const INITIAL_ELO = 1500;
const BASE_K_FACTOR = 32;

// Variable K-factor: starts high for new players, decreases with experience
function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10) return BASE_K_FACTOR;        // New player
  if (gamesPlayed < 30) return BASE_K_FACTOR * 0.75; // Developing player
  return BASE_K_FACTOR * 0.5;                        // Established player
}

function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

export async function GET() {
  try {
    // Get all games with players, ordered by creation date for ELO calculation
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
      },
      orderBy: {
        createdAt: 'asc'  // Process games chronologically for ELO
      }
    });
    
    // Initialize standings and ELO ratings
    const standingsMap = new Map<string, PlayerStanding>();
    const eloHistory = new Map<string, number[]>(); // Track ELO history for peak/lowest
    const gamesPlayedCount = new Map<string, number>(); // Track games for K-factor
    
    // First pass: Initialize all players
    for (const game of games) {
      for (const player of game.players) {
        if (!player.user) {
          console.warn(`Player ${player.id} has no user, skipping`);
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
            avgOpponentsPerGame: 0,
            eloRating: INITIAL_ELO,
            peakElo: INITIAL_ELO,
            lowestElo: INITIAL_ELO
          });
          eloHistory.set(player.userId, [INITIAL_ELO]);
          gamesPlayedCount.set(player.userId, 0);
        }
      }
    }
    
    // Second pass: Calculate standings and ELO ratings chronologically
    for (const game of games) {
      const playerCount = game.players.length;
      const opponentsPerPlayer = playerCount - 1;
      
      // Get current ELO ratings and game count for all players in this game
      const gamePlayerData = game.players
        .filter(p => p.user)
        .map(player => ({
          userId: player.userId,
          currentElo: standingsMap.get(player.userId)!.eloRating,
          gamesPlayed: gamesPlayedCount.get(player.userId)!,
          isWinner: game.winnerId === player.userId
        }));
      
      // Find the winner
      const winner = gamePlayerData.find(p => p.isWinner);
      const losers = gamePlayerData.filter(p => !p.isWinner);
      
      if (!winner) {
        console.warn(`Game ${game.id} has no winner in player data`);
        continue;
      }
      
      // Calculate ELO changes using proper point conservation
      const eloChanges = new Map<string, number>();
      
      // For multiplayer: Winner gains from each loser, each loser loses to winner
      let winnerTotalGain = 0;
      
      for (const loser of losers) {
        // Calculate expected score for this 1v1 matchup
        const expectedScoreWinner = calculateExpectedScore(winner.currentElo, loser.currentElo);
        const expectedScoreLoser = 1 - expectedScoreWinner;
        
        // Use variable K-factor based on games played
        const winnerK = getKFactor(winner.gamesPlayed);
        const loserK = getKFactor(loser.gamesPlayed);
        
        // Points exchanged in this matchup (use average K for conservation)
        const avgK = (winnerK + loserK) / 2;
        const pointsExchanged = avgK * expectedScoreLoser; // Points winner gains from this loser
        
        winnerTotalGain += pointsExchanged;
        
        // Loser loses points
        const loserNewElo = loser.currentElo - pointsExchanged;
        eloChanges.set(loser.userId, loserNewElo);
      }
      
      // Winner gains all the points
      const winnerNewElo = winner.currentElo + winnerTotalGain;
      eloChanges.set(winner.userId, winnerNewElo);
      
      // Apply ELO changes and update other stats
      for (const player of game.players) {
        if (!player.user) continue;
        
        const standing = standingsMap.get(player.userId)!;
        standing.gamesPlayed++;
        standing.opponentsPlayed += opponentsPerPlayer;
        
        // Update games played count for K-factor
        gamesPlayedCount.set(player.userId, gamesPlayedCount.get(player.userId)! + 1);
        
        // Update ELO
        if (eloChanges.has(player.userId)) {
          const newRating = eloChanges.get(player.userId)!;
          
          // Check for NaN and skip if invalid
          if (isNaN(newRating)) {
            console.warn(`NaN ELO for player ${player.userId} in game ${game.id}`);
            continue;
          }
          
          standing.eloRating = Math.round(newRating);
          
          // Track peak and lowest
          const history = eloHistory.get(player.userId)!;
          history.push(standing.eloRating);
          standing.peakElo = Math.max(...history.filter(e => !isNaN(e)));
          standing.lowestElo = Math.min(...history.filter(e => !isNaN(e)));
        }
        
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
    
    // Sort by ELO rating by default (power ranking)
    standings.sort((a, b) => b.eloRating - a.eloRating);
    
    // Log average ELO for debugging
    const avgElo = standings.reduce((sum, s) => sum + s.eloRating, 0) / standings.length;
    console.log(`Average ELO: ${avgElo.toFixed(0)} (should be close to ${INITIAL_ELO})`);
    
    return NextResponse.json(standings);
  } catch (error) {
    console.error('Failed to calculate standings - full error:', error);
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to calculate standings', details: errorMessage }, { status: 500 });
  }
}