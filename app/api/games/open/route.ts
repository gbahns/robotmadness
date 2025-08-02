// app/api/games/open/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from our Socket.io server
    const response = await fetch('http://localhost:3000/api/socket/games');
    
    if (!response.ok) {
      throw new Error('Failed to fetch games from socket server');
    }
    
    const games = await response.json();
    return NextResponse.json(games);
    
  } catch (error) {
    console.error('Error fetching open games:', error);
    // Return empty array on error
    return NextResponse.json([]);
  }
}
