import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { ElectionModal } from '../../components';
import { electionService } from '../../services';
import type { Election } from '../../services/electionService';
import { formatDateTime } from '../../utils/formatters';

const ElectionsTable: React.FC = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const columns = [
    {
      key: 'title',
      title: 'Election',
      render: (_value: any, record: Election) => (
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
      render: (_value: any, record: Election) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {record.type || 'N/A'}
        </div>
      ),
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (_value: any, record: Election) => {
        const faculty = record.faculty || (record as any).faculty_id;
        return faculty?.name || 'All Faculties';
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (_value: any, record: Election) => {
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
      render: (_value: any, record: Election) => {
        const startDate = record.startDate || (record as any).start_time || null;
        const endDate = record.endDate || (record as any).end_time || null;
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
      render: (_value: any, record: Election) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/elections/${record.id || (record as any)._id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedElection(record);
              setShowEditModal(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedElection(record);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionService.getElections();
      const electionsData = response.data || [];
      
      setElections(electionsData as Election[]);
    } catch (error: any) {
      console.error('Error fetching elections:', error);
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleDelete = async () => {
    if (!selectedElection) return;
    
    try {
      await electionService.deleteElection(selectedElection.id || (selectedElection as any)._id || '');
      setShowDeleteModal(false);
      setSelectedElection(null);
      fetchElections();
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Election Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage voting elections
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Election
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto scrollbar-thin scrollbar-thumb-university-gold-300 scrollbar-track-gray-100 dark:scrollbar-thumb-university-gold-600 dark:scrollbar-track-gray-800 mb-0">
        <Table
          data={elections}
          columns={columns}
          loading={loading}
          emptyText="No elections found in the database"
          hoverable
          striped
          onRowClick={(record) => {
            navigate(`/elections/${record.id || (record as any)._id}`);
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
        electionId={selectedElection?.id || (selectedElection as any)?._id}
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
  );
};

export default ElectionsTable;