'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function ClaimAccountPage() {
  const [step, setStep] = useState<'identify' | 'claim'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    username: string;
    displayName?: string;
    lastPlayed?: string;
    stats?: {
      gamesPlayed: number;
      gamesWon: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const checkAccount = async () => {
    setError('');
    setLoading(true);

    try {
      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');
      const params = new URLSearchParams();
      params.set(isEmail ? 'email' : 'username', identifier);

      const res = await fetch(`/api/auth/claim?${params}`);
      const data = await res.json();

      if (!data.found) {
        setError('No account found with this information. Are you sure you played the old version?');
      } else if (!data.claimable) {
        setError(data.message);
      } else {
        setAccountInfo(data);
        setStep('claim');
      }
    } catch {
      setError('Failed to check account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const claimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [isEmail ? 'email' : 'username']: identifier,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim account');
      }

      setSuccess(true);

      // Show success message with stats
      setTimeout(() => {
        // Auto sign in with the new password
        signIn('credentials', {
          email: isEmail ? identifier : data.user.email,
          password,
          callbackUrl: '/'
        });
      }, 2000);

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Account Claimed!</h2>
          <p className="text-gray-300 mb-4">
            Your account has been successfully claimed.
          </p>
          {accountInfo?.stats && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Your legacy stats:</p>
              <p className="text-yellow-400 font-bold">
                {accountInfo.stats.gamesPlayed} games played
              </p>
              {accountInfo.stats.gamesWon > 0 && (
                <p className="text-green-400 font-bold">
                  {accountInfo.stats.gamesWon} victories
                </p>
              )}
            </div>
          )}
          <p className="text-gray-400">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">RobotMadness</h1>
        </div>
        
        <h2 className="text-xl text-center mb-2 text-gray-300">
          Welcome Back, Commander!
        </h2>
        <p className="text-sm text-center mb-6 text-gray-400">
          Claim your account from the old RobotMadness
        </p>

        {step === 'identify' ? (
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg text-sm">
              <p className="text-blue-300">
                If you played RobotMadness before, enter your old email or username to claim your account and game history.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-2">
                Email or Username from Old Game
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && identifier && checkAccount()}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                placeholder="robot@example.com or username"
                disabled={loading}
              />
            </div>

            <button
              onClick={checkAccount}
              disabled={!identifier || loading}
              className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Find My Account'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                New player?{' '}
                <Link href="/auth/signup" className="text-yellow-400 hover:text-yellow-300">
                  Create a new account
                </Link>
              </p>
              <p className="text-gray-400 text-sm">
                Already claimed?{' '}
                <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={claimAccount} className="space-y-4">
            <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
              <p className="text-green-300 text-sm mb-2">Account found!</p>
              <div className="text-white">
                <p className="font-bold">@{accountInfo?.username}</p>
                {accountInfo?.displayName && (
                  <p className="text-sm text-gray-400">{accountInfo.displayName}</p>
                )}
                {accountInfo?.lastPlayed && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last played: {accountInfo.lastPlayed}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Create New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? 'Claiming Account...' : 'Claim My Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('identify');
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full text-gray-400 hover:text-white transition text-sm"
            >
              ← Try different email/username
            </button>
          </form>
        )}
      </div>
    </div>
  );
}