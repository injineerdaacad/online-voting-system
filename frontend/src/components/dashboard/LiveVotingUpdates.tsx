import React, { useState, useEffect } from 'react';
import { useSocketIO } from '../../context/SocketIOContext';
import { Vote, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface VoteCastData {
  electionId: string;
  electionTitle: string;
  candidateId: string;
  candidateName: string;
  voterId: string;
  voterName: string;
  timestamp: string;
}

interface ElectionResultsData {
  electionId: string;
  electionTitle: string;
  totalVotes: number;
  results: Array<{
    candidateId: string;
    candidateName: string;
    votes: number;
    percentage: number;
  }>;
  timestamp: string;
}

const LiveVotingUpdates: React.FC = () => {
  const { isConnected, subscribe } = useSocketIO();
  const [recentVotes, setRecentVotes] = useState<VoteCastData[]>([]);
  const [electionUpdates, setElectionUpdates] = useState<ElectionResultsData[]>([]);
  const [totalVotesToday, setTotalVotesToday] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeVoteCast = subscribe('vote_cast', (data: VoteCastData) => {
      setRecentVotes(prev => [data, ...prev.slice(0, 9)]);
      setTotalVotesToday(prev => prev + 1);
    });

    const unsubscribeElectionResults = subscribe('election_results_update', (data: ElectionResultsData) => {
      setElectionUpdates(prev => [data, ...prev.slice(0, 4)]);
    });

    return () => {
      unsubscribeVoteCast();
      unsubscribeElectionResults();
    };
  }, [isConnected, subscribe]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Live Voting Updates
        </h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Live</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Vote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Votes Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVotesToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Elections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(recentVotes.map(v => v.electionId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentVotes.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Votes
          </h3>
        </div>
        <div className="p-4">
          {recentVotes.length === 0 ? (
            <div className="text-center py-8">
              <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent votes</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Votes will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVotes.map((vote, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Vote className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vote.voterName} voted for {vote.candidateName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {vote.electionTitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(vote.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Election Results Updates
          </h3>
        </div>
        <div className="p-4">
          {electionUpdates.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent updates</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Election results will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {electionUpdates.map((update, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {update.electionTitle}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(update.timestamp)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {update.results.slice(0, 3).map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {result.candidateName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${result.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                            {result.votes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveVotingUpdates;