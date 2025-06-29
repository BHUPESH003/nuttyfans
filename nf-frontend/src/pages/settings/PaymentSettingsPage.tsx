import React, { useState, useEffect } from 'react';
import { Button } from 'src/components/common/button';
import { Input } from 'src/components/common/input';
import { Spinner } from 'src/components/common/Spinner';
import {
  PaymentService,
  PaymentMethod,
  PayoutMethod,
  PayoutSchedule,
  EarningsSummary,
} from 'src/services/paymentService';

export const PaymentSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [showAddPayoutForm, setShowAddPayoutForm] = useState(false);
  const [payoutFormData, setPayoutFormData] = useState({
    type: 'bank_account' as const,
    accountNumber: '',
    routingNumber: '',
    email: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        paymentMethodsData,
        payoutMethodsData,
        scheduleData,
        earningsData,
      ] = await Promise.all([
        PaymentService.getPaymentMethods(),
        PaymentService.getPayoutMethods(),
        PaymentService.getPayoutSchedule(),
        PaymentService.getEarningsSummary('month'),
      ]);

      setPaymentMethods(paymentMethodsData);
      setPayoutMethods(payoutMethodsData);
      setPayoutSchedule(scheduleData);
      setEarnings(earningsData);
    } catch (err) {
      setError('Failed to load payment settings. Please try again later.');
      console.error('Error fetching payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayoutMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await PaymentService.addPayoutMethod(payoutFormData);
      await fetchData();
      setShowAddPayoutForm(false);
      setPayoutFormData({
        type: 'bank_account',
        accountNumber: '',
        routingNumber: '',
        email: '',
      });
    } catch (err) {
      setError('Failed to add payout method. Please try again.');
      console.error('Error adding payout method:', err);
    }
  };

  const handleRemovePayoutMethod = async (methodId: string) => {
    if (!window.confirm('Are you sure you want to remove this payout method?')) {
      return;
    }

    try {
      await PaymentService.removePayoutMethod(methodId);
      await fetchData();
    } catch (err) {
      setError('Failed to remove payout method. Please try again.');
      console.error('Error removing payout method:', err);
    }
  };

  const handleSetDefaultPayoutMethod = async (methodId: string) => {
    try {
      await PaymentService.setDefaultPayoutMethod(methodId);
      await fetchData();
    } catch (err) {
      setError('Failed to set default payout method. Please try again.');
      console.error('Error setting default payout method:', err);
    }
  };

  const handleUpdateSchedule = async (frequency: 'weekly' | 'monthly') => {
    try {
      await PaymentService.updatePayoutSchedule({ frequency });
      await fetchData();
    } catch (err) {
      setError('Failed to update payout schedule. Please try again.');
      console.error('Error updating payout schedule:', err);
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Payment Settings</h1>

      {error && (
        <div className="text-red-500 text-sm mb-6">{error}</div>
      )}

      {/* Earnings Summary */}
      {earnings && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-medium mb-4">Earnings Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-gray-500 text-sm">Total Earnings</h3>
              <p className="text-2xl font-bold">${earnings.totalEarnings}</p>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Pending Payout</h3>
              <p className="text-2xl font-bold">${earnings.pendingPayout}</p>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Last Payout</h3>
              <p className="text-2xl font-bold">
                ${earnings.lastPayout.amount}
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(earnings.lastPayout.date).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payout Methods */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Payout Methods</h2>
          <Button
            variant="primary"
            onClick={() => setShowAddPayoutForm(true)}
          >
            Add Payout Method
          </Button>
        </div>

        {payoutMethods.length === 0 ? (
          <p className="text-gray-500">No payout methods added yet.</p>
        ) : (
          <div className="space-y-4">
            {payoutMethods.map(method => (
              <div
                key={method.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <div className="flex items-center">
                    {method.type === 'bank_account' ? '🏦' : '💳'}
                    <span className="ml-2 font-medium">
                      {method.type === 'bank_account'
                        ? `Bank Account (${method.details.bankName})`
                        : `PayPal (${method.details.email})`}
                    </span>
                    {method.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {method.type === 'bank_account'
                      ? `****${method.details.accountLast4}`
                      : method.details.email}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="secondary"
                      onClick={() => handleSetDefaultPayoutMethod(method.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => handleRemovePayoutMethod(method.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Payout Method Form */}
        {showAddPayoutForm && (
          <form onSubmit={handleAddPayoutMethod} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Method Type
              </label>
              <select
                value={payoutFormData.type}
                onChange={(e) => setPayoutFormData(prev => ({
                  ...prev,
                  type: e.target.value as 'bank_account' | 'paypal',
                }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="bank_account">Bank Account</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {payoutFormData.type === 'bank_account' ? (
              <>
                <Input
                  label="Account Number"
                  type="text"
                  value={payoutFormData.accountNumber}
                  onChange={(e) => setPayoutFormData(prev => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))}
                  required
                />
                <Input
                  label="Routing Number"
                  type="text"
                  value={payoutFormData.routingNumber}
                  onChange={(e) => setPayoutFormData(prev => ({
                    ...prev,
                    routingNumber: e.target.value,
                  }))}
                  required
                />
              </>
            ) : (
              <Input
                label="PayPal Email"
                type="email"
                value={payoutFormData.email}
                onChange={(e) => setPayoutFormData(prev => ({
                  ...prev,
                  email: e.target.value,
                }))}
                required
              />
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddPayoutForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Add Method
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Payout Schedule */}
      {payoutSchedule && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payout Schedule</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Frequency
              </label>
              <div className="flex space-x-4">
                <Button
                  variant={payoutSchedule.frequency === 'weekly' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateSchedule('weekly')}
                >
                  Weekly
                </Button>
                <Button
                  variant={payoutSchedule.frequency === 'monthly' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateSchedule('monthly')}
                >
                  Monthly
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Next payout scheduled for: {new Date(payoutSchedule.nextPayoutDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Minimum payout amount: ${payoutSchedule.minimumAmount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 