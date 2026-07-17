'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ArrowRight, Flame, Brain, Sparkles, Scale, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SLIDE_INTERVAL = 5000; // 5s

const Page = () => {
  const { userSession, foodLogs, profile } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 2;

  const goToSlide = useCallback((index: number) => {
    setActiveSlide(((index % totalSlides) + totalSlides) % totalSlides);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveSlide(prev => (prev + 1) % totalSlides);
  }, []);

  // Auto-advance every 5s, resets whenever activeSlide changes (incl. manual clicks)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [activeSlide, nextSlide]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Categorize food logs or fallback to mock logs for unauthenticated preview
  const logs = userSession?.user ? foodLogs : [
    { id: '1', name: 'Chicken Breast (150g)', calories: 250, date: todayStr, healthy: true },
    { id: '2', name: 'White Rice Cooked (200g)', calories: 260, date: todayStr, healthy: true },
    { id: '3', name: 'Apple (100g)', calories: 52, date: todayStr, healthy: true },
    { id: '4', name: 'Pepsi Soda (1 serving)', calories: 150, date: todayStr, healthy: false },
    { id: '5', name: 'Double Cheeseburger', calories: 650, date: todayStr, healthy: false }
  ];

  const isFoodHealthy = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('chicken') || n.includes('rice') || n.includes('apple') ||
      n.includes('banana') || n.includes('egg') || n.includes('oatmeal') ||
      n.includes('almond') || n.includes('yogurt') || n.includes('salmon') ||
      n.includes('broccoli') || n.includes('spinach') || n.includes('salad') ||
      n.includes('water') || n.includes('milk') || n.includes('sweet potato') ||
      n.includes('bread') || n.includes('cottage cheese') || n.includes('tuna');
  };

  // Group calorie intake for the last 5 days
  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const barData = last5Days.map(date => {
    const dayLogs = userSession?.user
      ? logs.filter(log => log.date === date)
      : (date === todayStr ? logs : [
        { name: 'Oatmeal', calories: 220, date, healthy: true },
        { name: 'Apple', calories: 55, date, healthy: true },
        { name: 'Pizza Slice', calories: 290, date, healthy: false }
      ]);

    let healthyCals = 0;
    let unhealthyCals = 0;

    dayLogs.forEach(log => {
      if ('healthy' in log && typeof log.healthy === 'boolean') {
        if (log.healthy) healthyCals += log.calories;
        else unhealthyCals += log.calories;
      } else {
        if (isFoodHealthy(log.name)) {
          healthyCals += log.calories;
        } else {
          unhealthyCals += log.calories;
        }
      }
    });

    const [year, month, day] = date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      name: label,
      Healthy: healthyCals || (userSession?.user ? 0 : 500 + Math.round(Math.random() * 150)),
      Unhealthy: unhealthyCals || (userSession?.user ? 0 : 300 + Math.round(Math.random() * 200))
    };
  });

  // Calculate today's budget split for Pie Chart
  const todayLogs = logs.filter(log => log.date === todayStr);
  const totalToday = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const target = profile.calorieTarget || 2000;

  const pieData = [];
  let remaining = 0;
  let consumed = 0;
  let extraEaten = 0;

  if (totalToday <= target) {
    consumed = totalToday;
    remaining = target - totalToday;
    extraEaten = 0;

    pieData.push({ name: 'Consumed Calories', value: consumed, color: '#0F9D77' });
    pieData.push({ name: 'Remaining Target', value: remaining, color: '#e5e7eb' });
  } else {
    consumed = target;
    remaining = 0;
    extraEaten = totalToday - target;

    pieData.push({ name: 'Consumed Target', value: consumed, color: '#0F9D77' });
    pieData.push({ name: 'Extra Eaten (Over)', value: extraEaten, color: '#ef4444' });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Hero Slider Section */}
      <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] bg-brand-black text-white overflow-hidden mb-8 sm:mb-12 shadow-xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {/* Slide 1: Main Hero */}
          <div className="relative w-full flex-shrink-0 py-10 px-5 sm:py-16 sm:px-16 text-center">
            <div className="absolute top-0 right-0 w-[220px] h-[220px] sm:w-[450px] sm:h-[450px] bg-brand-green/20 rounded-full blur-[90px] sm:blur-[120px] -mr-16 -mt-16 sm:-mr-36 sm:-mt-36" />
            <div className="absolute bottom-0 left-0 w-[220px] h-[220px] sm:w-[450px] sm:h-[450px] bg-brand-purple/20 rounded-full blur-[90px] sm:blur-[120px] -ml-16 -mb-16 sm:-ml-36 sm:-mb-36" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider bg-brand-green text-white border border-brand-green/20 shadow-lg shadow-brand-green/20">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Premium Healthify Assistant
              </span>
              <h1 className="font-display font-black text-2xl sm:text-5xl lg:text-6xl tracking-tight leading-tight sm:leading-none text-white">
                Simplify your nutrition. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#a3e635] to-brand-purple">
                  Achieve your target.
                </span>
              </h1>
              <p className="text-gray-400 font-semibold text-[11px] sm:text-sm lg:text-base max-w-xl mx-auto leading-relaxed px-3 sm:px-0">
                The ultimate companion to track daily calorie consumption, calculate your body metrics, and generate tailored, full-day eating plans using Gemini AI.
              </p>

              <div className="pt-3 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
                {userSession?.user ? (
                  <Link
                    href="/profile"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green text-white font-extrabold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-brand-green/90 transition-all shadow-md active:scale-95 text-xs sm:text-sm"
                  >
                    Go to Profile Dashboard <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green text-white font-extrabold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-brand-green/90 transition-all shadow-md active:scale-95 text-xs sm:text-sm"
                    >
                      Get Started Free <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                    <Link
                      href="/nutrition"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-extrabold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all border border-white/10 active:scale-95 text-xs sm:text-sm"
                    >
                      Calorie Counter
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Slide 2: AI Diet Planner Hero */}
          <div className="relative w-full flex-shrink-0 py-10 px-5 sm:py-16 sm:px-16 text-center">
            <div className="absolute top-0 left-0 w-[220px] h-[220px] sm:w-[450px] sm:h-[450px] bg-brand-purple/20 rounded-full blur-[90px] sm:blur-[120px] -ml-16 -mt-16 sm:-ml-36 sm:-mt-36" />
            <div className="absolute bottom-0 right-0 w-[220px] h-[220px] sm:w-[450px] sm:h-[450px] bg-brand-green/20 rounded-full blur-[90px] sm:blur-[120px] -mr-16 -mb-16 sm:-mr-36 sm:-mb-36" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider bg-brand-purple text-white border border-brand-purple/20 shadow-lg shadow-brand-purple/20">
                <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> AI-Powered Meal Planning
              </span>
              <h1 className="font-display font-black text-2xl sm:text-5xl lg:text-6xl tracking-tight leading-tight sm:leading-none text-white">
                Let AI build your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-[#a3e635] to-brand-green">
                  full-day diet plan.
                </span>
              </h1>
              <p className="text-gray-400 font-semibold text-[11px] sm:text-sm lg:text-base max-w-xl mx-auto leading-relaxed px-3 sm:px-0">
                Powered by Gemini AI, get a personalized breakfast, lunch, snacks, and dinner plan built around your exact macros and goals.
              </p>

              <div className="pt-3 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
                <Link
                  href="/generate-diet"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-purple text-white font-extrabold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-brand-purple/90 transition-all shadow-md active:scale-95 text-xs sm:text-sm"
                >
                  Generate My Diet Plan <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Prev/Next Arrows */}
        <button
          onClick={() => goToSlide(activeSlide - 1)}
          aria-label="Previous slide"
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full transition-all"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => goToSlide(activeSlide + 1)}
          aria-label="Next slide"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full transition-all"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${activeSlide === i ? 'w-5 sm:w-6 bg-brand-green' : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/50'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Analytics Dashboard Preview (Recharts) */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-10 shadow-sm space-y-5 sm:space-y-8 mb-10 sm:mb-16">
        <div>
          <span className="text-brand-purple text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-brand-tint-purple border border-brand-purple/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full inline-block">
            📊 Live Metrics Overview
          </span>
          <h2 className="font-display font-black text-lg sm:text-2xl text-brand-black tracking-tight mt-2.5 sm:mt-3">
            {userSession?.user ? "Your Live Calorie & Quality Analytics" : "Preview Analytics Dashboard"}
          </h2>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 mt-1">
            See your food health balance and goal budget status in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 pt-2 sm:pt-4">

          {/* Chart 1: Healthy vs Unhealthy calories (Bar Chart) */}
          <div className="border border-gray-50 bg-gray-50/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
            <div>
              <h3 className="font-display font-black text-sm sm:text-base text-gray-800">Food Intake Classification</h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">Compares calories from healthy catalog items versus custom/unprocessed additions.</p>
            </div>

            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} interval={0} />
                  <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151515', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="Healthy" fill="#0F9D77" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Unhealthy" fill="#7C5CE0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Today's Budget Allocation (Pie Chart) */}
          <div className="border border-gray-50 bg-gray-50/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4 max-w-xs w-full">
              <div>
                <h3 className="font-display font-black text-sm sm:text-base text-gray-800">Calorie Goal Completion</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">Visualizing today's calorie targets, eaten budget, and any extra calories consumed.</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-green inline-block" /> Eaten Target:</span>
                  <span className="font-black text-brand-black">{consumed} kcal</span>
                </div>
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-200 inline-block" /> Remaining:</span>
                  <span className="font-black text-brand-black">{remaining} kcal</span>
                </div>
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 inline-block" /> Extra Calories:</span>
                  <span className="font-black text-red-500">{extraEaten} kcal</span>
                </div>
              </div>
            </div>

            <div className="h-44 w-44 sm:h-60 sm:w-60 relative flex items-center justify-center flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151515', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-brand-black">{totalToday}</span>
                <span className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-wider">kcal today</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-4 sm:space-y-6 mb-10 sm:mb-16">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 px-2">
          <h2 className="font-display font-black text-xl sm:text-3xl tracking-tight text-brand-black">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500">
            We removed the clutter to focus on what actually drives results: calorie tracking and customized meal planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 pt-3 sm:pt-6">
          {/* Feature 1 */}
          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-brand-tint-green text-brand-green p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-black text-base sm:text-xl text-brand-black">Calorie Counter</h3>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500 leading-relaxed">
                Search our preset MongoDB food database, adjust portion sizes, and calculate your daily budget. Add logs to your calendar history on the go.
              </p>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] sm:text-xs font-extrabold text-brand-green">
              <span>Try without login</span>
              <Link href="/nutrition" className="hover:underline flex items-center gap-1">
                Explore <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-brand-tint-purple text-brand-purple p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-black text-base sm:text-xl text-brand-black">AI Full-Day Diet Planner</h3>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500 leading-relaxed">
                Generate tailored eating plans powered by Gemini AI. Input your metrics to receive breakfast, lunch, snacks, and dinner lists with precise macro ratios.
              </p>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] sm:text-xs font-extrabold text-brand-purple">
              <span>Requires onboarding</span>
              <Link href="/generate-diet" className="hover:underline flex items-center gap-1">
                Generate Plan <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-100 text-brand-black p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit">
                <Scale className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-black text-base sm:text-xl text-brand-black">Physiological Metrics</h3>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500 leading-relaxed">
                Calculate your BMI and exact daily caloric intake target using the Mifflin-St Jeor equation. Choose between Bulking, Cutting, or Maintenance budgets.
              </p>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] sm:text-xs font-extrabold text-brand-black">
              <span>Interactive dashboard</span>
              <Link href="/profile" className="hover:underline flex items-center gap-1">
                View Stats <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Elements */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 flex flex-col md:flex-row items-center justify-around gap-3 sm:gap-6 text-center md:text-left">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-gray-700">Seeded MongoDB Food Logs</span>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-gray-700">No hardcoded caloric targets</span>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-gray-700">Advanced Gemini 2.5 Diet Models</span>
        </div>
      </div>
    </div>
  );
};

export default Page;