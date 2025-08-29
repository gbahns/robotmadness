'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react"
import Link from 'next/link';
import UserButton from '@/components/auth/UserButton';

interface GameInfo {
  roomCode: string;
  name?: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  isPractice?: boolean;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [openGames, setOpenGames] = useState<GameInfo[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [isSettingGuestName, setIsSettingGuestName] = useState(false);

  // Determine the player name from session or guest name
  const playerName = session?.user?.name || session?.user?.username || guestName;
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    // If not authenticated, check for guest name in localStorage
    if (status === 'unauthenticated') {
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        setGuestName(savedName);
      } else {
        setIsSettingGuestName(true);
      }
    }

    // Fetch open games
    fetchOpenGames();

    // Refresh open games every 5 seconds
    const interval = setInterval(fetchOpenGames, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const fetchOpenGames = async () => {
    try {
      const response = await fetch('/api/games/open');
      if (response.ok) {
        const games = await response.json();
        setOpenGames(games);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const createGame = (isPractice: boolean = false) => {
    if (!playerName?.trim()) {
      setError('Please enter your name first');
      return;
    }

    // Check authentication for real games
    if (!isPractice && !isAuthenticated) {
      setError('You must be signed in to create a real game. Please sign in or create a practice game instead.');
      return;
    }

    // Save guest name if not authenticated
    if (!isAuthenticated && guestName.trim()) {
      localStorage.setItem('playerName', guestName);
    }
    
    // Store practice mode in session storage for the game page to read
    if (isPractice) {
      sessionStorage.setItem('practiceMode', 'true');
    } else {
      sessionStorage.removeItem('practiceMode');
    }
    
    // Navigate directly to game page which will create the game
    router.push('/game/new');
  };

  const handleSetGuestName = () => {
    if (!guestName.trim()) {
      setError('Please enter a name');
      return;
    }
    const name = guestName.trim();
    localStorage.setItem('playerName', name);
    setGuestName(name);
    setIsSettingGuestName(false);
    setError('');
  };

  const joinGame = (roomCode: string, isPractice: boolean = false) => {
    // Check authentication for real games
    if (!isPractice && !isAuthenticated) {
      setError('You must be signed in to join a real game. Please sign in or join a practice game instead.');
      return;
    }
    
    if (isAuthenticated || guestName.trim()) {
      if (!isAuthenticated) {
        localStorage.setItem('playerName', guestName);
      }
      router.push(`/game/${roomCode}`);
    } else {
      setError('Please enter your name first');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Top Navigation */}
      <nav className="flex justify-center gap-6 mb-8">
        <Link href="/users" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Players
        </Link>
        <Link href="/standings" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Standings
        </Link>
        <Link href="/games" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Recent Games
        </Link>
        <Link href="/course-viewer" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Courses
        </Link>
        <Link href="/board-viewer" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Boards
        </Link>
        <Link href="/board-editor" className="text-gray-300 hover:text-yellow-400 font-medium transition-colors">
          Board Editor
        </Link>
        {session?.user?.isAdmin && (
          <Link href="/admin" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Admin
          </Link>
        )}
      </nav>

      {/* Header */}
      <div className="relative mb-8">
        <h1 className="text-6xl font-bold text-yellow-400 text-center">RobotMadness</h1>
        <div className="absolute right-0 top-0">
          <UserButton />
        </div>
      </div>

      {/* Welcome message */}
      {playerName && (
        <div className="mb-6 text-center">
          <p className="text-xl">
            Welcome, <span className="font-semibold text-yellow-400">{playerName}</span>
            {!isAuthenticated && (
              <button
                onClick={() => setIsSettingGuestName(true)}
                className="ml-4 text-sm text-gray-400 hover:text-white"
              >
                (change)
              </button>
            )}
          </p>
        </div>
      )}

      {/* Guest name input for unauthenticated users */}
      {!isAuthenticated && (!guestName.trim() || isSettingGuestName) && (
        <div className="mb-8 max-w-md mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl mb-4">Enter Your Name</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && guestName.trim()) {
                    handleSetGuestName();
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                autoFocus
              />
              <button
                onClick={handleSetGuestName}
                disabled={!guestName.trim()}
                className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 transition"
              >
                Set Name
              </button>
              {isSettingGuestName && guestName && (
                <button
                  onClick={() => setIsSettingGuestName(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              <p className="text-orange-400 mb-2">⚠️ Guests can only play practice games</p>
              <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300 font-medium">
                Sign in to play real games and track your stats
              </Link>
            </div>
            {/* Notice for returning players */}
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded text-center">
              <p className="text-sm text-blue-300">
                Played the old version?{' '}
                <Link href="/auth/claim" className="text-yellow-400 hover:text-yellow-300 font-medium">
                  Claim your account
                </Link>
                {' '}to recover your game history!
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => createGame(false)}
          disabled={!isAuthenticated || !playerName?.trim() || isSettingGuestName}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition"
          title={!isAuthenticated ? 'Sign in required to create real games' : ''}
        >
          {!isAuthenticated ? '🔒 Create Game' : 'Create Game'}
        </button>
        <button
          onClick={() => createGame(true)}
          disabled={!playerName?.trim() || isSettingGuestName}
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          Practice Game
        </button>
      </div>

      {/* Open games list */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Open Games</h2>
        {loadingGames ? (
          <div className="text-center text-gray-400">Loading games...</div>
        ) : openGames.length > 0 ? (
          <div className="grid gap-4">
            {openGames.map((game) => (
              <div
                key={game.roomCode}
                className={`bg-gray-800 p-4 rounded-lg flex items-center justify-between ${
                  game.isPractice ? 'border-l-4 border-yellow-500' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{game.name || `Game ${game.roomCode}`}</h3>
                    {game.isPractice && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-medium">
                        PRACTICE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    Room: {game.roomCode} • {game.playerCount}/{game.maxPlayers} players
                    {game.isPractice && ' • Results not recorded'}
                  </p>
                </div>
                <button
                  onClick={() => joinGame(game.roomCode, game.isPractice || false)}
                  disabled={(!playerName?.trim() || isSettingGuestName) || (!isAuthenticated && !game.isPractice)}
                  className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-lg disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                  title={!isAuthenticated && !game.isPractice ? 'Sign in required for real games' : ''}
                >
                  {!isAuthenticated && !game.isPractice ? 'Sign In Required' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            No open games. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}