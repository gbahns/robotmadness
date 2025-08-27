import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Check if account can be deleted
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has played any games
    const gamesPlayed = await prisma.gamePlayer.count({
      where: { userId: session.user.id }
    });

    const gamesHosted = await prisma.game.count({
      where: { hostId: session.user.id }
    });

    const canDelete = gamesPlayed === 0 && gamesHosted === 0;
    const canAnonymize = !canDelete && (gamesPlayed > 0 || gamesHosted > 0);

    return NextResponse.json({
      canDelete,
      canAnonymize,
      gamesPlayed,
      gamesHosted,
      message: canDelete 
        ? "Your account can be deleted as you have no game history."
        : "Your account cannot be deleted due to game history, but can be anonymized."
    });

  } catch (error) {
    console.error("Check delete eligibility error:", error);
    return NextResponse.json(
      { error: "Failed to check delete eligibility" },
      { status: 500 }
    );
  }
}

// Delete or anonymize account
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action } = await req.json();

    if (action === "delete") {
      // Check if user has any game history
      const gamesPlayed = await prisma.gamePlayer.count({
        where: { userId: session.user.id }
      });

      const gamesHosted = await prisma.game.count({
        where: { hostId: session.user.id }
      });

      if (gamesPlayed > 0 || gamesHosted > 0) {
        return NextResponse.json(
          { error: "Cannot delete account with game history. Use anonymize instead." },
          { status: 400 }
        );
      }

      // Delete user and all related data (cascading deletes)
      await prisma.user.delete({
        where: { id: session.user.id }
      });

      return NextResponse.json({
        message: "Account deleted successfully"
      });

    } else if (action === "anonymize") {
      // Anonymize the account - remove PII but keep game history
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Generate anonymous username if needed
      const anonymousUsername = `player_${crypto.randomBytes(4).toString('hex')}`;
      const anonymousEmail = `${anonymousUsername}@deleted.local`;
      
      // Keep display name for game history, or use anonymous username
      const displayName = user.name || user.username || anonymousUsername;

      // Update user to remove PII
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          email: anonymousEmail,
          username: anonymousUsername,
          name: `[Deleted User] ${displayName}`,
          password: null, // Remove password
          image: null, // Remove profile image
          emailVerified: null
        }
      });

      // Delete all OAuth accounts
      await prisma.account.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete all sessions
      await prisma.session.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete any password reset tokens
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email }
      });

      return NextResponse.json({
        message: "Account anonymized successfully. Your game history has been preserved."
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'delete' or 'anonymize'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Delete/anonymize account error:", error);
    return NextResponse.json(
      { error: "Failed to process account deletion request" },
      { status: 500 }
    );
  }
}