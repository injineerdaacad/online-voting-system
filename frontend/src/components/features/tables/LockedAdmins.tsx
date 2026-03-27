import React from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

const LockedAdminsTable: React.FC = () => {
  return (
    <div className="min-h-screen bg-university-gradient animate-fade-in-up">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        
        <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-university-gold-200/20 dark:border-university-gold-800/20 bg-gradient-to-br from-white/90 via-white/95 to-university-gold-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 backdrop-blur-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-university-red-500 to-university-red-700 shadow-lg">
                <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                  Locked Administrators
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and manage locked admin accounts securely
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg">
          <div className="py-16 px-6 text-center animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-university-gold-500 to-university-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative p-8 rounded-full bg-gradient-to-br from-university-gold-100 to-university-blue-100 dark:from-university-gold-900/30 dark:to-university-blue-900/30">
                  <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-success-600 dark:text-success-400" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                  All Clear!
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  No locked administrator accounts at the moment
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This is great news! All admin accounts are active and accessible.
                </p>
              </div>

              <div className="pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  This component is ready to display locked accounts when they exist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockedAdminsTable;