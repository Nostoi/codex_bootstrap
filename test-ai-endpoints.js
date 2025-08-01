#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000';

async function testAIEndpoints() {
  console.log('🧪 Testing AI API endpoints...\n');

  // Test health check
  try {
    console.log('1. Testing AI health check...');
    const healthResponse = await fetch(`${API_BASE}/api/ai/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test task extraction
  try {
    console.log('\n2. Testing task extraction...');
    const extractResponse = await fetch(`${API_BASE}/api/ai/extract-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'I need to finish the quarterly report by Friday and schedule a meeting with the team next week. Also need to review the budget proposals.',
        maxTasks: 5
      })
    });
    
    if (extractResponse.ok) {
      const extractData = await extractResponse.json();
      console.log('✅ Task extraction:', JSON.stringify(extractData, null, 2));
    } else {
      const errorData = await extractResponse.text();
      console.log('❌ Task extraction failed:', extractResponse.status, errorData);
    }
  } catch (error) {
    console.log('❌ Task extraction failed:', error.message);
  }

  // Test chat completion
  try {
    console.log('\n3. Testing chat completion...');
    const chatResponse = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Help me prioritize my tasks for today' }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat completion:', JSON.stringify(chatData, null, 2));
    } else {
      const errorData = await chatResponse.text();
      console.log('❌ Chat completion failed:', chatResponse.status, errorData);
    }
  } catch (error) {
    console.log('❌ Chat completion failed:', error.message);
  }
}

testAIEndpoints();
