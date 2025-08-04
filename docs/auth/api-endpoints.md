# OAuth2 Authentication API Endpoints

This document defines the REST API endpoints for OAuth2 authentication in the Helmsman system.

## Base URL

```
Development: http://localhost:3001/api/auth
Production: https://api.helmsman.app/auth
```

## Authentication Flow Endpoints

### 1. Initiate OAuth Login

Redirects user to OAuth provider for authentication.

```http
GET /auth/{provider}/login
```

**Parameters:**

- `provider` (path): `google` | `microsoft`

**Query Parameters:**

- `redirect_uri` (optional): Frontend URL to redirect after successful auth
- `scopes` (optional): Comma-separated list of additional scopes

**Response:**

- `302 Redirect` to OAuth provider authorization URL

**Example:**

```bash
curl -X GET "http://localhost:3001/api/auth/google/login?redirect_uri=http://localhost:3000/dashboard"
# Returns 302 redirect to Google OAuth
```

### 2. OAuth Callback Handler

Handles OAuth provider callback and creates user session.

```http
GET /auth/{provider}/callback
```

**Parameters:**

- `provider` (path): `google` | `microsoft`

**Query Parameters:**

- `code` (required): Authorization code from OAuth provider
- `state` (required): State parameter for CSRF protection
- `error` (optional): Error code if OAuth failed

**Response:**

- `302 Redirect` to frontend with session token
- Success: `{frontend_url}?token={jwt_token}&refresh={refresh_token}`
- Error: `{frontend_url}/login?error={error_code}`

**Example Success Response:**

```http
302 Found
Location: http://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&refresh=rt_abc123...
```

## Session Management Endpoints

### 3. Refresh Access Token

Exchanges refresh token for new access token.

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "rt_abc123..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rt_def456...",
  "expiresAt": "2025-07-31T20:15:00.000Z"
}
```

**Error Response:**

```json
{
  "error": {
    "code": "auth/token-invalid",
    "message": "Refresh token is invalid or expired"
  }
}
```

### 4. Logout

Revokes current session and invalidates tokens.

```http
POST /auth/logout
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 5. Logout All Sessions

Revokes all user sessions across all devices.

```http
POST /auth/logout-all
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "success": true,
  "message": "All sessions revoked",
  "revokedSessions": 3
}
```

## User Profile Endpoints

### 6. Get User Profile

Returns authenticated user's profile information.

```http
GET /auth/profile
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "id": "usr_123abc",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "providers": [
    {
      "provider": "google",
      "email": "user@gmail.com",
      "hasCalendarAccess": true,
      "scopes": [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar"
      ]
    }
  ],
  "createdAt": "2025-07-01T10:00:00.000Z",
  "lastLoginAt": "2025-07-31T15:30:00.000Z"
}
```

### 7. Update User Profile

Updates user's profile information.

```http
PATCH /auth/profile
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "id": "usr_123abc",
  "email": "user@example.com",
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg",
  "updatedAt": "2025-07-31T16:00:00.000Z"
}
```

## Calendar Permission Endpoints

### 8. Request Calendar Permissions

Initiates OAuth flow for calendar access.

```http
POST /auth/calendar-permissions
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "provider": "google",
  "scopes": [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
  ]
}
```

**Response:**

```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?client_id=...",
  "state": "cal_state_abc123"
}
```

### 9. Get Calendar Permissions

Returns calendar access status for all providers.

```http
GET /auth/calendar-permissions
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "permissions": [
    {
      "provider": "google",
      "hasCalendarAccess": true,
      "scopes": [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
      ],
      "lastSyncAt": "2025-07-31T15:30:00.000Z"
    },
    {
      "provider": "microsoft",
      "hasCalendarAccess": false,
      "scopes": [],
      "lastSyncAt": null
    }
  ]
}
```

## Provider Management Endpoints

### 10. Link OAuth Provider

Links an additional OAuth provider to user account.

```http
POST /auth/providers/{provider}/link
```

**Parameters:**

- `provider` (path): `google` | `microsoft`

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?client_id=...",
  "state": "link_state_abc123"
}
```

### 11. Unlink OAuth Provider

Removes OAuth provider from user account.

```http
DELETE /auth/providers/{provider}
```

**Parameters:**

- `provider` (path): `google` | `microsoft`

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "success": true,
  "message": "Provider unlinked successfully"
}
```

**Error Response (if only provider):**

```json
{
  "error": {
    "code": "auth/cannot-unlink-last-provider",
    "message": "Cannot unlink the last authentication provider"
  }
}
```

## Administrative Endpoints

### 12. Get User Sessions

Returns all active sessions for the authenticated user.

```http
GET /auth/sessions
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "sessionId": "ses_xyz789",
      "createdAt": "2025-07-31T10:00:00.000Z",
      "expiresAt": "2025-08-30T10:00:00.000Z",
      "isActive": true,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "ipAddress": "192.168.1.100",
      "isCurrent": true
    }
  ]
}
```

### 13. Revoke Specific Session

Revokes a specific user session.

```http
DELETE /auth/sessions/{sessionId}
```

**Parameters:**

- `sessionId` (path): Session ID to revoke

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "auth/error-code",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

### Common Error Codes

| Code                            | HTTP Status | Description                    |
| ------------------------------- | ----------- | ------------------------------ |
| `auth/invalid-provider`         | 400         | Unsupported OAuth provider     |
| `auth/oauth-failed`             | 400         | OAuth flow failed              |
| `auth/token-expired`            | 401         | Access token expired           |
| `auth/token-invalid`            | 401         | Token is malformed or invalid  |
| `auth/session-invalid`          | 401         | Session not found or expired   |
| `auth/insufficient-permissions` | 403         | Missing required scopes        |
| `auth/state-mismatch`           | 400         | OAuth state parameter mismatch |
| `auth/user-not-found`           | 404         | User account not found         |
| `auth/provider-error`           | 502         | OAuth provider returned error  |
| `auth/rate-limited`             | 429         | Too many requests              |
| `auth/internal-error`           | 500         | Internal server error          |

## Rate Limiting

Authentication endpoints are rate limited to prevent abuse:

- **Login endpoints**: 5 requests per minute per IP
- **Token refresh**: 10 requests per minute per user
- **Profile updates**: 5 requests per minute per user
- **Session management**: 20 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1627842000
```

## Security Headers

All responses include security headers:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## CORS Configuration

CORS is configured to allow requests from trusted frontend domains:

```javascript
{
  origin: [
    'http://localhost:3000',  // Development
    'https://app.helmsman.app' // Production
  ],
  credentials: true,
  optionsSuccessStatus: 200
}
```

## Testing Examples

### Complete Authentication Flow

```bash
# 1. Initiate OAuth
curl -X GET "http://localhost:3001/api/auth/google/login" \
  -H "Accept: application/json"

# 2. After OAuth callback, test token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get user profile
curl -X GET "http://localhost:3001/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN"

# 4. Request calendar permissions
curl -X POST "http://localhost:3001/api/auth/calendar-permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "google", "scopes": ["https://www.googleapis.com/auth/calendar"]}'

# 5. Refresh token
REFRESH_TOKEN="rt_abc123..."
curl -X POST "http://localhost:3001/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "'$REFRESH_TOKEN'"}'

# 6. Logout
curl -X POST "http://localhost:3001/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

This API provides a complete OAuth2 authentication system with proper security, session management, and calendar integration capabilities.
