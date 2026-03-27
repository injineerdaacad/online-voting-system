import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Unlock, 
  Eye, 
  Search, 
  Filter, 
  Users, 
  Shield, 
  Clock, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Calendar,
  X,
  CheckCircle,
  User
} from 'lucide-react';
import { FilterForm, Button, Modal, Table, Badge } from '../../components';
import { userService } from '../../services';
import axios from '../../utils/axios';
import type { User, UserFilters } from '../../services/userService';
import { useSocketIO } from '../../context/SocketIOContext';

const LockedAdminsTable: React.FC = () => {
  const navigate = useNavigate();
  const { subscribe } = useSocketIO();
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
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);

  const columns = [
    {
      key: 'index',
      title: '#',
      dataIndex: 'index' as keyof User,
      render: (value: any, record: User, index: number) => (
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {index + 1}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Administrator',
      dataIndex: 'name' as keyof User,
      render: (value: string, record: User) => {
        const displayName = record.name || record.full_name || 'Unknown';
        const photoUrl = (record as any).photo_url;
        
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-university-gold-100 to-university-gold-200 dark:from-university-gold-900/30 dark:to-university-gold-800/30 flex items-center justify-center overflow-hidden shadow-md border-2 border-university-gold-300 dark:border-university-gold-700">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${displayName} profile`}
                    className="h-full w-full object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('svg')) {
                        const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        userIcon.setAttribute('class', 'h-6 w-6 text-university-gold-700 dark:text-university-gold-400');
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
                  <User className="h-6 w-6 text-university-gold-700 dark:text-university-gold-400" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-university-red-500 border-2 border-white dark:border-slate-800 shadow-sm">
                <Lock className="h-2 w-2 text-white m-auto mt-0.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <span></span>
                {record.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      title: 'Role & Access',
      dataIndex: 'role' as keyof User,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            value === 'super-admin' 
              ? 'bg-university-gold-100 dark:bg-university-gold-900/30' 
              : 'bg-university-blue-100 dark:bg-university-blue-900/30'
          }`}>
            <Shield className={`h-4 w-4 ${
              value === 'super-admin'
                ? 'text-university-gold-700 dark:text-university-gold-400'
                : 'text-university-blue-700 dark:text-university-blue-400'
            }`} />
          </div>
          <div>
            <Badge variant={value === 'super-admin' ? 'primary' : 'secondary'}>
              {value === 'super-admin' ? 'Super Admin' : 'Faculty Admin'}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Account Status',
      dataIndex: 'status' as keyof User,
      render: (value: string) => (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-university-red-50 dark:bg-university-red-900/20 border border-university-red-200 dark:border-university-red-800">
          <div className="h-2 w-2 rounded-full bg-university-red-500 animate-pulse" />
          <span className="text-sm font-medium text-university-red-700 dark:text-university-red-400">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      dataIndex: 'faculty' as keyof User,
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-university-blue-600 dark:text-university-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {value?.name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Locked Since',
      dataIndex: 'createdAt' as keyof User,
      render: (value: string) => {
        const date = new Date(value);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4 text-gray-400" />
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: User) => {
        const isLocked = record.is_locked === true || 
                        record.status === 'Suspended' || 
                        record.status === 'suspended' ||
                        record.status === 'INACTIVE' ||
                        record.status === 'Inactive' ||
                        (record.status && record.status.toLowerCase().includes('suspend'));
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(record);
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
                setSelectedUser(record);
                if (isLocked) {
                  setShowUnlockModal(true);
                } else {
                  setShowUnlockModal(true);
                }
              }}
              className={`min-w-[120px] px-4 py-2.5 rounded-lg shadow-md hover:shadow-xl transition-all hover-lift inline-flex items-center justify-center gap-2.5 text-white font-semibold ${
                isLocked
                  ? 'bg-gradient-to-r from-university-gold-600 to-university-gold-700 hover:from-university-gold-700 hover:to-university-gold-800'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
              title={isLocked ? "Unlock Account" : "Lock Account"}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-6 w-6 flex-shrink-0" strokeWidth={3.5} style={{ color: '#000000', stroke: '#000000' }} />
                  <span className="text-base font-extrabold whitespace-nowrap" style={{ color: '#000000', fontWeight: '900' }}>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="h-6 w-6 flex-shrink-0" strokeWidth={3.5} style={{ color: '#000000', stroke: '#000000' }} />
                  <span className="text-base font-extrabold whitespace-nowrap" style={{ color: '#000000', fontWeight: '900' }}>Lock</span>
                </>
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('/api/faculties');
      const facultiesData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setFaculties(facultiesData);
    } catch (error) {
      setFaculties([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await userService.getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      let allUsers = [];
      if (Array.isArray(response)) {
        allUsers = response;
      } else if (response.data && Array.isArray(response.data)) {
        allUsers = response.data;
      } else {
        allUsers = [];
      }
      
      let lockedUsers = allUsers.filter(user => {
        const isAdmin = user.role && (
          user.role.toLowerCase().includes('admin') || 
          user.role === 'Super Admin' || 
          user.role === 'Faculty Admin' ||
          user.role === 'super-admin' ||
          user.role === 'faculty-admin'
        );
        
        const isLocked = user.is_locked === true || 
                        user.status === 'Suspended' || 
                        user.status === 'Inactive' ||
                        user.status === 'suspended' ||
                        user.status === 'inactive' ||
                        user.status === 'SUSPENDED' ||
                        user.status === 'INACTIVE' ||
                        (user.status && user.status.toLowerCase().includes('suspend')) ||
                        (user.status && user.status.toLowerCase().includes('inactive'));
        
        return isAdmin && isLocked;
      });

      if (filters.search && filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        
        lockedUsers = lockedUsers.filter(user => 
          (user.full_name?.toLowerCase().includes(searchLower)) ||
          (user.name?.toLowerCase().includes(searchLower)) ||
          (user.username?.toLowerCase().includes(searchLower)) ||
          (user.email?.toLowerCase().includes(searchLower)) ||
          (user.phone?.toLowerCase().includes(searchLower))
        );
      }

      if (filters.role && filters.role.trim()) {
        lockedUsers = lockedUsers.filter(user => {
          const userRole = (user.role || '').toLowerCase();
          const filterRole = filters.role!.toLowerCase();
          
          if (filterRole === 'super-admin') {
            return userRole === 'super admin' || userRole === 'super-admin' || userRole === 'Super Admin';
          } else if (filterRole === 'faculty-admin') {
            return userRole === 'faculty admin' || userRole === 'faculty-admin' || userRole === 'Faculty Admin';
          } else {
            return userRole.includes(filterRole);
          }
        });
      }

      if (filters.facultyId && filters.facultyId.trim()) {
        
        lockedUsers = lockedUsers.filter(user => 
          (user.faculty_id?._id === filters.facultyId) || 
          ((user as { faculty?: { id?: string } }).faculty?.id === filters.facultyId)
        );
      }
      
      const totalFiltered = lockedUsers.length;
      const totalPages = Math.ceil(totalFiltered / pagination.limit);
      
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedData = lockedUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedData);
      setPagination({
        page: pagination.page,
        limit: pagination.limit,
        total: totalFiltered,
        totalPages: totalPages,
      });
    } catch (error) {
      setUsers([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAccountStatus = (payload: any) => {
      if (!payload) return fetchUsers();
      const type = (payload.type || payload.event || '').toString().toLowerCase();
      if (type.includes('lock') || type.includes('unlock') || type.includes('account_status')) {
        fetchUsers();
      }
    };

    const handleUserUpdate = (payload: any) => {
      if (payload?.user && typeof payload.user.is_locked !== 'undefined') {
        fetchUsers();
      }
    };

    const unsubscribeAccount = subscribe('account_status_update', handleAccountStatus);
    const unsubscribeUser = subscribe('user_update', handleUserUpdate);

    return () => {
      unsubscribeAccount();
      unsubscribeUser();
    };
  }, [subscribe]);

  useEffect(() => {
    fetchUsers();
    fetchFaculties();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, filters.search ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [pagination.page, pagination.limit, filters]);

  const handleUnlock = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await userService.unlockUser(selectedUser.id);
      setShowUnlockModal(false);
      setSelectedUser(null);
      fetchUsers();
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
                      Locked Administrators
                    </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                      Monitor and manage locked admin accounts securely
                    </p>
                  </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => fetchUsers()}
                  disabled={loading}
                  className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover-lift"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover-lift"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters && <X className="h-3 w-3" />}
                </button>
              </div>
            </div>
              </div>
            </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/30 dark:bg-gradient-to-br dark:from-red-900/30 dark:via-red-800/20 dark:to-red-700/10 border-red-200/60 dark:border-red-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 transition-all duration-300 group-hover:scale-110">
                  <Lock className="h-6 w-6 text-red-600 dark:text-red-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Locked
                </span>
              </div>
                    <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Locked
                      </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? "..." : pagination.total}
                      </p>
                    </div>
                    </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-200/30 dark:bg-gradient-to-br dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-700/10 border-amber-200/60 dark:border-amber-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 transition-all duration-300 group-hover:scale-110">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Super
                </span>
            </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Super Admins
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading
                    ? "..."
                    : users.filter(
                        (u) =>
                          u.role === "super-admin" || u.role === "Super Admin"
                      ).length}
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
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Faculty
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Faculty Admins
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading
                    ? "..."
                    : users.filter(
                        (u) =>
                          u.role === "faculty-admin" ||
                          u.role === "Faculty Admin"
                      ).length}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 dark:bg-gradient-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-700/10 border-purple-200/60 dark:border-purple-800/40 shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 transition-all duration-300 group-hover:scale-110">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  This Month
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  This Month
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading
                    ? "..."
                    : users.filter((u) => {
                        const created = new Date(
                          u.createdAt || u.created_at || new Date()
                        );
                        const now = new Date();
                        return (
                          created.getMonth() === now.getMonth() &&
                          created.getFullYear() === now.getFullYear()
                        );
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
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onClear={() => {
              setFilters({});
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            fields={[
              {
                key: 'search',
                label: 'Search',
                type: 'text',
                placeholder: 'Username, Full Name, Email, Phone...',
                icon: <Search className="h-4 w-4" />,
              },
              {
                key: 'facultyId',
                label: 'Faculty',
                type: 'select',
                icon: <GraduationCap className="h-4 w-4" />,
                options: [
                  { value: '', label: 'All Faculties' },
                  ...faculties.map((faculty) => ({
                    value: faculty.id || faculty._id || '',
                    label: `${faculty.name}${faculty.code ? ` (${faculty.code})` : ''}`,
                  })),
                ],
              },
              {
                key: 'role',
                label: 'Role',
                type: 'select',
                icon: <Shield className="h-4 w-4" />,
                options: [
                  { value: '', label: 'All Roles' },
                  { value: 'super-admin', label: 'Super Admin' },
                  { value: 'faculty-admin', label: 'Faculty Admin' },
                ],
              },
            ]}
          />
        )}

        <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg">
          {users.length === 0 && !loading ? (
            <div className="py-16 px-6 text-center animate-fade-in-up">
              <div className="max-w-md mx-auto space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-university-gold-500 to-university-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-8 rounded-full bg-gradient-to-br from-university-gold-100 to-university-blue-100 dark:from-university-gold-900/30 dark:to-university-blue-900/30">
                    <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-success-600 dark:text-success-400" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                    All Clear!
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                    No locked administrator accounts at the moment
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This is great news! All admin accounts are active and
                    accessible.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/admins")}
                    className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover-lift"
                  >
                    <Users className="h-4 w-4" />
                    View All Admins
                  </button>
                  <button
                    onClick={() => fetchUsers()}
                    className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover-lift"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh List
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              
              <div className="px-6 py-4 border-b border-gray-200/50 dark:border-slate-700/50 bg-university-header">
                <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-university-gold-600 dark:text-university-gold-400" />
                    Locked Accounts
                </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {pagination.total}{" "}
                    {pagination.total === 1
                      ? "administrator"
                      : "administrators"}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-university-gold-300 scrollbar-track-gray-100 dark:scrollbar-thumb-university-gold-600 dark:scrollbar-track-gray-800">
                <Table
                  data={users}
                  columns={columns}
                  loading={loading}
                  emptyText="No locked admins found"
                  onRowClick={(record) => navigate(`/admins/${record.id}`)}
                  hoverable
                  striped
                />
              </div>

              {pagination.totalPages > 1 && (
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
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-sm transition-all ${
                                pagination.page === pageNum
                                    ? "bg-university-gold-200 dark:bg-university-gold-800 text-university-gold-800 dark:text-university-gold-200 border-2 border-university-gold-400 dark:border-university-gold-600"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-university-gold-50 dark:hover:bg-university-gold-900/20"
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
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Unlock Administrator Account"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-university-gold-50 dark:bg-university-gold-900/20 border border-university-gold-200 dark:border-university-gold-800">
            <div className="p-2 rounded-lg bg-university-gold-600">
              <Unlock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Unlock Account
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to unlock the account for{" "}
                <span className="font-semibold text-university-gold-700 dark:text-university-gold-400">
                  {selectedUser?.name}
                </span>
                ? This will restore full access to their administrative
                privileges.
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedUser.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <Badge variant="primary">
                  {selectedUser.role === "super-admin"
                    ? "Super Admin"
                    : "Faculty Admin"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Faculty:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(selectedUser.faculty as any)?.name || "N/A"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => setShowUnlockModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUnlock}
              loading={actionLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 !text-black"
            >
              <Unlock className="h-4 w-4 !text-black" style={{ color: '#000000', stroke: '#000000' }} />
              <span className="!text-black" style={{ color: '#000000' }}>Unlock Account</span>
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="View Admin Details"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                View Admin Information
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access detailed admin profile
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              View detailed information for{" "}
              <strong>
                {selectedUser?.name || selectedUser?.full_name || "Unknown"}
              </strong>
              ?
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Username:</strong> {selectedUser?.username || "N/A"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Email:</strong> {selectedUser?.email || "N/A"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Role:</strong> {selectedUser?.role || "N/A"}
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
                navigate(`/admins/${selectedUser?.id || selectedUser?._id}`);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LockedAdminsTable;
