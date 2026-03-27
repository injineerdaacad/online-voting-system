import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, Filter, Building, TrendingUp, Users, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterForm, Button, Table, Badge, Modal } from '../../components';
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
  createdAt: string;
  updatedAt: string;
}

const DepartmentsTable: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const columns = [
    {
      key: 'index',
      title: '#',
      dataIndex: 'index' as keyof Department,
      render: (value: any, record: Department, index: number) => (
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
      dataIndex: 'name',
      render: (value: string, record: Department) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center">
            <span className="text-university-blue-700 font-medium">
              {value.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {value}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      title: 'Code',
      dataIndex: 'code' as keyof Department,
      render: (value: string, record: Department) => (
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-university-gold-100 text-university-gold-800 dark:bg-university-gold-900/30 dark:text-university-gold-400">
            {record.code || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (value: any, record: Department) => {
        const facultyName = record.faculty_id?.name;
        const facultyCode = record.faculty_id?.code;
        return (
          <div className="flex items-center">
            {facultyName ? (
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {facultyName}
                </div>
                {facultyCode && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {facultyCode}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt',
      render: (value: string) => (
        <span className="text-gray-900 dark:text-gray-100">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Department) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDepartment(record);
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
              setSelectedDepartment(record);
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg text-university-gold-600 dark:text-university-gold-400 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20 transition-all hover-lift"
            title="Edit Department"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDepartment(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover-lift"
            title="Delete Department"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartments();
      let allData = response.data || [];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allData = allData.filter(department => 
          (department.name?.toLowerCase().includes(searchLower)) ||
          (department.code?.toLowerCase().includes(searchLower)) ||
          (department.faculty_id?.name?.toLowerCase().includes(searchLower)) ||
          (department.faculty_id?.code?.toLowerCase().includes(searchLower))
        );
      }
      
      const total = allData.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = allData.slice(startIndex, endIndex);
      
      setDepartments(paginatedData);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (error) {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [filters, pagination.page, pagination.limit]);

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    
    try {
      await departmentService.deleteDepartment(selectedDepartment.id || selectedDepartment._id || '');
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
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
                  Department Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage university departments and academic units
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
                  onClick={() => navigate('/departments/new')}
                  className="btn-primary inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Department</span>
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
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Departments
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
                  <span className="text-sm font-medium">+5</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Departments
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : departments.filter(d => d.faculty_id).length}
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
                  <span className="text-sm font-medium">+15%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  This Month
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : departments.filter(d => {
                    const created = new Date(d.createdAt);
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
                  Faculties
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : Math.floor(departments.length * 0.3)}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </div>

        {showFilters && (
          <FilterForm
            filters={filters}
            onFilterChange={setFilters}
            onClear={() => setFilters({ search: '' })}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Department name, code, faculty...',
                icon: <Search className="h-4 w-4" />,
              },
            ]}
          />
        )}

        <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg mb-0">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Department List
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pagination.total} {pagination.total === 1 ? 'department' : 'departments'}
              </div>
            </div>

            <div className="block lg:hidden space-y-4">
              {departments.map((department, index) => (
                <div key={department.id || department._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center">
                        <span className="text-university-blue-700 font-medium">
                          {department.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{department.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-university-gold-100 text-university-gold-800 dark:bg-university-gold-900/30 dark:text-university-gold-400">
                            {department.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepartment(department);
                          setShowViewModal(true);
                        }}
                        className="p-2 rounded-lg text-university-blue-600 dark:text-university-blue-400 hover:bg-university-blue-50 dark:hover:bg-university-blue-900/20 transition-all"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepartment(department);
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded-lg text-university-gold-600 dark:text-university-gold-400 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20 transition-all"
                        title="Edit Department"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepartment(department);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Delete Department"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Faculty:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {department.faculty_id?.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(department.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <Table
                data={departments}
                columns={columns}
                loading={loading}
                emptyText="No departments found"
                onRowClick={(record) => navigate(`/departments/${record.id || record._id}`)}
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
                Showing <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span> to <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                  {pagination.total}
                </span> results
              </div>
              
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="btn-ghost px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all hover-lift"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover-lift ${
                          pagination.page === pageNum
                            ? 'bg-university-gold-200 dark:bg-university-gold-800 text-university-gold-800 dark:text-university-gold-200 border-2 border-university-gold-400 dark:border-university-gold-600'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Department Details"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                View Department Information
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access detailed department profile
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              View detailed information for <strong>{selectedDepartment?.name || 'Unknown'}</strong>?
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Department Name:</strong> {selectedDepartment?.name || 'N/A'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Department Code:</strong> {selectedDepartment?.code || 'N/A'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Faculty:</strong> {selectedDepartment?.faculty_id?.name || 'N/A'}
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
                navigate(`/departments/${selectedDepartment?.id || selectedDepartment?._id}`);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Department"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Edit className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Edit Department Information
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Modify department details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              Edit information for <strong>{selectedDepartment?.name || 'Unknown'}</strong>?
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Department Name:</strong> {selectedDepartment?.name || 'N/A'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Department Code:</strong> {selectedDepartment?.code || 'N/A'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Faculty:</strong> {selectedDepartment?.faculty_id?.name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowEditModal(false);
                navigate(`/departments/${selectedDepartment?.id || selectedDepartment?._id}/edit`);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Department
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Department"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DepartmentsTable;