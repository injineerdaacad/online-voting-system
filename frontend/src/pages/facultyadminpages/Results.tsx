import React, { useState, useEffect } from 'react';
import { Download, Trophy, Award, TrendingUp, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { electionService, resultService } from '../../services';

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

interface ElectionResult {
  election: Election;
  results: Result[];
  total_votes: number;
}

const ResultsTable: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  const columns = [
    {
      key: 'position',
      title: 'Rank',
      dataIndex: 'position',
      render: (value: number) => (
        <div className="flex items-center">
          {value === 1 && <Trophy className="h-5 w-5 text-yellow-500 mr-2" />}
          {value === 2 && <Award className="h-5 w-5 text-gray-400 mr-2" />}
          {value === 3 && <Award className="h-5 w-5 text-orange-600 mr-2" />}
          <span className="font-bold text-lg">{value}</span>
        </div>
      ),
    },
    {
      key: 'candidate',
      title: 'Candidate',
      render: (value: any, record: Result) => {
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
            </div>
          </div>
        );
      },
    },
    {
      key: 'votes',
      title: 'Votes',
      dataIndex: 'vote_count',
      render: (value: number) => (
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-university-blue-500 mr-2" />
          <span className="font-bold text-lg">{value}</span>
        </div>
      ),
    },
    {
      key: 'percentage',
      title: 'Percentage',
      dataIndex: 'percentage',
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
            <div 
              className="bg-university-gold-500 h-2.5 rounded-full" 
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="font-semibold">{value.toFixed(1)}%</span>
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
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionService.getElections();
      const electionsData = response.data || [];
      setElections(electionsData);
      
      if (electionsData.length > 0) {
        setSelectedElection(electionsData[0].id || (electionsData[0] as any)._id || '');
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
      
      const resultsData = response.results || (response as any).data || response;
      const votes = (response as any).total_votes || response.totalVotes || 0;
      
      const mappedResults: Result[] = (Array.isArray(resultsData) ? resultsData : []).map((item: any, index: number) => ({
        position: index + 1,
        candidate_id: item.candidate_id || item.candidate?._id || item.candidate?.id || '',
        candidate_name: item.candidate_name || item.candidate?.name || item.name || '',
        student_name: item.student_name || item.student?.full_name || item.candidate_name,
        vote_count: item.vote_count || item.votes || item.voteCount || 0,
        percentage: votes > 0 ? ((item.vote_count || item.votes || item.voteCount || 0) / votes) * 100 : 0,
        photo_url: item.photo_url || item.photo || item.candidate?.photo_url
      }));
      
      setResults(mappedResults);
      setTotalVotes(votes);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Election Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage election results
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Election
        </label>
        <select
          value={selectedElection}
          onChange={(e) => setSelectedElection(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-university-gold-500"
          disabled={loading}
        >
          <option value="">Select an election...</option>
          {elections.map((election) => (
            <option key={election.id || election._id} value={election.id || election._id}>
              {election.title} - {election.status}
            </option>
          ))}
        </select>
      </div>

      {selectedElection && !loadingResults && results.length > 0 && (
        <div className="bg-gradient-to-r from-university-gold-50 to-university-blue-50 dark:from-university-gold-900/20 dark:to-university-blue-900/20 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Votes Cast
              </h3>
              <p className="text-3xl font-bold text-university-gold-700 dark:text-university-gold-400 mt-2">
                {totalVotes.toLocaleString()}
              </p>
            </div>
            <Trophy className="h-16 w-16 text-university-gold-500" />
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