/**
 * Debug script para ver la estructura real de la respuesta del backend
 * para el endpoint /league-time/advance
 */

// Simular fetch para Node.js
import fetch, { Headers, Request, Response } from 'node-fetch';
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

const BASE_URL = 'http://localhost:3001/api';

async function testAdvanceTimeResponse() {
  console.log('🔍 Testing /league-time/advance response structure...\n');
  
  try {
    // Hacer petición directa al backend
    const response = await fetch(`${BASE_URL}/league-time/advance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount: 1, 
        unit: 'days',
        simulateMatches: true 
      })
    });

    console.log('📡 Raw Response Status:', response.status);
    console.log('📡 Raw Response OK:', response.ok);
    
    if (!response.ok) {
      console.log('❌ Response not OK:', response.statusText);
      const errorText = await response.text();
      console.log('Error text:', errorText);
      return;
    }

    const rawData = await response.json();
    console.log('📋 Raw Backend Response:');
    console.log(JSON.stringify(rawData, null, 2));

    // Analizar la estructura
    console.log('\n🔍 Structure Analysis:');
    console.log('Type:', typeof rawData);
    console.log('Has success:', 'success' in rawData);
    console.log('Has data:', 'data' in rawData);
    console.log('Has message:', 'message' in rawData);
    console.log('Has newDate:', 'newDate' in rawData);

    if (rawData.success) {
      console.log('\n✅ Backend Response Analysis:');
      console.log('- Success:', rawData.success);
      
      if (rawData.data) {
        console.log('- Data type:', typeof rawData.data);
        console.log('- Data structure:', Object.keys(rawData.data));
      }
      
      if (rawData.message) {
        console.log('- Message:', rawData.message);
      }
    }

  } catch (error) {
    console.error('💥 Error testing advance time:', error.message);
  }
}

testAdvanceTimeResponse();
