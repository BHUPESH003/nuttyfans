import React, { useState, useEffect } from 'react';
import { ReportService } from 'src/services/reportService';
import { Report } from 'src/types/report';
import { formatDistanceToNow } from 'date-fns';
import { UserPreviewCard } from 'src/components/common/userPreviewCard';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    resolved: number;
    rejected: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<Report['status']>('PENDING');

  useEffect(() => {
    loadReports();
    loadStats();
  }, [page, selectedStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { reports: newReports, total } = await ReportService.getReports(page);
      setReports((prev) => (page === 1 ? newReports : [...prev, ...newReports]));
      setHasMore(reports.length < total);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await ReportService.getReportStats();
      setStats(stats);
    } catch (err) {
      console.error('Error loading report stats:', err);
    }
  };

  const handleStatusChange = async (reportId: string, status: Report['status']) => {
    try {
      await ReportService.updateReport(reportId, { status });
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status } : report
        )
      );
      loadStats();
    } catch (err) {
      console.error('Error updating report status:', err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const getStatusBadgeClass = (status: Report['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Content Reports</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Reports</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-500">Pending</div>
            <div className="text-2xl font-semibold">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-green-500">Resolved</div>
            <div className="text-2xl font-semibold">{stats.resolved}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-red-500">Rejected</div>
            <div className="text-2xl font-semibold">{stats.rejected}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as Report['status'])}
          className="border rounded-lg px-3 py-2"
        >
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white p-4 rounded-lg shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatDistanceToNow(new Date(report.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="space-x-2">
                {report.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(report.id, 'RESOLVED')}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleStatusChange(report.id, 'REJECTED')}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-medium">Reason:</div>
              <div>{report.reason.replace(/_/g, ' ')}</div>
              {report.description && (
                <>
                  <div className="font-medium mt-2">Description:</div>
                  <div className="text-gray-600">{report.description}</div>
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="font-medium mb-2">Reported Content:</div>
              <div className="bg-gray-50 p-4 rounded">
                <UserPreviewCard
                  backgroundImage={report.post.mediaUrls?.[0] || '/images/default-cover.jpg'}
                  avatar={report.post.creator.avatarUrl || ''}
                  username={report.post.creator.username}
                  handle={`@${report.post.creator.username}`}
                  isVerified={report.post.creator.isVerified}
                />
                {report.post.title && (
                  <div className="font-medium mt-4">{report.post.title}</div>
                )}
                {report.post.content && (
                  <div className="text-gray-600 mt-2">{report.post.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center text-gray-500">Loading...</div>
        )}

        {!loading && hasMore && (
          <button
            onClick={loadMore}
            className="w-full py-2 text-blue-500 hover:text-blue-600"
          >
            Load More
          </button>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center text-gray-500">
            No reports found
          </div>
        )}
      </div>
    </div>
  );
}; 