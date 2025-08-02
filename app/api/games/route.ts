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
    const { name, playerName } = await request.json();
    
    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    
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
    
    return NextResponse.json({ 
      roomCode: game.roomCode,
      gameId: game.id,
    });
    
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
