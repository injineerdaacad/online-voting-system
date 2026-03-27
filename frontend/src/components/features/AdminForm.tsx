import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService, facultyService } from '../../services';
import { USER_ROLES } from '../../utils/constants';
import { PasswordForm, ImageUpload } from '../forms';
import { useForm } from 'react-hook-form';
import Alert from '../common/Alert';

interface AdminFormProps {
  mode: 'create' | 'edit';
}

const AdminForm: React.FC<AdminFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  } | null>(null);

  const { control, watch, reset, handleSubmit: rhfHandleSubmit, formState: { errors } } = useForm({
    defaultValues: initialValues,
    mode: 'onChange'
  });

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await facultyService.getFaculties();
        setFaculties(response.data || []);
      } catch (error) {
      }
    };

    const fetchAdminData = async () => {
      if (mode === 'edit' && id) {
        try {
          setLoading(true);
          const adminData = await userService.getAdminById(id);
          setInitialValues(adminData);
          reset(adminData);
          if (adminData.photo_url) {
            setPhotoPreview(adminData.photo_url);
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFaculties();
    fetchAdminData();
  }, [mode, id]);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setLoading(true);
      setAlertMessage(null);
      
      if (!values.full_name?.trim()) {
        setAlertMessage({
          type: 'error',
          title: 'Validation Error',
          message: 'Full name is required. Please enter the admin\'s full name.'
        });
        setLoading(false);
        return;
      }
      
      if (!values.username?.trim()) {
        setAlertMessage({
          type: 'error',
          title: 'Validation Error',
          message: 'Username is required. Please enter a unique username.'
        });
        setLoading(false);
        return;
      }
      
      if (!values.email?.trim()) {
        setAlertMessage({
          type: 'error',
          title: 'Validation Error',
          message: 'Email is required. Please enter a valid email address.'
        });
        setLoading(false);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        setAlertMessage({
          type: 'error',
          title: 'Invalid Email Format',
          message: 'Please enter a valid email address (e.g., admin@example.com).'
        });
        setLoading(false);
        return;
      }
      
      if (!values.role) {
        setAlertMessage({
          type: 'error',
          title: 'Validation Error',
          message: 'Role is required. Please select a role for the admin.'
        });
        setLoading(false);
        return;
      }
      
      if (values.role === USER_ROLES.FACULTY_ADMIN && !values.faculty_id) {
        setAlertMessage({
          type: 'error',
          title: 'Faculty Required',
          message: 'Faculty Admin must have a faculty assigned. Please select a faculty.'
        });
        setLoading(false);
        return;
      }
      
      if (mode === 'create') {
        if (!values.password) {
          setAlertMessage({
            type: 'error',
            title: 'Password Required',
            message: 'Password is required. Please enter a password with at least 6 characters.'
          });
          setLoading(false);
          return;
        }
        
        if (values.password.length < 6) {
          setAlertMessage({
            type: 'error',
            title: 'Password Too Short',
            message: 'Password must be at least 6 characters long. Please enter a stronger password.'
          });
          setLoading(false);
          return;
        }
        
        if (values.password !== values.confirm_password) {
          setAlertMessage({
            type: 'error',
            title: 'Passwords Don\'t Match',
            message: 'Password and Confirm Password fields must match. Please check and try again.'
          });
          setLoading(false);
          return;
        }
        
        const formData = new FormData();
        
        formData.append('full_name', values.full_name.trim());
        formData.append('username', values.username.trim().toLowerCase());
        formData.append('email', values.email.trim().toLowerCase());
        formData.append('phone', values.phone?.trim() || '');
        formData.append('password', values.password);
        formData.append('role', values.role);
        
        if (values.faculty_id) {
          formData.append('faculty_id', values.faculty_id);
        }
        
        if (selectedPhoto) {
          formData.append('photo', selectedPhoto);
        }

        try {
          await userService.addAdmin(formData);
          
          setAlertMessage({
            type: 'success',
            title: 'Success!',
            message: 'Admin has been created successfully. Redirecting to admin list...'
          });

          setTimeout(() => {
            navigate('/admins');
          }, 2000);
        } catch (error: any) {
          throw error;
        }
        
      } else if (mode === 'edit' && id) {
        try {
          if (selectedPhoto) {
            const formData = new FormData();
            formData.append('full_name', values.full_name);
            formData.append('username', values.username);
            formData.append('email', values.email);
            formData.append('phone', values.phone || '');
            formData.append('role', values.role);
            formData.append('faculty_id', values.faculty_id || '');
            formData.append('status', values.status);
            formData.append('photo', selectedPhoto);
            
            await userService.updateAdmin(id, formData);
          } else {
            const updateData = {
              full_name: values.full_name,
              username: values.username,
              email: values.email,
              phone: values.phone,
              role: values.role,
              faculty_id: values.faculty_id,
              status: values.status
            };
            await userService.updateAdmin(id, updateData);
          }
                    
          setAlertMessage({
            type: 'success',
            title: 'Success!',
            message: 'Admin has been updated successfully. Redirecting to admin list...'
          });
                    
          setTimeout(() => {
            navigate('/admins');
          }, 2000);
        } catch (error: any) {
          throw error;
        }
      }
      
    } catch (error: any) {
      
      let errorMessage = 'An unexpected error occurred';
      let errorTitle = 'Error';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('already')) {
        errorTitle = 'Username Already Exists';
        errorMessage = 'This username is already taken. Please choose a different username for the admin.';
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        errorTitle = 'Email Already Exists';
        errorMessage = 'This email address is already in use. Please use a different email address.';
      } else if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
        errorTitle = 'Phone Number Already Exists';
        errorMessage = 'This phone number is already registered. Please use a different phone number.';
      } else if (errorMessage.toLowerCase().includes('password')) {
        errorTitle = 'Password Error';
      } else if (errorMessage.toLowerCase().includes('faculty')) {
        errorTitle = 'Faculty Error';
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      
      setAlertMessage({
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (passwordData: { password: string; confirmPassword: string }) => {
    if (!id) return;
    
    try {
      setLoading(true);
        
      await userService.changePasswordWithData(id, {
        password: passwordData.password,
        confirm_password: passwordData.confirmPassword
      });
      toast.success('✅ Password changed successfully!');
      setShowPasswordForm(false);
      
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (file: File | null) => {
    setSelectedPhoto(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      if (mode === 'edit' && initialValues.photo_url) {
        setPhotoPreview(initialValues.photo_url);
      } else {
        setPhotoPreview(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a017' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/admins')}
              className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-amber-600 dark:from-white dark:via-blue-100 dark:to-amber-400 bg-clip-text text-transparent">
                {mode === 'create' ? 'Add New Admin' : 'Edit Admin'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                {mode === 'create' ? 'Create a new system administrator' : 'Update admin information'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6 relative">
          
          {loading && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-university-gold-200 border-t-university-gold-600"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {mode === 'create' ? 'Creating admin...' : 'Updating admin...'}
                </p>
              </div>
            </div>
          )}

          {alertMessage && (
            <Alert
              type={alertMessage.type}
              title={alertMessage.title}
              message={alertMessage.message}
              onClose={() => setAlertMessage(null)}
            />
          )}

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="h-5 w-5 text-university-gold-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Profile Photo
              </h3>
            </div>

            <div className="space-y-6">
              
              {mode === 'edit' && photoPreview && !selectedPhoto && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Profile Photo
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove Photo
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <img
                      src={photoPreview}
                      alt="Current profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium">Current profile photo</p>
                      <p className="text-xs">Upload a new photo below to replace this one</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {mode === 'edit' ? 'Upload New Photo' : 'Profile Photo'}
                    {mode === 'edit' && <span className="text-xs text-gray-500 ml-1">(Optional)</span>}
                  </h4>
                  
                  <ImageUpload
                    label=""
                    value={selectedPhoto}
                    onChange={handlePhotoChange}
                    maxSize={5}
                    aspectRatio={1}
                    cropShape="round"
                    helpText="PNG, JPG, GIF up to 5MB. Click to crop your image."
                  />
                </div>
              </div>

              {selectedPhoto && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      New Photo Selected
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={URL.createObjectURL(selectedPhoto)}
                      alt="New profile preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 dark:border-blue-600"
                    />
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      <p className="font-medium">{selectedPhoto.name}</p>
                      <p className="text-xs">This will replace the current photo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={rhfHandleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...control.register('full_name', { required: 'Full name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.full_name.message || 'This field is required')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  {...control.register('username', { required: 'Username is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.username.message || 'This field is required')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...control.register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email format'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.email.message || 'This field is required')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  {...control.register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>

              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    {...control.register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter password (min 6 characters)"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{String(errors.password.message || 'This field is required')}</p>
                  )}
                </div>
              )}

              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    {...control.register('confirm_password', {
                      required: 'Please confirm your password',
                      validate: (value: string) => {
                        const currentPassword = watch('password');
                        if (value !== currentPassword) {
                          return 'Passwords do not match';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm password"
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{String(errors.confirm_password.message || 'This field is required')}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  {...control.register('role', { required: 'Role is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select role</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Faculty Admin">Faculty Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.role.message || 'This field is required')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Faculty
                </label>
                <select
                  {...control.register('faculty_id')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {mode === 'create' ? 'Create Admin' : 'Update Admin'}
              </button>
            </div>
          </form>
        </div>

        {mode === 'edit' && (
          <div className="mt-8">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-university-gold-600" />
                    Change Password
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Update the admin's password
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 bg-university-gold-500 hover:bg-university-gold-600 text-white rounded-lg transition-colors duration-200"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordForm && (
                <PasswordForm
                  onSubmit={handlePasswordChange}
                  loading={loading}
                  title="Update Password"
                  description="Enter new password for this admin"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminForm;