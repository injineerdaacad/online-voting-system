import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Calendar, FileText, Users, Hash, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import { departmentService } from '../../services';

interface Department {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  faculty_id?: {
    _id: string;
    name: string;
    code?: string;
  };
  created_by?: {
    _id: string;
    name: string;
    username?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DepartmentDetailProps {}

const DepartmentDetail: React.FC<DepartmentDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDepartmentDetails();
    }
  }, [id]);

  const fetchDepartmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const departmentData = await departmentService.getDepartmentById(id!);
      setDepartment(departmentData);
    } catch (err) {
      setError('Failed to load department details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-university-gold-500"></div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Department not found'}
          </h2>
          <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Go Back
          </Button>
        </div>
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
              Department Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View department information and details
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start space-x-6">
          
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-university-blue-100 dark:bg-university-blue-900/30 flex items-center justify-center">
              <Building className="h-12 w-12 text-university-blue-600 dark:text-university-blue-400" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {department.name || 'Unknown Department'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Code: {department.code || 'N/A'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Department
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Department Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Department Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {department.name || 'Not provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Department Code</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {department.code || 'Not provided'}
                </p>
              </div>
            </div>

            {department.faculty_id && (
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Faculty</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {department.faculty_id.name || 'Unknown Faculty'}
                  </p>
                  {department.faculty_id.code && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Code: {department.faculty_id.code}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {department.createdAt ? new Date(department.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {department.updatedAt ? new Date(department.updatedAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {department.created_by && (
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {typeof department.created_by === 'object' 
                      ? department.created_by.name || department.created_by.username || 'Unknown User'
                      : 'User ID: ' + department.created_by
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Department ID</p>
                <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                  {department.id || department._id || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;