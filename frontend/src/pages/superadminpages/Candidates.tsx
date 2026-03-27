import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Award, Filter, Search, X, Users, TrendingUp, GraduationCap, BarChart3, Mail, Phone, ChevronLeft, ChevronRight, Loader2, Calendar, Vote, FileText, User } from 'lucide-react';
import { Table, Badge, Modal, FilterForm } from '../../components';
import { candidateService, electionService, facultyService, departmentService, userService } from '../../services';
import { API_ENDPOINTS, ELECTION_TYPES, ELECTION_POSITIONS, ELECTION_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

interface Candidate {
  id: string;
  _id?: string;
  candidate_id?: string;
  position: string;
  manifesto?: string;
  photo_url?: string;
  vote_count?: number;
  student?: {
    id: string;
    _id?: string;
    full_name: string;
    student_id?: string;
    email?: string;
    phone?: string;
    faculty_id?: {
      _id: string;
      name: string;
      code?: string;
    };
    status?: string;
    photo_url?: string;
  };
  election?: {
    _id: string;
    id?: string;
    title: string;
    status: string;
    type?: string;
    faculty_id?: {
      _id: string;
      name: string;
    };
  };
  created_by?: {
    id: string;
    username?: string;
    email?: string;
  };
  created_at?: string;
  createdAt?: string;
}

interface Election {
  _id: string;
  id?: string;
  title: string;
  status: string;
  type?: string;
}

const getPositionsByElectionType = (electionType: string | undefined): string[] => {
  if (!electionType) return [];
  
  return Object.values(ELECTION_POSITIONS);
};

const CandidatesTable: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [elections, setElections] = useState<Election[]>([]);
  const [faculties, setFaculties] = useState<Array<{ _id?: string; id?: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ _id?: string; id?: string; name: string; faculty_id?: string }>>([]);
  const [students, setStudents] = useState<Array<{ _id?: string; id?: string; full_name?: string; student_id?: string; email?: string; faculty_id?: { _id: string; name: string } }>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    electionId: '',
    facultyId: '',
    departmentId: '',
    position: '',
  });

  const [formData, setFormData] = useState({
    student_id: '',
    election_id: '',
    position: '',
    manifesto: '',
  });
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<Array<{ _id?: string; id?: string; full_name?: string; student_id?: string; email?: string }>>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);

  const selectedElection = elections.find(e => (e._id || e.id) === formData.election_id);
  const availablePositions = getPositionsByElectionType(selectedElection?.type);

  const columns = useMemo(() => [
    {
      key: 'no',
      title: '#',
      render: (_value: unknown, _record: Candidate, index: number) => {
        const rowNumber = ((pagination.page - 1) * pagination.limit) + index + 1;
        return (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {rowNumber}
          </span>
        );
      },
    },
    {
      key: 'candidate',
      title: 'Candidate',
      render: (value: any, record: Candidate) => {
        const name = record.student?.full_name || 'Unknown';
        const photoUrl = record.photo_url || record.student?.photo_url;
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${name} profile`}
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
                {name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {record.student?.student_id || 'N/A'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'position',
      title: 'Position',
      render: (value: any, record: Candidate) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {record.position || 'N/A'}
        </span>
      ),
    },
    {
      key: 'election',
      title: 'Election',
      render: (value: any, record: Candidate) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {record.election?.title || 'N/A'}
          </div>
          {record.election?.type && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {record.election.type}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (value: any, record: Candidate) => record.student?.faculty_id?.name || 'N/A',
    },
    {
      key: 'votes',
      title: 'Votes',
      render: (value: any, record: Candidate) => (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-university-gold-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {record.vote_count || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Election Status',
      render: (value: any, record: Candidate) => {
        const status = record.election?.status || 'Unknown';
        return (
          <Badge 
            variant={
              status === 'Active' ? 'success' : 
              status === 'Completed' ? 'info' : 
              'secondary'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Candidate) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(record);
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
              setSelectedCandidate(record);
              setFormData({
                student_id: record.student?.id || record.student?._id || '',
                election_id: record.election?._id || record.election?.id || '',
                position: record.position || '',
                manifesto: record.manifesto || '',
              });
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="Edit Candidate"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Candidate"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [pagination, setSelectedCandidate, setShowViewModal, setShowEditModal, setShowDeleteModal]);

  const fetchElections = async () => {
    try {
      const response = await electionService.getElections();
      const mappedElections: Election[] = (response.data || []).map((election: any) => ({
        _id: election._id || election.id,
        id: election.id || election._id,
        title: election.title,
        status: election.status || 'active',
        type: election.type
      }));
      setElections(mappedElections);
    } catch (error) {
      setElections([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties((response.data || []) as Array<{ _id?: string; id?: string; name: string }>);
    } catch (error) {
      setFaculties([]);
    }
  };

  const fetchDepartments = async (facultyId?: string) => {
    try {
      const response = await departmentService.getDepartments(facultyId ? { facultyId } : {});
      setDepartments((response.data || []) as Array<{ _id?: string; id?: string; name: string; faculty_id?: string }>);
    } catch (error) {
      setDepartments([]);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudentSearchResults([]);
      setShowStudentSearch(false);
      return;
    }

    try {
      setSearchingStudent(true);
      const response = await userService.getStudents({ search: query, limit: 10 });
      setStudentSearchResults(response.data || []);
      setShowStudentSearch(true);
    } catch (error) {
      setStudentSearchResults([]);
    } finally {
      setSearchingStudent(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getCandidates({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      let filteredData: Candidate[] = (response.data || []).map((candidate: any) => ({
        ...candidate,
        id: candidate.id || candidate._id,
        _id: candidate._id || candidate.id,
        election: candidate.election ? {
          _id: candidate.election._id || candidate.election.id,
          id: candidate.election.id || candidate.election._id,
          title: candidate.election.title,
          status: candidate.election.status || 'active',
          type: candidate.election.type,
          faculty_id: candidate.election.faculty_id
        } : undefined,
        student: candidate.student ? {
          ...candidate.student,
          id: candidate.student.id || candidate.student._id,
          _id: candidate.student._id || candidate.student.id
        } : undefined
      }));
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((candidate: Candidate) => 
          (candidate.student?.full_name?.toLowerCase().includes(searchLower)) ||
          (candidate.student?.student_id?.toLowerCase().includes(searchLower)) ||
          (candidate.position?.toLowerCase().includes(searchLower)) ||
          (candidate.election?.title?.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.electionId) {
        filteredData = filteredData.filter((candidate) => {
          const electionId = candidate.election?._id || candidate.election?.id;
          return electionId === filters.electionId;
        });
      }
      
      if (filters.facultyId) {
        filteredData = filteredData.filter((candidate) => {
          const facultyId = candidate.student?.faculty_id?._id || candidate.student?.faculty_id?.id;
          return facultyId === filters.facultyId;
        });
      }
      
      if (filters.position) {
        filteredData = filteredData.filter((candidate) => 
          candidate.position?.toLowerCase().includes(filters.position.toLowerCase())
        );
      }
      
      const total = filteredData.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setCandidates(paginatedData);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (error) {
      setCandidates([]);
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchElections();
    fetchFaculties();
    fetchDepartments();
  }, [pagination.page, pagination.limit, filters]);

  const handleDelete = async () => {
    if (!selectedCandidate) return;
    
    try {
      setActionLoading(true);
      const candidateId = selectedCandidate.id || selectedCandidate._id || selectedCandidate.candidate_id || '';
      await candidateService.deleteCandidate(candidateId);
      toast.success('Candidate deleted successfully');
      setShowDeleteModal(false);
      setSelectedCandidate(null);
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete candidate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.election_id || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      
      const axios = (await import('../../utils/axios')).default;
      await axios.post(API_ENDPOINTS.CANDIDATES.ADD, {
        student_id: formData.student_id,
        election_id: formData.election_id,
        position: formData.position,
        manifesto: formData.manifesto || undefined,
      });
      
      toast.success('Candidate added successfully');
      setShowAddModal(false);
      setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
      setStudentSearchQuery('');
      setStudentSearchResults([]);
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to add candidate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      const candidateId = selectedCandidate.id || selectedCandidate._id || selectedCandidate.candidate_id || '';
      
      const axios = (await import('../../utils/axios')).default;
      await axios.put(`/api/candidates/${candidateId}`, {
        position: formData.position,
        manifesto: formData.manifesto || undefined,
      });
      
      toast.success('Candidate updated successfully');
      setShowEditModal(false);
      setSelectedCandidate(null);
      setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update candidate');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const activeElections = new Set(candidates.filter(c => c.election?.status === 'Active').map(c => c.election?._id)).size;
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
    const thisMonth = candidates.filter(c => {
      const created = new Date(c.created_at || c.createdAt || '');
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return { totalCandidates, activeElections, totalVotes, thisMonth };
  }, [candidates]);

  return (
    <div className="min-h-screen bg-university-gradient">
      <div className="relative z-10 p-2 sm:p-3 lg:p-4 pb-0 mb-0">
        
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="glass rounded-2xl bg-gradient-to-br from-white/90 via-white/95 to-university-gold-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 border border-university-gold-200/20 dark:border-university-gold-800/20 shadow-theme-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                  Candidate Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage election candidates and their information
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
                  onClick={() => {
                    setShowAddModal(true);
                    setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
                    setStudentSearchQuery('');
                    setStudentSearchResults([]);
                  }}
                  className="btn-primary inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Candidate</span>
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
                  Total Candidates
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
                  <Vote className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+5</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Elections
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.activeElections}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30 dark:bg-gradient-to-br dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/10 border-green-200/60 dark:border-green-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 transition-all duration-300 group-hover:scale-110">
                  <Award className="h-6 w-6 text-green-600 dark:text-green-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+15%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Votes
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalVotes}
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
                  {stats.thisMonth}
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
            onClear={() => setFilters({ search: '', electionId: '', facultyId: '', departmentId: '', position: '' })}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Candidate name, Student ID, Position, Election...',
                icon: <Search className="h-4 w-4" />,
              },
              {
                key: 'electionId',
                label: 'Election',
                type: 'select',
                options: elections.map((election) => ({
                  value: election._id || election.id || '',
                  label: election.title,
                })),
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
              {
                key: 'position',
                label: 'Position',
                type: 'text',
                placeholder: 'Filter by position...',
              },
            ]}
          />
        )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden mb-0">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Award className="h-6 w-6 text-university-gold-600" />
                Candidate List
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {pagination.total} {pagination.total === 1 ? 'candidate' : 'candidates'}
                </span>
              </div>
            </div>
          </div>

          <div className="block lg:hidden flex-1 overflow-auto px-2">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-university-gold-500 animate-spin" />
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No candidates found
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {candidates.map((candidate) => {
                  const photoUrl = candidate.photo_url || candidate.student?.photo_url;
                  const name = candidate.student?.full_name || 'Unknown';

                  return (
                    <div
                      key={candidate.id || candidate._id || candidate.candidate_id}
                      className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-university-gold-500 to-university-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={`${name} profile`}
                                className="h-full w-full object-cover rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('svg')) {
                                    const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                    userIcon.setAttribute('class', 'h-6 w-6 text-white');
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
                              <User className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {name}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {candidate.student?.student_id || 'No ID'} • {candidate.position}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge 
                            variant={
                              candidate.election?.status === 'Active' ? 'success' : 
                              candidate.election?.status === 'Completed' ? 'info' : 
                              'secondary'
                            }
                          >
                            {candidate.election?.status || 'Unknown'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Vote className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {candidate.election?.title || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {candidate.student?.faculty_id?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-university-gold-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {candidate.vote_count || 0} votes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
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
                            setSelectedCandidate(candidate);
                            setFormData({
                              student_id: candidate.student?.id || candidate.student?._id || '',
                              election_id: candidate.election?._id || candidate.election?.id || '',
                              position: candidate.position || '',
                              manifesto: candidate.manifesto || '',
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Edit Candidate"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete Candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-university-gold-300 scrollbar-track-gray-100 dark:scrollbar-thumb-university-gold-600 dark:scrollbar-track-gray-800">
              <div className="min-w-full">
                <Table
                  data={candidates}
                  columns={columns}
                  loading={loading}
                  emptyText="No candidates found"
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
        title="View Candidate Details"
        size="xl"
      >
        {selectedCandidate && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  {selectedCandidate.student?.full_name || 'Unknown Candidate'}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedCandidate.position} • {selectedCandidate.election?.title || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Candidate Name
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCandidate.student?.full_name || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Student ID
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCandidate.student?.student_id || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Position
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCandidate.position || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Election
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCandidate.election?.title || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Faculty
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCandidate.student?.faculty_id?.name || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Votes
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-university-gold-500" />
                  {selectedCandidate.vote_count || 0}
                </p>
              </div>

              {selectedCandidate.manifesto && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                    Manifesto
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedCandidate.manifesto}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
          setStudentSearchQuery('');
          setStudentSearchResults([]);
        }}
        title="Add New Candidate"
        size="xl"
      >
        <form onSubmit={handleAddCandidate} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Student *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 z-10" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  searchStudents(e.target.value);
                }}
                placeholder="Search by student name or ID..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
              />
              {searchingStudent && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-5 w-5 text-university-blue-500 animate-spin" />
                </div>
              )}
            </div>

            {showStudentSearch && studentSearchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 max-h-48 overflow-y-auto">
                {studentSearchResults.map((student) => (
                  <button
                    key={student._id || student.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, student_id: student._id || student.id || '' }));
                      setStudentSearchQuery(student.full_name || student.student_id || '');
                      setStudentSearchResults([]);
                      setShowStudentSearch(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-200 dark:border-slate-600 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {student.full_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.student_id || student.email || 'N/A'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {formData.student_id && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ Student selected: {studentSearchQuery}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Election *
            </label>
            <select
              value={formData.election_id}
              onChange={(e) => {
                const selectedElectionId = e.target.value;
                setFormData(prev => ({ 
                  ...prev, 
                  election_id: selectedElectionId,
                  position: ''
                }));
              }}
              required
              className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100"
            >
              <option value="">Select Election</option>
              {elections
                .filter((election) => {
                  const status = (election.status || '').trim();
                  return status === ELECTION_STATUS.UPCOMING || status.toLowerCase() === 'upcoming';
                })
                .map((election) => (
                  <option key={election._id || election.id} value={election._id || election.id}>
                    {election.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Position *
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              required
              disabled={!formData.election_id || availablePositions.length === 0}
              className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!formData.election_id 
                  ? 'Select Election First' 
                  : availablePositions.length === 0 
                    ? 'No positions available' 
                    : 'Select Position'}
              </option>
              {availablePositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Manifesto
            </label>
            <textarea
              value={formData.manifesto}
              onChange={(e) => setFormData(prev => ({ ...prev, manifesto: e.target.value }))}
              placeholder="Enter candidate's manifesto or campaign statement..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
                setStudentSearchQuery('');
                setStudentSearchResults([]);
              }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </>
              )}
            </button>

          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCandidate(null);
          setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
        }}
        title="Edit Candidate"
        size="xl"
      >
        <form onSubmit={handleUpdateCandidate} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Position *
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              required
              disabled={!formData.election_id || availablePositions.length === 0}
              className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!formData.election_id 
                  ? 'Select Election First' 
                  : availablePositions.length === 0 
                    ? 'No positions available' 
                    : 'Select Position'}
              </option>
              {availablePositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Manifesto
            </label>
            <textarea
              value={formData.manifesto}
              onChange={(e) => setFormData(prev => ({ ...prev, manifesto: e.target.value }))}
              placeholder="Enter candidate's manifesto or campaign statement..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 transition-all text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedCandidate(null);
                setFormData({ student_id: '', election_id: '', position: '', manifesto: '' });
              }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-3 bg-university-blue-600 hover:bg-university-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Update Candidate
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Candidate"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete candidate <strong>{selectedCandidate?.student?.full_name}</strong> for position <strong>{selectedCandidate?.position}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CandidatesTable;