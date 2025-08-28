'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    gamesPlayed: number;
    hostedGames: number;
  };
}

interface Game {
  id: string;
  roomCode: string;
  name: string | null;
  boardName: string | null;
  isPractice: boolean;
  startedAt: string | null;
  endedAt: string | null;
  host: {
    username: string;
  } | null;
  winner: {
    username: string;
  } | null;
  _count: {
    players: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'games'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isAdmin) {
      router.push('/');
      return;
    }

    fetchData();
  }, [status, session, router, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } else {
        const res = await fetch('/api/admin/games');
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their game history.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const error = await res.json();
        alert(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        }),
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setEditingUser(null);
      } else {
        const error = await res.json();
        alert(`Failed to update user: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to update user');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setGames(games.filter(g => g.id !== gameId));
      } else {
        const error = await res.json();
        alert(`Failed to delete game: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to delete game');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGames = games.filter(game =>
    game.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.name && game.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">Admin Dashboard</h1>
        <Link href="/" className="text-blue-400 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${
            activeTab === 'users'
              ? 'bg-yellow-400 text-gray-900 font-bold'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded ${
            activeTab === 'games'
              ? 'bg-yellow-400 text-gray-900 font-bold'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Games
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Users ({filteredUsers.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Display Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Games</th>
                  <th className="px-4 py-3 text-center">Hosted</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-4 py-3">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                          className="px-2 py-1 bg-gray-600 text-white rounded"
                        />
                      ) : (
                        <span className="font-medium">{user.username}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.name || ''}
                          onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                          className="px-2 py-1 bg-gray-600 text-white rounded"
                        />
                      ) : (
                        user.name || '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          className="px-2 py-1 bg-gray-600 text-white rounded"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{user._count.gamesPlayed}</td>
                    <td className="px-4 py-3 text-center">{user._count.hostedGames}</td>
                    <td className="px-4 py-3 text-center">
                      {editingUser?.id === user.id ? (
                        <input
                          type="checkbox"
                          checked={editingUser.isAdmin}
                          onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                          className="rounded"
                        />
                      ) : (
                        <span className={user.isAdmin ? 'text-green-400' : 'text-gray-500'}>
                          {user.isAdmin ? '✓' : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        {editingUser?.id === user.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(editingUser)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              disabled={user.id === session.user.id}
                              title={user.id === session.user.id ? "Can't delete yourself" : ''}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Games ({filteredGames.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Room Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Board</th>
                  <th className="px-4 py-3 text-left">Host</th>
                  <th className="px-4 py-3 text-center">Players</th>
                  <th className="px-4 py-3 text-left">Winner</th>
                  <th className="px-4 py-3 text-center">Practice</th>
                  <th className="px-4 py-3 text-left">Started</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredGames.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-700">
                    <td className="px-4 py-3 font-mono">{game.roomCode}</td>
                    <td className="px-4 py-3">{game.name || '-'}</td>
                    <td className="px-4 py-3">{game.boardName || '-'}</td>
                    <td className="px-4 py-3">{game.host?.username || '-'}</td>
                    <td className="px-4 py-3 text-center">{game._count.players}</td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400">
                        {game.winner?.username || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {game.isPractice && (
                        <span className="text-blue-400">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {game.startedAt ? new Date(game.startedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}