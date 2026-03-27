import React from 'react';
import { Users, GraduationCap, Building } from 'lucide-react';

interface DemographicData {
  totalUsers: number;
  students: number;
  faculty: number;
  departments: number;
}

interface DemographicCardProps {
  data: DemographicData;
}

const DemographicCard: React.FC<DemographicCardProps> = ({ data }) => {
  const demographics = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      icon: Users,
      color: 'text-university-gold-500',
      bgColor: 'bg-university-gold-100',
    },
    {
      title: 'Students',
      value: data.students,
      icon: GraduationCap,
      color: 'text-university-blue-500',
      bgColor: 'bg-university-blue-100',
    },
    {
      title: 'Faculty',
      value: data.faculty,
      icon: Building,
      color: 'text-university-red-500',
      bgColor: 'bg-university-red-100',
    },
    {
      title: 'Departments',
      value: data.departments,
      icon: Building,
      color: 'text-university-pink-500',
      bgColor: 'bg-university-pink-100',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Demographics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {demographics.map((demo, index) => {
          const Icon = demo.icon;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${demo.bgColor}`}>
                <Icon className={`h-5 w-5 ${demo.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {demo.title}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {demo.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemographicCard;