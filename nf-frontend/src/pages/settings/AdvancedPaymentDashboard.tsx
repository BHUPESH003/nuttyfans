import React, { useState, useEffect } from 'react';
import { Button } from 'src/components/common/button';
import { Input } from 'src/components/common/input';
import { Spinner } from 'src/components/common/Spinner';
import { AdvancedPaymentService } from 'src/services/advancedPaymentService';
import {
  PaymentDashboardData
} from 'src/types/payment';

interface TaxDocFormData {
  type: 'W9' | '1099NEC' | 'other';
  year: number;
  file: File | null;
}

export const AdvancedPaymentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<PaymentDashboardData | null>(null);
  const [uploadingTaxDoc, setUploadingTaxDoc] = useState(false);
  const [taxDocForm, setTaxDocForm] = useState<TaxDocFormData>({
    type: 'W9',
    year: new Date().getFullYear(),
    file: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await AdvancedPaymentService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    try {
      const onboardingUrl = await AdvancedPaymentService.getStripeConnectOnboardingLink();
      window.location.href = onboardingUrl;
    } catch (err) {
      setError('Failed to start Stripe onboarding. Please try again.');
      console.error('Error getting Stripe onboarding link:', err);
    }
  };

  const handleTaxDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxDocForm.file) return;

    try {
      setUploadingTaxDoc(true);
      await AdvancedPaymentService.uploadTaxDocument({
        type: taxDocForm.type,
        year: taxDocForm.year,
        file: taxDocForm.file,
      });
      await fetchDashboardData();
      setTaxDocForm({
        type: 'W9',
        year: new Date().getFullYear(),
        file: null,
      });
    } catch (err) {
      setError('Failed to upload tax document. Please try again.');
      console.error('Error uploading tax document:', err);
    } finally {
      setUploadingTaxDoc(false);
    }
  };

  const handleDownloadTaxDoc = async (documentId: string) => {
    try {
      const blob = await AdvancedPaymentService.downloadTaxDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download tax document. Please try again.');
      console.error('Error downloading tax document:', err);
    }
  };

  const handleExportEarnings = async (format: 'csv' | 'pdf') => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
      
      const blob = await AdvancedPaymentService.exportEarningsReport({
        startDate,
        endDate,
        format,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export earnings report. Please try again.');
      console.error('Error exporting earnings:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Advanced Payment Dashboard</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stripe Connect Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Stripe Connect</h2>
        {dashboardData?.stripeAccount ? (
          <div>
            <div className="flex items-center mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                dashboardData.stripeAccount.status === 'verified' 
                  ? 'bg-green-100 text-green-800'
                  : dashboardData.stripeAccount.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {dashboardData.stripeAccount.status.charAt(0).toUpperCase() + dashboardData.stripeAccount.status.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Account ID</p>
                <p>{dashboardData.stripeAccount.accountId}</p>
              </div>
              <div>
                <p className="text-gray-500">Business Type</p>
                <p>{dashboardData.stripeAccount.details.businessType}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your Stripe account to start receiving payments directly to your bank account.
            </p>
            <Button variant="primary" onClick={handleStripeConnect}>
              Connect with Stripe
            </Button>
          </div>
        )}
      </div>

      {/* Tax Documents Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium mb-4">Tax Documents</h2>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Upload New Document</h3>
          <form onSubmit={handleTaxDocUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={taxDocForm.type}
                  onChange={(e) => setTaxDocForm(prev => ({
                    ...prev,
                    type: e.target.value as 'W9' | '1099NEC' | 'other'
                  }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="W9">W-9</option>
                  <option value="1099NEC">1099-NEC</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Year
                </label>
                <Input
                  type="number"
                  value={taxDocForm.year}
                  onChange={(e) => setTaxDocForm(prev => ({
                    ...prev,
                    year: parseInt(e.target.value)
                  }))}
                  min={2020}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setTaxDocForm(prev => ({
                  ...prev,
                  file: e.target.files?.[0] || null
                }))}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!taxDocForm.file || uploadingTaxDoc}
            >
              {uploadingTaxDoc ? 'Uploading...' : 'Upload Document'}
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
          {dashboardData?.taxDocuments.length === 0 ? (
            <p className="text-gray-500">No tax documents uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {dashboardData?.taxDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{doc.type}</p>
                    <p className="text-sm text-gray-500">
                      Year: {doc.year} | Status: {doc.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(doc.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadTaxDoc(doc.id)}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Advanced Analytics</h2>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => handleExportEarnings('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExportEarnings('pdf')}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {dashboardData?.analytics && (
          <div className="space-y-8">
            {/* Revenue Overview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Revenue</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">${dashboardData.analytics.revenue.total}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Subscriptions</p>
                  <p className="text-2xl font-bold">${dashboardData.analytics.revenue.subscriptions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Tips</p>
                  <p className="text-2xl font-bold">${dashboardData.analytics.revenue.tips}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">PPV Content</p>
                  <p className="text-2xl font-bold">${dashboardData.analytics.revenue.ppv}</p>
                </div>
              </div>
            </div>

            {/* Subscriber Metrics */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Subscribers</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Subscribers</p>
                  <p className="text-2xl font-bold">{dashboardData.analytics.subscribers.total}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Active Subscribers</p>
                  <p className="text-2xl font-bold">{dashboardData.analytics.subscribers.active}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Churn Rate</p>
                  <p className="text-2xl font-bold">
                    {(dashboardData.analytics.subscribers.churnRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Retention Rate</p>
                  <p className="text-2xl font-bold">
                    {(dashboardData.analytics.subscribers.retention * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Content Performance */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Content Performance</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Top Performing Content</p>
                    <p className="text-sm text-gray-500">Last 30 Days</p>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.analytics.content.topPerforming.map(post => (
                      <div key={post.postId} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-gray-500">
                            {post.views} views • {post.likes} likes • ${post.revenue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 