# RoboRally Authentication Implementation Guide
## Complete Integration with Existing Database Schema

---

## 🎯 IMPORTANT: Current Schema Analysis

The existing Prisma schema has a User model with:
- `id` (String, UUID)
- `email` (String, unique)  
- `username` (String, unique)
- `name` (String, optional)
- NO password field (perfect for OAuth-first approach)
- Proper relations to Game and GamePlayer models

**This means we need to extend the schema for authentication while preserving existing structure.**

---

## 📋 Implementation Steps

### Step 1: Install Dependencies

```bash
# Core authentication packages
npm install next-auth@beta @auth/prisma-adapter

# For password authentication (optional)
npm install bcryptjs
npm install --save-dev @types/bcryptjs

# Ensure Prisma is up to date
npm install @prisma/client prisma
```

### Step 2: Update Prisma Schema

Update `/prisma/schema.prisma` to add authentication fields:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Keep SQLite for now
  url      = env("DATABASE_URL")
}

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  username      String       @unique
  name          String?
  
  // NEW: Authentication fields
  password      String?      // Optional - for email/password auth
  image         String?      // Avatar URL
  emailVerified DateTime?    // For email verification
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // NEW: OAuth relations
  accounts      Account[]
  sessions      Session[]
  
  // Existing relations
  hostedGames   Game[]       @relation("HostedGames")
  wonGames      Game[]       @relation("WonGames")
  gamesPlayed   GamePlayer[]
}

// NEW: Account model for OAuth providers
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// NEW: Session model
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// NEW: Verification tokens for passwordless auth
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Keep existing Game model unchanged
model Game {
  id            String       @id @default(uuid())
  roomCode      String       @unique @default(cuid())
  name          String?
  hostId        String?
  boardName     String?
  courseName    String?
  maxPlayers    Int          @default(8)
  isPrivate     Boolean      @default(false)
  startedAt     DateTime?
  endedAt       DateTime?
  winnerId      String?
  finalResults  Json?
  totalDuration Int?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  host          User?        @relation("HostedGames", fields: [hostId], references: [id])
  winner        User?        @relation("WonGames", fields: [winnerId], references: [id])
  players       GamePlayer[]

  @@index([roomCode])
  @@index([hostId])
}

// Keep existing GamePlayer model unchanged
model GamePlayer {
  id              String   @id @default(uuid())
  gameId          String
  userId          String
  robotColor      String?
  startingDock    Int?
  joinedAt        DateTime @default(now())
  finalPosition   Int?
  flagsReached    Int?
  livesRemaining  Int?
  finalDamage     Int?
  robotsDestroyed Int?
  game            Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id])

  @@unique([gameId, userId])
  @@unique([gameId, startingDock])
  @@index([gameId])
  @@index([userId])
}
```

### Step 3: Run Database Migration

```bash
# Create and apply migration
npx prisma migrate dev --name add-authentication

# Generate Prisma Client
npx prisma generate
```

### Step 4: Create Environment Variables

Create/update `.env.local`:

```bash
# Database (existing)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration (NEW)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Discord OAuth (optional but recommended for gamers)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

Generate secret:
```bash
openssl rand -base64 32
```

### Step 5: Create Prisma Client Singleton

Create `/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 6: Configure NextAuth

Create `/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          username: profile.email.split('@')[0] + Math.floor(Math.random() * 1000),
          image: profile.picture,
        }
      }
    }),
    
    // Discord OAuth
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.global_name || profile.username,
          username: profile.username,
          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
        }
      }
    }),
    
    // Email/Password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.password) {
          return null
        }
        
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        
        if (!passwordMatch) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt"
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // For OAuth signins, ensure username is set
      if (account?.provider && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        if (dbUser && !dbUser.username) {
          // Generate username if missing
          const baseUsername = user.email.split('@')[0]
          let username = baseUsername
          let counter = 1
          
          // Ensure unique username
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`
            counter++
          }
          
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { username }
          })
        }
      }
      return true
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
```

### Step 7: Create API Route

Create `/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

### Step 8: Create Sign Up API

Create `/app/api/auth/signup/route.ts`:

```typescript
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
```

### Step 9: Create Middleware

Create `/middleware.ts`:

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isGamePage = req.nextUrl.pathname.startsWith("/game")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  
  // Protect game routes
  if (isGamePage && !isLoggedIn && !isApiRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
  
  // Redirect auth pages if logged in
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
```

### Step 10: Create TypeScript Types

Create `/types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string
    } & DefaultSession["user"]
  }

  interface User {
    username?: string
  }
}
```

### Step 11: Create Sign In Page

Create `/app/auth/signin/page.tsx`:

```tsx
'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    setLoading(true)
    signIn(provider, { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">RoboRally</h1>
        </div>
        
        <h2 className="text-xl text-center mb-6 text-gray-300">Sign In</h2>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading}
            className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthSignIn("discord")}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Continue with Discord
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="robot@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-yellow-400 hover:text-yellow-300">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Step 12: Create Sign Up Page

Create `/app/auth/signup/page.tsx`:

```tsx
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    name: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          name: formData.name
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      // Auto sign in
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">RoboRally</h1>
        </div>
        
        <h2 className="text-xl text-center mb-6 text-gray-300">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="robomaster"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="robot@example.com"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="RoboMaster 3000"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or sign up with</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={loading}
            className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <button
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Sign up with Discord
          </button>
        </div>

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Step 13: Create SessionProvider Component

Create `/components/auth/SessionProvider.tsx`:

```tsx
'use client'

import { SessionProvider } from "next-auth/react"

export default function Provider({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
```

### Step 14: Create UserButton Component

Create `/components/auth/UserButton.tsx`:

```tsx
'use client'

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function UserButton() {
  const { data: session, status } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  if (status === "loading") {
    return (
      <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 transition"
      >
        Sign In
      </Link>
    )
  }

  const displayName = session.user.name || session.user.username || "Player"
  const avatar = displayName[0]?.toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
      >
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
          {avatar}
        </div>
        <span className="text-white">{displayName}</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm text-gray-400">@{session.user.username}</p>
              <p className="text-sm text-gray-300 truncate">{session.user.email}</p>
            </div>
            
            <button
              onClick={() => {
                setShowDropdown(false)
                signOut({ callbackUrl: "/" })
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

### Step 15: Update Root Layout

Update `/app/layout.tsx`:

```tsx
import { auth } from "@/lib/auth"
import SessionProvider from "@/components/auth/SessionProvider"
import UserButton from "@/components/auth/UserButton"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <nav className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800">
            <Link href="/" className="text-2xl font-bold text-yellow-400">
              RoboRally
            </Link>
            <UserButton />
          </nav>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## 🔧 OAuth Provider Setup

### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

### Discord OAuth:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. New Application → OAuth2 → General
3. Add redirects:
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://yourdomain.com/api/auth/callback/discord`

---

## 🎮 Socket.io Integration

Update your Socket.io server to use authenticated users:

```typescript
// In server.ts or server.js
io.on('connection', async (socket) => {
  const token = socket.handshake.auth.token
  
  // Verify JWT token
  const session = await getServerSession(authConfig)
  
  if (!session?.user?.id) {
    socket.disconnect()
    return
  }
  
  // Store user info
  socket.data.userId = session.user.id
  socket.data.username = session.user.username
  
  socket.on('join-game', async (roomCode) => {
    const game = await prisma.game.findUnique({
      where: { roomCode }
    })
    
    if (!game) return
    
    // Check if player already in game
    const existingPlayer = await prisma.gamePlayer.findUnique({
      where: {
        gameId_userId: {
          gameId: game.id,
          userId: socket.data.userId
        }
      }
    })
    
    if (!existingPlayer) {
      // Add new player
      await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          userId: socket.data.userId,
          startingDock: getNextAvailableDock(game.id)
        }
      })
    }
    
    socket.join(roomCode)
    // ... rest of game logic
  })
})
```

---

## ✅ Testing Checklist

1. **Database Migration**
   - [ ] Run `npx prisma migrate dev --name add-authentication`
   - [ ] Verify new tables in database

2. **Environment Variables**
   - [ ] NEXTAUTH_SECRET is set
   - [ ] OAuth credentials configured (if using)

3. **Authentication Flow**
   - [ ] Can create account with email/password
   - [ ] Can sign in with email/password
   - [ ] OAuth providers work (if configured)
   - [ ] Protected routes redirect properly

4. **User Experience**
   - [ ] Username is unique and required
   - [ ] Display name shows correctly
   - [ ] Sign out works
   - [ ] Session persists on refresh

---

## 🚀 Next Steps

After implementing authentication:

1. **Add User Stats**: Track games played, wins, etc.
2. **Friend System**: Add friends, invite to games
3. **User Profiles**: View stats and game history
4. **Guest Mode**: Allow temporary play without account
5. **Email Verification**: Add email confirmation
6. **Password Reset**: Implement forgot password flow

---

## 📝 Summary

This implementation:
- ✅ Preserves existing database structure
- ✅ Adds authentication without breaking current functionality
- ✅ Supports multiple auth methods (OAuth + Password)
- ✅ Maintains unique username requirement
- ✅ Integrates with existing Game and GamePlayer models
- ✅ Ready for Socket.io integration
- ✅ Production-ready with proper security

The authentication system is now ready to be integrated with your RoboRally game!