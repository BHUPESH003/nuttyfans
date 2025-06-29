import React, { useState, useEffect } from 'react';
import { SubscriptionTier, SubscriptionStats } from 'src/types/subscription';
import { Button } from 'src/components/common/button';
import { Input } from 'src/components/common/input';
import { Spinner } from 'src/components/common/Spinner';
import { SubscriptionService } from 'src/services/subscriptionService';
import { AuthService } from 'src/services/authService';

interface TierFormData {
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const SubscriptionSettingsPage: React.FC = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);
  const [formData, setFormData] = useState<TierFormData>({
    name: '',
    description: '',
    price: 0,
    features: [''],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      const [tiersData, statsData] = await Promise.all([
        SubscriptionService.getSubscriptionTiers(user.id),
        SubscriptionService.getSubscriptionStats('month'),
      ]);
      setTiers(tiersData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load subscription data. Please try again later.');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature),
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const tierData = {
        ...formData,
        price: Number(formData.price),
        features: formData.features.filter(f => f.trim() !== ''),
      };

      if (selectedTier) {
        await SubscriptionService.updateSubscriptionTier(selectedTier.id, tierData);
      } else {
        await SubscriptionService.createSubscriptionTier(tierData);
      }

      await fetchData();
      setShowTierForm(false);
      setSelectedTier(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        features: [''],
      });
    } catch (err) {
      setError('Failed to save subscription tier. Please try again.');
      console.error('Error saving subscription tier:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description,
      price: tier.price,
      features: [...tier.features],
    });
    setShowTierForm(true);
  };

  const handleDelete = async (tierId: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription tier?')) {
      return;
    }

    try {
      await SubscriptionService.deleteSubscriptionTier(tierId);
      await fetchData();
    } catch (err) {
      setError('Failed to delete subscription tier. Please try again.');
      console.error('Error deleting subscription tier:', err);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Subscription Settings</h1>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedTier(null);
            setShowTierForm(true);
          }}
        >
          Create New Tier
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Monthly Revenue</h3>
            <p className="text-2xl font-bold">${stats.totalRevenue}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Active Subscribers</h3>
            <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Churn Rate</h3>
            <p className="text-2xl font-bold">{(stats.churnRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      {!showTierForm && (
        <div className="space-y-4">
          {tiers.map(tier => (
            <div key={tier.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium">{tier.name}</h3>
                  <p className="text-gray-600 mt-1">{tier.description}</p>
                  <p className="text-2xl font-bold mt-2">${tier.price}/month</p>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <span className="mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(tier)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(tier.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Form */}
      {showTierForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          <Input
            label="Tier Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Basic, Premium, VIP"
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            as="textarea"
            rows={3}
            placeholder="Describe what subscribers get with this tier..."
          />

          <Input
            label="Price per Month ($)"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <Input
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="e.g., Exclusive content access"
                />
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeFeature(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addFeature}
              className="mt-2"
            >
              Add Feature
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowTierForm(false);
                setSelectedTier(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : selectedTier ? 'Update Tier' : 'Create Tier'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}; 