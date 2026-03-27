import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Clock } from 'lucide-react';
import Modal from '../ui/Modal';
import { electionService, facultyService } from '../../services';
import { ELECTION_TYPES, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

interface ElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  electionId?: string;
  onSuccess?: () => void;
}

interface Faculty {
  id: string;
  _id?: string;
  name: string;
  code?: string;
}

const ElectionModal: React.FC<ElectionModalProps> = ({
  isOpen,
  onClose,
  mode,
  electionId,
  onSuccess,
}) => {
  const { user } = useAuth();
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

  const prevIsOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setTitle('');
      setDescription('');
      setType('');
      setFacultyId('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setErrors({});
      setError(null);
      
      if (mode === 'edit' && electionId) {
        fetchElection();
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, mode, electionId]);

  useEffect(() => {
    if (isOpen) {
      fetchFaculties();
    }
  }, [isOpen]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties(response.data || []);
    } catch (error) {
    }
  };

  const fetchElection = async () => {
    if (!electionId) return;
    
    try {
      setLoading(true);
      setError(null);
      const election = await electionService.getElectionById(electionId);
      
      if (!election) {
        throw new Error('Election data is empty');
      }
      
      setTitle(election.title || '');
      setDescription(election.description || '');
      setType(election.type || '');
      
      const electionAny = election as any;
      const facultyIdValue = electionAny.facultyId || 
                            election.faculty?.id || 
                            electionAny.faculty?._id || 
                            electionAny.faculty_id?._id || 
                            electionAny.faculty_id?.id || 
                            (typeof electionAny.faculty_id === 'string' ? electionAny.faculty_id : '');
      setFacultyId(facultyIdValue);

      const startDateValue = election.startDate || electionAny.start_time;
      if (startDateValue) {
        let start: Date;
        
        if (typeof startDateValue === 'string') {
          if (startDateValue.includes('T') || startDateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            start = new Date(startDateValue);
          } else {
            const dateMatch = startDateValue.match(/(\d{2})-(\d{2})-(\d{4})/);
            const timeMatch = startDateValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            
            if (dateMatch && timeMatch) {
              const [, day, month, year] = dateMatch;
              let [, hour, minute, ampm] = timeMatch;
              let hour24 = parseInt(hour);
              
              if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
                hour24 += 12;
              } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
                hour24 = 0;
              }
              
              start = new Date(`${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:00`);
            } else {
              start = new Date(startDateValue);
            }
          }
        } else {
          start = new Date(startDateValue);
        }
        
        if (!isNaN(start.getTime())) {
          setStartDate(start.toISOString().split('T')[0]);
          setStartTime(start.toTimeString().slice(0, 5));
        }
      }
      
      const endDateValue = election.endDate || electionAny.end_time;
      if (endDateValue) {
        let end: Date;
        
        if (typeof endDateValue === 'string') {
          if (endDateValue.includes('T') || endDateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            end = new Date(endDateValue);
          } else {
            const dateMatch = endDateValue.match(/(\d{2})-(\d{2})-(\d{4})/);
            const timeMatch = endDateValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            
            if (dateMatch && timeMatch) {
              const [, day, month, year] = dateMatch;
              let [, hour, minute, ampm] = timeMatch;
              let hour24 = parseInt(hour);
              
              if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
                hour24 += 12;
              } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
                hour24 = 0;
              }
              
              end = new Date(`${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:00`);
            } else {
              end = new Date(endDateValue);
            }
          }
        } else {
          end = new Date(endDateValue);
        }
        
        if (!isNaN(end.getTime())) {
          setEndDate(end.toISOString().split('T')[0]);
          setEndTime(end.toTimeString().slice(0, 5));
        }
      }
    } catch (error: any) {
      console.error('Error fetching election:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to load election details';
      setError(errorMessage);
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

  useEffect(() => {
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        
        if (end <= start) {
          newErrors.endDate = 'End date and time must be after start date and time';
        } else if (prev.endDate === 'End date and time must be after start date and time') {
          delete newErrors.endDate;
        }
        
        return newErrors;
      });
    } else {
      setErrors(prev => {
        if (prev.endDate === 'End date and time must be after start date and time') {
          const newErrors = { ...prev };
          delete newErrors.endDate;
          return newErrors;
        }
        return prev;
      });
    }
  }, [startDate, endDate, startTime, endTime]);

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
        await electionService.updateElection(electionId!, electionData);
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to save election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Election' : 'Edit Election'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Election Title <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 pl-10 pr-4 ${
                errors.title 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
              } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
              placeholder="Enter election title"
              maxLength={200}
            />
          </div>
          {errors.title && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5">
              <span>⚠</span>
              {errors.title}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {title.length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
            placeholder="Enter election description (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Election Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value !== ELECTION_TYPES.FACULTY_LEADERSHIP) {
                    setFacultyId('');
                  }
                }}
                className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 px-4 pr-10 appearance-none cursor-pointer ${
                  errors.type 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
              >
                <option value="" disabled>Select Election Type</option>
                {Object.values(ELECTION_TYPES)
                  .filter((electionType) => {
                    if (user?.role === USER_ROLES.FACULTY_ADMIN) {
                      return electionType === ELECTION_TYPES.FACULTY_LEADERSHIP;
                    }
                    return true;
                  })
                  .map((electionType) => (
                    <option key={electionType} value={electionType}>
                      {electionType}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg
                  className="h-4 w-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {errors.type && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5">
                <span>⚠</span>
                {errors.type}
              </p>
            )}
          </div>

          {type === ELECTION_TYPES.FACULTY_LEADERSHIP && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Faculty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 px-4 pr-10 appearance-none cursor-pointer ${
                    errors.facultyId 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                  } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
                >
                  <option value="">Select a faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id || faculty._id} value={faculty.id || faculty._id}>
                      {faculty.name} {faculty.code && `(${faculty.code})`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg
                    className="h-4 w-4 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.facultyId && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5">
                  <span>⚠</span>
                  {errors.facultyId}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 pl-10 pr-4 ${
                    errors.startDate 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                  } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 pl-10 pr-4 ${
                    errors.startDate 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                  } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
                />
              </div>
            </div>
            {errors.startDate && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5">
                <span>⚠</span>
                {errors.startDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 pl-10 pr-4 ${
                    errors.endDate 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                  } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 pl-10 pr-4 ${
                    errors.endDate 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
                  } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100`}
                />
              </div>
            </div>
            {errors.endDate && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5">
                <span>⚠</span>
                {errors.endDate}
              </p>
            )}
          </div>
        </div>
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-gray-200/70 dark:border-slate-700/70 mt-4 sm:mt-6 bg-white/95 dark:bg-slate-800/95 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 dark:from-blue-600 dark:via-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:via-blue-700 dark:hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-blue-700 dark:border-blue-600 order-1 sm:order-2 min-w-[160px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                {mode === 'create' ? 'Create Election' : 'Update Election'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ElectionModal;