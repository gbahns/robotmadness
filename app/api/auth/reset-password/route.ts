import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        // Mark email as verified since they received the reset email
        emailVerified: user.emailVerified || new Date()
      }
    });

    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    // Delete all other reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email }
    });

    return NextResponse.json({
      message: "Password reset successful. You can now sign in with your new password."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}