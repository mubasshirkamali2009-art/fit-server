import React from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-brand-green p-1.5 rounded-lg text-white">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="font-display font-black text-lg tracking-tight text-brand-black">
              FitTrack <span className="text-brand-green">AI</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold text-gray-500">
            <Link href="/" className="hover:text-brand-green transition-colors">
              Explore Exercises
            </Link>
            <Link href="/about" className="hover:text-brand-green transition-colors">
              Our Mission
            </Link>
            <Link href="/contact" className="hover:text-brand-green transition-colors">
              Support & FAQ
            </Link>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} FitTrack AI. All rights reserved. Premium Fitness Companion.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
