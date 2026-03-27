import React from 'react';
import Button from '../../ui/Button';

const FacultiesTable: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
    <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Faculty Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage university faculties
          </p>
        </div>
        <Button>Add Faculty</Button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Faculties table will be implemented here</p>
      </div>
    </div>
  );
};

export default FacultiesTable;