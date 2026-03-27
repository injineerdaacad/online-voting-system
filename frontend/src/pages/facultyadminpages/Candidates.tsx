import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Award, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { candidateService } from '../../services';

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
    full_name: string;
    faculty_id?: {
      _id: string;
      name: string;
    };
  };
  election?: {
    _id: string;
    title: string;
    status: string;
  };
  createdAt: string;
}

const CandidatesTable: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const columns = [
    {
      key: 'candidate',
      title: 'Candidate',
      render: (value: any, record: Candidate) => {
        const name = record.student?.full_name || 'Unknown';
        return (
          <div className="flex items-center">
            {record.photo_url || record.student?.photo_url ? (
              <img 
                src={record.photo_url || record.student?.photo_url || '/images/user/user-01.jpg'} 
                alt={name}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('svg')) {
                    const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    userIcon.setAttribute('class', 'h-5 w-5 text-university-gold-700');
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
                    parent.className = 'h-10 w-10 rounded-full bg-university-gold-100 flex items-center justify-center';
                  }
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-university-gold-100 flex items-center justify-center">
                <User className="h-5 w-5 text-university-gold-700" />
              </div>
            )}
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {record.position}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'election',
      title: 'Election',
      render: (value: any, record: Candidate) => record.election?.title || 'N/A',
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
        <div className="flex items-center">
          <Award className="h-4 w-4 text-university-gold-500 mr-1" />
          <span className="font-medium">{record.vote_count || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Candidate) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/candidates/${record.id || record._id || record.candidate_id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/candidates/${record.id || record._id || record.candidate_id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedCandidate(record);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getCandidates();
      const mappedCandidates: Candidate[] = (response.data || []).map((candidate: any) => ({
        ...candidate,
        id: candidate.id || candidate._id,
        _id: candidate._id || candidate.id,
        election: candidate.election ? {
          _id: candidate.election._id || candidate.election.id,
          title: candidate.election.title,
          status: candidate.election.status || 'active'
        } : undefined
      }));
      setCandidates(mappedCandidates);
    } catch (error) {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async () => {
    if (!selectedCandidate) return;
    
    try {
      await candidateService.deleteCandidate(selectedCandidate.id || selectedCandidate._id || selectedCandidate.candidate_id || '');
      setShowDeleteModal(false);
      setSelectedCandidate(null);
      fetchCandidates();
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidate Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage election candidates
          </p>
        </div>
        <Button
          onClick={() => navigate('/candidates/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Candidate
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table
          data={candidates}
          columns={columns}
          loading={loading}
          emptyText="No candidates found in the database"
          hoverable
          striped
        />
      </div>

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

export default CandidatesTable;