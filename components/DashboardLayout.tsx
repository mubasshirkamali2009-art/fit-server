'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/context/ToastContext';
import { 
  Utensils, 
  Brain, 
  User, 
  LogOut,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { userSession, profile, isDbConnected, updateProfile } = useApp();
  const { showToast } = useToast();

  const handleLogout = async () => {
    await authClient.signOut();
    showToast('Logged out successfully!', 'info');
    router.push('/');
  };

  // Onboarding form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'bulk' | 'cut' | 'maintain'>('maintain');
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);

  // Live calorie target calculation during onboarding
  useEffect(() => {
    if (height && weight && age) {
      const h = Number(height);
      const w = Number(weight);
      const a = Number(age);
      
      // Mifflin-St Jeor Equation
      let bmr = 10 * w + 6.25 * h - 5 * a;
      if (gender === 'male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      let multiplier = 1.2; // low
      if (activityLevel === 'moderate') multiplier = 1.55;
      if (activityLevel === 'high') multiplier = 1.8;

      const maintenance = Math.round(bmr * multiplier);
      let target = maintenance;
      if (goal === 'cut') target = maintenance - 500;
      if (goal === 'bulk') target = maintenance + 500;

      setCalorieTarget(target);
    }
  }, [height, weight, age, goal, activityLevel, gender]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!height || !weight || !age) return;
    setIsOnboardingSubmitting(true);
    try {
      await updateProfile({
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        gender,
        goal,
        activityLevel,
        calorieTarget,
        isOnboarded: true
      });
      showToast('Onboarding completed successfully! Welcome to FitTrack AI.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Onboarding failed.', 'error');
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const menuItems = [
    {
      name: 'Calorie Counter',
      path: '/nutrition',
      icon: Utensils,
      color: 'text-brand-green',
      hoverBg: 'hover:bg-brand-tint-green hover:text-brand-green'
    },
    {
      name: 'AI Eating Plan',
      path: '/generate-diet',
      icon: Brain,
      color: 'text-brand-purple',
      hoverBg: 'hover:bg-brand-tint-purple hover:text-brand-purple'
    },
    {
      name: 'Biometrics Profile',
      path: '/profile',
      icon: User,
      color: 'text-brand-black',
      hoverBg: 'hover:bg-gray-100 hover:text-brand-black'
    }
  ];

  const isActive = (path: string) => pathname === path;
  const showOnboarding = userSession?.user && (!profile.isOnboarded || !profile.height || profile.height === 0);

  if (showOnboarding) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tint-purple rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-tint-green rounded-full blur-3xl -z-10" />

            <div className="text-center space-y-3">
              <span className="text-brand-green text-[10px] font-black uppercase tracking-widest bg-brand-tint-green border border-brand-green/20 px-3 py-1.5 rounded-full inline-block">
                ✨ Healthify Personalization
              </span>
              <h2 className="font-display font-black text-3xl text-brand-black tracking-tight">
                Welcome to your Fitness Hub!
              </h2>
              <p className="text-xs font-semibold text-gray-500 max-w-sm mx-auto leading-relaxed">
                Please enter your biometric details. We calculate your BMI and daily calorie target based on your health goals.
              </p>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                  >
                    <option value="cut">Fat Loss (Cut)</option>
                    <option value="bulk">Muscle Gain (Bulk)</option>
                    <option value="maintain">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Activity Level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                  >
                    <option value="low">Sedentary (desk job)</option>
                    <option value="moderate">Active (gym 3-4x/week)</option>
                    <option value="high">Athletic (daily workout)</option>
                  </select>
                </div>
              </div>

              {height && weight && age && (
                <div className="p-4 bg-brand-tint-green/40 border border-brand-green/10 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>Estimated Daily Calorie Target:</span>
                    <span className="text-brand-green text-sm font-black">{calorieTarget} kcal</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>Estimated BMI:</span>
                    <span className="text-brand-purple text-sm font-black">
                      {(Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isOnboardingSubmitting}
                className="w-full py-4 bg-brand-black text-white font-extrabold uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-green transition-all active:scale-98 shadow-md"
              >
                {isOnboardingSubmitting ? 'Saving Metrics...' : 'Complete Onboarding'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 sticky top-16 h-[calc(100vh-64px)] justify-between z-40">
        <div className="space-y-8">
          {/* User Profile Summary */}
          {userSession?.user && (
            <div className="flex items-center gap-3 p-3 bg-brand-tint-neutral border border-brand-black/5 rounded-2xl">
              {userSession.user.image ? (
                <img
                  src={userSession.user.image}
                  alt={userSession.user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-brand-green/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-brand-tint-green border border-brand-green/10 flex items-center justify-center text-brand-green font-bold">
                  {userSession.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-brand-black truncate leading-tight">
                  {userSession.user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-brand-green">
                    Goal: {profile.goal || 'Onboarding'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-brand-black text-white shadow-sm'
                      : `text-gray-500 ${item.hoverBg}`
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : item.color}`} />
                  {item.name}
                  {item.name.includes('AI') && (
                    <Sparkles className="h-3 w-3 text-brand-purple fill-brand-purple ml-auto animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="space-y-4 pt-4 border-t border-gray-50">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
            <span className="flex items-center gap-1">
              {isDbConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-brand-green" /> Cloud DB Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-red-400" /> Offline Cache
                </>
              )}
            </span>
            <span className="uppercase text-gray-300">v2.0</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2.5 px-4 flex justify-around items-center z-50 shadow-lg">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                active ? 'text-brand-green' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-black tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Work Area */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 mb-20 md:mb-0 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
