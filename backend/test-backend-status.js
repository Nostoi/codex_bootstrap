#!/usr/bin/env node

const http = require('http');

console.log('Testing backend server status...');

// Test if server is running on port 3501
const options = {
  hostname: 'localhost',
  port: 3501,
  path: '/',
  timeout: 5000,
};

const req = http
  .request(options, res => {
    console.log(`✅ Backend server is running! Status: ${res.statusCode}`);
    console.log(`Response headers:`, res.headers);
  })
  .on('error', err => {
    console.log(`❌ Backend server not running: ${err.message}`);
  })
  .on('timeout', () => {
    console.log(`❌ Connection timeout to backend server`);
  });

req.end();

// Test database connection port
const net = require('net');
const dbSocket = new net.Socket();

dbSocket.setTimeout(5000);
dbSocket
  .connect(5487, 'localhost', () => {
    console.log('✅ Database port 5487 is accessible');
    dbSocket.destroy();
  })
  .on('error', err => {
    console.log(`❌ Database connection failed: ${err.message}`);
  })
  .on('timeout', () => {
    console.log(`❌ Database connection timeout`);
  });

// Check if pnpm process is running
const { exec } = require('child_process');
exec('ps aux | grep "nest start"', (error, stdout, stderr) => {
  if (stdout.includes('nest start')) {
    console.log('✅ NestJS process found running');
  } else {
    console.log('❌ No NestJS process found');
  }
});
