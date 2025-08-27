import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, password, username, name } = await req.json()

    // Validate
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        )
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name: name || username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      }
    })

    return NextResponse.json({
      message: "Account created successfully",
      user
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}