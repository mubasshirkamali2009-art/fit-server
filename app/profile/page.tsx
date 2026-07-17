'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, UserProfile } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Scale, Info, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const ProfilePage = () => {
  const { userSession, isLoading, profile, updateProfile, calculateBmi } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState(profile.goal);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [calorieTarget, setCalorieTarget] = useState(profile.calorieTarget);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current values once profile loads
  useEffect(() => {
    if (profile) {
      setHeight(profile.height);
      setWeight(profile.weight);
      setAge(profile.age);
      setGender(profile.gender || 'male');
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel);
      setCalorieTarget(profile.calorieTarget);
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && (!userSession || !userSession.user)) {
      router.push('/login');
    }
  }, [userSession, isLoading, router]);

  if (isLoading || !userSession?.user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    try {
      const updated: Partial<UserProfile> = {
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        gender,
        goal,
        activityLevel,
        calorieTarget: Number(calorieTarget),
        isOnboarded: true
      };

      await updateProfile(updated);
      setSaveSuccess(true);
      showToast('Biometrics updated successfully!', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update biometrics.', 'error');
    }
  };

  const bmiDetails = calculateBmi();

  // Helper to suggest calorie target based on goal
  const autoSuggestCalories = () => {
    // Mifflin-St Jeor Equation
    let baseBmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
    if (gender === 'male') {
      baseBmr += 5;
    } else {
      baseBmr -= 161;
    }

    let multiplier = 1.2; // Sedentary
    if (activityLevel === 'moderate') multiplier = 1.55;
    if (activityLevel === 'high') multiplier = 1.8;

    const maintenance = Math.round(baseBmr * multiplier);
    
    if (goal === 'cut') {
      setCalorieTarget(maintenance - 500);
    } else if (goal === 'bulk') {
      setCalorieTarget(maintenance + 500);
    } else {
      setCalorieTarget(maintenance);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        
        <div>
          <h1 className="font-display font-black text-3xl text-brand-black tracking-tight">
            Biometric Profile
          </h1>
          <p className="text-sm font-semibold text-gray-400 mt-1">Configure your physiological statistics and calorie limits.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns: Form Fields (2/3 width) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            
            {saveSuccess && (
              <div className="p-4 bg-brand-tint-green border-l-4 border-brand-green rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                <p className="text-xs font-semibold text-brand-green">Profile metrics updated successfully!</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  required
                  value={height || ''}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  required
                  value={weight || ''}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Age (years)
                </label>
                <input
                  type="number"
                  required
                  value={age || ''}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Fitness Goal
                </label>
                <select
                  value={goal || 'maintain'}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                >
                  <option value="cut">Fat Loss (Cut)</option>
                  <option value="bulk">Muscle Gain (Bulk)</option>
                  <option value="maintain">Performance (Maintain)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Activity Level
                </label>
                <select
                  value={activityLevel || 'moderate'}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all cursor-pointer"
                >
                  <option value="low">Sedentary (desk job)</option>
                  <option value="moderate">Active (gym 3-4x/week)</option>
                  <option value="high">Athletic (daily workout)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                      Daily Calorie Target (kcal)
                    </label>
                    <button
                      type="button"
                      onClick={autoSuggestCalories}
                      className="text-[10px] font-black text-brand-green hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Suggest Target
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    value={calorieTarget || ''}
                    onChange={(e) => setCalorieTarget(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-green text-white font-extrabold hover:bg-brand-green/90 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </div>

          </form>

          {/* Right Column: Live BMI status (1/3 width) */}
          <div className="bg-brand-tint-purple border border-brand-purple/10 rounded-[2rem] p-7 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-purple/10 pb-4">
              <Scale className="h-5 w-5 text-brand-purple" />
              <h3 className="font-display font-black text-lg text-brand-black">Live Biometrics</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">BODY MASS INDEX</div>
                <div className="text-4xl font-black text-brand-black tracking-tight mt-1">
                  {bmiDetails.bmi || '0.0'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">CATEGORY</div>
                <span className={`inline-block font-extrabold text-sm mt-1 px-3 py-1 rounded-xl bg-white border border-brand-purple/10 ${bmiDetails.color || 'text-gray-500'}`}>
                  {bmiDetails.category || 'N/A'}
                </span>
              </div>

              <div className="bg-white/60 p-4 border border-brand-purple/10 rounded-2xl flex items-start gap-2.5">
                <Info className="h-4 w-4 text-brand-purple flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                  {bmiDetails.advice || 'Complete onboarding to generate BMI details.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
