import React from 'react';
import Button from '../../ui/Button';

const CandidatesTable: React.FC = () => {
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
        <Button>Add Candidate</Button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Candidates table will be implemented here</p>
      </div>
    </div>
  );
};

export default CandidatesTable;