import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Vote, TrendingUp, Calendar, Settings, Plus, Eye, ArrowRight, Building, UserCheck } from 'lucide-react';
import axios from '../../utils/axios';
import { ROUTES, USER_ROLES, API_ENDPOINTS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  facultyStudents: number;
  facultyDepartments: number;
  activeElections: number;
  totalVotes: number;
  facultyCandidates: number;
}

const FacultyAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    facultyStudents: 0,
    facultyDepartments: 0,
    activeElections: 0,
    totalVotes: 0,
    facultyCandidates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentElections, setRecentElections] = useState<any[]>([]);
  const facultyId = user?.faculty_id?._id || user?.faculty_id;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!facultyId) {
        setLoading(false);
        return;
      }

      try {
        const [studentsRes, departmentsRes, electionsRes, candidatesRes] = await Promise.all([
          axios.get(API_ENDPOINTS.USERS.BASE, { params: { role: USER_ROLES.STUDENT, faculty_id: facultyId } }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.DEPARTMENTS.BASE, { params: { faculty_id: facultyId } }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.ELECTIONS.BASE, { params: { faculty_id: facultyId } }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.CANDIDATES.BASE, { params: { faculty_id: facultyId } }).catch(() => ({ data: [] })),
        ]);

        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        const departmentsData = Array.isArray(departmentsRes.data) ? departmentsRes.data : [];
        const electionsData = Array.isArray(electionsRes.data) ? electionsRes.data : [];
        const candidatesData = Array.isArray(candidatesRes.data) ? candidatesRes.data : [];
        
        const activeElections = electionsData.filter((e: any) => e.status === 'Active').length;

        setStats({
          facultyStudents: studentsData.length,
          facultyDepartments: departmentsData.length,
          activeElections,
          totalVotes: 0,
          facultyCandidates: candidatesData.length,
        });

        setRecentElections(electionsData.slice(0, 5));
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [facultyId]);

  const statsCards = [
    {
      title: 'Faculty Students',
      value: loading ? '...' : stats.facultyStudents.toString(),
      change: '+5%',
      changeType: 'positive',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      darkBgColor: 'bg-gradient-to-br from-amber-900/20 to-amber-800/20',
      borderColor: 'border-amber-200',
      darkBorderColor: 'border-amber-800/30',
      onClick: () => navigate(ROUTES.STUDENTS),
    },
    {
      title: 'Departments',
      value: loading ? '...' : stats.facultyDepartments.toString(),
      change: 'Stable',
      changeType: 'neutral',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      darkBgColor: 'bg-gradient-to-br from-blue-900/20 to-blue-800/20',
      borderColor: 'border-blue-200',
      darkBorderColor: 'border-blue-800/30',
      onClick: () => navigate(ROUTES.DEPARTMENTS),
    },
    {
      title: 'Active Elections',
      value: loading ? '...' : stats.activeElections.toString(),
      change: '+2',
      changeType: 'positive',
      icon: Vote,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      darkBgColor: 'bg-gradient-to-br from-green-900/20 to-green-800/20',
      borderColor: 'border-green-200',
      darkBorderColor: 'border-green-800/30',
      onClick: () => navigate(ROUTES.ELECTIONS),
    },
    {
      title: 'Candidates',
      value: loading ? '...' : stats.facultyCandidates.toString(),
      change: '+3',
      changeType: 'positive',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      darkBgColor: 'bg-gradient-to-br from-purple-900/20 to-purple-800/20',
      borderColor: 'border-purple-200',
      darkBorderColor: 'border-purple-800/30',
      onClick: () => navigate(ROUTES.CANDIDATES),
    },
  ];

  return (
    <div className="min-h-screen bg-university-gradient">
      <div className="relative z-10 p-2 sm:p-3 lg:p-4">
        
        <div className="mb-4 sm:mb-6 lg:mb-12">
          <div className="glass rounded-2xl bg-gradient-to-br from-white/90 via-white/95 to-university-blue-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 border border-university-blue-200/20 dark:border-university-blue-800/20 shadow-theme-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                  Faculty Admin Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  {user?.faculty_id?.name || 'Faculty'} Management Overview
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={card.onClick}
                className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer bg-gradient-to-br from-white/90 to-white/95 dark:from-slate-800/90 dark:to-slate-700/90 border-slate-200/60 dark:border-slate-700/40 shadow-lg"
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bgColor} ${card.darkBgColor} transition-all duration-300 group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${card.color} transition-colors duration-300`} />
                    </div>
                    {card.changeType === 'positive' && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{card.change}</span>
                      </div>
                    )}
                    {card.changeType === 'neutral' && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.change}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          
          <div className="xl:col-span-2">
            <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg">
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Faculty Elections
                  </h3>
                  <button 
                    onClick={() => navigate(ROUTES.ELECTIONS)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">New Election</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : recentElections.length > 0 ? (
                  <div className="space-y-4">
                    {recentElections.map((election: any, index: number) => {
                      const statusColors: any = {
                        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                        'Upcoming': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                        'Closed': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
                        'Inactive': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      };
                      
                      return (
                        <div key={election._id || index} className="group p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/80 transition-all duration-200 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {election.title || 'Untitled Election'}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {election.type || 'General'} • {new Date(election.start_time || election.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 ${statusColors[election.status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'} text-xs font-medium rounded-full`}>
                                {election.status || 'Unknown'}
                              </span>
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-lg">No faculty elections</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Create your first election to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="glass rounded-2xl shadow-theme-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg">
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Settings className="h-6 w-6 text-amber-600" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => navigate(ROUTES.STUDENTS)}
                  className="group w-full text-left p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/30 dark:hover:to-amber-800/30 rounded-xl border border-amber-200/50 dark:border-amber-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-600 rounded-lg group-hover:bg-amber-700 transition-colors">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-200">
                        Manage Students
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        View and manage student accounts
                      </p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(ROUTES.DEPARTMENTS)}
                  className="group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        Manage Departments
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Add or edit departments
                      </p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(ROUTES.ELECTIONS)}
                  className="group w-full text-left p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 rounded-xl border border-green-200/50 dark:border-green-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        Create Election
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Set up a new voting process
                      </p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(ROUTES.CANDIDATES)}
                  className="group w-full text-left p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors">
                      <UserCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-800 dark:text-purple-200">
                        Manage Candidates
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        Add or edit candidate information
                      </p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate(ROUTES.RESULTS)}
                  className="group w-full text-left p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30 rounded-xl border border-red-200/50 dark:border-red-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600 rounded-lg group-hover:bg-red-700 transition-colors">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">
                        View Results
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Check election outcomes
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl shadow-theme-lg overflow-hidden border border-university-blue-200/20 dark:border-university-blue-800/20 bg-gradient-to-br from-white/90 to-university-blue-50/90 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All Systems Operational</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Powered by</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Somalia National University</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyAdminDashboard;