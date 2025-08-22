'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [selectedBoardId, setSelectedBoardId] = useState('test');
  const [isSettingName, setIsSettingName] = useState(false);

  useEffect(() => {
    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    } else {
      // If no saved name, show the name input
      setIsSettingName(true);
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

      // Save player name
      if (playerName.trim()) {
        localStorage.setItem('playerName', playerName);
      }

      router.push(`/game/${roomCode}`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
    }
  };

  const joinGameDirect = (gameCode: string) => {
    // Make sure we have a player name
    if (!playerName.trim()) {
      const name = prompt('Please enter your name:');
      if (!name || !name.trim()) return;

      setPlayerName(name.trim());
      localStorage.setItem('playerName', name.trim());
    }

    // Navigate directly to the game
    router.push(`/game/${gameCode}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Top Navigation */}
      <nav className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Link 
          href="/course-viewer" 
          className="text-gray-300 hover:text-yellow-400 font-medium transition-colors"
        >
          Courses
        </Link>
        <Link 
          href="/board-viewer" 
          className="text-gray-300 hover:text-yellow-400 font-medium transition-colors"
        >
          Boards
        </Link>
        <Link 
          href="/board-editor" 
          className="text-gray-300 hover:text-yellow-400 font-medium transition-colors"
        >
          Board Editor
        </Link>
      </nav>

      {/* Player Name Display */}
      {playerName && (
        <div className="absolute top-4 right-4 bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-3">
          <span className="text-gray-300">Playing as:</span>
          <span className="font-semibold text-yellow-400">{playerName}</span>
          <button
            onClick={() => {
              setIsSettingName(true);
            }}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Change
          </button>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold mb-4 text-yellow-400 drop-shadow-lg">
          RobotMadness
        </h1>
        <p className="text-xl mb-2 text-gray-300">
          You are brilliant. You are powerful. You are sophisticated.
        </p>
        <p className="text-2xl text-gray-100 font-semibold">
          You are BORED.
        </p>
      </div>

      {/* Player Name Input for new users */}
      {isSettingName && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-200">
            Choose Your Robot Pilot Name
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  localStorage.setItem('playerName', playerName.trim());
                  setPlayerName(playerName.trim());
                  setIsSettingName(false);
                }
              }}
              className="flex-1 p-3 bg-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => {
                if (playerName.trim()) {
                  localStorage.setItem('playerName', playerName.trim());
                  setPlayerName(playerName.trim());
                  setIsSettingName(false);
                }
              }}
              disabled={!playerName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold transition"
            >
              Set Name
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">
            This name will be used in all games you join
          </p>
        </div>
      )}

      <div className="flex gap-6 mb-8">
        <button
          onClick={createGame}
          disabled={!playerName.trim() || isSettingName}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold text-lg transition transform hover:scale-105 disabled:transform-none"
        >
          Create Game
        </button>
      </div>

      {(!playerName.trim() || isSettingName) && (
        <div className="text-center text-gray-400 text-sm mb-8">
          Please set your pilot name above to create or join games
        </div>
      )}

      <div className="text-gray-400 text-sm mb-8">
        Program your robot to navigate the factory floor and be the first to reach all checkpoints!
      </div>

      {/* Open Games List */}
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Open Games</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          {loadingGames ? (
            <p className="text-gray-500 text-center">Loading games...</p>
          ) : openGames.length > 0 ? (
            <div className="space-y-2">
              {openGames.map((game) => (
                <div
                  key={game.roomCode}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition"
                >
                  <div>
                    <p className="font-semibold">{game.name}</p>
                    <p className="text-sm text-gray-400">
                      Room: {game.roomCode} • {game.playerCount}/{game.maxPlayers} players
                    </p>
                  </div>
                  <button
                    onClick={() => joinGameDirect(game.roomCode)}
                    disabled={!playerName.trim() || isSettingName}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-1 rounded text-sm"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No open games. Create one!</p>
          )}
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
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
              className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
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
              className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
            />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex gap-4">
              <button
                onClick={createGame}
                disabled={!playerName.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}