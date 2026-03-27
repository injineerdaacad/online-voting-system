import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Hash, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import { facultyService } from '../../services';
import type { Faculty, CreateFacultyData, UpdateFacultyData } from '../../services/facultyService';

interface FacultyFormProps {
  mode: 'create' | 'edit';
}

const FacultyForm: React.FC<FacultyFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setFaculty] = useState<Faculty | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchFaculty();
    }
  }, [mode, id]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const facultyData = await facultyService.getFacultyById(id!);
      setFaculty(facultyData);
      setFormData({
        name: facultyData.name || '',
        code: facultyData.code || '',
      });
    } catch (error) {
      navigate('/faculties');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Faculty name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Faculty name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Faculty name must not exceed 100 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Faculty code is required';
    } else if (formData.code.trim().length < 2) {
      newErrors.code = 'Faculty code must be at least 2 characters';
    } else if (formData.code.trim().length > 10) {
      newErrors.code = 'Faculty code must not exceed 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const facultyData: CreateFacultyData | UpdateFacultyData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
      };

      if (mode === 'create') {
        await facultyService.createFaculty(facultyData as CreateFacultyData);
      } else {
        await facultyService.updateFaculty(id!, facultyData as UpdateFacultyData);
      }

      navigate('/faculties');
    } catch (error: any) {
      
      if (error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path === 'name') {
            backendErrors.name = err.message;
          } else if (err.path === 'code') {
            backendErrors.code = err.message;
          }
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: 'Failed to save faculty. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-university-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/faculties')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Faculty' : 'Edit Faculty'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'create' ? 'Add a new faculty to the system' : 'Update faculty information'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-university-blue-600 dark:text-university-blue-400" />
              Faculty Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Faculty Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`form-input pl-10 w-full rounded-lg border ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-university-blue-500 focus:ring-university-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter faculty name"
                    maxLength={100}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.name.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Faculty Code *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`form-input pl-10 w-full rounded-lg border ${
                      errors.code 
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-university-blue-500 focus:ring-university-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter faculty code (e.g., SCI, ENG)"
                    maxLength={10}
                  />
                </div>
                {errors.code && (
                  <p className="text-red-500 text-sm">{errors.code}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.code.length}/10 characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/faculties')}
              leftIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Faculty' : 'Update Faculty'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyForm;