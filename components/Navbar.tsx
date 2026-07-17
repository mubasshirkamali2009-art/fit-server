'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/context/ToastContext';
import { Menu, X, Dumbbell, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { userSession, isLoading } = useApp();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    showToast('Logged out successfully!', 'info');
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">

          {/* Desktop Left: Logo */}
          <div className="hidden md:flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-brand-green p-2 rounded-lg text-white">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-brand-black">
                FitTrack <span className="text-brand-green">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Center: Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/"
              className={`text-sm font-semibold transition-colors duration-200 ${isActive('/') ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'
                }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm font-semibold transition-colors duration-200 ${isActive('/about') ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'
                }`}
            >
              About
            </Link>
            <Link
              href="/nutrition"
              className={`text-sm font-semibold transition-colors duration-200 ${isActive('/nutrition') ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'
                }`}
            >
              Calorie Counter
            </Link>
            {userSession?.user && (
              <Link
                href="/generate-diet"
                className={`text-sm font-semibold transition-colors duration-200 ${isActive('/generate-diet') ? 'text-brand-purple' : 'text-gray-600 hover:text-brand-purple'
                  }`}
              >
                AI Eating Plan
              </Link>
            )}
          </div>

          {/* Desktop Right: Profile / Auth Toggles */}
          <div className="hidden md:flex items-center space-x-3">
            {!isLoading && (
              <>
                {userSession?.user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/profile"
                      className="bg-brand-tint-green border border-brand-green/20 text-brand-green py-1 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-brand-tint-green/80 transition-all"
                    >
                      {userSession.user.image ? (
                        <img
                          src={userSession.user.image}
                          alt={userSession.user.name}
                          className="w-4.5 h-4.5 rounded-full object-cover border border-brand-green/20"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span className="max-w-[80px] truncate">{userSession.user.name}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="text-sm font-semibold text-brand-black hover:text-brand-green transition-colors px-4 py-2"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Layout: Logo Left, Avatar + Toggle Right */}
          <div className="flex md:hidden items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <div className="bg-brand-green p-2 rounded-lg text-white">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight text-brand-black">
                FitTrack <span className="text-brand-green">AI</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {!isLoading && userSession?.user && (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center"
                >
                  {userSession.user.image ? (
                    <img
                      src={userSession.user.image}
                      alt={userSession.user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-brand-green/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-tint-green border-2 border-brand-green/30 flex items-center justify-center text-brand-green">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-brand-black hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-2 shadow-inner">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${isActive('/') ? 'bg-brand-tint-green text-brand-green' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${isActive('/about') ? 'bg-brand-tint-green text-brand-green' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            About
          </Link>
          <Link
            href="/nutrition"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${isActive('/nutrition') ? 'bg-brand-tint-green text-brand-green' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Calorie Counter
          </Link>

          {userSession?.user ? (
            <>
              <div className="border-t border-gray-100 my-2 pt-2" />
              <Link
                href="/generate-diet"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${isActive('/generate-diet') ? 'bg-brand-tint-purple text-brand-purple' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                AI Eating Plan
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${isActive('/profile') ? 'bg-brand-tint-green text-brand-green' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                Profile
              </Link>

              <div className="border-t border-gray-100 my-2 pt-2" />
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {userSession.user.image ? (
                    <img
                      src={userSession.user.image}
                      alt={userSession.user.name}
                      className="w-6 h-6 rounded-full object-cover border border-brand-green/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-tint-green border border-brand-green/20 flex items-center justify-center text-brand-green flex-shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-500 truncate">
                    Logged in as {userSession.user.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 text-base font-semibold text-brand-black hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 text-base font-semibold bg-brand-green text-white hover:bg-brand-green/90 rounded-xl transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;