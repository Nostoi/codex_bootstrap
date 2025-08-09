import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GoogleService } from './google/google.service';
import { GraphService } from './graph/graph.service';
import { AiService } from '../ai/ai.service';

@ApiTags('email-ai')
@Controller('email-ai')
export class EmailAiController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly graphService: GraphService,
    private readonly aiService: AiService
  ) {}

  @Get(':userId/extract-tasks')
  @ApiOperation({ summary: 'Extract tasks from both Gmail and Outlook emails using AI' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    description: 'Number of days to look back for emails (default: 7)',
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'Email provider: google, microsoft, or both (default: both)',
  })
  @ApiResponse({ status: 200, description: 'Tasks extracted from emails' })
  async extractTasksFromEmails(
    @Param('userId') userId: string,
    @Query('daysBack') daysBack?: number,
    @Query('provider') provider?: 'google' | 'microsoft' | 'both'
  ) {
    const days = daysBack || 7;
    const useProvider = provider || 'both';
    const allEmails: any[] = [];

    try {
      // Collect emails from specified providers
      if (useProvider === 'google' || useProvider === 'both') {
        try {
          const gmailEmails = await this.googleService.getGmailMessagesForTaskExtraction(
            userId,
            days
          );
          allEmails.push(...gmailEmails.map(email => ({ ...email, provider: 'gmail' })));
        } catch (error) {
          console.warn(`Gmail integration not available for user ${userId}:`, error.message);
        }
      }

      if (useProvider === 'microsoft' || useProvider === 'both') {
        try {
          const outlookEmails = await this.graphService.getMailMessagesForTaskExtraction(
            userId,
            days
          );
          allEmails.push(...outlookEmails.map(email => ({ ...email, provider: 'outlook' })));
        } catch (error) {
          console.warn(`Outlook integration not available for user ${userId}:`, error.message);
        }
      }

      if (allEmails.length === 0) {
        return {
          success: true,
          message: 'No emails found or no email integrations configured',
          data: {
            tasks: [],
            emailsProcessed: 0,
            tasksExtracted: 0,
          },
        };
      }

      // Use AI to extract tasks from emails
      const aiResponse = await this.aiService.extractTasksFromEmails(allEmails);

      return {
        success: true,
        data: {
          tasks: aiResponse.data,
          emailsProcessed: allEmails.length,
          tasksExtracted: aiResponse.data.length,
          usage: aiResponse.usage,
          processingTimeMs: aiResponse.processingTimeMs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          tasks: [],
          emailsProcessed: allEmails.length,
          tasksExtracted: 0,
        },
      };
    }
  }

  @Get(':userId/gmail/tasks')
  @ApiOperation({ summary: 'Extract tasks from Gmail emails only' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    description: 'Number of days to look back for emails (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Tasks extracted from Gmail' })
  async extractTasksFromGmail(
    @Param('userId') userId: string,
    @Query('daysBack') daysBack?: number
  ) {
    const days = daysBack || 7;

    try {
      const emails = await this.googleService.getGmailMessagesForTaskExtraction(userId, days);

      if (emails.length === 0) {
        return {
          success: true,
          message: 'No Gmail emails found',
          data: { tasks: [], emailsProcessed: 0, tasksExtracted: 0 },
        };
      }

      const aiResponse = await this.aiService.extractTasksFromEmails(emails);

      return {
        success: true,
        data: {
          tasks: aiResponse.data,
          emailsProcessed: emails.length,
          tasksExtracted: aiResponse.data.length,
          usage: aiResponse.usage,
          processingTimeMs: aiResponse.processingTimeMs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { tasks: [], emailsProcessed: 0, tasksExtracted: 0 },
      };
    }
  }

  @Get(':userId/outlook/tasks')
  @ApiOperation({ summary: 'Extract tasks from Outlook emails only' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    description: 'Number of days to look back for emails (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Tasks extracted from Outlook' })
  async extractTasksFromOutlook(
    @Param('userId') userId: string,
    @Query('daysBack') daysBack?: number
  ) {
    const days = daysBack || 7;

    try {
      const emails = await this.graphService.getMailMessagesForTaskExtraction(userId, days);

      if (emails.length === 0) {
        return {
          success: true,
          message: 'No Outlook emails found',
          data: { tasks: [], emailsProcessed: 0, tasksExtracted: 0 },
        };
      }

      const aiResponse = await this.aiService.extractTasksFromEmails(emails);

      return {
        success: true,
        data: {
          tasks: aiResponse.data,
          emailsProcessed: emails.length,
          tasksExtracted: aiResponse.data.length,
          usage: aiResponse.usage,
          processingTimeMs: aiResponse.processingTimeMs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { tasks: [], emailsProcessed: 0, tasksExtracted: 0 },
      };
    }
  }

  @Post(':userId/classify-email')
  @ApiOperation({ summary: 'Classify email content for task extraction relevance' })
  @ApiResponse({ status: 200, description: 'Email classification result' })
  async classifyEmail(
    @Param('userId') userId: string,
    @Body()
    emailData: {
      subject: string;
      from: string;
      content: string;
      snippet?: string;
    }
  ) {
    try {
      const classification = await this.aiService.classifyEmailForTasks(emailData);

      return {
        success: true,
        data: classification,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          hasActionableContent: false,
          confidence: 0,
          categories: [],
          urgency: 'low',
        },
      };
    }
  }
}
