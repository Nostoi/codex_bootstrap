// Test if Node.js can resolve @nestjs/core module
const { NestFactory } = require('@nestjs/core');
console.log('✅ NestFactory loaded successfully:', !!NestFactory);
console.log('✅ Module resolution working correctly');
