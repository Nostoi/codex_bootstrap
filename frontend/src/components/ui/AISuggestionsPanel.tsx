import React, { useState } from 'react';

interface AISuggestion {
  id: string;
  text: string;
  type: 'breakdown' | 'scheduling' | 'optimization' | 'general';
}

interface AISuggestionsPanelProps {
  isVisible: boolean;
  isLoading?: boolean;
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestionId: string) => void;
  onClose: () => void;
}

export default function AISuggestionsPanel({
  isVisible,
  isLoading = false,
  suggestions,
  onApplySuggestion,
  onClose,
}: AISuggestionsPanelProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  if (!isVisible) return null;

  const handleApplySuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestionId));
    onApplySuggestion(suggestionId);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">AI Task Suggestions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-1"
            aria-label="Close suggestions panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing task...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No suggestions available for this task.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-green-600 font-medium">AI Suggestions Ready</p>
                <p className="text-gray-600 text-sm">Here are some ways to improve this task:</p>
              </div>

              <div data-testid="ai-suggestions" className="space-y-4">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                            {suggestion.type === 'breakdown'
                              ? '🔄'
                              : suggestion.type === 'scheduling'
                                ? '📅'
                                : suggestion.type === 'optimization'
                                  ? '⚡'
                                  : '💡'}
                            {suggestion.type}
                          </span>
                        </div>
                        <p className="text-gray-700">{suggestion.text}</p>
                      </div>

                      <button
                        onClick={() => handleApplySuggestion(suggestion.id)}
                        disabled={appliedSuggestions.has(suggestion.id)}
                        className={`ml-4 px-3 py-1 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          appliedSuggestions.has(suggestion.id)
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        {appliedSuggestions.has(suggestion.id) ? 'Applied' : 'Apply Suggestion'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type { AISuggestion, AISuggestionsPanelProps };
