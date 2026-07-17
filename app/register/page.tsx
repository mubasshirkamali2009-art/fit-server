'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, User, Dumbbell, AlertCircle, Camera } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const RegisterPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
        image: imageUrl || undefined,
      });

      if (res.error) {
        setError(res.error.message || 'Registration failed');
        showToast(res.error.message || 'Registration failed', 'error');
      } else {
        // Instantly sign out for security, then redirect to login
        await authClient.signOut();
        showToast('Account created successfully! Please log in.', 'success');
        router.push('/login');
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during signup';
      setError(msg);
      showToast(msg, 'error');
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
          Start your training journey
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-brand-green hover:underline">
            Log in here
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

          {/* Google Sign Up */}
          <button
            id="google-signup-btn"
            type="button"
            onClick={async () => {
              setError('');
              setLoading(true);
              try {
                await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
              } catch (err: any) {
                setError(err.message || 'Google sign-up failed');
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm mb-6"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold">
              <span className="bg-white px-3 text-gray-400 tracking-wider">or sign up with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Profile Image URL
              </label>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-xs font-black uppercase tracking-wider text-white bg-brand-black hover:bg-brand-green focus:outline-none transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
