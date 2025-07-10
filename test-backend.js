#!/usr/bin/env node
/**
 * Quick test to verify backend functionality
 */

const http = require('http');
const WebSocket = require('ws');

console.log('🧪 Testing Quidditch Betting Backend...\n');

// Test 1: Health Check
function testHealthCheck() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health Check:', response.status === 'OK' ? 'PASSED' : 'FAILED');
          resolve(response.status === 'OK');
        } catch (error) {
          console.log('❌ Health Check: FAILED - Invalid JSON response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health Check: FAILED - Server not running');
      resolve(false);
    });
    
    req.end();
  });
}

// Test 2: WebSocket Connection
function testWebSocket() {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket('ws://localhost:3002');
      
      ws.on('open', () => {
        console.log('✅ WebSocket Connection: PASSED');
        
        // Send a ping
        ws.send(JSON.stringify({
          type: 'ping',
          data: {},
          timestamp: new Date().toISOString()
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'connection' || message.type === 'time_update') {
            console.log('✅ WebSocket Message Received:', message.type);
          } else if (message.type === 'pong') {
            console.log('✅ WebSocket Ping/Pong: PASSED');
          }
        } catch (error) {
          console.log('❌ WebSocket Message: Invalid JSON');
        }
      });
      
      ws.on('error', (error) => {
        console.log('❌ WebSocket Connection: FAILED');
        resolve(false);
      });
      
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 2000);
      
    } catch (error) {
      console.log('❌ WebSocket Connection: FAILED - Server not running');
      resolve(false);
    }
  });
}

// Test 3: API Endpoints
function testAPIEndpoints() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/teams',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Endpoints: ACCESSIBLE');
          resolve(true);
        } catch (error) {
          console.log('❌ API Endpoints: FAILED - Invalid JSON response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ API Endpoints: FAILED - Server not running');
      resolve(false);
    });
    
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('Starting tests...\n');
  
  const healthCheck = await testHealthCheck();
  const webSocket = await testWebSocket();
  const apiEndpoints = await testAPIEndpoints();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Health Check: ${healthCheck ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`WebSocket: ${webSocket ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`API Endpoints: ${apiEndpoints ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = healthCheck && webSocket && apiEndpoints;
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd backend && npm run dev');
  }
}

runTests();
