'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PlayerStanding = {
  userId: string;
  username: string;
  name: string | null;
  gamesPlayed: number;
  gamesWon: number;
  traditionalWinPct: number;
  opponentsPlayed: number;
  opponentsDefeated: number;
  weightedWinPct: number;
  avgOpponentsPerGame: number;
  eloRating: number;
  peakElo: number;
  lowestElo: number;
};

type SortField = 'elo' | 'rank' | 'username' | 'gamesPlayed' | 'gamesWon' | 'traditionalWinPct' | 'weightedWinPct' | 'avgOpponents';
type SortDirection = 'asc' | 'desc';

export default function StandingsPage() {
  const [standings, setStandings] = useState<PlayerStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('elo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showExplanation, setShowExplanation] = useState(false);
  const [minGames, setMinGames] = useState(0);

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    try {
      const response = await fetch('/api/standings');
      const data = await response.json();
      if (Array.isArray(data)) {
        setStandings(data);
      } else {
        console.error('Invalid response format:', data);
        setStandings([]);
      }
    } catch (error) {
      console.error('Failed to fetch standings:', error);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === 'elo') {
      // Reset to default ELO ranking
      setSortField('elo');
      setSortDirection('desc');
      return;
    }
    
    if (field === 'rank') {
      // Reset to weighted ranking
      setSortField('rank');
      setSortDirection('asc');
      return;
    }
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default to descending for numeric fields
      const numericFields: SortField[] = ['elo', 'gamesPlayed', 'gamesWon', 'traditionalWinPct', 'weightedWinPct', 'avgOpponents'];
      setSortDirection(numericFields.includes(field) ? 'desc' : 'asc');
    }
  };

  const filteredStandings = standings.filter(s => s.gamesPlayed >= minGames);

  const sortedStandings = [...filteredStandings].sort((a, b) => {
    if (sortField === 'elo') {
      // Default ranking by ELO
      return b.eloRating - a.eloRating;
    }
    
    if (sortField === 'rank') {
      // Ranking by weighted percentage
      return b.weightedWinPct - a.weightedWinPct;
    }
    
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortField) {
      case 'username':
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      case 'gamesPlayed':
        aValue = a.gamesPlayed;
        bValue = b.gamesPlayed;
        break;
      case 'gamesWon':
        aValue = a.gamesWon;
        bValue = b.gamesWon;
        break;
      case 'traditionalWinPct':
        aValue = a.traditionalWinPct;
        bValue = b.traditionalWinPct;
        break;
      case 'weightedWinPct':
        aValue = a.weightedWinPct;
        bValue = b.weightedWinPct;
        break;
      case 'avgOpponents':
        aValue = a.avgOpponentsPerGame;
        bValue = b.avgOpponentsPerGame;
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
        <div className="text-white text-xl">Loading standings...</div>
      </div>
    );
  }

  // Calculate totals for verification
  const totals = filteredStandings.reduce((acc, s) => ({
    gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
    gamesWon: acc.gamesWon + s.gamesWon,
    opponentsPlayed: acc.opponentsPlayed + s.opponentsPlayed,
    opponentsDefeated: acc.opponentsDefeated + s.opponentsDefeated
  }), { gamesPlayed: 0, gamesWon: 0, opponentsPlayed: 0, opponentsDefeated: 0 });

  const overallWeightedPct = totals.opponentsPlayed > 0 
    ? (totals.opponentsDefeated / totals.opponentsPlayed) * 100 
    : 0;

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
          <h1 className="text-2xl font-bold text-white">Power Rankings</h1>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            {showExplanation ? 'Hide' : 'About'} Ranking System
          </button>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
            <h3 className="font-bold text-white mb-2">Ranking System Explained</h3>
            <div className="mb-3 pb-3 border-b border-gray-700">
              <h4 className="font-semibold text-blue-400 mb-1">ELO Rating (Power Ranking)</h4>
              <p className="mb-1">
                ELO is a skill rating system originally from chess. Players start at 1500 and gain/lose points based on:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                <li>Win against strong opponents → Gain more points</li>
                <li>Win against weak opponents → Gain fewer points</li>
                <li>Lose to strong opponents → Lose fewer points</li>
                <li>Lose to weak opponents → Lose more points</li>
              </ul>
              <p className="mt-1 text-yellow-400 text-xs">
                ELO accounts for opponent strength, making it the best measure of true skill level.
              </p>
            </div>
            <h4 className="font-semibold text-blue-400 mb-1">Weighted Win Percentage</h4>
            <p className="mb-2">
              Traditional win percentage (Wins/Games) treats all games equally - a win in a 2-player game 
              counts the same as a win in an 8-player game. This can overvalue wins in smaller games.
            </p>
            <p className="mb-2">
              <strong className="text-white">Weighted win percentage</strong> uses the formula: 
              <span className="font-mono mx-2 text-blue-400">Opponents Defeated / Opponents Played</span>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Win an 8-player game → Defeat 7 opponents (more impressive)</li>
              <li>Win a 2-player game → Defeat 1 opponent (less impressive)</li>
              <li>Lose any game → Defeat 0 opponents</li>
            </ul>
            <p className="mt-2 text-yellow-400">
              This system properly weights victories based on the competition faced, providing a more 
              accurate measure of competitive performance.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-gray-300">
            Minimum games:
            <input
              type="number"
              min="0"
              value={minGames}
              onChange={(e) => setMinGames(Math.max(0, parseInt(e.target.value) || 0))}
              className="ml-2 w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="text-xs text-gray-400">
            Showing {filteredStandings.length} of {standings.length} players
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('elo')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Rank <SortIcon field="elo" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-1">
                    Player <SortIcon field="username" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('elo')}
                >
                  <div className="flex items-center justify-center gap-1">
                    ELO <SortIcon field="elo" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('gamesPlayed')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Games <SortIcon field="gamesPlayed" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('gamesWon')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Wins <SortIcon field="gamesWon" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('traditionalWinPct')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Trad % <SortIcon field="traditionalWinPct" />
                  </div>
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div title="Opponents Defeated">Opp Def</div>
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div title="Opponents Played">Opp Play</div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('weightedWinPct')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Weight % <SortIcon field="weightedWinPct" />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('avgOpponents')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Avg Opp <SortIcon field="avgOpponents" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedStandings.map((standing, index) => {
                const rank = (sortField === 'elo' || sortField === 'rank') ? index + 1 : '-';
                const getRankColor = (r: number) => {
                  if (r === 1) return 'text-yellow-400';
                  if (r === 2) return 'text-gray-300';
                  if (r === 3) return 'text-orange-600';
                  return 'text-gray-400';
                };
                
                return (
                  <tr key={standing.userId} className="hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${typeof rank === 'number' ? getRankColor(rank) : 'text-gray-500'}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">
                        {standing.username}
                      </div>
                      {standing.name && (
                        <div className="text-xs text-gray-400">
                          {standing.name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-lg ${
                          standing.eloRating >= 1600 ? 'text-purple-400' :
                          standing.eloRating >= 1550 ? 'text-blue-400' :
                          standing.eloRating >= 1500 ? 'text-green-400' :
                          standing.eloRating >= 1450 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {standing.eloRating}
                        </span>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span title="Peak ELO">↑{standing.peakElo}</span>
                          <span title="Lowest ELO">↓{standing.lowestElo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-white">
                      {standing.gamesPlayed}
                    </td>
                    <td className="px-3 py-2 text-center text-white">
                      {standing.gamesWon}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium ${
                        standing.traditionalWinPct >= 50 ? 'text-green-400' :
                        standing.traditionalWinPct >= 25 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {standing.traditionalWinPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-300">
                      {standing.opponentsDefeated}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-300">
                      {standing.opponentsPlayed}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${
                        standing.weightedWinPct >= 30 ? 'text-green-400' :
                        standing.weightedWinPct >= 20 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {standing.weightedWinPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-300">
                      {standing.avgOpponentsPerGame.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {sortedStandings.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No players found matching criteria
            </div>
          )}
        </div>

        {/* System Stats */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
          <div className="flex justify-around">
            <div>
              Total Games Played: <span className="text-white">{totals.gamesPlayed}</span>
            </div>
            <div>
              Total Wins: <span className="text-white">{totals.gamesWon}</span>
            </div>
            <div>
              Overall Weighted Win %: <span className="text-white">{overallWeightedPct.toFixed(1)}%</span>
              <span className="ml-2 text-gray-500">(should approach 50% with complete data)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}