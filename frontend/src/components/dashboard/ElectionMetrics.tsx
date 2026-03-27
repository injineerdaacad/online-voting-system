import React from 'react';
import { Vote, Users, Clock, TrendingUp } from 'lucide-react';

interface ElectionMetricsProps {
  totalElections: number;
  activeElections: number;
  totalVotes: number;
  participationRate: number;
}

const ElectionMetrics: React.FC<ElectionMetricsProps> = ({
  totalElections,
  activeElections,
  totalVotes,
  participationRate,
}) => {
  const metrics = [
    {
      title: 'Total Elections',
      value: totalElections,
      icon: Vote,
      color: 'text-university-gold-500',
      bgColor: 'bg-university-gold-100',
    },
    {
      title: 'Active Elections',
      value: activeElections,
      icon: Clock,
      color: 'text-university-blue-500',
      bgColor: 'bg-university-blue-100',
    },
    {
      title: 'Total Votes',
      value: totalVotes.toLocaleString(),
      icon: Users,
      color: 'text-university-red-500',
      bgColor: 'bg-university-red-100',
    },
    {
      title: 'Participation Rate',
      value: `${participationRate}%`,
      icon: TrendingUp,
      color: 'text-university-pink-500',
      bgColor: 'bg-university-pink-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ElectionMetrics;