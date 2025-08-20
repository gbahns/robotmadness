// app/api/games/route.ts

import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // DATABASE DISABLED - TODO: Re-enable when adding full database support

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
