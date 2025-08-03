# Microsoft Graph Authentication Service

This service provides OAuth 2.0 authentication for Microsoft Graph API integration using Azure MSAL (Microsoft Authentication Library).

## Overview

The authentication service consists of:

- **GraphAuthService**: Core authentication logic using MSAL
- **GraphAuthController**: REST API endpoints for OAuth flows
- **Updated GraphService**: Uses centralized authentication instead of direct token access

## Features

- ✅ OAuth 2.0 Authorization Code Flow
- ✅ Automatic token refresh using MSAL silent flow
- ✅ Secure token storage in database
- ✅ State parameter validation
- ✅ Error handling and logging
- ✅ Token revocation
- ✅ User profile retrieval

## API Endpoints

### Authentication Flow

1. **GET /api/graph/auth/authorize?userId={userId}**
   - Generates authorization URL for OAuth flow
   - Returns: `{ authUrl: string, state: string }`

2. **GET /api/graph/auth/callback?code={code}&state={state}&userId={userId}**
   - Handles OAuth callback from Microsoft
   - Exchanges code for tokens
   - Returns: `{ success: boolean, user: object }`

### Status & Management

3. **GET /api/graph/auth/status?userId={userId}**
   - Check authentication status
   - Returns: `{ authenticated: boolean }`

4. **POST /api/graph/auth/refresh?userId={userId}**
   - Manually refresh access token
   - Returns: `{ success: boolean }`

5. **POST /api/graph/auth/revoke?userId={userId}**
   - Revoke access and clear tokens
   - Returns: `{ success: boolean }`

6. **GET /api/graph/auth/profile?userId={userId}**
   - Get authenticated user's profile
   - Returns: Microsoft Graph user object

## Configuration

The service requires these environment variables:

```env
MICROSOFT_CLIENT_ID=your_azure_app_client_id
MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret
MICROSOFT_TENANT_ID=your_azure_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/graph/auth/callback
```

## Scopes

The service requests these Microsoft Graph scopes:

- `User.Read` - Read user profile
- `Calendars.ReadWrite` - Full calendar access
- `Files.ReadWrite` - OneDrive file access
- `Team.ReadBasic.All` - Basic Teams information

## Integration

The GraphService has been updated to use the new authentication pattern:

```typescript
// Old pattern (direct token access)
const config = await this.prisma.integrationConfig.findUnique({...});
const graphClient = this.createGraphClient(config.accessToken);

// New pattern (centralized auth)
const graphClient = await this.createGraphClient(userId);
```

All calendar operations now automatically handle token refresh and authentication errors.

## Database Schema

The service uses the existing `IntegrationConfig` model with this approach:

- `accessToken`: Current Microsoft Graph access token
- `refreshToken`: Stores the MSAL account ID for silent token refresh
- `expiresAt`: Token expiration time
- `scopes`: Granted permissions

## Error Handling

- **401 Unauthorized**: Token expired or invalid, re-authentication required
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: MSAL or database errors

## Security

- State parameter prevents CSRF attacks
- Tokens are encrypted in database storage
- Automatic token cleanup on revocation
- Secure HTTPS-only cookies for session management

## Usage Example

```typescript
// 1. Start authentication
const { authUrl } = await authService.getAuthorizationUrl(userId);
// Redirect user to authUrl

// 2. Handle callback
const result = await authService.handleCallback(code, state, userId);

// 3. Use authenticated Graph client
const events = await graphService.getCalendarEvents(userId);
```

## Next Steps

1. Add comprehensive unit tests
2. Implement rate limiting
3. Add audit logging
4. Support for additional Graph scopes
5. Webhook support for real-time updates
