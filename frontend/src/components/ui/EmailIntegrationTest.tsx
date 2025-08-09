import React, { useState } from 'react';
import { aiService } from '@/lib/aiService';

const EmailIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runEmailIntegrationTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'AI Service Health Check',
        test: async () => {
          return await aiService.healthCheck();
        },
      },
      {
        name: 'Email Classification Test',
        test: async () => {
          return await aiService.classifyEmailForTasks({
            subject: 'Project Meeting Tomorrow',
            from: 'team@company.com',
            content:
              'Hi team, we need to discuss the Q4 project timeline. Please prepare your status reports and come ready to discuss next steps. Meeting is at 2 PM in Conference Room A.',
            snippet: 'Project meeting discussion...',
          });
        },
      },
      {
        name: 'Mock Email Task Extraction',
        test: async () => {
          const mockEmails = [
            {
              id: 'email-1',
              subject: 'Urgent: Submit quarterly report by Friday',
              from: 'manager@company.com',
              date: new Date().toISOString(),
              content:
                'Please complete your quarterly performance report and submit it by end of day Friday. Include key metrics and achievements.',
              snippet: 'Quarterly report deadline...',
            },
            {
              id: 'email-2',
              subject: 'Team standup notes - action items',
              from: 'scrum@company.com',
              date: new Date().toISOString(),
              content:
                "From today's standup: John will review the user feedback, Sarah will update the documentation, and we need to schedule the client demo for next week.",
              snippet: 'Standup action items...',
            },
          ];

          return await aiService.extractTasksFromEmails(mockEmails);
        },
      },
    ];

    const results = [];

    for (const testCase of tests) {
      try {
        console.log(`Running test: ${testCase.name}`);
        const result = await testCase.test();
        results.push({
          name: testCase.name,
          status: 'success',
          result: result,
          error: null,
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-base-100 rounded-lg border border-base-300 p-6">
        <h2 className="text-2xl font-bold mb-4">📧 Email Integration Test Suite</h2>

        <div className="mb-6">
          <button
            onClick={runEmailIntegrationTests}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Running Tests...
              </>
            ) : (
              'Run Email Integration Tests'
            )}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Test Results</h3>

            {testResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.status === 'success'
                    ? 'border-success bg-success/10'
                    : 'border-error bg-error/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.name}</h4>
                  <span
                    className={`badge ${
                      result.status === 'success' ? 'badge-success' : 'badge-error'
                    }`}
                  >
                    {result.status === 'success' ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>

                {result.error && (
                  <div className="text-error text-sm mb-2">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}

                {result.result && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-base-content/70 hover:text-base-content">
                      View Result Data
                    </summary>
                    <pre className="mt-2 p-2 bg-base-200 rounded text-xs overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="mt-6 p-4 bg-info/10 border border-info rounded-lg">
              <h4 className="font-medium text-info mb-2">📋 Test Summary</h4>
              <div className="text-sm">
                <div>Total tests: {testResults.length}</div>
                <div>Passed: {testResults.filter(r => r.status === 'success').length}</div>
                <div>Failed: {testResults.filter(r => r.status === 'error').length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailIntegrationTest;
