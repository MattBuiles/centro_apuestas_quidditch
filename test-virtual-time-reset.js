#!/usr/bin/env node

/**
 * Test script to verify that database reset correctly resets virtual time
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testVirtualTimeReset() {
  try {
    console.log('🔄 Testing virtual time reset during database reset...');
    
    // Step 1: Login as admin
    console.log('\n👤 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@quidditch.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.tokens.access;
    console.log('✅ Admin login successful');
    
    // Step 2: Check current virtual time
    console.log('\n⏰ Step 2: Checking current virtual time...');
    const timeBefore = await axios.get(`${API_BASE}/league-time`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current virtual time before reset:', timeBefore.data.data.currentDate);
    
    // Step 3: Execute database reset
    console.log('\n🔄 Step 3: Executing database reset...');
    const resetResponse = await axios.post(`${API_BASE}/admin/reset-database`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Database reset completed!');
    console.log('Reset response:', JSON.stringify(resetResponse.data.data, null, 2));
    
    // Step 4: Check virtual time after reset
    console.log('\n⏰ Step 4: Checking virtual time after reset...');
    const timeAfter = await axios.get(`${API_BASE}/league-time`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Virtual time after reset:', timeAfter.data.data.currentDate);
    
    // Step 5: Verify that time was reset to July 15th
    const afterDate = new Date(timeAfter.data.data.currentDate);
    const expectedMonth = 6; // July is month 6 (0-indexed)
    const expectedDay = 15;
    
    console.log('\n🔍 Step 5: Verifying time reset...');
    console.log(`Expected: July 15th (month ${expectedMonth}, day ${expectedDay})`);
    console.log(`Actual: ${afterDate.toDateString()} (month ${afterDate.getMonth()}, day ${afterDate.getDate()})`);
    
    if (afterDate.getMonth() === expectedMonth && afterDate.getDate() === expectedDay) {
      console.log('✅ SUCCESS: Virtual time was correctly reset to July 15th!');
    } else {
      console.log('❌ FAILURE: Virtual time was not reset to the expected date');
    }
    
    // Step 6: Verify new season was created
    console.log('\n🏆 Step 6: Verifying new season creation...');
    const seasonResponse = await axios.get(`${API_BASE}/seasons/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (seasonResponse.data.success && seasonResponse.data.data) {
      console.log('✅ New season created successfully:', seasonResponse.data.data.name);
      console.log('Season start date:', new Date(seasonResponse.data.data.startDate).toDateString());
      console.log('Season end date:', new Date(seasonResponse.data.data.endDate).toDateString());
    } else {
      console.log('❌ No active season found after reset');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

// Execute the test
testVirtualTimeReset();
