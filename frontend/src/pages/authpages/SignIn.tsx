import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const SignIn: React.FC = () => {
  const [loginKey, setLoginKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentYear = new Date().getFullYear();

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginKey, password);
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,160,23,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.03),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          <div className="hidden lg:block space-y-8">
            <div className="text-center">
              
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 university-logo-container">
                  <img
                    src="/images/brand/Logo.png"
                    alt="Somalia National University"
                    className="university-logo"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-amber-600 via-blue-600 to-red-600 bg-clip-text text-transparent mb-2 leading-tight">
                  Somalia National University
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-blue-500 mx-auto rounded-full"></div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Online Voting System
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-amber-500 mx-auto rounded-full"></div>
              </div>

              <div className="flex justify-center space-x-4 mt-12">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 p-8">
              
              <div className="lg:hidden text-center mb-8">
                
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 university-logo-container-mobile">
                    <img
                      src="/images/brand/Logo.png"
                      alt="Somalia National University"
                      className="university-logo"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    Somalia National University
                  </h1>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Online Voting System
                  </h2>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome Back
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in to your account
                </p>
              </div>

              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sign in to your account
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="loginKey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input
                        id="loginKey"
                        name="loginKey"
                        type="text"
                        autoComplete="username"
                        required
                        value={loginKey}
                        onChange={(e) => setLoginKey(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                        placeholder="Enter your email or username"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-amber-500 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  © {currentYear} Somalia National University. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
