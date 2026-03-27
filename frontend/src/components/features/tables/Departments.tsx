import React from 'react';
import Button from '../../ui/Button';

const DepartmentsTable: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
    <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Department Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage university departments
          </p>
        </div>
        <Button>Add Department</Button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Departments table will be implemented here</p>
      </div>
    </div>
  );
};

export default DepartmentsTable;