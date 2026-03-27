import React, { useState, useEffect } from 'react';
import { Download, Trophy, Award, TrendingUp, FileText, Activity, Users, Calendar, Radio, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { electionService, resultService } from '../../services';
import { useSocketIO } from '../../context/SocketIOContext';

interface Election {
  id: string;
  _id?: string;
  title: string;
  type: string;
  status: string;
}

interface Result {
  position: number;
  candidate_id: string;
  candidate_name: string;
  student_name?: string;
  vote_count: number;
  percentage: number;
  photo_url?: string;
}

interface LiveVote {
  candidateName: string;
  position: string;
  voterName: string;
  timestamp: string;
}

const ResultsTable: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [selectedElectionData, setSelectedElectionData] = useState<Election | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [liveVotes, setLiveVotes] = useState<LiveVote[]>([]);
  const { isConnected, subscribe, emit } = useSocketIO();

  const columns = [
    {
      key: 'position',
      title: 'Rank',
      render: (_value: any, record: Result) => (
        <div className="flex items-center">
          {record.position === 1 && <Trophy className="h-5 w-5 text-yellow-500 mr-2" />}
          {record.position === 2 && <Award className="h-5 w-5 text-gray-400 mr-2" />}
          {record.position === 3 && <Award className="h-5 w-5 text-orange-600 mr-2" />}
          <span className="font-bold text-lg">{record.position}</span>
        </div>
      ),
    },
    {
      key: 'candidate',
      title: 'Candidate',
      render: (_value: any, record: Result) => {
        const name = record.student_name || record.candidate_name || 'Unknown';
        return (
          <div className="flex items-center">
            {record.photo_url ? (
              <img 
                src={record.photo_url} 
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
            </div>
          </div>
        );
      },
    },
    {
      key: 'votes',
      title: 'Votes',
      render: (_value: any, record: Result) => (
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-university-blue-500 mr-2" />
          <span className="font-bold text-lg">{record.vote_count}</span>
        </div>
      ),
    },
    {
      key: 'percentage',
      title: 'Percentage',
      render: (_value: any, record: Result) => (
        <div className="flex items-center">
          <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
            <div 
              className="bg-university-gold-500 h-2.5 rounded-full" 
              style={{ width: `${record.percentage}%` }}
            ></div>
          </div>
          <span className="font-semibold">{record.percentage.toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults(selectedElection);
      const electionData = elections.find(e => (e.id || e._id) === selectedElection);
      setSelectedElectionData(electionData || null);
    }
  }, [selectedElection, elections]);

  useEffect(() => {
    if (!isConnected || !selectedElection) return;

    emit('join-election', selectedElection);

    const unsubscribeVoteCast = subscribe('vote_cast', (data: any) => {
      if (data.electionId === selectedElection) {
        setLiveVotes(prev => [{
          candidateName: data.candidateName,
          position: data.position || 'Unknown',
          voterName: data.voterName,
          timestamp: data.timestamp,
        }, ...prev.slice(0, 9)]);
      }
    });

    const unsubscribeResultsUpdate = subscribe('election_results_update', (data: any) => {
      if (data.electionId === selectedElection) {
        const updatedResults = data.results.map((r: any, index: number) => ({
          position: index + 1,
          candidate_id: r.candidateId,
          candidate_name: r.candidateName,
          vote_count: r.votes,
          percentage: r.percentage,
        }));
        setResults(updatedResults);
        setTotalVotes(data.totalVotes || 0);
      }
    });

    return () => {
      unsubscribeVoteCast();
      unsubscribeResultsUpdate();
      emit('leave-election', selectedElection);
    };
  }, [isConnected, selectedElection, subscribe, emit]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionService.getElections();
      const electionsData = response.data || [];
      setElections(electionsData);
      
      if (electionsData.length > 0) {
        const firstElection = electionsData[0];
        setSelectedElection(firstElection.id || (firstElection as any)._id || '');
      }
    } catch (error) {
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (electionId: string) => {
    try {
      setLoadingResults(true);
      const response = await resultService.getElectionResults(electionId);
      
      const resultsData = response.results || [];
      const votes = (response as any).total_votes || response.totalVotes || 0;
      const electionData = response.election;
      
      const formattedResults = Array.isArray(resultsData) 
        ? resultsData.map((r: any, index: number) => ({
            position: r.position || index + 1,
            candidate_id: r.candidate_id || r.id,
            candidate_name: r.candidate_name || r.student?.full_name || r.student_name || 'Unknown',
            student_name: r.student?.full_name || r.student_name || r.candidate_name,
            vote_count: r.vote_count || r.votes || 0,
            percentage: r.percentage || (votes > 0 ? ((r.vote_count || r.votes || 0) / votes) * 100 : 0),
            photo_url: r.photo_url || r.student?.photo_url,
          }))
        : [];
      
      setResults(formattedResults);
      setTotalVotes(votes);
      if (electionData) {
        setSelectedElectionData({
          id: electionData.id,
          title: electionData.title,
          type: electionData.type,
          status: electionData.status,
        });
      }
    } catch (error) {
      setResults([]);
      setTotalVotes(0);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;
    
    const selectedElectionData = elections.find(e => (e.id || e._id) === selectedElection);
    const csvContent = [
      ['Rank', 'Candidate', 'Votes', 'Percentage'],
      ...results.map(r => [
        r.position,
        r.student_name || r.candidate_name,
        r.vote_count,
        r.percentage.toFixed(1) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${selectedElectionData?.title || 'election'}-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Open': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'Scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-university-blue-600" />
            Election Results Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View comprehensive election results and live voting updates
          </p>
        </div>
        <Button
          onClick={handleExport}
          leftIcon={<Download className="h-4 w-4" />}
          disabled={results.length === 0}
        >
          Export Results
        </Button>
      </div>

      {selectedElection && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          isConnected 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center gap-3">
            <Activity className={`h-5 w-5 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            <span className={`font-medium ${isConnected ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
              {isConnected ? 'Live Updates Active' : 'Connecting to Live Updates...'}
            </span>
          </div>
          {isConnected && (
            <span className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Radio className="h-4 w-4 animate-pulse" />
              Real-time
            </span>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-university-blue-600" />
            All Elections
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select an election to view detailed results
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading elections...
            </div>
          ) : elections.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No elections found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elections.map((election) => {
                const electionId = election.id || (election as any)._id || '';
                return (
                  <div
                    key={electionId}
                    onClick={() => setSelectedElection(electionId)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedElection === electionId
                        ? 'border-university-blue-500 bg-university-blue-50 dark:bg-university-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-university-gold-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">
                        {election.title}
                      </h3>
                      <Badge className={getStatusBadge(election.status)}>
                        {election.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-medium">Type:</span>
                        <span>{election.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedElectionData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedElectionData?.title}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={getStatusBadge(selectedElectionData?.status || '')}>
                  {selectedElectionData?.status}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {selectedElectionData?.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedElection && !loadingResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-university-gold-50 to-university-blue-50 dark:from-university-gold-900/20 dark:to-university-blue-900/20 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Votes Cast
                </h3>
                <p className="text-3xl font-bold text-university-gold-700 dark:text-university-gold-400 mt-2">
                  {totalVotes.toLocaleString()}
                </p>
              </div>
              <Users className="h-12 w-12 text-university-gold-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Candidates
                </h3>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                  {results.length}
                </p>
              </div>
              <Award className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Live Votes
                </h3>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">
                  {liveVotes.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recent activity
                </p>
              </div>
              <Activity className="h-12 w-12 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {selectedElection && liveVotes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              Live Voting Activity
            </h3>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {liveVotes.map((vote, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="font-semibold">{vote.voterName}</span> voted for{' '}
                      <span className="font-semibold text-university-blue-600 dark:text-university-blue-400">
                        {vote.candidateName}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Position: {vote.position}
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
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table
          data={results}
          columns={columns}
          loading={loadingResults}
          emptyText={selectedElection ? "No results found for this election" : "Please select an election to view results"}
          hoverable
          striped
        />
      </div>

      {results.length > 0 && results[0] && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg shadow p-6 border-2 border-yellow-400">
          <div className="flex items-center">
            <Trophy className="h-12 w-12 text-yellow-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                🏆 Winner
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {results[0].student_name || results[0].candidate_name}
              </h3>
              <p className="text-lg text-yellow-700 dark:text-yellow-400">
                {results[0].vote_count} votes ({results[0].percentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;