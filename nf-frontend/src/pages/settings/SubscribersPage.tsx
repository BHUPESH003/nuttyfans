import React, { useState, useEffect } from 'react';
import { Subscription } from 'src/types/subscription';
import { Button } from 'src/components/common/button';
import { Spinner } from 'src/components/common/Spinner';
import { SubscriptionService } from 'src/services/subscriptionService';

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export const SubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all');

  useEffect(() => {
    fetchSubscribers();
  }, [pagination.page, statusFilter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await SubscriptionService.getSubscribers({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setSubscribers(response.subscribers);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load subscribers. Please try again later.');
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      await SubscriptionService.cancelSubscription(subscriptionId);
      await fetchSubscribers();
    } catch (err) {
      setError('Failed to cancel subscription. Please try again.');
      console.error('Error cancelling subscription:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  if (loading && subscribers.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired' | 'cancelled')}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Subscribers</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscriber
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Payment
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscribers.map(subscription => (
              <tr key={subscription.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={subscription.subscriber?.avatarUrl || 'https://via.placeholder.com/40'}
                      alt={subscription.subscriber?.fullName}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.subscriber?.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{subscription.subscriber?.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{subscription.tier?.name}</div>
                  <div className="text-sm text-gray-500">${subscription.tier?.price}/month</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${subscription.status === 'expired' ? 'bg-red-100 text-red-800' : ''}
                    ${subscription.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(subscription.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subscription.renewalDate
                    ? new Date(subscription.renewalDate).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {subscription.status === 'active' && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancelSubscription(subscription.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}; 