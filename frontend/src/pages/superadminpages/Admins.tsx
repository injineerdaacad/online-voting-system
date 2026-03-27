import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock, Unlock, Eye, Search, Filter, Users, TrendingUp, Shield, Building, Mail, Phone, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Modal, Table, Badge, AddEditForm } from '../../components';
import { userService, facultyService } from '../../services';
import { USER_ROLES, USER_STATUS } from '../../utils/constants';
import type { User, UserFilters, PaginatedResponse } from '../../services/userService';
import FilterForm, { FilterField } from '../../components/forms/FilterForm';
import type { FormField } from '../../components/forms/AddEditForm';

const AdminTable: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [faculties, setFaculties] = useState<Array<{ _id?: string; id?: string; name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const columns = [
    {
      key: 'no',
      title: '#',
      render: (_value: unknown, _record: User, index: number) => {
        const rowNumber = ((pagination.page - 1) * pagination.limit) + index + 1;
        return (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {rowNumber}
          </span>
        );
      },
    },
    {
      key: 'username',
      title: 'Username',
      dataIndex: 'username' as keyof User,
      render: (_value: string, record: User) => {
        const username = record.username || 'N/A';
        const photoUrl = (record as { photo_url?: string }).photo_url;
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-university-gold-100 dark:bg-university-gold-900/30 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${username} profile`}
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('svg')) {
                      const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      userIcon.setAttribute('class', 'h-5 w-5 text-university-gold-700 dark:text-university-gold-300');
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
                <User className="h-5 w-5 text-university-gold-700 dark:text-university-gold-300" />
              )}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {username}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'full_name',
      title: 'Full Name',
      dataIndex: 'full_name' as keyof User,
      render: (_value: string, record: User) => {
        const displayName = record.full_name || record.name || 'N/A';
        return (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {displayName}
          </div>
        );
      },
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email' as keyof User,
      render: (value: string) => {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {value}
          </div>
        );
      },
    },
    {
      key: 'phone',
      title: 'Phone',
      dataIndex: 'phone' as keyof User,
      render: (value: string) => {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {value || 'N/A'}
          </div>
        );
      },
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role' as keyof User,
      render: (value: string) => (
        <Badge variant="primary">
          {value || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status' as keyof User,
      render: (value: string) => (
        <Badge variant={value === USER_STATUS.ACTIVE ? 'success' : 'error'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      dataIndex: 'faculty' as keyof User,
      render: (_value: unknown, record: User) => {
        const facultyName = record.faculty_id?.name || (record as { faculty?: { name?: string } }).faculty?.name;
        return facultyName || 'N/A';
      },
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataIndex: 'createdAt' as keyof User,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value: unknown, record: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(record);
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
              setSelectedUser(record);
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="Edit Admin"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(record);
              setShowLockModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title={record.status === 'Suspended' ? 'Unlock Admin' : 'Lock Admin'}
          >
            {record.status === 'Suspended' ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Admin"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<User> = await userService.getAdmins({});
      
      let filteredData = response.data;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(user => 
          (user.full_name?.toLowerCase().includes(searchLower)) ||
          (user.name?.toLowerCase().includes(searchLower)) ||
          (user.username?.toLowerCase().includes(searchLower)) ||
          (user.email?.toLowerCase().includes(searchLower)) ||
          (user.phone?.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.status) {
        filteredData = filteredData.filter(user => user.status === filters.status);
      }
      
      if (filters.facultyId) {
        filteredData = filteredData.filter(user => 
          (user.faculty_id?._id === filters.facultyId) || 
          ((user as { faculty?: { id?: string } }).faculty?.id === filters.facultyId)
        );
      }
      
      const totalFiltered = filteredData.length;
      const totalPages = Math.ceil(totalFiltered / pagination.limit);
      
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setUsers(paginatedData);
      setPagination(prev => ({
        ...prev,
        total: totalFiltered,
        totalPages: totalPages,
      }));
    } catch (error: unknown) {
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties((response.data || []) as Array<{ _id?: string; id?: string; name: string }>);
    } catch (error: unknown) {
      setFaculties([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFaculties();
  }, [pagination.page, pagination.limit, filters]);

  const handleDelete = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id ?? (selectedUser as { _id?: string })._id;
    if (!userId) return;
    
    try {
      setActionLoading(true);
      await userService.deleteUser(userId);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id ?? (selectedUser as { _id?: string })._id;
    if (!userId) return;
    
    try {
      setActionLoading(true);
      if (selectedUser.status === USER_STATUS.SUSPENDED) {
        await userService.unlockUser(userId);
      } else {
        await userService.lockUser(userId);
      }
      setShowLockModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
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
                  Admin Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage system administrators and their permissions
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
                  <span className="hidden sm:inline">Add Admin</span>
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
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Admins
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
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+3</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Admins
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {
                    users.filter((user) => user.status === USER_STATUS.ACTIVE)
                      .length
                  }
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
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Stable
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Faculties
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {faculties.length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-200/30 dark:bg-gradient-to-br dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-700/10 border-amber-200/60 dark:border-amber-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 transition-all duration-300 group-hover:scale-110">
                  <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Full Access
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Super Admins
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {
                    users.filter((user) => user.role === USER_ROLES.SUPER_ADMIN)
                      .length
                  }
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
            onClear={() => setFilters({})}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Username, Full Name, Email, Phone...',
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
                icon: <Building className="h-4 w-4" />,
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
                Admin List
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {pagination.total} administrators
                </span>
              </div>
            </div>
          </div>
          
          <div className="block lg:hidden flex-1 overflow-auto px-2">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No admins found
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id || user._id}
                    className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/admins/${user.id || user._id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                          {(user as { photo_url?: string }).photo_url ? (
                            <img
                              src={
                                (user as { photo_url?: string })
                                  .photo_url as string
                              }
                              alt={`${
                                user.full_name ||
                                user.name ||
                                user.username ||
                                "User"
                              } profile`}
                              className="h-full w-full object-cover rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('svg')) {
                                  parent.innerHTML = '';
                                  const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                  userIcon.setAttribute('class', 'h-6 w-6 text-white');
                                  userIcon.setAttribute('fill', 'none');
                                  userIcon.setAttribute('stroke', 'currentColor');
                                  userIcon.setAttribute('viewBox', '0 0 24 24');
                                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                  path.setAttribute('stroke-linecap', 'round');
                                  path.setAttribute('stroke-linejoin', 'round');
                                  path.setAttribute('stroke-width', '2');
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
                            {user.full_name || user.name || "Unknown"}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : user.status === "Suspended"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {user.email}
                        </span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {user.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "Super Admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
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
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Admin"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setShowLockModal(true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === "Suspended"
                            ? "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        }`}
                        title={
                          user.status === "Suspended"
                            ? "Unlock Admin"
                            : "Lock Admin"
                        }
                      >
                        {user.status === "Suspended" ? (
                          <Unlock className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete Admin"
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
                  data={users}
                  columns={columns}
                  loading={loading}
                  emptyText="No admins found"
                  onRowClick={(record) => navigate(`/admins/${record.id}`)}
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
        title="Delete Admin"
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
                {selectedUser?.full_name || selectedUser?.name}
              </strong>
              ?
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Username:{" "}
              <span className="font-medium">{selectedUser?.username}</span>
            </p>
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
              Delete Admin
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        title={
          selectedUser?.status === USER_STATUS.SUSPENDED
            ? "Unlock Admin"
            : "Lock Admin"
        }
      >
        <div className="space-y-6">
          <div
            className={`flex items-center gap-4 p-4 rounded-xl border ${
              selectedUser?.status === USER_STATUS.SUSPENDED
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30"
            }`}
          >
            <div
              className={`p-3 rounded-xl ${
                selectedUser?.status === USER_STATUS.SUSPENDED
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              }`}
            >
              {selectedUser?.status === USER_STATUS.SUSPENDED ? (
                <Unlock className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  selectedUser?.status === USER_STATUS.SUSPENDED
                    ? "text-green-900 dark:text-green-100"
                    : "text-amber-900 dark:text-amber-100"
                }`}
              >
                {selectedUser?.status === USER_STATUS.SUSPENDED
                  ? "Unlock Admin"
                  : "Lock Admin"}
              </h4>
              <p
                className={`text-sm ${
                  selectedUser?.status === USER_STATUS.SUSPENDED
                    ? "text-green-700 dark:text-green-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {selectedUser?.status === USER_STATUS.SUSPENDED
                  ? "Restore admin access"
                  : "Temporarily disable admin access"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to{" "}
              {selectedUser?.status === USER_STATUS.SUSPENDED
                ? "unlock"
                : "lock"}{" "}
              <strong className="text-slate-900 dark:text-white">
                {selectedUser?.full_name || selectedUser?.name}
              </strong>
              ?
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Username:{" "}
              <span className="font-medium">{selectedUser?.username}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowLockModal(false)}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleLockToggle}
              disabled={actionLoading}
              className={`px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                selectedUser?.status === USER_STATUS.SUSPENDED
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {actionLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {selectedUser?.status === USER_STATUS.SUSPENDED
                ? "Unlock Admin"
                : "Lock Admin"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Admin Details"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                View Admin Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access detailed admin profile
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-slate-700 dark:text-slate-300">
              View detailed information for{" "}
              <strong className="text-slate-900 dark:text-white">
                {selectedUser?.full_name || selectedUser?.name}
              </strong>
              ?
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Username:{" "}
              <span className="font-medium">{selectedUser?.username}</span>
            </p>
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
                navigate(`/admins/${selectedUser?.id || selectedUser?._id}`);
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
          setSelectedUser(null);
        }}
        title="Edit Admin"
        size="xl"
        initialData={selectedUser ? {
          full_name: selectedUser.full_name || selectedUser.name || '',
          username: selectedUser.username || '',
          email: selectedUser.email || '',
          phone: selectedUser.phone || '',
          role: selectedUser.role || '',
          faculty_id: selectedUser.faculty_id?._id || selectedUser.faculty_id?.id || (selectedUser as any).faculty?._id || (selectedUser as any).faculty?.id || '',
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
            key: 'username',
            label: 'Username',
            type: 'text',
            placeholder: 'Enter username',
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
            key: 'role',
            label: 'Role',
            type: 'select',
            placeholder: 'Select role',
            required: true,
            options: [
              { value: USER_ROLES.SUPER_ADMIN, label: 'Super Admin' },
              { value: USER_ROLES.FACULTY_ADMIN, label: 'Faculty Admin' },
            ],
          },
          {
            key: 'faculty_id',
            label: 'Faculty',
            type: 'select',
            placeholder: 'Select faculty',
            options: faculties.map((faculty) => ({
              value: faculty._id || faculty.id || '',
              label: faculty.name,
            })),
          },
        ]}
        submitLabel="Update Admin"
        loading={actionLoading}
        onSubmit={async (data) => {
          if (!selectedUser?.id && !selectedUser?._id) return;
          
          try {
            setActionLoading(true);
            const userId = selectedUser.id || selectedUser._id;
            await userService.updateUser(userId, data);
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
          } catch (error: any) {
            console.error('Failed to update admin:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <AddEditForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Admin"
        size="xl"
        fields={[
          {
            key: 'full_name',
            label: 'Full Name',
            type: 'text',
            placeholder: 'Enter full name',
            required: true,
          },
          {
            key: 'username',
            label: 'Username',
            type: 'text',
            placeholder: 'Enter username',
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
            key: 'role',
            label: 'Role',
            type: 'select',
            placeholder: 'Select role',
            required: true,
            options: [
              { value: USER_ROLES.SUPER_ADMIN, label: 'Super Admin' },
              { value: USER_ROLES.FACULTY_ADMIN, label: 'Faculty Admin' },
            ],
          },
          {
            key: 'faculty_id',
            label: 'Faculty',
            type: 'select',
            placeholder: 'Select faculty',
            options: faculties.map((faculty) => ({
              value: faculty._id || faculty.id || '',
              label: faculty.name,
            })),
          },
          {
            key: 'password',
            label: 'Password',
            type: 'password',
            placeholder: 'Enter password (min 6 characters)',
            required: true,
          },
          {
            key: 'confirm_password',
            label: 'Confirm Password',
            type: 'password',
            placeholder: 'Confirm password',
            required: true,
          },
        ]}
        submitLabel="Create Admin"
        loading={actionLoading}
        onSubmit={async (data) => {
          try {
            setActionLoading(true);
            const userData: any = {
              full_name: data.full_name,
              username: data.username,
              email: data.email,
              password: data.password,
              confirm_password: data.confirm_password,
              role: data.role,
            };
            
            if (data.phone) {
              userData.phone = data.phone;
            }
            
            if (data.role === USER_ROLES.FACULTY_ADMIN) {
              if (!data.faculty_id) {
                throw new Error('Faculty Admin must have a faculty assigned');
              }
              userData.faculty_id = data.faculty_id;
            }
            
            await userService.createUser(userData);
            setShowAddModal(false);
            fetchUsers();
          } catch (error: any) {
            console.error('Failed to create admin:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </div>
  );
};

export default AdminTable;