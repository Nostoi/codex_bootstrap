// Test Socket.IO connection to our backend
const { io } = require('socket.io-client');

console.log('🔌 Testing Socket.IO connection to backend...');

const BACKEND_PORT = process.env.BACKEND_PORT || '3501';
const socket = io(`http://localhost:${BACKEND_PORT}/notifications`, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('📡 Socket ID:', socket.id);

  // Test sending a message
  socket.emit('test-message', { message: 'Hello from test client!' });
});

socket.on('disconnect', reason => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('connect_error', error => {
  console.log('❌ Connection error:', error.message);
});

socket.on('notification', data => {
  console.log('📬 Received notification:', data);
});

// Keep the connection alive for a few seconds to test
setTimeout(() => {
  console.log('🔚 Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 3500);
