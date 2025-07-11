#!/usr/bin/env node

/**
 * Test script for the comprehensive database reset functionality
 * Tests the new admin endpoint for database reset
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = null;

async function testEndpoint(url, method = 'GET', body = null, headers = {}, description = '') {
  try {
    console.log(`\n🔍 Testing: ${description || `${method} ${url}`}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      config.data = body;
    }
    
    const response = await axios(config);
    console.log(`✅ Success: ${response.status} ${response.statusText}`);
    
    if (response.data) {
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    }
    
    return response.data;
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code} ${error.response?.statusText || error.message}`);
    
    if (error.response?.data) {
      console.log(`📄 Error details:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return null;
  }
}

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const loginData = await testEndpoint('/auth/login', 'POST', {
    email: 'admin@quidditch.com',
    password: 'admin123'
  }, {}, 'Admin login');
  
  if (loginData && loginData.success && loginData.data && loginData.data.tokens) {
    authToken = loginData.data.tokens.access;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed');
    return false;
  }
}

async function testDatabaseReset() {
  console.log('\n🔄 Testing comprehensive database reset...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test system status before reset
  console.log('\n📊 Checking system status before reset...');
  await testEndpoint('/admin/system-status', 'GET', null, headers, 'System status before reset');
  
  // Perform database reset
  console.log('\n🧹 Performing database reset...');
  const resetResult = await testEndpoint('/admin/reset-database', 'POST', {}, headers, 'Complete database reset');
  
  if (resetResult && resetResult.success) {
    console.log('\n✅ Database reset completed successfully!');
    console.log(`📈 Stats: ${JSON.stringify(resetResult.data.stats, null, 2)}`);
    console.log(`🏆 New season: ${resetResult.data.newSeason.name}`);
    console.log(`⏰ Virtual time: ${resetResult.data.virtualTime.currentDate}`);
  } else {
    console.log('\n❌ Database reset failed');
    return;
  }
  
  // Test system status after reset
  console.log('\n📊 Checking system status after reset...');
  await testEndpoint('/admin/system-status', 'GET', null, headers, 'System status after reset');
  
  // Test if teams exist
  console.log('\n👥 Checking teams...');
  await testEndpoint('/teams', 'GET', null, {}, 'Teams list');
  
  // Test if matches exist
  console.log('\n⚽ Checking matches...');
  await testEndpoint('/matches', 'GET', null, {}, 'Matches list');
  
  // Test if current season exists
  console.log('\n🏆 Checking current season...');
  await testEndpoint('/seasons/current', 'GET', null, {}, 'Current season');
}

async function main() {
  console.log('🎯 TESTING COMPREHENSIVE DATABASE RESET FUNCTIONALITY');
  console.log('=====================================================');
  
  // First login as admin
  const loginSuccess = await loginAsAdmin();
  
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }
  
  // Test the database reset
  await testDatabaseReset();
  
  console.log('\n🏁 Test completed!');
}

// Run the test
main().catch(console.error);
