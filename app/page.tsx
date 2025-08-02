// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GameInfo {
  roomCode: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
}

export default function Home() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [openGames, setOpenGames] = useState<GameInfo[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }

    // Fetch open games
    fetchOpenGames();

    // Refresh open games every 5 seconds
    const interval = setInterval(fetchOpenGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpenGames = async () => {
    try {
      const response = await fetch('/api/games/open');
      if (response.ok) {
        const games = await response.json();
        setOpenGames(games);
      }
    } catch (err) {
      console.error('Failed to fetch open games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const createGame = async () => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gameName || 'RobotMadness Game', playerName }),
      });

      if (!response.ok) throw new Error('Failed to create game');

      const { roomCode } = await response.json();

      // Save player name and ID
      if (playerName.trim()) {
        localStorage.setItem('playerName', playerName);
        const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('playerId', playerId);
      }

      // Navigate to the game
      router.push(`/game/${roomCode}`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      console.error('Create game error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8 text-green-400">RobotMadness</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/Join Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded mb-4"
            >
              Create New Game
            </button>
            <p className="text-gray-400 text-center">or join an open game →</p>
          </div>

          {/* Open Games Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Open Games</h2>
            {loadingGames ? (
              <p className="text-gray-400">Loading games...</p>
            ) : openGames.length > 0 ? (
              <div className="space-y-2">
                {openGames.map((game) => (
                  <div
                    key={game.roomCode}
                    className="flex justify-between items-center p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
                    onClick={() => {
                      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      sessionStorage.setItem('playerId', playerId);
                      router.push(`/game/${game.roomCode}`);
                    }}
                  >
                    <div>
                      <p className="font-semibold">{game.name}</p>
                      <p className="text-sm text-gray-400">Room: {game.roomCode}</p>
                    </div>
                    <span className="text-sm">{game.playerCount}/8 players</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No open games. Create one!</p>
            )}
          </div>
        </div>

        {/* Create Game Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
              <input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    createGame();
                  }
                }}
                className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-400"
                autoFocus
              />
              <input
                type="text"
                placeholder="Game Name (optional)"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    createGame();
                  }
                }}
                className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-400"
              />
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="flex gap-4">
                <button
                  onClick={createGame}
                  disabled={!playerName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setGameName('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}