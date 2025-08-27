import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { provider } = await req.json();

    if (!provider || !['google', 'discord'].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    // Store the user ID in session/cookie to link after OAuth callback
    // This will be handled by NextAuth's account linking
    // For now, return the OAuth URL to redirect to
    const callbackUrl = `/settings?linked=${provider}`;
    
    return NextResponse.json({
      message: "Redirecting to OAuth provider",
      provider,
      // The client will initiate the OAuth flow
      redirectUrl: `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    });

  } catch (error) {
    console.error("Link account error:", error);
    return NextResponse.json(
      { error: "Failed to initiate account linking" },
      { status: 500 }
    );
  }
}