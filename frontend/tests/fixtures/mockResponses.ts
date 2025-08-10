// Mock data for AI integration tests
export const mockAIResponses = [
  // Sensitive data handling - MUST BE FIRST to avoid being caught by generic patterns
  {
    match: (body: any) => {
      const text = body.text || '';
      console.log('[MOCK DEBUG] Checking sensitive data pattern for text:', text);
      const matches =
        text.includes('payroll') || text.includes('employee ID') || text.includes('salary');
      console.log('[MOCK DEBUG] Sensitive data match:', matches);
      return matches;
    },
    response: (body: any) => {
      console.log('[MOCK DEBUG] Returning sensitive data response');
      return {
        data: [
          {
            id: `extracted-${Date.now()}-${Math.random()}`,
            name: 'Process payroll data for employee [REDACTED]',
            description: 'Employee information will be anonymized',
            priority: 6,
            estimatedHours: 1,
            dependencies: [],
            tags: ['sensitive', 'hr'],
            energyLevel: 'medium',
            focusType: 'administrative',
            complexity: 5,
            flags: ['sensitive_data_detected'],
          },
        ],
        usage: { promptTokens: 75, completionTokens: 40, totalTokens: 115 },
        model: 'gpt-4o-mini',
        processingTimeMs: 800,
        warnings: ['Sensitive data detected: Employee information will be anonymized'],
      };
    },
  },
  // Multi-task batch extraction - Must be before generic patterns
  {
    match: (body: any) => {
      const text = body.text || '';
      console.log('[MOCK DEBUG] Checking multi-task batch pattern for text:', text);
      const hasDebugAuth = text.includes('debug the authentication system');
      const hasUnitTests = text.includes('write unit tests for the new features');
      const hasQuarterlyReview = text.includes('prepare the quarterly review presentation');
      const hasProjectDoc = text.includes('finish the project documentation');

      console.log('[MOCK DEBUG] Multi-task match check:', {
        hasDebugAuth,
        hasUnitTests,
        hasQuarterlyReview,
        hasProjectDoc,
      });

      // Match if we have most of the key phrases from the batch test
      return hasDebugAuth && hasUnitTests && hasQuarterlyReview && hasProjectDoc;
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Finish project documentation',
          description: '',
          priority: 5,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'administrative',
          complexity: undefined,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Schedule team meeting for quarterly review',
          description: '',
          priority: 2,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'low',
          focusType: 'collaborative',
          complexity: undefined,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Debug authentication system',
          description: '',
          priority: 8,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'high',
          focusType: 'technical',
          complexity: 8,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Update user interface design',
          description: '',
          priority: 5,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'creative',
          complexity: 6,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Write unit tests for new features',
          description: '',
          priority: 5,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'high',
          focusType: 'technical',
          complexity: 7,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Prepare quarterly review presentation',
          description: '',
          priority: 5,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'administrative',
          complexity: 5,
        },
      ],
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      model: 'gpt-4o-mini',
      processingTimeMs: 1000,
    }),
  },
  // Positive scenarios - task extraction
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('I need to') || text.includes('finish the project documentation');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Finish project documentation',
          description: '',
          priority: 5,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'administrative',
          complexity: undefined,
        },
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Schedule team meeting for quarterly review',
          description: '',
          priority: 2,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'low',
          focusType: 'collaborative',
          complexity: undefined,
        },
      ],
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      model: 'gpt-4o-mini',
      processingTimeMs: 1000,
    }),
  },
  // Technical task
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('Debug the authentication') || text.includes('authentication system');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Debug authentication system',
          description: '',
          priority: 8,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'high',
          focusType: 'technical',
          complexity: 8,
        },
      ],
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      model: 'gpt-4o-mini',
      processingTimeMs: 1000,
    }),
  },
  // Creative task
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('Creative brainstorming session') || text.includes('brainstorming');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Creative brainstorming session',
          description: '',
          priority: 3,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'creative',
          complexity: 4,
        },
      ],
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      model: 'gpt-4o-mini',
      processingTimeMs: 1000,
    }),
  },
  {
    match: (body: any) => {
      const text = body.text || '';
      return (
        text.includes('Simple task extraction') ||
        text.includes('performance') ||
        text.includes('Complete the report')
      );
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Complete the report',
          description: '',
          priority: 4,
          estimatedHours: 2,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'administrative',
          complexity: 3,
          dueDate: body.text?.includes('next Friday') ? '2024-01-19' : undefined,
        },
      ],
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
      model: 'gpt-4o-mini',
      processingTimeMs: 500,
    }),
  },
  // Date parsing patterns for natural language tests
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('Schedule meeting for tomorrow');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Schedule meeting',
          description: '',
          priority: 3,
          estimatedHours: 1,
          dependencies: [],
          tags: [],
          energyLevel: 'low',
          focusType: 'social',
          complexity: 2,
          dueDate: '2024-01-13', // Tomorrow
        },
      ],
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
      model: 'gpt-4o-mini',
      processingTimeMs: 500,
    }),
  },
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('Deadline is in 3 weeks');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Complete deadline task',
          description: '',
          priority: 4,
          estimatedHours: 3,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'technical',
          complexity: 5,
          dueDate: '2024-02-02', // In 3 weeks
        },
      ],
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
      model: 'gpt-4o-mini',
      processingTimeMs: 500,
    }),
  },
  {
    match: (body: any) => {
      const text = body.text || '';
      return text.includes('Due at end of month');
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'End of month task',
          description: '',
          priority: 5,
          estimatedHours: 2,
          dependencies: [],
          tags: [],
          energyLevel: 'medium',
          focusType: 'administrative',
          complexity: 4,
          dueDate: '2024-01-31', // End of month
        },
      ],
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
      model: 'gpt-4o-mini',
      processingTimeMs: 500,
    }),
  },
  // Credit card data handling
  {
    match: (body: any) => {
      const text = body.text || '';
      return (
        text.includes('payment method') ||
        text.includes('card') ||
        /\d{4}\s?\d{4}\s?\d{4}\s?\d{3}/.test(text)
      );
    },
    response: (body: any) => ({
      data: [
        {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: 'Update payment method',
          description: 'Payment information will not be stored',
          priority: 4,
          estimatedHours: 1,
          dependencies: [],
          tags: ['payment', 'sensitive'],
          energyLevel: 'low',
          focusType: 'administrative',
          complexity: 2,
          flags: ['sensitive_data_detected'],
        },
      ],
      usage: { promptTokens: 60, completionTokens: 30, totalTokens: 90 },
      model: 'gpt-4o-mini',
      processingTimeMs: 600,
      warnings: ['Sensitive data detected: Payment information will not be stored'],
    }),
  },
];

// Error scenarios
export const errorScenarios = {
  timeout: {
    match: (body: any) => body.text?.includes('Test timeout scenario'),
    response: { status: 408, body: 'Request Timeout' },
  },
  error: {
    match: (body: any) => body.text?.includes('Test error scenario'),
    response: { status: 500, body: 'Internal Server Error' },
  },
  quota: {
    match: (body: any) => body.text?.includes('Test quota limits'),
    response: { status: 429, body: 'API quota limit exceeded' },
  },
};

// Mock responses for AI task classification
export const mockClassificationResponses = [
  {
    match: (body: any) => {
      const title = body.title || '';
      const description = body.description || '';
      return (
        title.includes('Analyze user feedback data') ||
        description.includes('Review customer surveys')
      );
    },
    response: (body: any) => ({
      data: {
        energyLevel: 'medium',
        focusType: 'technical',
        complexity: 6,
        estimatedHours: 2,
        tags: ['data-analysis', 'customer-feedback'],
        priority: 5,
      },
      usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
      model: 'gpt-4o-mini',
      processingTimeMs: 800,
    }),
  },
  // Default classification for any other task
  {
    match: () => true,
    response: (body: any) => ({
      data: {
        energyLevel: 'medium',
        focusType: 'administrative',
        complexity: 4,
        estimatedHours: 1,
        tags: ['general'],
        priority: 3,
      },
      usage: { promptTokens: 60, completionTokens: 30, totalTokens: 90 },
      model: 'gpt-4o-mini',
      processingTimeMs: 600,
    }),
  },
];
