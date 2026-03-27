import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { electionService, facultyService } from '../../services';
import { ELECTION_TYPES } from '../../utils/constants';

interface ElectionFormProps {
  mode: 'create' | 'edit';
}

interface Faculty {
  id: string;
  _id?: string;
  name: string;
  code?: string;
}

const ElectionForm: React.FC<ElectionFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [errors, setErrors] = useState<{
    title?: string;
    type?: string;
    facultyId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    fetchFaculties();
    if (mode === 'edit' && id) {
      fetchElection();
    }
  }, [mode, id]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties(response.data || []);
    } catch (error) {
    }
  };

  const fetchElection = async () => {
    try {
      setLoading(true);
      const election = await electionService.getElectionById(id!);
      setTitle(election.title || '');
      setDescription(election.description || '');
      setType(election.type || '');
      
      const facultyIdValue = typeof election.faculty_id === 'string' 
        ? election.faculty_id 
        : (election.faculty_id?._id || (election.faculty_id as any)?.id || election.faculty?.id || election.faculty?._id || '');
      setFacultyId(facultyIdValue);

      if (election.startDate) {
        const start = new Date(election.startDate);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      if (election.endDate) {
        const end = new Date(election.endDate);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }
    } catch (error) {
      setError('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Election title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Election title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Election title must be less than 200 characters';
    }

    if (!type) {
      newErrors.type = 'Election type is required';
    }

    if (type === ELECTION_TYPES.FACULTY_LEADERSHIP && !facultyId) {
      newErrors.facultyId = 'Faculty is required for Faculty Leadership Election';
    }

    if (!startDate || !startTime) {
      newErrors.startDate = 'Start date and time are required';
    }

    if (!endDate || !endTime) {
      newErrors.endDate = 'End date and time are required';
    }

    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      if (end <= start) {
        newErrors.endDate = 'End date and time must be after start date and time';
      }
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

      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const electionData = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startDate: startDateTime,
        endDate: endDateTime,
        facultyId: type === ELECTION_TYPES.FACULTY_LEADERSHIP ? facultyId : undefined,
      };

      if (mode === 'create') {
        await electionService.createElection(electionData);
      } else {
        await electionService.updateElection(id!, electionData);
      }

      navigate('/elections');
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to save election');
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'edit') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-university-gradient">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-university-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-university-gradient">
      <div className="relative z-10 p-2 sm:p-3 lg:p-4">
        
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="glass rounded-2xl bg-gradient-to-br from-white/90 via-white/95 to-university-gold-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 border border-university-gold-200/20 dark:border-university-gold-800/20 shadow-theme-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                    {mode === 'create' ? 'Create Election' : 'Edit Election'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                    {mode === 'create' 
                      ? 'Create a new voting election' 
                      : 'Update election information'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Election Title *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`form-input pl-10 w-full rounded-lg border ${
                    errors.title 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Enter election title"
                  maxLength={200}
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {title.length}/200 characters
              </p>
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
                placeholder="Enter election description (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Election Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value !== ELECTION_TYPES.FACULTY_LEADERSHIP) {
                      setFacultyId('');
                    }
                  }}
                  className={`form-select w-full rounded-lg border ${
                    errors.type 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                >
                  <option value="" disabled>Select election type</option>
                  {Object.values(ELECTION_TYPES).map((electionType) => (
                    <option key={electionType} value={electionType}>
                      {electionType}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.type}</p>
                )}
              </div>

              {type === ELECTION_TYPES.FACULTY_LEADERSHIP && (
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
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date & Time *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`form-input pl-10 w-full rounded-lg border ${
                        errors.startDate 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`form-input pl-10 w-full rounded-lg border ${
                        errors.startDate 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                  </div>
                </div>
                {errors.startDate && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date & Time *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`form-input pl-10 w-full rounded-lg border ${
                        errors.endDate 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`form-input pl-10 w-full rounded-lg border ${
                        errors.endDate 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                  </div>
                </div>
                {errors.endDate && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
                )}
              </div>
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
                {loading ? 'Saving...' : mode === 'create' ? 'Create Election' : 'Update Election'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ElectionForm;