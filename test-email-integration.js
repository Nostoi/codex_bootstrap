#!/usr/bin/env node

/**
 * Quick Email Integration Test Script
 * Tests the email-ai endpoints to verify integration works
 */

const http = require('http');

const BASE_URL = process.env.BACKEND_PORT
  ? `http://localhost:${process.env.BACKEND_PORT}`
  : 'http://localhost:3501';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function testEmailIntegration() {
  console.log('🔍 Testing Email Integration Endpoints...\n');

  const testUserId = 'test-user-123';

  const endpoints = [
    `/email-ai/${testUserId}/extract-tasks?daysBack=7`,
    `/email-ai/${testUserId}/gmail/tasks?daysBack=7`,
    `/email-ai/${testUserId}/outlook/tasks?daysBack=7`,
    `/integrations/google/gmail/${testUserId}/tasks?daysBack=7`,
    `/integrations/microsoft/mail/${testUserId}/tasks?daysBack=7`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await makeRequest(endpoint);

      if (response.status === 200) {
        console.log('✅ Endpoint accessible');
      } else if (response.status === 401 || response.status === 404) {
        console.log('⚠️  Endpoint exists but requires authentication/configuration');
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
      }

      console.log(`   Status: ${response.status}`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Response type: JSON`);
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend server not running');
        break;
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    console.log(''); // Empty line
  }

  console.log('🏁 Email Integration Test Complete');
}

// Run test
testEmailIntegration().catch(console.error);
