import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a Microsoft Graph client with user's access token
   */
  private createGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: {
        getAccessToken: async () => accessToken,
      },
    });
  }

  /**
   * Get user's Microsoft Graph profile
   */
  async getUserProfile(userId: string) {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config?.accessToken) {
        throw new Error('Microsoft integration not configured for user');
      }

      const graphClient = this.createGraphClient(config.accessToken);
      const profile = await graphClient.api('/me').get();

      return profile;
    } catch (error) {
      this.logger.error('Error fetching Microsoft Graph profile:', error);
      throw error;
    }
  }

  /**
   * Get user's OneDrive files
   */
  async getOneDriveFiles(userId: string, folderId?: string) {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config?.accessToken) {
        throw new Error('Microsoft integration not configured for user');
      }

      const graphClient = this.createGraphClient(config.accessToken);
      const endpoint = folderId 
        ? `/me/drive/items/${folderId}/children`
        : '/me/drive/root/children';
      
      const files = await graphClient.api(endpoint).get();

      return files;
    } catch (error) {
      this.logger.error('Error fetching OneDrive files:', error);
      throw error;
    }
  }

  /**
   * Create a file in OneDrive
   */
  async createOneDriveFile(userId: string, filename: string, content: string) {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config?.accessToken) {
        throw new Error('Microsoft integration not configured for user');
      }

      const graphClient = this.createGraphClient(config.accessToken);
      
      const file = await graphClient
        .api(`/me/drive/root:/${filename}:/content`)
        .put(content);

      return file;
    } catch (error) {
      this.logger.error('Error creating OneDrive file:', error);
      throw error;
    }
  }

  /**
   * Get user's Teams
   */
  async getTeams(userId: string) {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config?.accessToken) {
        throw new Error('Microsoft integration not configured for user');
      }

      const graphClient = this.createGraphClient(config.accessToken);
      const teams = await graphClient.api('/me/joinedTeams').get();

      return teams;
    } catch (error) {
      this.logger.error('Error fetching Teams:', error);
      throw error;
    }
  }

  /**
   * Store or update Microsoft integration configuration
   */
  async saveIntegrationConfig(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
    scopes?: string[],
  ) {
    return this.prisma.integrationConfig.upsert({
      where: {
        provider_userId: {
          provider: 'microsoft',
          userId,
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes || [],
      },
      create: {
        provider: 'microsoft',
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes || [],
      },
    });
  }
}
