import React, { useState } from 'react';
import { ContentService } from 'src/services/contentService';
import CustomModal from 'src/components/common/customModal';
import { Button } from 'src/components/common/button';
import { Input } from 'src/components/common/input';

interface TipModalProps {
  postId: string;
  creatorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({
  postId,
  creatorName,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedAmounts = [5, 10, 20, 50, 100];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ContentService.sendTip(postId, amount);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to send tip. Please try again.');
      console.error('Error sending tip:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      width="w-full max-w-md"
      className="mx-4"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Send a tip to {creatorName}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {predefinedAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  variant={amount === preset ? "primary" : "secondary"}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              step="1"
              className="pl-8"
              error={error || undefined}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || amount < 1}
            >
              {loading ? 'Sending...' : 'Send Tip'}
            </Button>
          </div>
        </form>
      </div>
    </CustomModal>
  );
}; 