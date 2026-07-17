import React from 'react';
import { Target, Heart, Award, ArrowUpRight, Flame } from 'lucide-react';
import Link from 'next/link';

const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-brand-purple text-xs font-extrabold uppercase tracking-widest bg-brand-tint-purple border border-brand-purple/20 px-3.5 py-1.5 rounded-full inline-block mb-4">
          Our Philosophy
        </span>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-brand-black tracking-tight leading-tight">
          Not just another fitness app. <br />
          <span className="text-brand-green">Calorie tracking, simplified.</span>
        </h1>
        <p className="text-gray-500 font-semibold text-base mt-4 leading-relaxed">
          We believe in direct, clutter-free nutrition tracking and highly personalized dietary targets without any hardcoded formulas.
        </p>
      </div>

      {/* Core Values / Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {/* Value 1 */}
        <div className="bg-brand-tint-green border border-brand-green/20 rounded-3xl p-8 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-white text-brand-green p-3 rounded-2xl w-fit shadow-sm">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-brand-black mb-2">Physiological Goals</h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              We compute your exact daily caloric targets using BMR models matching your weight, height, age, activity level, and gender.
            </p>
          </div>
        </div>

        {/* Value 2 */}
        <div className="bg-brand-tint-purple border border-brand-purple/20 rounded-3xl p-8 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-white text-brand-purple p-3 rounded-2xl w-fit shadow-sm">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-brand-black mb-2">Precision Counting</h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              Search a database of real foods connected directly to MongoDB, choose portion sizes, and calculate your exact meal calories instantly.
            </p>
          </div>
        </div>

        {/* Value 3 */}
        <div className="bg-brand-tint-neutral border border-gray-200/50 rounded-3xl p-8 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-white text-brand-black p-3 rounded-2xl w-fit shadow-sm">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-brand-black mb-2">AI Meal Planners</h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              Leverage advanced LLMs to build structured, multi-meal plans matching your specific macro distributions and fitness targets.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
