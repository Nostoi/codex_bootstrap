# OAuth2 Authentication Environment Configuration

This document specifies all environment variables required for the OAuth2 authentication system.

## 🔒 Required Environment Variables

### JWT Configuration

```bash
# JWT Secret (Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-minimum-256-bits-long

# JWT Token Expiration (recommended: 15 minutes)
JWT_EXPIRES_IN=15m

# Refresh Token Expiration (recommended: 30 days)
REFRESH_TOKEN_EXPIRES_IN=30d

# JWT Issuer (your application domain)
JWT_ISSUER=helmsman.app

# JWT Audience (your application domain)
JWT_AUDIENCE=helmsman.app
```

### Google OAuth Configuration

```bash
# Google Client ID (from Google Cloud Console)
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# Google Client Secret (from Google Cloud Console)
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456

# Google OAuth Redirect URI
GOOGLE_REDIRECT_URI=http://localhost:3501/api/auth/google/callback

# Google OAuth Scopes (comma-separated)
GOOGLE_DEFAULT_SCOPES=https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email

# Google Calendar Scopes (for calendar integration)
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events

# Google Gmail Scopes (for email integration and AI task extraction)
GOOGLE_GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly
```

### Microsoft OAuth Configuration

```bash
# Microsoft Application (Client) ID (from Azure Portal)
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012

# Microsoft Client Secret (from Azure Portal)
MICROSOFT_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu~

# Microsoft Tenant ID (from Azure Portal, or 'common' for multi-tenant)
MICROSOFT_TENANT_ID=common

# Microsoft OAuth Redirect URI
MICROSOFT_REDIRECT_URI=http://localhost:3501/api/auth/microsoft/callback

# Microsoft OAuth Scopes (space-separated)
MICROSOFT_DEFAULT_SCOPES=https://graph.microsoft.com/User.Read offline_access

# Microsoft Calendar Scopes (for calendar integration)
MICROSOFT_CALENDAR_SCOPES=https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Calendars.Read

# Microsoft Mail Scopes (for email integration and AI task extraction)
MICROSOFT_MAIL_SCOPES=https://graph.microsoft.com/Mail.Read
```

### Encryption Configuration

```bash
# Encryption Key for OAuth tokens (Generate with: openssl rand -hex 32)
ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Alternative: Base64 encoded key (Generate with: openssl rand -base64 32)
# ENCRYPTION_KEY_BASE64=YWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTA=
```

### Frontend URLs

```bash
# Frontend Base URL
FRONTEND_URL=http://localhost:5500

# Frontend Auth Success Redirect
FRONTEND_AUTH_SUCCESS_URL=/dashboard

# Frontend Auth Error Redirect
FRONTEND_AUTH_ERROR_URL=/login

# Frontend Calendar Permission Success
FRONTEND_CALENDAR_SUCCESS_URL=/settings/integrations
```

### Session Configuration

```bash
# Maximum concurrent sessions per user
MAX_SESSIONS_PER_USER=5

# Session timeout in seconds (default: 30 days)
SESSION_TIMEOUT=2592000

# Token cleanup interval in seconds (default: 1 hour)
TOKEN_CLEANUP_INTERVAL=3600
```

### Rate Limiting Configuration

```bash
# Rate limiting window in milliseconds (default: 1 minute)
RATE_LIMIT_WINDOW_MS=60000

# Maximum login attempts per window
RATE_LIMIT_LOGIN_MAX=5

# Maximum token refresh attempts per window
RATE_LIMIT_REFRESH_MAX=10

# Maximum profile update attempts per window
RATE_LIMIT_PROFILE_MAX=5
```

### Database Configuration

```bash
# Database URL (existing from main application)
DATABASE_URL=postgresql://user:password@localhost:5432/helmsman

# Enable SSL for database connections in production
DATABASE_SSL=true
```

## 🌍 Environment-Specific Configurations

### Development Environment (.env.development)

```bash
# Development JWT (use a simple key for dev)
JWT_SECRET=development-jwt-secret-not-for-production

# Google OAuth (development app)
GOOGLE_CLIENT_ID=dev-google-client-id
GOOGLE_CLIENT_SECRET=dev-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Microsoft OAuth (development app)
MICROSOFT_CLIENT_ID=dev-microsoft-client-id
MICROSOFT_CLIENT_SECRET=dev-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback

# Frontend URLs (development)
FRONTEND_URL=http://localhost:3000
FRONTEND_AUTH_SUCCESS_URL=/dashboard
FRONTEND_AUTH_ERROR_URL=/login

# Development encryption key
ENCRYPTION_KEY=dev-encryption-key-32-characters-long

# Relaxed rate limiting for development
RATE_LIMIT_LOGIN_MAX=50
RATE_LIMIT_REFRESH_MAX=100
```

### Staging Environment (.env.staging)

```bash
# Staging JWT (use production-like security)
JWT_SECRET=staging-super-secret-jwt-key-minimum-256-bits

# Google OAuth (staging app)
GOOGLE_CLIENT_ID=staging-google-client-id
GOOGLE_CLIENT_SECRET=staging-google-client-secret
GOOGLE_REDIRECT_URI=https://api-staging.helmsman.app/api/auth/google/callback

# Microsoft OAuth (staging app)
MICROSOFT_CLIENT_ID=staging-microsoft-client-id
MICROSOFT_CLIENT_SECRET=staging-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://api-staging.helmsman.app/api/auth/microsoft/callback

# Frontend URLs (staging)
FRONTEND_URL=https://staging.helmsman.app
FRONTEND_AUTH_SUCCESS_URL=/dashboard
FRONTEND_AUTH_ERROR_URL=/login

# Staging encryption key
ENCRYPTION_KEY=staging-encryption-key-32-chars-long

# Production-like rate limiting
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REFRESH_MAX=10
```

### Production Environment (.env.production)

```bash
# Production JWT (use vault or secret manager)
JWT_SECRET=${VAULT_JWT_SECRET}

# Google OAuth (production app)
GOOGLE_CLIENT_ID=${VAULT_GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${VAULT_GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=https://api.helmsman.app/api/auth/google/callback

# Microsoft OAuth (production app)
MICROSOFT_CLIENT_ID=${VAULT_MICROSOFT_CLIENT_ID}
MICROSOFT_CLIENT_SECRET=${VAULT_MICROSOFT_CLIENT_SECRET}
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://api.helmsman.app/api/auth/microsoft/callback

# Frontend URLs (production)
FRONTEND_URL=https://app.helmsman.app
FRONTEND_AUTH_SUCCESS_URL=/dashboard
FRONTEND_AUTH_ERROR_URL=/login

# Production encryption key (from vault)
ENCRYPTION_KEY=${VAULT_ENCRYPTION_KEY}

# Strict rate limiting
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REFRESH_MAX=10
RATE_LIMIT_PROFILE_MAX=5

# Enable all security features
DATABASE_SSL=true
```

## 🔐 Secret Generation Commands

### Generate JWT Secret

```bash
# Strong JWT secret (256 bits)
openssl rand -base64 32

# Alternative: using Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Generate Encryption Key

```bash
# 32-byte hex encoded encryption key
openssl rand -hex 32

# Alternative: Base64 encoded
openssl rand -base64 32
```

### Generate Session ID

```bash
# Random session identifier
uuidgen | tr '[:upper:]' '[:lower:]'

# Alternative: using Node.js
node -e "console.log(require('crypto').randomUUID())"
```

## 🏗️ OAuth Application Setup

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Staging: `https://api-staging.helmsman.app/api/auth/google/callback`
   - Production: `https://api.helmsman.app/api/auth/google/callback`
6. Copy Client ID and Client Secret to environment variables

### Microsoft Azure Portal Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Configure application:
   - Name: "Helmsman Task Manager"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Add web platform URLs:
     - Development: `http://localhost:3001/api/auth/microsoft/callback`
     - Staging: `https://api-staging.helmsman.app/api/auth/microsoft/callback`
     - Production: `https://api.helmsman.app/api/auth/microsoft/callback`
5. Go to "Certificates & secrets" → Create new client secret
6. Go to "API permissions" → Add permissions:
   - Microsoft Graph: User.Read (delegated)
   - Microsoft Graph: Calendars.ReadWrite (delegated)
   - Microsoft Graph: offline_access (delegated)
7. Copy Application (client) ID and Client Secret to environment variables

## 🔒 Security Considerations

### Secret Management in Production

**DO NOT** store secrets directly in environment files in production. Use:

- **AWS**: AWS Secrets Manager or Parameter Store
- **Azure**: Azure Key Vault
- **Google Cloud**: Secret Manager
- **Kubernetes**: Kubernetes Secrets
- **Docker**: Docker Secrets
- **HashiCorp Vault**: For multi-cloud deployments

### Example with AWS Secrets Manager

```bash
# Retrieve from AWS Secrets Manager
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id prod/helmsman/jwt-secret --query SecretString --output text)
GOOGLE_CLIENT_SECRET=$(aws secretsmanager get-secret-value --secret-id prod/helmsman/google-client-secret --query SecretString --output text)
MICROSOFT_CLIENT_SECRET=$(aws secretsmanager get-secret-value --secret-id prod/helmsman/microsoft-client-secret --query SecretString --output text)
ENCRYPTION_KEY=$(aws secretsmanager get-secret-value --secret-id prod/helmsman/encryption-key --query SecretString --output text)
```

### Environment Variable Validation

Create a validation script to ensure all required variables are present:

```bash
#!/bin/bash
# validate-env.sh

REQUIRED_VARS=(
  "JWT_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "MICROSOFT_CLIENT_ID"
  "MICROSOFT_CLIENT_SECRET"
  "ENCRYPTION_KEY"
  "FRONTEND_URL"
  "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

echo "All required environment variables are set ✅"
```

### Secret Rotation Strategy

1. **JWT Secret**: Rotate every 90 days, maintain 2 keys during transition
2. **OAuth Secrets**: Rotate when compromised or annually
3. **Encryption Key**: Rotate every 6 months with data re-encryption
4. **Database Passwords**: Rotate quarterly

## 📝 Environment Checklist

### Development Environment

- [ ] All OAuth applications created for localhost
- [ ] Development database configured
- [ ] HTTPS not required for OAuth callbacks
- [ ] Relaxed rate limiting for testing
- [ ] Debug logging enabled

### Staging Environment

- [ ] OAuth applications configured for staging domains
- [ ] HTTPS required for all OAuth callbacks
- [ ] Production-like security settings
- [ ] Monitoring and logging configured
- [ ] Load balancer SSL termination configured

### Production Environment

- [ ] OAuth applications configured for production domains
- [ ] All secrets stored in secure secret management system
- [ ] HTTPS enforced everywhere
- [ ] Strict rate limiting enabled
- [ ] Comprehensive monitoring and alerting
- [ ] Database SSL connections enabled
- [ ] Regular secret rotation scheduled

This configuration ensures secure OAuth2 authentication across all environments while maintaining proper separation of concerns and security best practices.
