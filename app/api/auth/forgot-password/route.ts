import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return NextResponse.json({
        message: "This account uses social login. Please sign in with Google or Discord."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email }
    });

    // Create new reset token (expires in 1 hour)
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashedToken,
        expires: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    // In production, you would send an email here
    // For development, we'll return the token in the response
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    // TODO: Send email with reset link
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    
    // In development, return the URL for testing
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        message: "Password reset link generated (development mode)",
        resetUrl // Remove this in production!
      });
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}