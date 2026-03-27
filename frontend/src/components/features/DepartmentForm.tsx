import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Hash } from 'lucide-react';
import Button from '../ui/Button';
import { departmentService, facultyService } from '../../services';

interface DepartmentFormProps {
  mode: 'create' | 'edit';
}

interface Faculty {
  id: string;
  _id?: string;
  name: string;
  code?: string;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    facultyId?: string;
  }>({});

  useEffect(() => {
    fetchFaculties();
    if (mode === 'edit' && id) {
      fetchDepartment();
    }
  }, [mode, id]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties(response.data || []);
    } catch (error) {
    }
  };

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const department = await departmentService.getDepartmentById(id!);
      setName(department.name || '');
      setCode((department as any).code || '');
      const facultyIdValue = typeof department.faculty_id === 'string' 
        ? department.faculty_id 
        : (department.faculty_id?._id || (department.faculty_id as any)?.id || '');
      setFacultyId(facultyIdValue);
      setDescription(department.description || '');
    } catch (error) {
      setError('Failed to load department details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Department name must be at least 3 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Department name must be less than 100 characters';
    }

    if (!code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (code.trim().length < 2) {
      newErrors.code = 'Department code must be at least 2 characters';
    } else if (code.trim().length > 10) {
      newErrors.code = 'Department code must be less than 10 characters';
    }

    if (!facultyId) {
      newErrors.facultyId = 'Faculty is required';
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
      setLoading(true);
      setError(null);

      const departmentData = {
        name: name.trim(),
        code: code.trim(),
        facultyId,
        description: description.trim() || undefined,
      };

      if (mode === 'create') {
        await departmentService.createDepartment(departmentData);
      } else {
        await departmentService.updateDepartment(id!, departmentData);
      }

      navigate('/departments');
    } catch (error) {
      setError('Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'edit') {
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
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Department' : 'Edit Department'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'create' 
                ? 'Add a new department to the university' 
                : 'Update department information'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input pl-10 w-full rounded-lg border ${
                    errors.name 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Enter department name"
                  maxLength={100}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {name.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department Code *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={`form-input pl-10 w-full rounded-lg border ${
                    errors.code 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Enter department code"
                  maxLength={10}
                />
              </div>
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.code}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {code.length}/10 characters
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Faculty *
            </label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className={`form-select w-full rounded-lg border ${
                errors.facultyId 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">Select a faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id || faculty._id} value={faculty.id || faculty._id}>
                  {faculty.name} {faculty.code && `(${faculty.code})`}
                </option>
              ))}
            </select>
            {errors.facultyId && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.facultyId}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="form-textarea w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter department description (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-university-gold-600 hover:bg-university-gold-700 text-white"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Department' : 'Update Department'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;