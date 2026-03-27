import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar, Shield, Phone, Building, UserCheck, Clock, Edit, GraduationCap, Hash, AlertCircle, CheckCircle, XCircle, RefreshCw, TrendingUp, Settings, Plus, Eye, ArrowRight } from 'lucide-react';
import userService, { User as UserType } from '../../services/userService';
import EditProfileModal from '../../components/user/EditProfileModal';
import { USER_ROLES } from '../../utils/constants';

const UserProfiles: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(authUser as any);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const hasFetchedRef = useRef(false);

  const hasAccess = useCallback(() => {
    if (!authUser) {
      return false;
    }
    
    if (!authUser.role) {
      return true;
    }
    
    if (authUser.role === USER_ROLES.SUPER_ADMIN) return true;
    
    if (authUser.role === USER_ROLES.FACULTY_ADMIN) return true;
    
    return true;
  }, [authUser]);

  const fetchUserDetails = async (showRefreshIndicator = false) => {
    if (!authUser?.id && !authUser?._id) return;
    
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (!showRefreshIndicator) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const userDetails = await userService.getCurrentUserProfile();
      setUser(userDetails);
      setLastUpdated(new Date());
    } catch (error) {
      setUser(authUser as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authUser && hasAccess() && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUserDetails();
    }
  }, [authUser]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUser: UserType) => {
    setUser(updatedUser);
    setLastUpdated(new Date());
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      fetchUserDetails(true);
    }, 500);
  };

  const handleManualRefresh = () => {
    fetchUserDetails(true);
  };

  const getUserName = () => {
    return user?.full_name || user?.name || authUser?.full_name || authUser?.name || 'Unknown User';
  };

  const getUserEmail = () => {
    return user?.email || authUser?.email || 'No email provided';
  };

  const getUserPhone = () => {
    return user?.phone || authUser?.phone || 'No phone provided';
  };

  const getUserRole = () => {
    return user?.role || authUser?.role || 'Unknown Role';
  };

  const getUserFaculty = () => {
    if (user?.faculty_id?.name) return user.faculty_id.name;
    if (user?.faculty?.name) return user.faculty.name;
    if (authUser?.faculty_id?.name) return authUser.faculty_id.name;
    if (authUser?.faculty?.name) return authUser.faculty.name;
    return 'Not assigned';
  };

  const getUserDepartment = () => {
    if (user?.department?.name) return user.department.name;
    if (authUser?.department?.name) return authUser.department.name;
    return 'Not assigned';
  };

  const getUserStatus = () => {
    return user?.status || authUser?.status || 'Unknown';
  };

  const getMemberSince = () => {
    return user?.createdAt || authUser?.createdAt;
  };

  const getLastLogin = () => {
    return user?.last_login || authUser?.last_login;
  };

  const getLastLogout = () => {
    return user?.last_logout || authUser?.last_logout;
  };

  const getLoginAttempts = () => {
    return user?.login_attempts || user?.attempt_login || authUser?.attempt_login || 0;
  };

  const getAccountLocked = () => {
    return user?.account_locked || user?.is_locked || authUser?.is_locked ? 'Yes' : 'No';
  };

  const getOnlineStatus = () => {
    return user?.is_login ? 'Online' : 'Offline';
  };

  const getOnlineStatusColor = () => {
    return user?.is_login ? 'text-green-600' : 'text-gray-500';
  };

  const getLastSeen = () => {
    return user?.last_seen || user?.last_login || user?.updatedAt;
  };

  const isAccountLocked = () => {
    return user?.is_locked || authUser?.is_locked || false;
  };

  const getRoleSpecificInfo = () => {
    if (!user) return null;

    switch (user.role) {
      case USER_ROLES.SUPER_ADMIN:
        return {
          title: 'Super Administrator',
          description: 'Full system access and control',
          icon: Shield,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case USER_ROLES.FACULTY_ADMIN:
        return {
          title: 'Faculty Administrator',
          description: `Administrator for ${user.faculty_id?.name || 'Faculty'}`,
          icon: Building,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case USER_ROLES.STUDENT:
        return {
          title: 'Student',
          description: `${user.department?.name || 'Department'} Student`,
          icon: GraduationCap,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      default:
        return null;
    }
  };

  const getStatusInfo = () => {
    if (!user) return null;

    const isOnline = user.is_login;
    const isLocked = user.account_locked || user.is_locked;
    const attemptLogin = user.login_attempts || user.attempt_login || 0;

    if (isLocked) {
      return {
        status: 'Locked',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        description: 'Account is locked due to security reasons'
      };
    }

    if (attemptLogin > 3) {
      return {
        status: 'Warning',
        icon: AlertCircle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        description: 'Multiple failed login attempts detected'
      };
    }

    if (isOnline) {
      return {
        status: 'Online',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        description: 'Currently active and online'
      };
    }

    return {
      status: 'Offline',
      icon: Clock,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      description: `Last seen ${formatDateTime(getLastSeen())}`
    };
  };

  if (!authUser) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Access Restricted
              </h3>
              <p className="text-red-600 dark:text-red-400">
                Only Super Admins and Faculty Admins can access their profile pages.
              </p>
              <p className="text-sm text-red-500 dark:text-red-300 mt-2">
                Your role: {authUser?.role || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          </div>
          <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleSpecificInfo();
  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a017' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-amber-600 dark:from-white dark:via-blue-100 dark:to-amber-400 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                Manage your account information
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-50"
                title={refreshing ? 'Refreshing...' : loading ? 'Loading...' : 'Refresh profile data'}
              >
                <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${(refreshing || loading) ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {roleInfo && (
            <div className="group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-red-100 transition-all duration-300 group-hover:scale-110">
                    <roleInfo.icon className={`h-6 w-6 ${roleInfo.color} transition-colors duration-300`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Role
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {roleInfo.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          )}
          
          {statusInfo && (
            <div className="group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100 transition-all duration-300 group-hover:scale-110">
                    <statusInfo.icon className={`h-6 w-6 ${statusInfo.color} transition-colors duration-300`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statusInfo.status}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden mb-8">
          
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl">
                  {(user as any)?.photo_url ? (
                    <img
                      src={(user as any).photo_url}
                      alt={`${(user as any)?.full_name || user?.name || 'User'} profile`}
                      className="h-full w-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg class="h-14 w-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                        }
                      }}
                    />
                  ) : (
                    <User className="h-14 w-14 text-white" />
                  )}
                </div>
                
                <div className={`absolute bottom-2 right-2 h-7 w-7 rounded-full border-3 border-white ${
                  getOnlineStatus() === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  {getUserName()}
                </h1>
                <p className="text-blue-100 text-lg mb-4">
                  @{user?.username || user?.student_id || 'username'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                    {user?.role || 'Unknown Role'}
                  </span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    getOnlineStatus() === 'Online' 
                      ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                      : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
                  }`}>
                    {getOnlineStatus()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEditProfile}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Edit className="h-5 w-5" />
                <span className="font-semibold">Edit Profile</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                  <User className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-slate-900 dark:text-white font-medium">{getUserEmail()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="text-slate-900 dark:text-white font-medium">{getUserPhone()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</p>
                      <p className="text-slate-900 dark:text-white font-medium">{getUserRole()}</p>
                    </div>
                  </div>

                  {user?.student_id && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                      <Hash className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Student ID</p>
                        <p className="text-slate-900 dark:text-white font-medium">{user.student_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-3 text-green-600 dark:text-green-400" />
                  Academic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Building className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Faculty</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {getUserFaculty()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Building className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Department</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {getUserDepartment()}
                      </p>
                    </div>
                  </div>

                  {user?.batch && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                      <GraduationCap className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Batch</p>
                        <p className="text-slate-900 dark:text-white font-medium">{user.batch}</p>
                      </div>
                    </div>
                  )}

                  {user?.graduation_year && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Graduation Year</p>
                        <p className="text-slate-900 dark:text-white font-medium">{user.graduation_year}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-purple-600 dark:text-purple-400" />
                  Account Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</p>
                      <p className="text-slate-900 dark:text-white font-medium">{formatDate(user?.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Login</p>
                      <p className="text-slate-900 dark:text-white font-medium">{formatDateTime(user?.last_login)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Logout</p>
                      <p className="text-slate-900 dark:text-white font-medium">{formatDateTime(user?.last_logout)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                    <UserCheck className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</p>
                      <p className="text-slate-900 dark:text-white">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user?.status === 'Active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {user?.status || 'N/A'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-3 text-orange-600 dark:text-orange-400" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.created_by && (
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                <User className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created By</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {user.created_by.username || user.created_by.email || 'N/A'}
                  </p>
                </div>
              </div>
            )}
              
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Login Attempts</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {getLoginAttempts()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Locked</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {getAccountLocked()}
                </p>
              </div>
            </div>

            {user?.attempt_login_time && (
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Failed Login</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {formatDateTime(user.attempt_login_time)}
                  </p>
                </div>
              </div>
            )}

            {user?.updated_by && (
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-600/50 rounded-xl">
                <User className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated By</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {user.updated_by.username || user.updated_by.email || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Updated</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Powered by</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Somalia National University</span>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={user}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default UserProfiles;