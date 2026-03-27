import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Check, X, Users, TrendingUp, Filter, Search, GraduationCap, BarChart3, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { userService } from '../../services';
import { USER_STATUS } from '../../utils/constants';

interface Student {
  id?: string;
  _id?: string;
  full_name?: string;
  student_id?: string;
  email: string;
  phone?: string;
  status: string;
  faculty_id?: {
    _id?: string;
    id?: string;
    name: string;
    code?: string;
  };
  department?: {
    _id?: string;
    id?: string;
    name: string;
  };
  has_voted?: any[];
  createdAt?: string;
}

const StudentsTable: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    faculty: ''
  });

  const columns = [
    {
      key: 'name',
      title: 'Student',
      render: (value: any, record: Student) => {
        const displayName = record.full_name || record.student_id || 'Unknown';
        const photoUrl = (record as any).photo_url;
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-university-blue-100 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${displayName} profile`}
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
                {displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {record.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'student_id',
      title: 'Student ID',
      dataIndex: 'student_id',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'faculty',
      title: 'Faculty',
      render: (value: any, record: Student) => record.faculty_id?.name || 'N/A',
    },
    {
      key: 'department',
      title: 'Department',
      render: (value: any, record: Student) => record.department?.name || 'N/A',
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (value: string) => (
        <Badge variant={value === USER_STATUS.ACTIVE ? 'success' : 'error'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'voted',
      title: 'Voted',
      render: (value: any, record: Student) => {
        const hasVoted = record.has_voted && record.has_voted.length > 0;
        return hasVoted ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-gray-400" />
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, record: Student) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/students/${record.id || record._id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/students/${record.id || record._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedStudent(record);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await userService.getStudents();
      const mappedStudents: Student[] = (response.data || []).map((user: any) => ({
        ...user,
        id: user.id || user._id,
        _id: user._id || user.id,
        department: user.department ? {
          _id: user.department._id || user.department.id,
          id: user.department.id || user.department._id,
          name: user.department.name
        } : undefined
      }));
      setStudents(mappedStudents);
    } catch (error) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async () => {
    if (!selectedStudent) return;
    
    try {
      await userService.deleteUser(selectedStudent.id || selectedStudent._id || '');
      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student accounts
          </p>
        </div>
        <Button
          onClick={() => navigate('/students/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Student
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto scrollbar-thin scrollbar-thumb-university-gold-300 scrollbar-track-gray-100 dark:scrollbar-thumb-university-gold-600 dark:scrollbar-track-gray-800">
        <Table
          data={students}
          columns={columns}
          loading={loading}
          emptyText="No students found in the database"
          hoverable
          striped
        />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Student"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{selectedStudent?.full_name || selectedStudent?.student_id}</strong>? 
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

export default StudentsTable;