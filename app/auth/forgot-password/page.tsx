'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState(''); // For development testing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      // In development, show the reset URL
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Check Your Email</h2>
          <p className="text-gray-300 mb-6">
            If an account exists with <span className="font-semibold text-yellow-400">{email}</span>,
            you will receive a password reset link shortly.
          </p>
          
          {/* Development mode: Show reset URL */}
          {resetUrl && process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
              <p className="text-sm text-blue-300 mb-2">Development Mode - Reset Link:</p>
              <Link 
                href={resetUrl.replace(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000', '')}
                className="text-xs text-yellow-400 break-all hover:text-yellow-300"
              >
                {resetUrl}
              </Link>
            </div>
          )}
          
          <p className="text-sm text-gray-400 mb-4">
            Didn&apos;t receive an email? Check your spam folder or try again.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                setResetUrl('');
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Try Another Email
            </button>
            
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 transition text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">RobotMadness</h1>
        </div>
        
        <h2 className="text-xl text-center mb-2 text-gray-300">Forgot Your Password?</h2>
        <p className="text-sm text-center mb-6 text-gray-400">
          No worries! Enter your email and we&apos;ll send you reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder="robot@example.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-400 text-sm">
            Remember your password?{' '}
            <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300">
              Sign In
            </Link>
          </p>
          <p className="text-gray-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-yellow-400 hover:text-yellow-300">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}