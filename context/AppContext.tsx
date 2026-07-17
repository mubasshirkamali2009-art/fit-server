'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  date: string; // YYYY-MM-DD
}

export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number;
  calories: number;
}

export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  age: number;
  gender?: 'male' | 'female';
  goal: 'bulk' | 'cut' | 'maintain';
  activityLevel: 'low' | 'moderate' | 'high';
  calorieTarget: number;
  isOnboarded?: boolean;
}

interface AppContextType {
  foodLogs: FoodLog[];
  weightHistory: WeightLog[];
  profile: UserProfile;
  isLoading: boolean;
  isDbConnected: boolean;
  userSession: any;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addFoodLog: (name: string, calories: number) => Promise<void>;
  deleteFoodLog: (id: string) => Promise<void>;
  calculateBmi: () => { bmi: number; category: string; color: string; advice: string };
  triggerDemoLogin: () => Promise<boolean>;
}

const defaultWeightHistory: WeightLog[] = [
  { date: '2026-06-18', weight: 81.2, calories: 2100 },
  { date: '2026-06-25', weight: 80.8, calories: 1950 },
  { date: '2026-07-02', weight: 80.1, calories: 1800 },
  { date: '2026-07-09', weight: 79.5, calories: 1900 },
  { date: '2026-07-16', weight: 78.9, calories: 1850 }
];

const defaultProfile: UserProfile = {
  height: 0,
  weight: 0,
  age: 0,
  gender: 'male',
  goal: 'maintain',
  activityLevel: 'moderate',
  calorieTarget: 2000,
  isOnboarded: false
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: sessionData, isPending } = authClient.useSession();
  
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>(defaultWeightHistory);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Synchronize authentication and database data
  useEffect(() => {
    const fetchData = async () => {
      if (sessionData?.user) {
        try {
          const [prof, foods] = await Promise.all([
            apiGet<any>('/profile'),
            apiGet<any[]>('/nutrition'),
          ]);

          if (prof && (prof.height !== undefined || prof.isOnboarded !== undefined)) {
            setProfile(prof);
          }
          setIsDbConnected(true);
          if (Array.isArray(foods)) setFoodLogs(foods);
        } catch (error) {
          console.error('Error connecting to Express backend, using fallback storage:', error);
          setIsDbConnected(false);
          loadLocalFallback();
        }
      } else {
        loadLocalFallback();
      }
      setIsLoading(false);
    };

    if (!isPending) {
      fetchData();
    }
  }, [sessionData, isPending]);

  const loadLocalFallback = () => {
    if (typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('fit_profile');
      const cachedFoods = localStorage.getItem('fit_foods');
      const cachedWeight = localStorage.getItem('fit_weights');

      if (cachedProfile) setProfile(JSON.parse(cachedProfile));
      if (cachedFoods) setFoodLogs(JSON.parse(cachedFoods));
      if (cachedWeight) setWeightHistory(JSON.parse(cachedWeight));
    }
  };

  const syncLocalItem = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // Profile Update
  const updateProfile = async (updatedFields: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updatedFields };
    setProfile(newProfile);

    // Sync weight change to weight history list
    if (updatedFields.weight) {
      const todayStr = new Date().toISOString().split('T')[0];
      setWeightHistory(prev => {
        const index = prev.findIndex(w => w.date === todayStr);
        let updatedWeights;
        if (index > -1) {
          updatedWeights = [...prev];
          updatedWeights[index] = {
            ...updatedWeights[index],
            weight: updatedFields.weight!
          };
        } else {
          updatedWeights = [...prev, { date: todayStr, weight: updatedFields.weight!, calories: newProfile.calorieTarget }];
        }
        syncLocalItem('fit_weights', updatedWeights);
        return updatedWeights;
      });
    }

    syncLocalItem('fit_profile', newProfile);

    if (sessionData?.user && isDbConnected) {
      try {
        await apiPost('/profile', newProfile);
      } catch (err) {
        console.error('Failed to sync profile to DB:', err);
      }
    }
  };

  // Nutrition
  const addFoodLog = async (name: string, calories: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newLog: FoodLog = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      calories,
      date: today
    };

    setFoodLogs(prev => {
      const updated = [newLog, ...prev];
      syncLocalItem('fit_foods', updated);
      return updated;
    });

    // Also update weight log calorie intake for today
    setWeightHistory(prev => {
      const index = prev.findIndex(w => w.date === today);
      let updatedWeights;
      if (index > -1) {
        updatedWeights = [...prev];
        updatedWeights[index] = {
          ...updatedWeights[index],
          calories: updatedWeights[index].calories + calories
        };
      } else {
        updatedWeights = [...prev, { date: today, weight: profile.weight, calories: calories }];
      }
      syncLocalItem('fit_weights', updatedWeights);
      return updatedWeights;
    });

    if (sessionData?.user && isDbConnected) {
      try {
        await apiPost('/nutrition', newLog);
      } catch (err) {
        console.error('Failed to sync food log:', err);
      }
    }
  };

  const deleteFoodLog = async (id: string) => {
    setFoodLogs(prev => {
      const updated = prev.filter(f => f.id !== id);
      syncLocalItem('fit_foods', updated);
      return updated;
    });

    if (sessionData?.user && isDbConnected) {
      try {
        await apiDelete('/nutrition', { id });
      } catch (err) {
        console.error('Failed to delete food log:', err);
      }
    }
  };

  // BMI calculations
  const calculateBmi = () => {
    const heightInMeters = profile.height / 100;
    if (heightInMeters <= 0) return { bmi: 0, category: 'N/A', color: 'text-gray-500', advice: 'Enter a valid height.' };
    
    const bmi = parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
    
    let category = '';
    let color = '';
    let advice = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-blue-500';
      advice = 'We recommend a slight caloric surplus (bulking mode) with compound resistance exercises to build lean muscle safely.';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Healthy Weight';
      color = 'text-brand-green';
      advice = 'Excellent. Maintain your physical stats or toggle clean bulk / slow cut based on your definition goals.';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = 'text-orange-500';
      advice = 'We recommend a caloric deficit (cutting mode) alongside consistent cardio and high-intensity interval training.';
    } else {
      category = 'Obese';
      color = 'text-red-500';
      advice = 'Focus on cardiovascular health, a sustainable caloric deficit, and consistency. Start with moderate low-impact activities.';
    }

    return { bmi, category, color, advice };
  };

  // Demo login trigger
  const triggerDemoLogin = async () => {
    try {
      const demoEmail = 'demo@fittrack.ai';
      const demoPassword = 'password123';

      try {
        await authClient.signUp.email({
          email: demoEmail,
          password: demoPassword,
          name: 'FitTrack Demo Account',
        });
      } catch (e) {
        // Fall through to sign in if user already exists
      }

      const res = await authClient.signIn.email({
        email: demoEmail,
        password: demoPassword
      });

      return !!res.data;
    } catch (err) {
      console.error('Demo login error:', err);
      window.location.href = '/profile';
      return true;
    }
  };

  return (
    <AppContext.Provider
      value={{
        foodLogs,
        weightHistory,
        profile,
        isLoading,
        isDbConnected,
        userSession: sessionData,
        updateProfile,
        addFoodLog,
        deleteFoodLog,
        calculateBmi,
        triggerDemoLogin
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
