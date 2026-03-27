import React, { useState, useEffect } from 'react';
import { User, Mail, User as UserIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import InputField from '../forms/InputField';
import PhoneInput from '../forms/PhoneInput';
import userService, { User as UserType } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onSuccess?: (updatedUser: UserType) => void;
}

interface FormData {
  full_name: string;
  username: string;
  email: string;
  phone: string;
}

interface FormErrors {
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  photo?: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    username: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user?.id && !user?._id) {
      return;
    }

    setLoading(true);
    try {
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const updateData = {
        name: formData.full_name,
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
      };

      const updatedUser = await userService.updateCurrentUserProfile(updateData, selectedPhoto || undefined);

      updateUser(updatedUser as any);
      
      onSuccess?.(updatedUser);
      
      onClose();
      
    } catch (error: any) {
      
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('email')) {
          setErrors({ email: 'This email is already in use' });
        } else if (errorMessage.includes('username')) {
          setErrors({ username: 'This username is already taken' });
        } else {
          setErrors({ email: errorMessage });
        }
      } else {
        setErrors({ email: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onClose();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ photo: 'Please select a valid image file' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ photo: 'Image size must be less than 5MB' });
        return;
      }
      
      setSelectedPhoto(file);
      setErrors({ photo: undefined });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      size="lg"
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-university-gold-100 dark:bg-university-gold-900/30 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="h-full w-full object-cover rounded-full"
              />
            ) : (user as any)?.photo_url ? (
              <img
                src={(user as any).photo_url}
                alt={`${user?.full_name || user?.name || 'User'} profile`}
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg class="h-8 w-8 text-university-gold-700 dark:text-university-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                  }
                }}
              />
            ) : (
              <UserIcon className="h-8 w-8 text-university-gold-700 dark:text-university-gold-300" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Profile Picture
            </h3>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                {selectedPhoto ? 'Change Photo' : 'Upload Photo'}
              </label>
              {selectedPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="ml-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
            {errors.photo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.photo}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG, GIF up to 5MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            error={errors.full_name}
            leftIcon={<User className="h-4 w-4 text-gray-400" />}
            placeholder="Enter your full name"
            required
            disabled={loading}
          />

          <InputField
            label="Username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            error={errors.username}
            leftIcon={<User className="h-4 w-4 text-gray-400" />}
            placeholder="Enter your username"
            required
            disabled={loading}
          />

          <InputField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
            placeholder="Enter your email"
            required
            disabled={loading}
          />

          <PhoneInput
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="Enter your phone number"
            disabled={loading}
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Account Information (Read-only)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Role:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{user?.role || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{user?.status || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Faculty:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {user?.faculty_id?.name || user?.faculty?.name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Department:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {user?.department?.name || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-university-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white 
            bg-blue-600 border border-transparent rounded-lg 
            hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;