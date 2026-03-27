import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, BookOpen } from 'lucide-react';

const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-university-gold-500/20 to-university-blue-500/20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-university-blue-500/20 to-university-gold-500/20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 bg-gradient-to-br from-university-gold-500 to-university-blue-600 rounded-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <img 
                  src="/images/brand/Logo.png" 
                  alt="SNU Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 object-contain"
                />
              </div>
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-university-gold-400 to-university-blue-400 bg-clip-text text-transparent">
                  SNU
                </h3>
                <p className="text-xs text-slate-400">
                  Somalia National University
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Empowering democracy through secure and transparent online voting systems for the Somalia National University community.
            </p>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-university-gold-400" />
              <span>Secure & Transparent</span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-university-gold-400">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              <li>
                <Link 
                  to="/dashboard" 
                  className="text-xs sm:text-sm text-slate-300 hover:text-university-gold-400 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/elections" 
                  className="text-xs sm:text-sm text-slate-300 hover:text-university-gold-400 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>Elections</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/results" 
                  className="text-xs sm:text-sm text-slate-300 hover:text-university-gold-400 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>Results</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="text-xs sm:text-sm text-slate-300 hover:text-university-gold-400 transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>Profile</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-university-blue-400">System Features</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              <li className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-university-gold-400 flex-shrink-0" />
                <span>User Management</span>
              </li>
              <li className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-university-gold-400 flex-shrink-0" />
                <span>Faculty Management</span>
              </li>
              <li className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-university-gold-400 flex-shrink-0" />
                <span>Secure Voting</span>
              </li>
              <li className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-university-gold-400 flex-shrink-0" />
                <span>Real-time Results</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-university-red-400">Contact</h4>
            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-slate-300">
              <p>Somalia National University</p>
              <p>Mogadishu, Somalia</p>
              <p className="text-slate-400">info@snu.edu.so</p>
              <p className="text-slate-400">+252 615 600 765</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-slate-400">
              <span>© {currentYear} Somalia National University</span>
              <span className="hidden sm:inline">•</span>
              <span>All rights reserved</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-400">
              <span>Made with</span>
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-university-red-400 animate-pulse" />
              <span>for SNU Community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;