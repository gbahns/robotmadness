import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const games = await prisma.game.findMany({
      select: {
        id: true,
        roomCode: true,
        name: true,
        boardName: true,
        isPractice: true,
        startedAt: true,
        endedAt: true,
        host: {
          select: {
            username: true,
          }
        },
        winner: {
          select: {
            username: true,
          }
        },
        _count: {
          select: {
            players: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}