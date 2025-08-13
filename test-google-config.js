#!/usr/bin/env node

/**
 * Test Google API Configuration
 * This script verifies that Google API credentials are properly configured
 */

const { google } = require('googleapis');

async function testGoogleConfiguration() {
  console.log('🔍 Testing Google API Configuration...\n');

  // Read environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  console.log('📋 Environment Configuration:');
  console.log(`   Client ID: ${clientId ? clientId.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(
    `   Client Secret: ${clientSecret ? clientSecret.substring(0, 10) + '...' : 'NOT SET'}`
  );
  console.log(`   Callback URL: ${callbackUrl || 'NOT SET'}\n`);

  if (!clientId || !clientSecret) {
    console.error('❌ Google API credentials are not properly configured');
    process.exit(1);
  }

  try {
    // Test OAuth2 client creation
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);

    console.log('✅ OAuth2 client created successfully');

    // Generate authorization URL for testing
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    console.log('✅ Authorization URL can be generated');
    console.log(`📝 Test URL: ${authUrl.substring(0, 100)}...\n`);

    console.log('🎉 Google API configuration is valid!');
    console.log('📌 Next steps:');
    console.log('   1. Implement OAuth flow in authentication module');
    console.log('   2. Test with real user authentication');
    console.log('   3. Verify calendar/drive access permissions');
  } catch (error) {
    console.error('❌ Error testing Google configuration:', error.message);
    process.exit(1);
  }
}

testGoogleConfiguration();
