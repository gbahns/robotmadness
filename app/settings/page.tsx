'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Profile settings
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'accounts' | 'danger'>('profile');
  const [hasPassword, setHasPassword] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState({ google: false, discord: false });
  const [deleteEligibility, setDeleteEligibility] = useState({ 
    canDelete: false, 
    canAnonymize: false, 
    gamesPlayed: 0, 
    gamesHosted: 0 
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    
    if (session?.user) {
      setUsername(session.user.username || '');
      setDisplayName(session.user.name || '');
      setEmail(session.user.email || '');
      
      // Check if user has a password (OAuth users might not)
      checkPasswordStatus();
      // Check linked accounts
      checkLinkedAccounts();
      // Check deletion eligibility
      checkDeleteEligibility();
      
      // Check if we're returning from OAuth linking attempt
      const linkedProvider = searchParams.get('linked');
      const linkError = searchParams.get('error');
      
      if (linkedProvider || linkError) {
        // Always recheck linked accounts after any OAuth attempt
        setTimeout(() => {
          checkLinkedAccounts();
        }, 500);
        
        setActiveTab('accounts');
        
        if (linkError === 'OAuthAccountNotLinked') {
          setError('This account is already linked.');
          setSuccess(''); // Clear any success message
        } else if (linkedProvider) {
          setSuccess(`Checking ${linkedProvider} account status...`);
        }
        
        // Clean up URL
        router.replace('/settings');
      }
    }
  }, [session, status, router, searchParams]);

  const checkPasswordStatus = async () => {
    try {
      const res = await fetch('/api/settings/check-password');
      const data = await res.json();
      setHasPassword(data.hasPassword);
    } catch {
      console.error('Failed to check password status');
    }
  };

  const checkLinkedAccounts = async () => {
    try {
      const res = await fetch('/api/settings/linked-accounts');
      const data = await res.json();
      setLinkedAccounts({ google: data.google, discord: data.discord });
    } catch {
      console.error('Failed to check linked accounts');
    }
  };

  const checkDeleteEligibility = async () => {
    try {
      const res = await fetch('/api/settings/delete-account');
      const data = await res.json();
      setDeleteEligibility({
        canDelete: data.canDelete,
        canAnonymize: data.canAnonymize,
        gamesPlayed: data.gamesPlayed,
        gamesHosted: data.gamesHosted
      });
    } catch {
      console.error('Failed to check delete eligibility');
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'discord') => {
    setError('');
    setLoading(true);
    
    // Use NextAuth's signIn directly with the provider
    // This will link the account if the user is already signed in
    const { signIn } = await import('next-auth/react');
    
    try {
      await signIn(provider, { 
        callbackUrl: `/settings?linked=${provider}`,
        redirect: true 
      });
    } catch (error) {
      console.error('Failed to link account:', error);
      setError('Failed to link account');
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'discord') => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/settings/linked-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlink account');
      }

      setSuccess(`${provider} account unlinked successfully`);
      checkLinkedAccounts(); // Refresh the linked accounts
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      
      // Update local state with new values
      if (data.user) {
        setUsername(data.user.username);
        setDisplayName(data.user.name || '');
      }
      
      // Refresh session to get updated data
      await update({
        ...session,
        user: {
          ...session?.user,
          username: data.user.username,
          name: data.user.name
        }
      });
      
      router.refresh();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: hasPassword ? currentPassword : null, 
          newPassword 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess(hasPassword ? 'Password updated successfully!' : 'Password set successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (action: 'delete' | 'anonymize') => {
    const confirmMessage = action === 'delete' 
      ? 'Are you sure you want to delete your account? This action cannot be undone.'
      : 'Are you sure you want to anonymize your account? This will remove all personal information but preserve your game history. You will not be able to sign in again.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process account deletion');
      }

      // Sign out and redirect
      router.push('/api/auth/signout');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-yellow-400">Account Settings</h1>
              <Link href="/" className="text-gray-400 hover:text-white transition">
                Back to Game
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === 'profile'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === 'password'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {hasPassword ? 'Password' : 'Set Password'}
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === 'accounts'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Linked Accounts
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === 'danger'
                    ? 'text-red-400 border-b-2 border-red-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Danger Zone
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="username"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Display Name"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 text-gray-900 py-2 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {!hasPassword && (
                  <div className="mb-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
                    <p className="text-sm text-blue-300">
                      You signed up with OAuth. Set a password to enable email/password login.
                    </p>
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    {hasPassword ? 'New Password' : 'Password'}
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="••••••••"
                    minLength={8}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm {hasPassword ? 'New' : ''} Password
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
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 text-gray-900 py-2 px-4 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
                >
                  {loading ? "Updating..." : hasPassword ? "Update Password" : "Set Password"}
                </button>
              </form>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Connected Accounts</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Link your social accounts to sign in with them. You can link multiple accounts to the same RobotMadness profile.
                  </p>
                  
                  {/* Google Account */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <div>
                          <p className="font-medium text-white">Google</p>
                          {linkedAccounts.google ? (
                            <p className="text-sm text-green-400">Connected</p>
                          ) : (
                            <p className="text-sm text-gray-400">Not connected</p>
                          )}
                        </div>
                      </div>
                      {linkedAccounts.google ? (
                        <button
                          onClick={() => handleUnlinkAccount('google')}
                          disabled={loading || (!hasPassword && linkedAccounts.discord === false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!hasPassword && linkedAccounts.discord === false ? 'Cannot unlink your only authentication method' : ''}
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkAccount('google')}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-300 transition disabled:opacity-50"
                        >
                          Link Account
                        </button>
                      )}
                    </div>

                    {/* Discord Account */}
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865F2">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <div>
                          <p className="font-medium text-white">Discord</p>
                          {linkedAccounts.discord ? (
                            <p className="text-sm text-green-400">Connected</p>
                          ) : (
                            <p className="text-sm text-gray-400">Not connected</p>
                          )}
                        </div>
                      </div>
                      {linkedAccounts.discord ? (
                        <button
                          onClick={() => handleUnlinkAccount('discord')}
                          disabled={loading || (!hasPassword && linkedAccounts.google === false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!hasPassword && linkedAccounts.google === false ? 'Cannot unlink your only authentication method' : ''}
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkAccount('discord')}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-300 transition disabled:opacity-50"
                        >
                          Link Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!hasPassword && (linkedAccounts.google || linkedAccounts.discord) && (
                  <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Tip:</strong> Set a password in the Password tab to enable email/password login as a backup method.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-4">
                {/* Show game history stats */}
                {(deleteEligibility.gamesPlayed > 0 || deleteEligibility.gamesHosted > 0) && (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Your Game History</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Games Played:</span>
                        <span className="ml-2 text-white font-semibold">{deleteEligibility.gamesPlayed}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Games Hosted:</span>
                        <span className="ml-2 text-white font-semibold">{deleteEligibility.gamesHosted}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Can delete - no game history */}
                {deleteEligibility.canDelete && (
                  <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      You have no game history. Your account can be completely deleted.
                    </p>
                    <button
                      onClick={() => handleDeleteAccount('delete')}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {loading ? "Deleting..." : "Delete My Account"}
                    </button>
                  </div>
                )}

                {/* Can only anonymize - has game history */}
                {deleteEligibility.canAnonymize && (
                  <div className="p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">Account Removal Options</h3>
                    <div className="text-sm text-gray-300 mb-4 space-y-2">
                      <p>
                        <strong>Your account cannot be deleted</strong> because you have participated in {deleteEligibility.gamesPlayed} game(s) 
                        and hosted {deleteEligibility.gamesHosted} game(s). This history is part of other players&apos; records.
                      </p>
                      <p>
                        However, you can <strong>anonymize your account</strong> which will:
                      </p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Remove your email address and password</li>
                        <li>Remove all linked OAuth accounts</li>
                        <li>Replace your username with an anonymous ID</li>
                        <li>Mark your display name as [Deleted User]</li>
                        <li>Preserve your game history for other players</li>
                        <li>Prevent you from signing in again</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount('anonymize')}
                      disabled={loading}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {loading ? "Anonymizing..." : "Anonymize My Account"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}