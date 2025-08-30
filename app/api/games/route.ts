// app/api/games/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    // const { name, playerName } = await request.json();
    await request.json(); // Parse body but don't use values (database disabled)
    
    // Generate room code (no database uniqueness check for now)
    const roomCode = generateRoomCode();
    
    // DATABASE DISABLED - Just return the room code without persisting to database
    // TODO: Re-enable database operations when adding full database support
    /*
    // Make sure room code is unique
    while (attempts < 10) {
      const existing = await prisma.game.findUnique({
        where: { roomCode },
      });
      
      if (!existing) break;
      
      roomCode = generateRoomCode();
      attempts++;
    }
    
    // Create the game
    const game = await prisma.game.create({
      data: {
        roomCode,
        name: name || `RobotMadness Game`,
        state: JSON.stringify({
          phase: 'waiting',
          players: {},
          board: null,
          currentRegister: 0,
          roundNumber: 0,
        }),
      },
    });
    */
    
    return NextResponse.json({ 
      roomCode: roomCode,
      gameId: roomCode, // Use roomCode as temporary gameId
    });
    
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        roomCode: true,
        name: true,
        boardName: true,
        courseName: true,
        isPractice: true,
        startedAt: true,
        endedAt: true,
        totalDuration: true,
        createdAt: true,
        finalResults: true,
        host: {
          select: {
            username: true,
            name: true,
          }
        },
        winner: {
          select: {
            username: true,
            name: true,
          }
        },
        players: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            players: true,
          }
        }
      }
    });
    
    return NextResponse.json(games);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
