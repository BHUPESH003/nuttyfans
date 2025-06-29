import React, { useState } from 'react';
import { ReportService } from 'src/services/reportService';
import { ReportReason } from 'src/types/report';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'HATE_SPEECH', label: 'Hate Speech' },
  { value: 'VIOLENCE', label: 'Violence' },
  { value: 'COPYRIGHT', label: 'Copyright Violation' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'OTHER', label: 'Other' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      await ReportService.createReport({
        reason,
        description: description.trim() || undefined,
        postId,
      });

      onSuccess?.();
      onClose();
      setReason('INAPPROPRIATE_CONTENT');
      setDescription('');
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Report Content</h2>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason for Report *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Additional Details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide any additional details about your report"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-red-500 text-white px-4 py-2 rounded-lg ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 