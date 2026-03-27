import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../components';
import { ROUTES } from '../../utils/constants';

const ServerError: React.FC = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-university-red-50/20 to-university-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertTriangle className="h-32 w-32 text-university-red-500 dark:text-university-red-400 opacity-20" />
              <h1 className="absolute inset-0 flex items-center justify-center text-9xl font-bold text-university-red-500 dark:text-university-red-400">
                500
              </h1>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Internal Server Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Something went wrong on our end. We're working to fix the issue.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            fullWidth
            className="bg-gradient-to-r from-university-blue-500 to-university-blue-600 hover:from-university-blue-600 hover:to-university-blue-700"
          >
            Refresh Page
          </Button>
          <Button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            leftIcon={<Home className="h-4 w-4" />}
            variant="outline"
            fullWidth
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            variant="outline"
            fullWidth
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;