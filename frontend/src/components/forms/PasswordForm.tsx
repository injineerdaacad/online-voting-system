import React from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

interface PasswordFormProps {
  onSubmit: (data: PasswordFormData) => void;
  loading?: boolean;
  initialValues?: Partial<PasswordFormData>;
  title?: string;
  description?: string;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  onSubmit,
  loading = false,
  initialValues,
  title = "Change Password",
  description = "Enter your new password below"
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset: _reset
  } = useForm<PasswordFormData>({
    mode: 'onChange',
    defaultValues: initialValues
  });

  const password = watch('password');

  const handleFormSubmit = (data: PasswordFormData) => {
    onSubmit(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
      
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-university-gold-500 to-university-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                }
              })}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-university-gold-500 focus:border-university-gold-500 transition-all duration-200 ${
                errors.password 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="Enter your new password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-university-gold-500 focus:border-university-gold-500 transition-all duration-200 ${
                errors.confirmPassword 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="Confirm your new password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {password && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password Strength:
            </p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((level) => {
                const strength = password.length >= 6 ? 
                  (password.match(/[a-z]/) ? 1 : 0) + 
                  (password.match(/[A-Z]/) ? 1 : 0) + 
                  (password.match(/\d/) ? 1 : 0) + 
                  (password.match(/[^a-zA-Z\d]/) ? 1 : 0) : 0;
                
                return (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                      level <= strength
                        ? strength <= 1
                          ? 'bg-red-500'
                          : strength <= 2
                          ? 'bg-yellow-500'
                          : strength <= 3
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                        : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-gradient-to-r from-university-gold-500 to-university-blue-600 hover:from-university-gold-600 hover:to-university-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating Password...</span>
              </div>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;