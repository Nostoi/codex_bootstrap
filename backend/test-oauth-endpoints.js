#!/usr/bin/env node

/**
 * Simple test script to verify OAuth endpoints are working
 * Run this after starting the backend server
 */

const http = require('http');

const baseUrl = 'http://localhost:8000';

const testEndpoints = [
  { method: 'GET', path: '/auth/google', description: 'Google OAuth initiation' },
  { method: 'GET', path: '/auth/microsoft', description: 'Microsoft OAuth initiation' },
  { method: 'GET', path: '/auth/profile', description: 'Protected profile endpoint (requires JWT)' },
  { method: 'POST', path: '/auth/refresh', description: 'Token refresh endpoint' },
  { method: 'POST', path: '/auth/logout', description: 'Logout endpoint' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'User-Agent': 'OAuth-Test-Script/1.0'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${res.statusCode} (${endpoint.description})`);
      resolve({ status: res.statusCode, endpoint });
    });

    req.on('error', (err) => {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${err.message} (${endpoint.description})`);
      resolve({ error: err.message, endpoint });
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ ${endpoint.method} ${endpoint.path} - Timeout (${endpoint.description})`);
      req.destroy();
      resolve({ timeout: true, endpoint });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing OAuth endpoints...\n');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✨ OAuth endpoint testing complete!');
  console.log('Note: Some endpoints like /auth/profile will return 401 without valid JWT tokens, which is expected.');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoints, testEndpoint };
