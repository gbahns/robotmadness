'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  createdAt: string;
  _count: {
    gamesPlayed: number;
    wonGames: number;
  };
};

type SortField = 'username' | 'email' | 'gamesPlayed' | 'wonGames' | 'winRate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Numeric columns should default to descending (highest first)
      const numericFields: SortField[] = ['gamesPlayed', 'wonGames', 'winRate'];
      setSortDirection(numericFields.includes(field) ? 'desc' : 'asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortField) {
      case 'username':
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'gamesPlayed':
        aValue = a._count.gamesPlayed;
        bValue = b._count.gamesPlayed;
        break;
      case 'wonGames':
        aValue = a._count.wonGames;
        bValue = b._count.wonGames;
        break;
      case 'winRate':
        aValue = a._count.gamesPlayed > 0 ? (a._count.wonGames / a._count.gamesPlayed) : 0;
        bValue = b._count.gamesPlayed > 0 ? (b._count.wonGames / b._count.gamesPlayed) : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
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
      return <span className="text-gray-500">↕</span>;
    }
    return <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading players...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <div className="text-sm text-gray-400">
            Total: {users.length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center justify-between">
                    Username <SortIcon field="username" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center justify-between">
                    Email <SortIcon field="email" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('gamesPlayed')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Played <SortIcon field="gamesPlayed" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('wonGames')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Won <SortIcon field="wonGames" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Win % <SortIcon field="winRate" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-between">
                    Joined <SortIcon field="createdAt" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedUsers.map((user) => {
                const winRate = user._count.gamesPlayed > 0 
                  ? ((user._count.wonGames / user._count.gamesPlayed) * 100).toFixed(1)
                  : '0.0';
                  
                return (
                  <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-center">
                      <span className="text-white">
                        {user._count.gamesPlayed}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-center">
                      <span className="text-white">
                        {user._count.wonGames}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-center">
                      <span className={`font-medium ${
                        parseFloat(winRate) >= 50 
                          ? 'text-green-400' 
                          : parseFloat(winRate) >= 25 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`}>
                        {winRate}%
                      </span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {sortedUsers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}