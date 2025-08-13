const http = require('http');

console.log('🔍 Checking backend server status...');

// Test basic health endpoint
function testEndpoint(path = '/', expectedStatus = [200, 404]) {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 3501,
      path: path,
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, res => {
      console.log(`✅ ${path}: Status ${res.statusCode}`);
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', err => {
      console.log(`❌ ${path}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`⏱️ ${path}: Connection timeout`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

async function checkBackend() {
  console.log('Testing endpoints...');

  // Test root endpoint
  await testEndpoint('/');

  // Test API health endpoint
  await testEndpoint('/api/health');

  // Test API base
  await testEndpoint('/api');

  console.log('Backend check complete.');
}

checkBackend();
