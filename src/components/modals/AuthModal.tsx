import React, { useState } from 'react';
import { 
  UserProfile, 
  UserRole, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signInAsGuest, 
  logoutUser, 
  updateUserRole 
} from '../../lib/firebase';
import {
  TIER_CONFIGS,
  isDeveloperUser,
  getEffectiveUserTier
} from '../../lib/subscription';
import { 
  User, 
  Shield, 
  Crown, 
  Sword, 
  FlaskConical,
  LogOut, 
  Key, 
  Mail, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Cloud, 
  RefreshCw,
  Zap,
  X
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  onOpenUpgradeModal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onOpenUpgradeModal
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Player');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const profile = await signInWithEmail(email, password);
      onUserChange(profile);
      setSuccessMsg(`Welcome back, ${profile.displayName}!`);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter an email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      const nameToUse = displayName.trim() || email.split('@')[0];
      const profile = await signUpWithEmail(email, password, nameToUse, selectedRole);
      onUserChange(profile);
      setSuccessMsg(`Account created successfully! Role set to ${selectedRole}.`);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const profile = await signInWithGoogle(selectedRole);
      onUserChange(profile);
      setSuccessMsg(`Signed in with Google as ${profile.displayName}`);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google sign-in failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const profile = await signInAsGuest(selectedRole, displayName.trim() || 'Guest Adventurer');
      onUserChange(profile);
      setSuccessMsg(`Logged in as Guest (${selectedRole})`);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Guest sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await updateUserRole(currentUser.uid, newRole);
      const updatedProfile = { ...currentUser, role: newRole };
      onUserChange(updatedProfile);
      setSuccessMsg(`Role updated to ${newRole}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to update user role.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onUserChange(null);
      setSuccessMsg('Logged out successfully.');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to log out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-tight">
                {currentUser ? 'User Account & Role' : 'Adventurer Portal'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser ? `Signed in as ${currentUser.displayName}` : 'Cloud save, character sync & roles'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-950/70 border border-red-700/60 text-red-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold">{errorMsg}</p>
                {errorMsg.includes('Guest Mode') && (
                  <p className="text-[11px] text-red-300/90 leading-relaxed">
                    Firebase requires enabling the <em>Email/Password</em> provider in the Firebase Console (Authentication &rarr; Sign-in method). In the meantime, you can continue immediately with Guest Mode or Google Sign-In!
                  </p>
                )}
              </div>
            </div>
            {errorMsg.includes('Guest Mode') && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setTab('guest');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition shadow flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Switch to Guest Mode</span>
                </button>
              </div>
            )}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6">
          {currentUser ? (
            /* LOGGED IN VIEW */
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{currentUser.displayName}</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">
                      {currentUser.email || 'Guest User'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Cloud className="w-3 h-3 text-indigo-400" />
                        <span>Cloud Sync Active</span>
                      </div>
                      {(() => {
                        const effectiveTier = isDeveloperUser(currentUser) ? 'developer' : getEffectiveUserTier(currentUser);
                        const cfg = TIER_CONFIGS[effectiveTier] || TIER_CONFIGS.free;
                        return (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badgeColor}`}>
                            <span>{cfg.badge}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {onOpenUpgradeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUpgradeModal();
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-lg text-xs transition shadow flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isDeveloperUser(currentUser) ? 'Tier Perks' : 'Manage Tier'}</span>
                  </button>
                )}
              </div>

              {/* Role Configuration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Active User Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  <button
                    type="button"
                    onClick={() => handleRoleChange('Player')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currentUser.role === 'Player'
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sword className={`w-4 h-4 ${currentUser.role === 'Player' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className={`font-semibold text-xs ${currentUser.role === 'Player' ? 'text-amber-200' : 'text-slate-300'}`}>
                        Player
                      </span>
                      {currentUser.role === 'Player' && <Check className="w-3.5 h-3.5 ml-auto text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Character sheets, spells, gear & roll calculations.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('DM')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currentUser.role === 'DM'
                        ? 'bg-purple-950/40 border-purple-500/80 shadow-md shadow-purple-950/30 ring-1 ring-purple-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className={`w-4 h-4 ${currentUser.role === 'DM' ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span className={`font-semibold text-xs ${currentUser.role === 'DM' ? 'text-purple-200' : 'text-slate-300'}`}>
                        Dungeon Master
                      </span>
                      {currentUser.role === 'DM' && <Check className="w-3.5 h-3.5 ml-auto text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      DM screen, encounters, monsters & party HUD.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('Tester')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currentUser.role === 'Tester'
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <FlaskConical className={`w-4 h-4 ${currentUser.role === 'Tester' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className={`font-semibold text-xs ${currentUser.role === 'Tester' ? 'text-emerald-200' : 'text-slate-300'}`}>
                        Tester
                      </span>
                      {currentUser.role === 'Tester' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Full QA tester mode: bypasses all subscription limits.
                    </p>
                  </button>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50 transition-colors"
                >
                  Done
                </button>
              </div>

            </div>
          ) : (
            /* NOT LOGGED IN VIEW */
            <div className="space-y-5">
              
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-850 rounded-xl border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`py-2 font-medium rounded-lg transition-colors ${
                    tab === 'signin'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`py-2 font-medium rounded-lg transition-colors ${
                    tab === 'signup'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setTab('guest')}
                  className={`py-2 font-medium rounded-lg transition-colors ${
                    tab === 'guest'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Guest Mode
                </button>
              </div>

              {/* Role Selection for New Signups or Guests */}
              {(tab === 'signup' || tab === 'guest') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Select Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('Player')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRole === 'Player'
                          ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sword className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-xs text-amber-200">Player</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Sheet, Spells, Inventory</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('DM')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRole === 'DM'
                          ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/50'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-xs text-purple-200">Dungeon Master</span>
                      </div>
                      <p className="text-[10px] text-slate-400">DM Screen, Encounters</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('Tester')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRole === 'Tester'
                          ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-xs text-emerald-200">Tester</span>
                      </div>
                      <p className="text-[10px] text-slate-400">QA & Subscription Bypass</p>
                    </button>
                  </div>
                </div>
              )}

              {/* SIGN IN FORM */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="adventurer@realm.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                  </button>
                </form>
              )}

              {/* SIGN UP FORM */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Valerius the Bold"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="adventurer@realm.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                  </button>
                </form>
              )}

              {/* GUEST FORM */}
              {tab === 'guest' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Guest Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Guest Player"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">
                    Guest mode generates a temporary anonymous session with full access to your selected role without registering an email.
                  </p>

                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Continue as Guest</span>}
                  </button>
                </div>
              )}

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  or
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
