import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Check, X, Users, TrendingUp, Filter, Search, GraduationCap, BarChart3, Mail, Phone, ChevronLeft, ChevronRight, Loader2, AlertCircle, UserPlus, Calendar, User } from 'lucide-react';
import { Table, Badge, Modal, AddEditForm, FilterForm } from '../../components';
import { userService, facultyService, departmentService } from '../../services';
import { USER_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

interface Student {
  id?: string;
  _id?: string;
  full_name?: string;
  student_id?: string;
  email: string;
  phone?: string;
  status: string;
  batch?: string;
  graduation_year?: number;
  faculty_id?: {
    _id?: string;
    id?: string;
    name: string;
    code?: string;
  };
  department?: {
    _id?: string;
    id?: string;
    name: string;
  };
  has_voted?: any[];
  createdAt?: string;
}

const StudentsTable: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [faculties, setFaculties] = useState<Array<{ _id?: string; id?: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ _id?: string; id?: string; name: string; faculty_id?: string }>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    facultyId: ''
  });
  
  const [searchStudentId, setSearchStudentId] = useState('');
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentFromAPI, setStudentFromAPI] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchedIdRef = useRef<string>('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ student_id: string; full_name?: string }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const autocompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  const columns = useMemo(() => [
    {
      key: 'no',
      title: '#',
      render: (_value: unknown, _record: Student, index: number) => {
        const rowNumber = ((pagination.page - 1) * pagination.limit) + index + 1;
        return (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {rowNumber}
          </span>
        );
      },
    },
    {
      key: 'name',
      title: 'Student',
      render: (_value: any, record: Student) => {
        const displayName = record.full_name || record.student_id || 'Unknown';
        const photoUrl = (record as any).photo_url;
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${displayName} profile`}
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('svg')) {
                      const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      userIcon.setAttribute('class', 'h-5 w-5 text-university-blue-700');
                      userIcon.setAttribute('fill', 'none');
                      userIcon.setAttribute('stroke', 'currentColor');
                      userIcon.setAttribute('viewBox', '0 0 24 24');
                      userIcon.setAttribute('stroke-width', '2');
                      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                      path.setAttribute('stroke-linecap', 'round');
                      path.setAttribute('stroke-linejoin', 'round');
                      path.setAttribute('d', 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z');
                      userIcon.appendChild(path);
                      parent.appendChild(userIcon);
                    }
                  }}
                />
              ) : (
                <User className="h-5 w-5 text-university-blue-700" />
              )}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {record.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'student_id',
      title: 'Student ID',
      render: (_value: unknown, record: Student) => record.student_id || 'N/A',
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (_value: any, record: Student) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {record.phone || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'batch',
      title: 'Batch',
      render: (_value: unknown, record: Student) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {record.batch || 'N/A'}
        </span>
      ),
    },
    {
      key: 'graduation_year',
      title: 'Graduation Year',
      render: (_value: unknown, record: Student) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {record.graduation_year || 'N/A'}
        </span>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (_value: unknown, record: Student) => record.faculty_id?.name || 'N/A',
    },
    {
      key: 'department',
      title: 'Department',
      render: (_value: any, record: Student) => record.department?.name || 'N/A',
    },
    {
      key: 'status',
      title: 'Status',
      render: (_value: unknown, record: Student) => (
        <Badge variant={record.status === USER_STATUS.ACTIVE ? 'success' : 'error'}>
          {record.status}
        </Badge>
      ),
    },
    {
      key: 'voted',
      title: 'Voted',
      render: (_value: any, record: Student) => {
        const hasVoted = record.has_voted && record.has_voted.length > 0;
        return hasVoted ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-gray-400" />
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value: any, record: Student) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(record);
              setShowViewModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(record);
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="Edit Student"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Student"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [pagination, setSelectedStudent, setShowViewModal, setShowEditModal, setShowDeleteModal]);

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties((response.data || []) as Array<{ _id?: string; id?: string; name: string }>);
    } catch (error: unknown) {
      setFaculties([]);
    }
  };

  const fetchDepartments = async (facultyId?: string) => {
    try {
      const response = await departmentService.getDepartments(facultyId ? { facultyId } : {});
      setDepartments((response.data || []) as Array<{ _id?: string; id?: string; name: string; faculty_id?: string }>);
    } catch (error: unknown) {
      setDepartments([]);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await userService.getStudents();
      
      let filteredData: Student[] = (response.data || []).map((user: any) => ({
        ...user,
        id: user.id || user._id,
        _id: user._id || user.id,
        department: user.department ? {
          _id: user.department._id || user.department.id,
          id: user.department.id || user.department._id,
          name: user.department.name
        } : undefined
      }));
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((student) => 
          (student.full_name?.toLowerCase().includes(searchLower)) ||
          (student.student_id?.toLowerCase().includes(searchLower)) ||
          (student.email?.toLowerCase().includes(searchLower)) ||
          (student.phone?.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.status) {
        filteredData = filteredData.filter((student) => student.status === filters.status);
      }
      
      if (filters.facultyId) {
        filteredData = filteredData.filter((student) => {
          const facultyId = student.faculty_id?._id || student.faculty_id?.id;
          return facultyId === filters.facultyId;
        });
      }
      
      const total = filteredData.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setStudents(paginatedData);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (error) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchFaculties();
    fetchDepartments();
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    if (!showAddModal) {
      setSearchStudentId('');
      setStudentFromAPI(null);
      setSearchError(null);
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      setShowManualForm(false);
      return;
    }

    if (studentFromAPI?.student_data) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    if (searchStudentId.trim().length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    autocompleteTimeoutRef.current = setTimeout(async () => {
      if (studentFromAPI?.student_data) {
        return;
      }
      
      try {
        const response = await userService.searchStudentIds(searchStudentId.trim());
        setAutocompleteSuggestions(response.student_ids || []);
        setShowAutocomplete(response.student_ids && response.student_ids.length > 0);
        setSelectedSuggestionIndex(-1);
      } catch (error: any) {
        console.error('Error fetching autocomplete suggestions:', error);
        setAutocompleteSuggestions([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, [searchStudentId, showAddModal, studentFromAPI]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!showAddModal) {
      lastSearchedIdRef.current = '';
      return;
    }

    if (studentFromAPI?.student_data) {
      return;
    }

    const trimmedId = searchStudentId.trim().toUpperCase();
    
    if (trimmedId.length < 3) {
      if (trimmedId.length === 0) {
        setStudentFromAPI(null);
        setSearchError(null);
        lastSearchedIdRef.current = '';
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (lastSearchedIdRef.current === trimmedId) {
        return;
      }
      
      if (studentFromAPI?.student_data) {
        return;
      }
      
      lastSearchedIdRef.current = trimmedId;
      
      await searchStudentDetails(trimmedId);
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchStudentId, showAddModal, studentFromAPI]);

  const searchStudentDetails = async (studentId: string) => {
    const trimmedId = studentId?.trim() || '';
    
    if (!trimmedId) {
      setStudentFromAPI(null);
      setSearchError(null);
      lastSearchedIdRef.current = '';
      return;
    }

    try {
      setSearchingStudent(true);
      setSearchError(null);
      setShowAutocomplete(false);
      
      const response = await userService.checkStudentInUniversityAPI(trimmedId);
      
      if (response.exists_in_api && response.student_data) {
        setStudentFromAPI(response);
        setSearchError(null);
        setShowManualForm(false);
        
        if (response.student_data.faculty.faculty_id) {
          const facultyIdStr = String(response.student_data.faculty.faculty_id);
          setSelectedFacultyId(facultyIdStr);
          await fetchDepartments(facultyIdStr);
          
          if (response.student_data.department.department_id) {
            const deptIdStr = String(response.student_data.department.department_id);
            setSelectedDepartmentId(deptIdStr);
          } else {
            setSelectedDepartmentId('');
          }
        } else {
          const apiFacultyName = response.student_data.faculty.name?.toLowerCase().trim() || '';
          let matchedFacultyId = '';
          
          if (apiFacultyName && faculties.length > 0) {
            const normalizeForMatch = (name: string) => {
              return name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/\bof\b/g, 'of')
                .replace(/[^\w\s]/g, '');
            };
            
            const normalizedApiName = normalizeForMatch(apiFacultyName);
            
            const matchedFaculty = faculties.find(faculty => {
              const facultyName = normalizeForMatch(faculty.name || '');
              return facultyName === normalizedApiName || 
                     facultyName.includes(normalizedApiName) || 
                     normalizedApiName.includes(facultyName) ||
                     (facultyName.replace(/^faculty\s+/, '') === normalizedApiName.replace(/^faculty\s+/, ''));
            });
            
            if (matchedFaculty) {
              matchedFacultyId = String(matchedFaculty._id || matchedFaculty.id || '');
              setSelectedFacultyId(matchedFacultyId);
              await fetchDepartments(matchedFacultyId);
            } else {
              setSelectedFacultyId('');
            }
          } else {
            setSelectedFacultyId('');
          }
          
          if (response.student_data.department.department_id) {
            const deptIdStr = String(response.student_data.department.department_id);
            setSelectedDepartmentId(deptIdStr);
            
            if (!matchedFacultyId) {
              try {
                const dept = await departmentService.getDepartmentById(deptIdStr);
                const deptFacultyId = (dept as any).faculty?._id || (dept as any).faculty?.id || (dept as any).faculty_id?._id || (dept as any).faculty_id?.id;
                if (deptFacultyId) {
                  const deptFacultyIdStr = String(deptFacultyId);
                  setSelectedFacultyId(deptFacultyIdStr);
                  await fetchDepartments(deptFacultyIdStr);
                }
              } catch (deptError) {
                console.error('Error fetching department to get faculty:', deptError);
              }
            }
          } else {
            setSelectedDepartmentId('');
          }
        }
        
      } else {
        setStudentFromAPI(null);
        const errorMsg = response.message || response.api_unavailable 
          ? 'University API is currently unavailable. Please use manual entry.'
          : 'Student not found in University API. You can add manually.';
        setSearchError(errorMsg);
      }
    } catch (error: any) {
      console.error('Error searching student:', error);
      setStudentFromAPI(null);
      lastSearchedIdRef.current = '';
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        if (status === 404) {
          setSearchError('Student not found in University API. You can add manually.');
        } else if (status === 503 || status === 500) {
          setSearchError('University API is currently unavailable. Please use manual entry.');
        } else {
          setSearchError(message || 'Error searching student. Please try again.');
        }
      } else if (error.request) {
        setSearchError('Unable to connect to University API. Please check your connection and try again.');
      } else {
        setSearchError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSearchingStudent(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    
    try {
      setActionLoading(true);
      await userService.deleteUser(selectedStudent.id || selectedStudent._id || '');
      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-university-gradient">
      <div className="relative z-10 p-2 sm:p-3 lg:p-4 pb-0 mb-0">
        
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="glass rounded-2xl bg-gradient-to-br from-white/90 via-white/95 to-university-gold-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 border border-university-gold-200/20 dark:border-university-gold-800/20 shadow-theme-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                  Student Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage university students and their accounts
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover-lift"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters && <X className="h-3 w-3" />}
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Student</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-200/30 dark:bg-gradient-to-br dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-700/10 border-amber-200/60 dark:border-amber-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 transition-all duration-300 group-hover:scale-110">
                  <Users className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {pagination.total}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:bg-gradient-to-br dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-700/10 border-blue-200/60 dark:border-blue-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 transition-all duration-300 group-hover:scale-110">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+5</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Students
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {students.filter((s) => s.status === USER_STATUS.ACTIVE).length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30 dark:bg-gradient-to-br dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/10 border-green-200/60 dark:border-green-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 transition-all duration-300 group-hover:scale-110">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+15%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Voted Students
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {students.filter((s) => s.has_voted && s.has_voted.length > 0).length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 dark:bg-gradient-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-700/10 border-purple-200/60 dark:border-purple-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 transition-all duration-300 group-hover:scale-110">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  This Month
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {students.filter((s) => {
                    if (!s.createdAt) return false;
                    const created = new Date(s.createdAt);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </div>

        {showFilters && (
          <FilterForm
            filters={filters}
            onFilterChange={(newFilters: Record<string, any>) => {
              setFilters(prev => ({ ...prev, ...newFilters }));
            }}
            onClear={() => setFilters({ search: '', status: '', facultyId: '' })}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Student ID, Name, Email, Phone...',
                icon: <Search className="h-4 w-4" />,
              },
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { value: USER_STATUS.ACTIVE, label: 'Active' },
                  { value: USER_STATUS.INACTIVE, label: 'Inactive' },
                  { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
                ],
              },
              {
                key: 'facultyId',
                label: 'Faculty',
                type: 'select',
                icon: <GraduationCap className="h-4 w-4" />,
                options: faculties.map((faculty) => ({
                  value: faculty._id || faculty.id || '',
                  label: faculty.name,
                })),
              },
            ]}
          />
        )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden mb-0">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                Student List
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {pagination.total} {pagination.total === 1 ? 'student' : 'students'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="block lg:hidden flex-1 overflow-auto px-2">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No students found
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id || student._id}
                    className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      const studentId = student.id || student._id;
                      if (studentId) {
                        navigate(`/students/${studentId}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                          {(student as any)?.photo_url ? (
                            <img
                              src={(student as any).photo_url}
                              alt={`${student.full_name || student.student_id || 'Student'} profile`}
                              className="h-full w-full object-cover rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('svg')) {
                                  const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                  userIcon.setAttribute('class', 'h-12 w-12 text-white');
                                  userIcon.setAttribute('fill', 'none');
                                  userIcon.setAttribute('stroke', 'currentColor');
                                  userIcon.setAttribute('viewBox', '0 0 24 24');
                                  userIcon.setAttribute('stroke-width', '2');
                                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('stroke-linecap', 'round');
                                  path.setAttribute('stroke-linejoin', 'round');
                                  path.setAttribute('d', 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z');
                                  userIcon.appendChild(path);
                                  parent.appendChild(userIcon);
                                }
                              }}
                            />
                          ) : (
                            <User className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {student.full_name || student.student_id || 'Unknown'}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {student.student_id || 'No ID'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : student.status === "Suspended"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {student.email}
                        </span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {student.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {student.faculty_id?.name || 'N/A'} - {student.department?.name || 'N/A'}
                        </span>
                      </div>
                      {student.batch && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Batch:</span>
                          <span className="text-slate-600 dark:text-slate-400">{student.batch}</span>
                        </div>
                      )}
                      {student.graduation_year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400">
                            Grad: {student.graduation_year}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {student.has_voted && student.has_voted.length > 0 ? (
                          <>
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-green-600 dark:text-green-400">Has voted</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">Not voted</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowViewModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Student"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-university-gold-300 scrollbar-track-gray-100 dark:scrollbar-thumb-university-gold-600 dark:scrollbar-track-gray-800">
              <div className="min-w-full">
                <Table
                  data={students}
                  columns={columns}
                  loading={loading}
                  emptyText="No students found"
                  onRowClick={(record) => {
                    const studentId = record.id || record._id;
                    if (studentId) {
                      navigate(`/students/${studentId}`);
                    }
                  }}
                  hoverable
                  striped
                />
              </div>
            </div>
          </div>

          {pagination.total >= 10 && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-700/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                  Showing{" "}
                  <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                    {pagination.total}
                  </span>{" "}
                  results
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    className="btn-ghost px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all hover-lift"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover-lift ${
                              pagination.page === pageNum
                                ? "bg-university-gold-200 dark:bg-university-gold-800 text-university-gold-800 dark:text-university-gold-200 border-2 border-university-gold-400 dark:border-university-gold-600"
                                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    className="btn-ghost px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all hover-lift"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Student Details"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                View Student Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access detailed student profile
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-slate-700 dark:text-slate-300">
              View detailed information for{" "}
              <strong className="text-slate-900 dark:text-white">
                {selectedStudent?.full_name || selectedStudent?.student_id || 'Unknown'}
              </strong>
              ?
            </p>
            {selectedStudent?.student_id && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Student ID:{" "}
                <span className="font-medium">{selectedStudent.student_id}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                const studentId = selectedStudent?.id || selectedStudent?._id;
                if (studentId) {
                  navigate(`/students/${studentId}`);
                }
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          </div>
        </div>
      </Modal>

      <AddEditForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        title="Edit Student"
        size="xl"
        initialData={selectedStudent ? {
          full_name: selectedStudent.full_name || '',
          student_id: selectedStudent.student_id || '',
          email: selectedStudent.email || '',
          phone: selectedStudent.phone || '',
          facultyId: selectedStudent.faculty_id?._id || (selectedStudent.faculty_id as any)?.id || '',
          departmentId: selectedStudent.department?._id || '',
        } : {}}
        fields={[
          {
            key: 'full_name',
            label: 'Full Name',
            type: 'text',
            placeholder: 'Enter full name',
            required: true,
          },
          {
            key: 'student_id',
            label: 'Student ID',
            type: 'text',
            placeholder: 'Enter student ID',
            required: true,
          },
          {
            key: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Enter email address',
            required: true,
          },
          {
            key: 'phone',
            label: 'Phone',
            type: 'text',
            placeholder: 'Enter phone number',
          },
          {
            key: 'facultyId',
            label: 'Faculty',
            type: 'select',
            placeholder: 'Select faculty',
            required: true,
            options: faculties.map((faculty) => ({
              value: faculty._id || faculty.id || '',
              label: faculty.name,
            })),
          },
          {
            key: 'departmentId',
            label: 'Department',
            type: 'select',
            placeholder: 'Select department',
            required: true,
            options: departments.map((dept) => ({
              value: dept._id || dept.id || '',
              label: dept.name,
            })),
          },
        ]}
        submitLabel="Update Student"
        loading={actionLoading}
        onSubmit={async (data) => {
          if (!selectedStudent?.id && !selectedStudent?._id) return;
          
          try {
            setActionLoading(true);
            const studentId = selectedStudent.id || selectedStudent._id;
            await userService.updateUser(studentId || '', data);
            setShowEditModal(false);
            setSelectedStudent(null);
            fetchStudents();
          } catch (error: any) {
            console.error('Failed to update student:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSearchStudentId('');
          setStudentFromAPI(null);
          setSearchError(null);
          setAutocompleteSuggestions([]);
          setShowAutocomplete(false);
          setShowManualForm(false);
          setSelectedFacultyId('');
          setSelectedDepartmentId('');
          lastSearchedIdRef.current = '';
        }}
        title="Add New Student"
        size="xl"
      >
        {!showManualForm ? (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Search Student from University API
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type Student ID to search and auto-fill information (e.g., B3SC)
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchStudentId}
                  onChange={(e) => {
                    setSearchStudentId(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => {
                    if (autocompleteSuggestions.length > 0) {
                      setShowAutocomplete(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowAutocomplete(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedSuggestionIndex(prev => 
                        prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const currentValue = searchStudentId.trim();
                      
                      if (selectedSuggestionIndex >= 0 && autocompleteSuggestions[selectedSuggestionIndex]) {
                        const selectedId = autocompleteSuggestions[selectedSuggestionIndex].student_id.trim().toUpperCase();
                        lastSearchedIdRef.current = selectedId;
                        setSearchStudentId(autocompleteSuggestions[selectedSuggestionIndex].student_id);
                        setShowAutocomplete(false);
                        searchStudentDetails(autocompleteSuggestions[selectedSuggestionIndex].student_id);
                      } else if (currentValue.length > 0) {
                        const upperValue = currentValue.toUpperCase();
                        lastSearchedIdRef.current = upperValue;
                        setShowAutocomplete(false);
                        searchStudentDetails(currentValue);
                      } else {
                        toast.error('Please enter a Student ID');
                      }
                    } else if (e.key === 'Escape') {
                      setShowAutocomplete(false);
                    }
                  }}
                  placeholder="Type Student ID (e.g., B3SC) - suggestions will appear below"
                  className="w-full h-14 pl-12 pr-14 rounded-xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-lg"
                  required
                />
                {searchingStudent && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                )}

                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {autocompleteSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.student_id}
                        onClick={() => {
                          const selectedId = suggestion.student_id.trim().toUpperCase();
                          lastSearchedIdRef.current = selectedId;
                          setSearchStudentId(suggestion.student_id);
                          setShowAutocomplete(false);
                          searchStudentDetails(suggestion.student_id);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className={`px-4 py-3 cursor-pointer transition-all ${
                          index === selectedSuggestionIndex
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                        } ${index === 0 ? 'rounded-t-xl' : ''} ${
                          index === autocompleteSuggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-base">
                              {suggestion.student_id}
                            </div>
                            {suggestion.full_name && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {suggestion.full_name}
                              </div>
                            )}
                          </div>
                          {index === selectedSuggestionIndex && (
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {searchStudentId.trim().length >= 2 && searchStudentId.trim().length < 3 && !showAutocomplete && autocompleteSuggestions.length === 0 && !searchingStudent && !studentFromAPI && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Continue typing... API search will start automatically after 3 characters.
                </p>
              )}
              {searchStudentId.trim().length >= 3 && !showAutocomplete && autocompleteSuggestions.length === 0 && !searchingStudent && !studentFromAPI && (
                <p className="mt-3 text-sm text-blue-500 dark:text-blue-400 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching University API... This may take a moment.
                </p>
              )}

              {searchError && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{searchError}</p>
                  </div>
                </div>
              )}

              {studentFromAPI?.student_data && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Student found! Information will be auto-filled below.
                    </p>
                    {!studentFromAPI.can_auto_register && studentFromAPI.message && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {studentFromAPI.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {studentFromAPI?.student_data && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  const formData = new FormData(e.target as HTMLFormElement);
                  const password = formData.get('password') as string;
                  const confirm_password = formData.get('confirm_password') as string;
                  
                  const facultyId = selectedFacultyId || studentFromAPI.student_data.faculty.faculty_id || formData.get('facultyId') as string || '';
                  const departmentId = selectedDepartmentId || studentFromAPI.student_data.department.department_id || formData.get('departmentId') as string || '';
                  
                  if (!password || password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                  }

                  if (password !== confirm_password) {
                    toast.error('Passwords do not match');
                    return;
                  }

                  if (!facultyId || facultyId.trim() === '') {
                    toast.error('Please select a faculty');
                    return;
                  }

                  if (!departmentId || departmentId.trim() === '') {
                    toast.error('Please select a department');
                    return;
                  }

                  if (!studentFromAPI.student_data.student_id || studentFromAPI.student_data.student_id.trim() === '') {
                    toast.error('Student ID is required');
                    return;
                  }

                  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
                  if (!objectIdRegex.test(facultyId)) {
                    toast.error('Invalid faculty ID format. Please select a faculty from the dropdown.');
                    return;
                  }

                  if (!objectIdRegex.test(departmentId)) {
                    toast.error('Invalid department ID format. Please select a department from the dropdown.');
                    return;
                  }

                  const email = (studentFromAPI.student_data.email && 
                                studentFromAPI.student_data.email !== 'NaN' && 
                                studentFromAPI.student_data.email.toLowerCase() !== 'nan')
                    ? studentFromAPI.student_data.email
                    : '';
                  const username = email ? email.split('@')[0] : studentFromAPI.student_data.student_id.toLowerCase();

                  try {
                    setActionLoading(true);
                    const userData: any = {
                      full_name: studentFromAPI.student_data.full_name,
                      username: username,
                      student_id: studentFromAPI.student_data.student_id.trim().toUpperCase(),
                      email: email || `student.${studentFromAPI.student_data.student_id.toLowerCase()}@snu.edu.so`,
                      phone: studentFromAPI.student_data.phone || '',
                      password: password,
                      confirm_password: confirm_password,
                      role: 'Student',
                      faculty_id: facultyId,
                      department: departmentId,
                      batch: studentFromAPI.student_data.batch || 
                             (studentFromAPI.student_data.student_id ? `Batch-${studentFromAPI.student_data.student_id.substring(0, 2)}` : 'Batch-Default'),
                      status: studentFromAPI.student_data.status || USER_STATUS.ACTIVE,
                      photo_url: studentFromAPI.student_data.photo_url || null,
                    };
                    await userService.createUser(userData);
                    
                    toast.success('Student created successfully');
                    setShowAddModal(false);
                    setSearchStudentId('');
                    setStudentFromAPI(null);
                    setSearchError(null);
                    fetchStudents();
                  } catch (error: any) {
                    console.error('Failed to create student:', error);
                    let errorMessage = 'Failed to create student';
                    
                    if (error.response?.data) {
                      const errorData = error.response.data;
                      errorMessage = errorData.error || errorData.message || errorMessage;
                      
                      if (errorData.details) {
                        errorMessage += `: ${JSON.stringify(errorData.details)}`;
                      }
                    } else if (error.message) {
                      errorMessage = error.message;
                    }
                    
                    toast.error(errorMessage);
                    console.error('Full error response:', error.response?.data);
                    console.error('Error status:', error.response?.status);
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="space-y-6"
              >
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student Information from University API (Read-only)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={studentFromAPI.student_data.full_name}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Student ID *
                      </label>
                      <input
                        type="text"
                        value={studentFromAPI.student_data.student_id}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={studentFromAPI.student_data.email || ''}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={studentFromAPI.student_data.phone || ''}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Faculty * {studentFromAPI.student_data.faculty.exists_in_system && <span className="text-green-600 dark:text-green-400">(Auto-selected from API)</span>}
                      </label>
                      {studentFromAPI.student_data.faculty.exists_in_system && studentFromAPI.can_auto_register ? (
                        <input
                          type="text"
                          value={studentFromAPI.student_data.faculty.name || 'N/A'}
                          readOnly
                          className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        />
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={studentFromAPI.student_data.faculty.name || 'N/A'}
                            readOnly
                            className="w-full h-11 px-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm"
                          />
                          <select
                            name="facultyId"
                            value={selectedFacultyId}
                            onChange={(e) => {
                              setSelectedFacultyId(e.target.value);
                              setSelectedDepartmentId('');
                              if (e.target.value) {
                                fetchDepartments(e.target.value);
                              }
                            }}
                            required
                            className={`w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-900 border-2 ${
                              selectedFacultyId && studentFromAPI.student_data.faculty.exists_in_system
                                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'border-amber-400 dark:border-amber-600'
                            } focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100`}
                          >
                            <option value="">Select Faculty from System *</option>
                            {faculties.map((faculty) => {
                              const facultyId = String(faculty._id || faculty.id || '');
                              return (
                                <option key={facultyId} value={facultyId}>
                                  {faculty.name}
                                </option>
                              );
                            })}
                          </select>
                          {selectedFacultyId ? (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✓ Faculty automatically selected {studentFromAPI.student_data.faculty.exists_in_system ? 'from API match' : 'by name match'}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Faculty from API not found in system. Please select from dropdown above.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Department * {studentFromAPI.student_data.department.exists_in_system && <span className="text-green-600 dark:text-green-400">(Auto-selected from API)</span>}
                      </label>
                      {studentFromAPI.student_data.department.exists_in_system && studentFromAPI.can_auto_register ? (
                        <input
                          type="text"
                          value={studentFromAPI.student_data.department.name || 'N/A'}
                          readOnly
                          className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        />
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={studentFromAPI.student_data.department.name || 'N/A'}
                            readOnly
                            className="w-full h-11 px-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm"
                          />
                          <select
                            name="departmentId"
                            value={selectedDepartmentId}
                            onChange={(e) => setSelectedDepartmentId(e.target.value)}
                            required
                            className={`w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-900 border-2 ${
                              selectedDepartmentId && studentFromAPI.student_data.department.exists_in_system
                                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'border-amber-400 dark:border-amber-600'
                            } focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100`}
                          >
                            <option value="">Select Department from System *</option>
                            {departments.map((dept) => {
                              const deptId = String(dept._id || dept.id || '');
                              return (
                                <option key={deptId} value={deptId}>
                                  {dept.name}
                                </option>
                              );
                            })}
                          </select>
                          {selectedDepartmentId ? (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✓ Department automatically selected from API match
                            </p>
                          ) : studentFromAPI.student_data.department.exists_in_system ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Department found in API but not auto-selected. Please select from dropdown above.
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Department from API not found in system. Please select from dropdown above.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {studentFromAPI.student_data.batch && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Batch
                        </label>
                        <input
                          type="text"
                          value={studentFromAPI.student_data.batch}
                          readOnly
                          className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <input
                        type="text"
                        value={studentFromAPI.student_data.status || 'Active'}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    </div>

                    {studentFromAPI.student_data.photo_url && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Photo URL
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={studentFromAPI.student_data.photo_url}
                            readOnly
                            className="flex-1 h-11 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm"
                          />
                          <img
                            src={studentFromAPI.student_data.photo_url}
                            alt="Student photo"
                            className="h-11 w-11 rounded-lg object-cover border border-gray-300 dark:border-slate-600"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Account Password (Required)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter password (min 6 characters)"
                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        placeholder="Confirm password"
                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSearchStudentId('');
                      setStudentFromAPI(null);
                      setSearchError(null);
                    }}
                    disabled={actionLoading}
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {(searchError || (!studentFromAPI && searchStudentId.trim().length >= 2 && !searchingStudent)) && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Student not found in University API
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          You can manually enter student information below
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(true)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Manually
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!studentFromAPI && !searchError && searchStudentId.trim().length < 2 && (
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Start typing Student ID to search
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Or use manual entry option below
                </p>
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="mt-4 px-6 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all inline-flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Student Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const studentId = formData.get('student_id') as string;
              const email = formData.get('email') as string;
              
              const username = email && email !== 'NaN' && email.toLowerCase() !== 'nan' && email.includes('@')
                ? email.split('@')[0]
                : studentId ? studentId.toLowerCase() : '';
              
              if (!username) {
                toast.error('Username is required. Please provide a valid email or student ID.');
                return;
              }
              
              if (!studentId || studentId.trim() === '') {
                toast.error('Student ID is required.');
                return;
              }
              
              const data = {
                full_name: formData.get('full_name') as string,
                username: username,
                student_id: studentId.trim(),
                email: email,
                phone: formData.get('phone') as string,
                password: formData.get('password') as string,
                confirm_password: formData.get('confirm_password') as string,
                faculty_id: formData.get('facultyId') as string,
                department: formData.get('departmentId') as string,
                batch: formData.get('batch') as string || (studentId ? `Batch-${studentId.substring(0, 2)}` : 'Batch-Default'),
                status: formData.get('status') as string || USER_STATUS.ACTIVE,
                photo_url: formData.get('photo_url') as string || null,
              };

              try {
                setActionLoading(true);
                await userService.createUser({
                  ...data,
                  role: 'Student',
                });
                toast.success('Student created successfully');
                setShowAddModal(false);
                setShowManualForm(false);
                setSearchStudentId('');
                setStudentFromAPI(null);
                fetchStudents();
              } catch (error: any) {
                console.error('Failed to create student:', error);
                let errorMessage = 'Failed to create student';
                
                if (error.response?.data) {
                  const errorData = error.response.data;
                  errorMessage = errorData.error || errorData.message || errorMessage;
                  
                  if (errorData.details) {
                    errorMessage += `: ${JSON.stringify(errorData.details)}`;
                  }
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                toast.error(errorMessage);
                console.error('Full error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
              } finally {
                setActionLoading(false);
              }
            }}
            className="space-y-6"
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Manual Student Entry
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Fill in all required fields to create student account manually
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="Enter full name"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Student ID *
                </label>
                <input
                  type="text"
                  name="student_id"
                  required
                  placeholder="Enter student ID"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address (optional)"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Faculty *
                </label>
                <select
                  name="facultyId"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty._id || faculty.id} value={faculty._id || faculty.id || ''}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <select
                  name="departmentId"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id || ''}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Batch *
                </label>
                <input
                  type="text"
                  name="batch"
                  required
                  placeholder="Enter batch (e.g., Batch-3)"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  defaultValue={USER_STATUS.ACTIVE}
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                >
                  <option value={USER_STATUS.ACTIVE}>Active</option>
                  <option value={USER_STATUS.INACTIVE}>Inactive</option>
                  <option value={USER_STATUS.SUSPENDED}>Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Photo URL
                </label>
                <input
                  type="url"
                  name="photo_url"
                  placeholder="Enter photo URL (optional)"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  minLength={6}
                  placeholder="Confirm password"
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setSearchStudentId('');
                }}
                disabled={actionLoading}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all disabled:opacity-50"
              >
                Back to Search
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Student
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Student"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Confirm Deletion
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">
                {selectedStudent?.full_name || selectedStudent?.student_id || 'Unknown'}
              </strong>
              ?
            </p>
            {selectedStudent?.student_id && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Student ID:{" "}
                <span className="font-medium">{selectedStudent.student_id}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentsTable;