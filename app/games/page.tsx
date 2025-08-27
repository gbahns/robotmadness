'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';

type GamePlayer = {
  id: string;
  userId: string;
  user: {
    username: string;
    name: string | null;
  };
  flagsReached: number;
  livesRemaining: number;
  finalDamage: number;
};

type FinalResult = {
  playerId: string;
  position: number;
  flags: number;
  finalDamage: number;
};

type Game = {
  id: string;
  roomCode: string;
  name: string | null;
  boardName: string | null;
  isPractice?: boolean;
  startedAt: string | null;
  endedAt: string | null;
  totalDuration: number | null;
  createdAt: string;
  finalResults: FinalResult[] | null;
  host: {
    username: string;
    name: string | null;
  } | null;
  winner: {
    username: string;
    name: string | null;
  } | null;
  players: GamePlayer[];
  _count: {
    players: number;
  };
};

type SortField = 'date' | 'name' | 'players' | 'duration' | 'winner' | 'board' | 'host' | 'maxFlags';
type SortDirection = 'asc' | 'desc';

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setGames(data);
      } else {
        console.error('Invalid response format:', data);
        setGames([]);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      const numericFields: SortField[] = ['players', 'duration'];
      setSortDirection(numericFields.includes(field) ? 'desc' : 'asc');
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMaxFlags = (game: Game): number => {
    if (!game.finalResults || !Array.isArray(game.finalResults)) return 0;
    return Math.max(...game.finalResults.map((r) => r.flags || 0), 0);
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = searchTerm === '' || 
      game.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.host?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.winner?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.boardName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortField) {
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'name':
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
        break;
      case 'host':
        aValue = (a.host?.username || '').toLowerCase();
        bValue = (b.host?.username || '').toLowerCase();
        break;
      case 'players':
        aValue = a._count.players;
        bValue = b._count.players;
        break;
      case 'maxFlags':
        aValue = getMaxFlags(a);
        bValue = getMaxFlags(b);
        break;
      case 'duration':
        aValue = a.totalDuration || 0;
        bValue = b.totalDuration || 0;
        break;
      case 'winner':
        aValue = (a.winner?.username || '').toLowerCase();
        bValue = (b.winner?.username || '').toLowerCase();
        break;
      case 'board':
        aValue = (a.boardName || '').toLowerCase();
        bValue = (b.boardName || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-500 text-xs">↕</span>;
    }
    return <span className="text-blue-400 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading game history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-white">Game History</h1>
          <div className="text-sm text-gray-400">
            Total: {games.length} games
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search games, players, boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Games Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date <SortIcon field="date" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Game <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('host')}
                >
                  <div className="flex items-center gap-1">
                    Host <SortIcon field="host" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('board')}
                >
                  <div className="flex items-center gap-1">
                    Board <SortIcon field="board" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('players')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Players <SortIcon field="players" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('maxFlags')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Flags <SortIcon field="maxFlags" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('winner')}
                >
                  <div className="flex items-center gap-1">
                    Winner <SortIcon field="winner" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Duration <SortIcon field="duration" />
                  </div>
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedGames.map((game) => (
                <Fragment key={game.id}>
                  <tr className="hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-xs">
                      {formatDate(game.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {game.name || `Game ${game.id.substring(0, 8)}`}
                        </span>
                        {game.isPractice && (
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                            Practice
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                      {game.host ? (
                        <div>
                          <div className="font-medium">{game.host.name || game.host.username}</div>
                          {game.host.name && (
                            <div className="text-xs text-gray-500">@{game.host.username}</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-xs">
                      {game.boardName || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-white">
                      {game._count.players}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className="text-blue-400 font-medium">
                        {getMaxFlags(game) || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {game.winner ? (
                        <div className="text-yellow-400">
                          <div className="font-medium">{game.winner.name || game.winner.username}</div>
                          {game.winner.name && (
                            <div className="text-xs text-yellow-600">@{game.winner.username}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-gray-300">
                      {formatDuration(game.totalDuration)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        {expandedGame === game.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                  {expandedGame === game.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-3 bg-gray-850">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-300">
                            <strong>Room Code:</strong> {game.roomCode}
                          </div>
                          {game.players.length > 0 && (
                            <div>
                              <strong className="text-sm text-gray-300">Players:</strong>
                              <div className="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {game.players.map((player) => (
                                  <div key={player.id} className="text-xs bg-gray-700 rounded px-2 py-1">
                                    <div className="text-white font-medium">
                                      {player.user ? (
                                        <>
                                          {player.user.name || player.user.username}
                                          {player.user.name && (
                                            <span className="text-gray-400 ml-1">(@{player.user.username})</span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-gray-400">Unknown Player</span>
                                      )}
                                    </div>
                                    <div className="text-gray-400">
                                      Flags: {player.flagsReached} | 
                                      Lives: {player.livesRemaining} | 
                                      Damage: {player.finalDamage}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {game.startedAt && (
                            <div className="text-xs text-gray-400">
                              Started: {formatDate(game.startedAt)}
                              {game.endedAt && <> | Ended: {formatDate(game.endedAt)}</>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          
          {sortedGames.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No games found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}