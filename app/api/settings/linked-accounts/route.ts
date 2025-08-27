import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all linked accounts for the user
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        providerAccountId: true
      }
    });

    // Transform to a simpler format
    const linkedProviders = accounts.reduce((acc, account) => {
      acc[account.provider] = true;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json({
      google: linkedProviders.google || false,
      discord: linkedProviders.discord || false,
      accounts: accounts
    });

  } catch (error) {
    console.error("Get linked accounts error:", error);
    return NextResponse.json(
      { error: "Failed to get linked accounts" },
      { status: 500 }
    );
  }
}

// DELETE method to unlink an account
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { provider } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Check if user has at least one other way to sign in
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Count authentication methods
    const accountCount = user.accounts.length;
    const hasPassword = !!user.password;
    
    // Ensure user will have at least one way to sign in
    if (accountCount <= 1 && !hasPassword) {
      return NextResponse.json(
        { error: "Cannot unlink your only authentication method. Please set a password first." },
        { status: 400 }
      );
    }

    // Delete the account link
    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: provider
      }
    });

    return NextResponse.json({
      message: `${provider} account unlinked successfully`
    });

  } catch (error) {
    console.error("Unlink account error:", error);
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    );
  }
}