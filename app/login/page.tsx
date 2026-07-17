'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, Dumbbell, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const LoginPage = () => {
  const router = useRouter();
  const { triggerDemoLogin } = useApp();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        const errMsg = res.error.message || 'Invalid credentials';
        setError(errMsg);
        showToast(errMsg, 'error');
      } else {
        showToast('Logged in successfully!', 'success');
        router.push('/');
      }
    } catch (err: any) {
      const errMsg = err.message || 'An unexpected error occurred';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/profile',
      });
      // Page will redirect automatically via OAuth flow
    } catch (err: any) {
      const errMsg = err.message || 'Google sign-in failed';
      setError(errMsg);
      showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const success = await triggerDemoLogin();
      if (success) {
        showToast('Logged in as Demo User!', 'success');
        router.push('/profile');
      } else {
        setError('Demo sign-in failed');
        showToast('Demo sign-in failed', 'error');
      }
    } catch (err) {
      showToast('Redirecting to offline fallback profile...', 'info');
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50/50">

      <div className="sm:mx-auto w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-brand-green p-3 rounded-2xl text-white shadow-lg shadow-brand-green/20">
            <Dumbbell className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-display font-black text-3xl tracking-tight text-brand-black">
          Welcome back to FitTrack
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-gray-500">
          Or{' '}
          <Link href="/register" className="font-extrabold text-brand-green hover:underline">
            create a new fitness account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-100 sm:rounded-3xl sm:px-10 shadow-sm">

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm mb-6"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold">
              <span className="bg-white px-3 text-gray-400 tracking-wider">or sign in with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div>
              <button
                id="email-signin-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-xs font-black uppercase tracking-wider text-white bg-brand-black hover:bg-brand-green focus:outline-none transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold">
              <span className="bg-white px-3 text-gray-400 tracking-wider">Demo / Instant Access</span>
            </div>
          </div>

          {/* Quick Demo Sign In */}
          <div className="mt-6">
            <button
              id="demo-signin-btn"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full flex items-center justify-between py-4 px-5 border border-brand-green/20 rounded-2xl text-sm font-bold text-brand-green bg-brand-tint-green hover:bg-brand-green hover:text-white transition-all active:scale-95 group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 fill-current" /> Auto-fill Demo Account
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-center text-gray-400 font-semibold mt-3">
              Credentials: <span className="font-extrabold text-gray-500">demo@fittrack.ai</span> / <span className="font-extrabold text-gray-500">password123</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
