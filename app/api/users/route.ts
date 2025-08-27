import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      include: {
        gamesPlayed: {
          where: {
            game: {
              isPractice: false  // Only count non-practice games
            }
          }
        },
        wonGames: {
          where: {
            isPractice: false  // Only count non-practice games
          }
        }
      }
    });
    
    // Transform to include counts
    const usersWithCounts = users.map(user => ({
      ...user,
      _count: {
        gamesPlayed: user.gamesPlayed.length,
        wonGames: user.wonGames.length
      },
      // Remove the actual game arrays to reduce payload
      gamesPlayed: undefined,
      wonGames: undefined
    }));
    
    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}