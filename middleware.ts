import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isGamePage = req.nextUrl.pathname.startsWith("/game")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  
  // For now, allow game access without auth (gradual migration)
  // We'll enable this later once auth is fully integrated
  // if (isGamePage && !isLoggedIn && !isApiRoute) {
  //   return NextResponse.redirect(new URL("/auth/signin", req.url))
  // }
  
  // Redirect auth pages if logged in
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}