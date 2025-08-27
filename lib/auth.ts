import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          username: profile.email?.split('@')[0] + Math.floor(Math.random() * 1000),
          image: profile.picture,
        }
      }
    }),
    
    // Discord OAuth
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const username = profile.username || profile.global_name?.toLowerCase().replace(/\s+/g, '') || 'user' + profile.id;
        return {
          id: profile.id,
          email: profile.email || `${username}@discord.local`,
          name: profile.global_name || profile.username,
          username: username,
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
        
        try {
          // Dynamic import to avoid edge runtime issues
          const bcrypt = await import("bcryptjs")
          
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
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt"
  },
  
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        const userData = user as { username?: string }
        token.username = userData.username
      }
      
      // Return previous token if the user is already signed in
      // and we're just linking a new account
      if (trigger === "signIn" && token.id && account) {
        // Account linking - keep existing token
        return token
      }
      
      // For subsequent requests, ensure we have the user data
      if (token.id && !token.username) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true }
        })
        if (dbUser) {
          token.username = dbUser.username
        }
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
    
    async signIn({ user, account }) {
      // Allow OAuth sign-ins
      if (!account) return true;
      
      console.log(`OAuth Sign-in: provider=${account.provider}, email=${user.email}, accountId=${account.providerAccountId}`);
      
      // Check if we're linking to an existing account (cookie set by link endpoint)
      // Note: We need to handle this differently since NextAuth doesn't pass cookies directly
      
      // For OAuth signins, check if we should link to existing account
      if (account.provider && user.email) {
        // First try to find user by email
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        if (dbUser) {
          console.log(`Found existing user: id=${dbUser.id}, email=${dbUser.email}, username=${dbUser.username}`);
          // Check if this OAuth account is already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            }
          })
          
          // If not linked yet, link it to the existing user
          if (!existingAccount) {
            console.log(`Linking ${account.provider} account to existing user ${dbUser.id}`);
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null
              }
            })
          } else {
            console.log(`${account.provider} account already linked to user ${dbUser.id}`);
            // Account already linked - this is fine for account linking flow
            // NextAuth will handle the session appropriately
          }
          
          // Ensure username is set if missing
          if (!dbUser.username) {
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
          
          // Override the user id to use the existing user
          user.id = dbUser.id
        } else {
          console.log(`No existing user found with email ${user.email}. A new account will be created.`);
        }
      }
      return true
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)