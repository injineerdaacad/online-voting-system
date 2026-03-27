import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Button from '../ui/Button';
import InputField from '../forms/InputField';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const SignInForm: React.FC = () => {
  const [loginKey, setLoginKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputField
        label="Email or Username"
        type="text"
        value={loginKey}
        onChange={(e) => setLoginKey(e.target.value)}
        leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
        placeholder="Enter your email or username"
        required
      />
      
      <InputField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="h-4 w-4 text-gray-400" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        placeholder="Enter your password"
        required
      />

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        fullWidth
        className="w-full"
      >
        Sign In
      </Button>
    </form>
  );
};

export default SignInForm;