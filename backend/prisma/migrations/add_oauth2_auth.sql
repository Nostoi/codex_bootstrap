-- Migration to add OAuth2 authentication tables
-- Run with: npx prisma db push

-- Add OAuth providers table
CREATE TABLE IF NOT EXISTS "OAuthProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "scope" TEXT[],
    "tokenExpiresAt" TIMESTAMP(3),
    "lastRefreshed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthProvider_pkey" PRIMARY KEY ("id")
);

-- Add user sessions table
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- Add blacklisted tokens table
CREATE TABLE IF NOT EXISTS "BlacklistedToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id")
);

-- Add missing fields to User table if they don't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "picture" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthProvider_userId_provider_key" ON "OAuthProvider"("userId", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthProvider_provider_providerId_key" ON "OAuthProvider"("provider", "providerId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_refreshToken_key" ON "UserSession"("refreshToken");
CREATE UNIQUE INDEX IF NOT EXISTS "BlacklistedToken_token_key" ON "BlacklistedToken"("token");

-- Add foreign key constraints
ALTER TABLE "OAuthProvider" ADD CONSTRAINT "OAuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
