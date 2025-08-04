// WebSocket Test Script
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket Connection...');

// Test connection to WebSocket gateway
const ws = new WebSocket('ws://localhost:3001', {
  headers: {
    Authorization: 'Bearer test-token',
  },
});

ws.on('open', function open() {
  console.log('✅ WebSocket Connected Successfully!');

  // Test sending a message
  ws.send(
    JSON.stringify({
      type: 'test',
      data: { message: 'Hello WebSocket!' },
    })
  );
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket Error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket Connection Closed');
});

// Close after 5 seconds
setTimeout(() => {
  ws.close();
}, 5000);
