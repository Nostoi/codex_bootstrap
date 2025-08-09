import React, { useState, useEffect } from 'react';
import { aiService } from '@/lib/aiService';
import { ExtractedTask } from '@/components/ui/ChatGPTIntegration';

interface EmailIntegrationProps {
  userId: string;
  onTasksExtracted: (tasks: ExtractedTask[]) => void;
  onError?: (error: string) => void;
}

interface EmailStats {
  emailsProcessed: number;
  tasksExtracted: number;
  lastSync?: Date;
  providers: Array<'gmail' | 'outlook'>;
}

export const EmailIntegration: React.FC<EmailIntegrationProps> = ({
  userId,
  onTasksExtracted,
  onError,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [stats, setStats] = useState<EmailStats>({
    emailsProcessed: 0,
    tasksExtracted: 0,
    providers: [],
  });
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft' | 'both'>('both');
  const [daysBack, setDaysBack] = useState(7);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);

  const handleExtractTasks = async () => {
    if (isExtracting) return;

    setIsExtracting(true);
    try {
      const result = await aiService.extractTasksFromAllEmails(userId, daysBack, selectedProvider);

      setExtractedTasks(result.tasks);
      setStats({
        emailsProcessed: result.emailsProcessed,
        tasksExtracted: result.tasksExtracted,
        lastSync: new Date(),
        providers:
          selectedProvider === 'both'
            ? ['gmail', 'outlook']
            : selectedProvider === 'google'
              ? ['gmail']
              : ['outlook'],
      });

      onTasksExtracted(result.tasks);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to extract tasks from emails';
      onError?.(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  const getProviderIcon = (provider: 'gmail' | 'outlook') => {
    return provider === 'gmail' ? '📧' : '📨';
  };

  const getProviderName = (provider: 'gmail' | 'outlook') => {
    return provider === 'gmail' ? 'Gmail' : 'Outlook';
  };

  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📬</span>
        <h3 className="font-semibold text-lg">Email Task Extraction</h3>
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider Selection */}
          <div>
            <label htmlFor="email-provider-select" className="block text-sm font-medium mb-2">
              Email Provider
            </label>
            <select
              id="email-provider-select"
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as typeof selectedProvider)}
              className="select select-bordered w-full"
              disabled={isExtracting}
              aria-label="Select email provider for task extraction"
            >
              <option value="both">Both Gmail & Outlook</option>
              <option value="google">Gmail Only</option>
              <option value="microsoft">Outlook Only</option>
            </select>
          </div>

          {/* Days Back */}
          <div>
            <label className="block text-sm font-medium mb-2">Days to Scan</label>
            <select
              value={daysBack}
              onChange={e => setDaysBack(Number(e.target.value))}
              className="select select-bordered w-full"
              disabled={isExtracting}
            >
              <option value={1}>Last 24 hours</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last week</option>
              <option value={14}>Last 2 weeks</option>
              <option value={30}>Last month</option>
            </select>
          </div>
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtractTasks}
          disabled={isExtracting}
          className="btn btn-primary w-full"
        >
          {isExtracting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Analyzing Emails...
            </>
          ) : (
            <>🔍 Extract Tasks from Emails</>
          )}
        </button>
      </div>

      {/* Stats Display */}
      {stats.lastSync && (
        <div className="bg-base-200 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-base-content/60">Emails Processed:</span>
              <div className="font-medium">{stats.emailsProcessed}</div>
            </div>
            <div>
              <span className="text-base-content/60">Tasks Found:</span>
              <div className="font-medium">{stats.tasksExtracted}</div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-base-content/60">Sources:</span>
            {stats.providers.map(provider => (
              <span key={provider} className="badge badge-sm">
                {getProviderIcon(provider)} {getProviderName(provider)}
              </span>
            ))}
          </div>

          <div className="text-xs text-base-content/60 mt-1">
            Last sync: {stats.lastSync.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Extracted Tasks Preview */}
      {extractedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            📋 Extracted Tasks ({extractedTasks.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {extractedTasks.map((task, index) => (
              <div key={index} className="bg-base-50 border border-base-200 rounded p-3 text-sm">
                <div className="font-medium">{task.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`badge badge-xs ${
                      task.priority === 'high'
                        ? 'badge-error'
                        : task.priority === 'medium'
                          ? 'badge-warning'
                          : 'badge-info'
                    }`}
                  >
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-base-content/60">Due: {task.dueDate}</span>
                  )}
                  {task.estimatedDuration && (
                    <span className="text-xs text-base-content/60">
                      ~{task.estimatedDuration}min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailIntegration;
