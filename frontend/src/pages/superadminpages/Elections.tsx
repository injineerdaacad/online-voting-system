import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Filter, Search, TrendingUp, CheckCircle, Clock, XCircle, BarChart3, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { FilterForm, ElectionModal } from '../../components';
import { electionService, facultyService } from '../../services';
import { ELECTION_STATUS, ELECTION_TYPES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

interface Election {
  id: string;
  _id?: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  start_time?: string;
  end_time?: string;
  faculty?: {
    id: string;
    _id?: string;
    name: string;
  };
  faculty_id?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const ElectionsTable: React.FC = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [allElections, setAllElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [faculties, setFaculties] = useState<Array<{ _id?: string; id?: string; name: string }>>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    facultyId: ''
  });

  const columns = [
    {
      key: 'title',
      title: 'Election',
      render: (value: any, record: Election) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-university-gold-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-university-gold-700" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {record.title}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Election Type',
      render: (value: any, record: Election) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {record.type || 'N/A'}
        </div>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (value: any, record: Election) => {
        if (record.type === ELECTION_TYPES.FACULTY_LEADERSHIP) {
          return record.faculty?.name || record.faculty_id?.name || 'N/A';
        }
        return 'All Faculties';
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (_value: unknown, record: Election) => {
        const value = record.status;
        const variants: any = {
          'Active': 'success',
          'Upcoming': 'primary',
          'Closed': 'secondary',
          'Inactive': 'error',
        };
        return (
          <Badge variant={variants[value] || 'secondary'}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'dates',
      title: 'Duration',
      render: (value: any, record: Election) => {
        const startDate = record.startDate || record.start_time || null;
        const endDate = record.endDate || record.end_time || null;
        
        return (
          <div className="text-sm">
            <div className="text-gray-900 dark:text-white">
              {formatDateTime(startDate) || 'N/A'}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              to {formatDateTime(endDate) || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Election) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/elections/${record.id || record._id}`);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElection(record);
              setShowEditModal(true);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="Edit Election"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElection(record);
              setShowDeleteModal(true);
            }}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Election"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchFaculties = async () => {
    try {
      const response = await facultyService.getFaculties();
      setFaculties((response.data || []) as Array<{ _id?: string; id?: string; name: string }>);
    } catch (error) {
      setFaculties([]);
    }
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionService.getElections();
      const allData = response.data || [];
      setAllElections(allData);
      applyFilters(allData);
    } catch (error: any) {
      console.error('Error fetching elections:', error);
      setAllElections([]);
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: Election[]) => {
    let filtered = [...data];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((election) =>
        election.title?.toLowerCase().includes(searchLower) ||
        election.type?.toLowerCase().includes(searchLower) ||
        election.faculty?.name?.toLowerCase().includes(searchLower) ||
        (election as any).faculty_id?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((election) => election.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((election) => election.type === filters.type);
    }

    if (filters.facultyId) {
      filtered = filtered.filter((election) => {
        const facultyId = election.faculty?._id || election.faculty?.id || election.faculty_id?._id;
        return facultyId === filters.facultyId;
      });
    }

    setElections(filtered);
  };

  useEffect(() => {
    fetchElections();
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (allElections.length > 0 || filters.search || filters.status || filters.type || filters.facultyId) {
      applyFilters(allElections);
    }
  }, [filters, allElections]);

  const stats = useMemo(() => {
    const total = allElections.length;
    const active = allElections.filter((e) => e.status === 'Active').length;
    const upcoming = allElections.filter((e) => e.status === 'Upcoming').length;
    const closed = allElections.filter((e) => e.status === 'Closed').length;
    const thisMonth = allElections.filter((e) => {
      const created = new Date(e.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return { total, active, upcoming, closed, thisMonth };
  }, [allElections]);

  const handleDelete = async () => {
    if (!selectedElection) return;
    
    try {
      await electionService.deleteElection(selectedElection.id || selectedElection._id || '');
      setShowDeleteModal(false);
      setSelectedElection(null);
      fetchElections();
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-university-gradient">
      <div className="relative z-10 p-2 sm:p-3 lg:p-4 pb-0 mb-0 !mb-0">
        
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="glass rounded-2xl bg-gradient-to-br from-white/90 via-white/95 to-university-gold-50/90 dark:from-slate-800/90 dark:via-slate-800/95 dark:to-slate-700/90 border border-university-gold-200/20 dark:border-university-gold-800/20 shadow-theme-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-university">
                  Election Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                  Manage voting elections
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
                  <span className="hidden sm:inline">Create Election</span>
                  <span className="sm:hidden">Create</span>
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
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-colors duration-300" />
              </div>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{stats.thisMonth}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Total Elections
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30 dark:bg-gradient-to-br dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/10 border-green-200/60 dark:border-green-800/40 shadow-lg">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 transition-all duration-300 group-hover:scale-110">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 transition-colors duration-300" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Active Elections
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.active}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:bg-gradient-to-br dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-700/10 border-blue-200/60 dark:border-blue-800/40 shadow-lg">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 transition-all duration-300 group-hover:scale-110">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Upcoming
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.upcoming}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-200/30 dark:bg-gradient-to-br dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-700/10 border-gray-200/60 dark:border-gray-800/40 shadow-lg">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900/30 transition-all duration-300 group-hover:scale-110">
                <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400 transition-colors duration-300" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Closed
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.closed}
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
          onClear={() => setFilters({ search: '', status: '', type: '', facultyId: '' })}
          fields={[
            {
              key: 'search',
              label: 'Search',
              type: 'text',
              placeholder: 'Title, Type, Description...',
              icon: <Search className="h-4 w-4" />,
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Inactive', label: 'Inactive' },
              ],
            },
            {
              key: 'type',
              label: 'Type',
              type: 'select',
              options: Object.values(ELECTION_TYPES).map((type) => ({
                value: type,
                label: type,
              })),
            },
            {
              key: 'facultyId',
              label: 'Faculty',
              type: 'select',
              icon: <Calendar className="h-4 w-4" />,
              options: faculties.map((faculty) => ({
                value: faculty._id || faculty.id || '',
                label: faculty.name,
              })),
            },
          ]}
        />
      )}

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden mb-0 !mb-0">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Calendar className="h-6 w-6 text-university-gold-600 dark:text-university-gold-400" />
                Election List
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {elections.length} {elections.length === 1 ? 'election' : 'elections'}
                </span>
              </div>
            </div>
          </div>
          <Table
            data={elections}
            columns={columns}
            loading={loading}
            emptyText={
              allElections.length === 0
                ? "No elections found in the database. Click 'Create Election' to add your first election."
                : "No elections match your filters. Try adjusting your search criteria."
            }
            hoverable
            striped
            onRowClick={(record) => {
              navigate(`/elections/${record.id || record._id}`);
            }}
          />
        </div>

      <ElectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="create"
        onSuccess={() => {
          fetchElections();
        }}
      />

      <ElectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedElection(null);
        }}
        mode="edit"
        electionId={selectedElection?.id || selectedElection?._id}
        onSuccess={() => {
          fetchElections();
        }}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Election"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              Are you sure you want to delete this election?
            </p>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                {selectedElection?.title}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action cannot be undone and will permanently delete all associated candidates and votes.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
    </div>
  );
};

export default ElectionsTable;