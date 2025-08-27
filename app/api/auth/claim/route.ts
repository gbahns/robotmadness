import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    // Validate inputs
    if (!email && !username) {
      return NextResponse.json(
        { error: "Please provide either email or username" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the migrated user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
          username ? { username: username.toLowerCase() } : {}
        ].filter(condition => Object.keys(condition).length > 0),
        // Only allow claiming accounts without passwords (migrated users)
        password: null
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "No unclaimed account found with this email/username. " +
                 "If you're a new user, please sign up instead." 
        },
        { status: 404 }
      );
    }

    // Check if account already has a password (already claimed)
    if (user.password) {
      return NextResponse.json(
        { error: "This account has already been claimed. Please sign in instead." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password to claim the account
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date() // Mark as verified since they proved ownership
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      }
    });

    // Count their existing games for a nice welcome message
    const gamesPlayed = await prisma.gamePlayer.count({
      where: { userId: user.id }
    });

    const gamesWon = await prisma.game.count({
      where: { winnerId: user.id }
    });

    return NextResponse.json({
      success: true,
      message: "Account successfully claimed! You can now sign in with your password.",
      user: updatedUser,
      stats: {
        gamesPlayed,
        gamesWon
      }
    });

  } catch (error) {
    console.error("Claim account error:", error);
    return NextResponse.json(
      { error: "Failed to claim account. Please try again." },
      { status: 500 }
    );
  }
}

// Check if an account can be claimed
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) {
      return NextResponse.json(
        { error: "Provide email or username to check" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
          username ? { username: username.toLowerCase() } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        password: true,
        gamesPlayed: {
          select: {
            game: {
              select: {
                createdAt: true
              }
            }
          },
          take: 1,
          orderBy: {
            game: {
              createdAt: 'desc'
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        found: false,
        message: "No account found with this information."
      });
    }

    // Check if already claimed
    if (user.password) {
      return NextResponse.json({ 
        found: true,
        claimable: false,
        message: "This account already has a password. Please sign in.",
        username: user.username
      });
    }

    // Get last played date if available
    const lastPlayed = user.gamesPlayed[0]?.game?.createdAt;

    return NextResponse.json({
      found: true,
      claimable: true,
      message: "Account found! You can claim it by setting a password.",
      username: user.username,
      displayName: user.name,
      lastPlayed: lastPlayed ? new Date(lastPlayed).toLocaleDateString() : null
    });

  } catch (error) {
    console.error("Check account error:", error);
    return NextResponse.json(
      { error: "Failed to check account status" },
      { status: 500 }
    );
  }
}