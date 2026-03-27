import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, Filter, Building, TrendingUp, Users, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterForm, AddEditForm, Modal, Table } from '../../components';
import { facultyService } from '../../services';
import type { Faculty, FacultyFilters, PaginatedResponse } from '../../services/facultyService';

interface ExtendedFaculty extends Faculty {
  _id?: string;
  status?: string;
  created_at?: string;
  created_by?: {
    _id: string;
    username?: string;
    email?: string;
  };
}

const FacultiesTable: React.FC = () => {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<ExtendedFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<FacultyFilters>({});
  const [selectedFaculty, setSelectedFaculty] = useState<ExtendedFaculty | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const columns = [
    {
      key: 'index',
      title: '#',
      render: (_value: unknown, _record: ExtendedFaculty, index: number) => (
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {index + 1}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      render: (_value: unknown, record: ExtendedFaculty) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center">
            <span className="text-university-blue-700 font-medium">
              {record.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {record.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      title: 'Code',
      render: (_value: unknown, record: ExtendedFaculty) => (
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-university-gold-100 text-university-gold-800 dark:bg-university-gold-900/30 dark:text-university-gold-400">
            {record.code || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'departments',
      title: 'Departments',
      render: (_value: unknown, record: ExtendedFaculty) => (
        <div className="flex items-center">
          {record.departments && record.departments.length > 0 ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {record.departments.length} dept{record.departments.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">No departments</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (_value: unknown, record: ExtendedFaculty) => new Date(record.createdAt || record.created_at || '').toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value: unknown, record: ExtendedFaculty) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFaculty(record);
              setShowViewModal(true);
            }}
            className="p-2 rounded-lg text-university-blue-600 dark:text-university-blue-400 hover:bg-university-blue-50 dark:hover:bg-university-blue-900/20 transition-all hover-lift"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFaculty(record);
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg text-university-gold-600 dark:text-university-gold-400 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20 transition-all hover-lift"
            title="Edit Faculty"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFaculty(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover-lift"
            title="Delete Faculty"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Faculty> = await facultyService.getFaculties({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (response.data.length > 0) {
      }
      
      let filteredData = response.data;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(faculty => 
          (faculty.name?.toLowerCase().includes(searchLower)) ||
          (faculty.code?.toLowerCase().includes(searchLower))
        );
      }
      
      setFaculties(filteredData);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / response.limit),
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, [pagination.page, pagination.limit, filters]);

  const handleDelete = async () => {
    if (!selectedFaculty) return;
    
    try {
      setActionLoading(true);
      const facultyId = selectedFaculty.id || selectedFaculty._id;
      
      if (!facultyId) {
        return;
      }
      
      await facultyService.deleteFaculty(facultyId);
      setShowDeleteModal(false);
      setSelectedFaculty(null);
      fetchFaculties();
      
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
                  Faculty Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage university faculties and departments
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
                  <span className="hidden sm:inline">Add Faculty</span>
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
                  <Building className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Faculties
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : pagination.total}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:bg-gradient-to-br dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-700/10 border-blue-200/60 dark:border-blue-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 transition-all duration-300 group-hover:scale-110">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+3</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Faculties
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : faculties.length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/30 dark:bg-gradient-to-br dark:from-red-900/30 dark:via-red-800/20 dark:to-red-700/10 border-red-200/60 dark:border-red-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 transition-all duration-300 group-hover:scale-110">
                  <Calendar className="h-6 w-6 text-red-600 dark:text-red-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+24%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  This Month
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : faculties.filter(f => {
                    const created = new Date(f.createdAt || f.created_at || new Date());
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 dark:bg-gradient-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-700/10 border-purple-200/60 dark:border-purple-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 transition-all duration-300 group-hover:scale-110">
                  <Building className="h-6 w-6 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Stable</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Departments
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : Math.floor(faculties.length * 2.5)}
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
            onClear={() => setFilters({})}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Faculty name, code...',
                icon: <Search className="h-4 w-4" />,
              },
            ]}
          />
        )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden mb-0">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-600" />
                Faculty List
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {pagination.total} {pagination.total === 1 ? 'faculty' : 'faculties'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="block lg:hidden flex-1 overflow-auto px-2">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : faculties.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No faculties found
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {faculties.map((faculty) => (
                  <div
                    key={faculty.id || (faculty as any)._id}
                    className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      const facultyId = faculty.id || (faculty as any)._id;
                      if (facultyId) {
                        navigate(`/faculties/${facultyId}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {faculty.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {faculty.name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {faculty.code || 'No code'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {faculty.departments && faculty.departments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {faculty.departments.length} department{faculty.departments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Created: {new Date(faculty.createdAt || (faculty as any).created_at || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFaculty(faculty);
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
                          setSelectedFaculty(faculty);
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Faculty"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFaculty(faculty);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete Faculty"
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
                  data={faculties}
                  columns={columns}
                  loading={loading}
                  emptyText="No faculties found"
                  onRowClick={(record) => {
                    const facultyId = record.id || record._id;
                    if (facultyId) {
                      navigate(`/faculties/${facultyId}`);
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
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Faculty"
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
                {selectedFaculty?.name}
              </strong>
              ?
            </p>
            {selectedFaculty?.code && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Code:{" "}
                <span className="font-medium">{selectedFaculty.code}</span>
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
              Delete Faculty
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Faculty Details"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                View Faculty Information
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access detailed faculty profile
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              View detailed information for <strong>{selectedFaculty?.name || 'Unknown'}</strong>?
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Name:</strong> {selectedFaculty?.name || 'N/A'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Code:</strong> {selectedFaculty?.code || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                const facultyId = selectedFaculty?.id || selectedFaculty?._id;
                if (facultyId) {
                  navigate(`/faculties/${facultyId}`);
                } else {
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
          setSelectedFaculty(null);
        }}
        title="Edit Faculty"
        size="xl"
        initialData={selectedFaculty ? {
          name: selectedFaculty.name || '',
          code: selectedFaculty.code || '',
        } : {}}
        fields={[
          {
            key: 'name',
            label: 'Faculty Name',
            type: 'text',
            placeholder: 'Enter faculty name',
            required: true,
          },
          {
            key: 'code',
            label: 'Faculty Code',
            type: 'text',
            placeholder: 'Enter faculty code',
          },
        ]}
        submitLabel="Update Faculty"
        loading={actionLoading}
        onSubmit={async (data) => {
          if (!selectedFaculty?.id && !selectedFaculty?._id) return;
          
          try {
            setActionLoading(true);
            const facultyId = selectedFaculty.id || selectedFaculty._id;
            await facultyService.updateFaculty(facultyId, data);
            setShowEditModal(false);
            setSelectedFaculty(null);
            fetchFaculties();
          } catch (error: any) {
            console.error('Failed to update faculty:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <AddEditForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Faculty"
        size="xl"
        fields={[
          {
            key: 'name',
            label: 'Faculty Name',
            type: 'text',
            placeholder: 'Enter faculty name',
            required: true,
          },
          {
            key: 'code',
            label: 'Faculty Code',
            type: 'text',
            placeholder: 'Enter faculty code',
          },
        ]}
        submitLabel="Create Faculty"
        loading={actionLoading}
        onSubmit={async (data) => {
          try {
            setActionLoading(true);
            await facultyService.createFaculty({
              name: data.name as string,
              code: data.code as string,
              description: data.description as string | undefined,
            });
            setShowAddModal(false);
            fetchFaculties();
          } catch (error: any) {
            console.error('Failed to create faculty:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </div>
  );
};

export default FacultiesTable;