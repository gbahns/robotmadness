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
            
            <Link
              href="/settings"
              onClick={() => setShowDropdown(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Account Settings
            </Link>
            
            <div className="border-t border-gray-700">
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
          </div>
        </>
      )}
    </div>
  )
}