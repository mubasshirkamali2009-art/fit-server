'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Sparkles, Utensils, AlertCircle, Apple, Flame, Info, CheckCircle } from 'lucide-react';

interface Meal {
  name: string;
  description: string;
  calories: number;
}

interface DietPlan {
  meals: Meal[];
  totalCalories: number;
  macros: { carbs: number; protein: number; fat: number };
  dietitianTips: string[];
}

const GenerateDietPage = () => {
  const { userSession, isLoading, profile } = useApp();
  const router = useRouter();

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && (!userSession || !userSession.user)) {
      router.push('/login');
    }
  }, [userSession, isLoading, router]);

  // Load plan from localStorage if it was previously generated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('fit_diet_plan');
      if (cached) {
        setDietPlan(JSON.parse(cached));
      }
    }
  }, []);

  if (isLoading || !userSession?.user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const handleGenerateDiet = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const session = await import('@/lib/auth-client').then(m => m.authClient.getSession()) as any;
      const token = session?.data?.session?.token || '';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'generate-diet',
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
          gender: profile.gender || 'male',
          goal: profile.goal,
          activityLevel: profile.activityLevel
        })
      });

      if (res.ok) {
        const plan = await res.json();
        setDietPlan(plan);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fit_diet_plan', JSON.stringify(plan));
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate diet plan. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Could not contact the AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-brand-black tracking-tight flex items-center gap-2">
              AI Diet Planner
            </h1>
            <p className="text-sm font-semibold text-gray-400 mt-1">
              Generate a custom full day eating plan based on your current biometrics and goals.
            </p>
          </div>

          <button
            onClick={handleGenerateDiet}
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-purple hover:bg-brand-purple/95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-purple/10"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Analyzing Metrics...' : 'Generate Diet Plan'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-500" />
            {error}
          </div>
        )}

        {isGenerating && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-brand-purple/20" />
              <div className="absolute inset-0 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-black text-gray-700 animate-pulse">Running dietary logic models...</p>
            <p className="text-xs text-gray-400 font-semibold max-w-xs text-center leading-relaxed">
              Analyzing Height ({profile.height}cm), Weight ({profile.weight}kg), and Goal ({profile.goal}) to generate your custom macro split.
            </p>
          </div>
        )}

        {!isGenerating && !dietPlan && (
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 text-center space-y-6 max-w-xl mx-auto shadow-sm">
            <div className="bg-brand-tint-purple p-4 rounded-2xl w-fit mx-auto text-brand-purple">
              <Apple className="h-8 w-8" />
            </div>
            <h3 className="font-display font-black text-xl text-brand-black">No Plan Generated Yet</h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              Click the "Generate Diet Plan" button in the top right to analyze your biometrics and receive a personalized 5-meal eating plan designed specifically for you.
            </p>
          </div>
        )}

        {!isGenerating && dietPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left/Middle: Meal cards (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-display font-black text-xl text-brand-black flex items-center gap-2 border-b border-gray-50 pb-4">
                <Utensils className="h-5 w-5 text-brand-green" /> Your Eating Schedule
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {dietPlan.meals.map((meal, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider text-brand-purple bg-brand-tint-purple border border-brand-purple/20 px-2.5 py-1 rounded-full">
                        {meal.name}
                      </span>
                      <p className="text-sm font-semibold text-gray-700 pt-2 leading-relaxed">
                        {meal.description}
                      </p>
                    </div>
                    <div className="bg-brand-tint-green text-brand-green border border-brand-green/10 rounded-2xl px-4 py-3 flex flex-col items-center justify-center flex-shrink-0 w-24">
                      <span className="text-xs font-black">{meal.calories}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-0.5">kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Macros Split & Dietitian Tips (1/3 width) */}
            <div className="space-y-6">
              
              {/* Macros split card */}
              <div className="bg-brand-black text-white rounded-[2rem] p-7 space-y-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-brand-purple/10 rounded-full blur-3xl -z-10" />
                <h3 className="font-display font-black text-lg border-b border-white/10 pb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-brand-purple" /> Macro Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">DAILY CALORIE BUDGET</div>
                      <div className="text-3xl font-black text-white mt-0.5">{dietPlan.totalCalories} kcal</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10">
                    {/* Carbs */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-300">
                        <span>Carbohydrates</span>
                        <span className="text-white font-black">{dietPlan.macros.carbs}g</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-green h-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Protein */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-300">
                        <span>Protein</span>
                        <span className="text-white font-black">{dietPlan.macros.protein}g</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-purple h-full" style={{ width: '35%' }} />
                      </div>
                    </div>

                    {/* Fat */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-300">
                        <span>Dietary Fat</span>
                        <span className="text-white font-black">{dietPlan.macros.fat}g</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-yellow-400 h-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dietitian Tips Card */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-7 space-y-6 shadow-sm">
                <h3 className="font-display font-black text-lg text-brand-black border-b border-gray-50 pb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-brand-purple" /> Dietitian Advice
                </h3>

                <ul className="space-y-4">
                  {dietPlan.dietitianTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <CheckCircle className="h-4.5 w-4.5 text-brand-green flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-gray-600 leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default GenerateDietPage;
