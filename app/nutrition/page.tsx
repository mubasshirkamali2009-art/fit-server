'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/DashboardLayout';

import Link from 'next/link';
import { Flame, Plus, Trash2, Search, Utensils, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface FoodItem {
  name: string;
  calories: number;
}

const NutritionPage = () => {
  const { userSession, isLoading, foodLogs, profile, addFoodLog, deleteFoodLog } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  // Search and portions state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(100); // 100g or 1 serving
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodCalories, setCustomFoodCalories] = useState<number | ''>('');

  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for logged foods if user is logged out
  const [localLogs, setLocalLogs] = useState<{ id: string; name: string; calories: number; date: string }[]>([]);

  // Search database for foods
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/nutrition/foods?search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setError('Failed to fetch food search results.');
      }
    } catch (err) {
      setError('Connection error while searching foods.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const isPerServing = isServingBased(food.name);
    setQuantity(isPerServing ? 1 : 100);
  };

  const isServingBased = (name: string): boolean => {
    const lowercase = name.toLowerCase();
    return lowercase.includes('egg') ||
      lowercase.includes('bread') ||
      lowercase.includes('scoop') ||
      lowercase.includes('tbsp') ||
      lowercase.includes('slice') ||
      lowercase.includes('serving') ||
      lowercase.includes('protein powder');
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalName = '';
    let finalCalories = 0;

    if (selectedFood) {
      finalName = `${selectedFood.name} (${quantity}${isServingBased(selectedFood.name) ? ' serv' : 'g'})`;
      if (isServingBased(selectedFood.name)) {
        finalCalories = Math.round(selectedFood.calories * quantity);
      } else {
        finalCalories = Math.round((selectedFood.calories * quantity) / 100);
      }
    } else {
      if (!customFoodName) {
        setError('Please select a food or enter a custom name.');
        return;
      }
      if (!customFoodCalories || Number(customFoodCalories) <= 0) {
        setError('Please enter a valid calorie amount.');
        return;
      }
      finalName = customFoodName;
      finalCalories = Number(customFoodCalories);
    }

    setIsSubmitting(true);
    try {
      if (userSession?.user) {
        await addFoodLog(finalName, finalCalories);
        showToast(`Logged "${finalName}" to database successfully!`, 'success');
      } else {
        // Add to local state for guest user
        const newLog = {
          id: Math.random().toString(36).substring(2, 9),
          name: finalName,
          calories: finalCalories,
          date: new Date().toISOString().split('T')[0]
        };
        setLocalLogs(prev => [newLog, ...prev]);
        showToast(`Logged "${finalName}" locally!`, 'success');
      }
      // Reset form states
      setSelectedFood(null);
      setCustomFoodName('');
      setCustomFoodCalories('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      const errMsg = err.message || 'Could not add food log. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      if (userSession?.user) {
        await deleteFoodLog(id);
        showToast('Food entry removed from database!', 'info');
      } else {
        setLocalLogs(prev => prev.filter(item => item.id !== id));
        showToast('Food entry removed!', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove food entry.', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const logsToShow = userSession?.user
    ? foodLogs.filter(f => f.date === todayStr)
    : localLogs.filter(f => f.date === todayStr);

  const totalCaloriesToday = logsToShow.reduce((sum, f) => sum + f.calories, 0);
  const targetCalories = profile.calorieTarget || 2000;
  const progressPercent = Math.min((totalCaloriesToday / targetCalories) * 100, 100);

  const viewContent = (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-brand-black tracking-tight">
          Calorie Counter
        </h1>
        <p className="text-sm font-semibold text-gray-400 mt-1">
          Search the database to compute calories and track your daily budget.
        </p>
      </div>

      {!userSession?.user && (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-semibold text-orange-700 leading-relaxed">
            <p className="font-black">Guest Mode Enabled</p>
            <p>You can search foods and calculate calories locally. <Link href="/login" className="underline font-black">Log in</Link> to sync your history to the database.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Side: Logger Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="font-display font-black text-lg text-brand-black flex items-center gap-2 border-b border-gray-50 pb-4">
              <Plus className="h-5 w-5 text-brand-green" /> Add Food Item
            </h2>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                {error}
              </div>
            )}

            {/* Food Search Bar */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Search Food Database
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type to search (e.g. Apple, Chicken, Rice...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:border-brand-green transition-all"
                />
              </div>
            </div>

            {/* Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="border border-gray-100 rounded-2xl max-h-48 overflow-y-auto divide-y divide-gray-50 shadow-inner bg-gray-50/20">
                {searchResults.map((food, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left px-4 py-3 hover:bg-brand-tint-green/30 text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                  >
                    <span>{food.name}</span>
                    <span className="text-gray-400">{food.calories} kcal {isServingBased(food.name) ? '/ serving' : '/ 100g'}</span>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="text-center py-2 text-xs font-bold text-gray-400 animate-pulse">
                Searching DB...
              </div>
            )}

            {/* Selected Food / Portion Form */}
            {selectedFood && (
              <form onSubmit={handleAddFood} className="p-4 bg-brand-tint-green/30 border border-brand-green/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-brand-black">{selectedFood.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                      {isServingBased(selectedFood.name) ? 'Servings (count)' : 'Weight (grams)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-green"
                    />
                  </div>

                  <div className="text-right p-3 bg-white/80 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Calories</div>
                    <div className="text-lg font-black text-brand-green mt-0.5">
                      {isServingBased(selectedFood.name)
                        ? Math.round(selectedFood.calories * quantity)
                        : Math.round((selectedFood.calories * quantity) / 100)}{' '}
                      kcal
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-brand-green text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-green/90 transition-all active:scale-98 shadow-sm"
                >
                  Log Food Entry
                </button>
              </form>
            )}

            {/* Custom Manual Food Entry */}
            {!selectedFood && (
              <form onSubmit={handleAddFood} className="border-t border-gray-50 pt-6 space-y-4">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Or Enter Custom Food</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Avocado Toast"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Calories (kcal)"
                      value={customFoodCalories}
                      onChange={(e) => setCustomFoodCalories(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:border-brand-green transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-brand-black text-white font-extrabold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-brand-green transition-all active:scale-95 shadow-sm"
                >
                  Log Custom Food
                </button>
              </form>
            )}
          </div>

          {/* Today's Logged Foods List */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="font-display font-black text-lg text-brand-black flex items-center gap-2 border-b border-gray-50 pb-4">
              <Utensils className="h-5 w-5 text-brand-purple" /> Today's Logged Meals
            </h2>

            {logsToShow.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-6">No foods logged today yet.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto pr-2">
                {logsToShow.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-3.5">
                    <div>
                      <div className="text-xs font-black text-gray-800">{log.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold mt-0.5">Today</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-brand-green">{log.calories} kcal</span>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Calorie Budget Progress Dashboard */}
        <div className="bg-brand-black text-white rounded-[2rem] p-7 space-y-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-green/10 rounded-full blur-3xl -z-10" />

          <h3 className="font-display font-black text-lg text-white border-b border-white/10 pb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-brand-green" /> Daily Calorie Budget
          </h3>

          <div className="flex flex-col items-center justify-center py-4 relative">
            {/* Visual Circular Progress Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-white/10"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-brand-green transition-all duration-500"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - progressPercent / 100)}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black tracking-tight text-white">{totalCaloriesToday}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">kcal consumed</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-xs font-bold text-gray-300">
              <span>Goal Target:</span>
              <span className="text-white font-black">{targetCalories} kcal</span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-gray-300">
              <span>Remaining Calories:</span>
              <span className={`font-black ${targetCalories - totalCaloriesToday < 0 ? 'text-red-400' : 'text-brand-green'}`}>
                {Math.max(0, targetCalories - totalCaloriesToday)} kcal
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-green h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 text-center font-bold">
              {Math.round(progressPercent)}% of daily allowance completed
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return userSession?.user ? (
    <DashboardLayout>{viewContent}</DashboardLayout>
  ) : (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 md:p-10 mb-10">
        {viewContent}
      </main>
    </div>
  );
};

export default NutritionPage;
