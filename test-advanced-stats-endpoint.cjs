const http = require('http');

// Function to make HTTP request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-test-token' // You might need to replace this with a real admin token
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAdvancedStatistics() {
  try {
    console.log('🔍 Testing advanced statistics endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/statistics/advanced?period=30', {
    
    console.log('📊 Response status:', response.statusCode);
    console.log('📊 Response data structure:');
    
    if (response.data && typeof response.data === 'object') {
      console.log('- success:', response.data.success);
      
      if (response.data.data) {
        console.log('- data.indicators:', !!response.data.data.indicators);
        console.log('- data.statusDistribution:', !!response.data.data.statusDistribution);
        console.log('- data.betDistribution:', !!response.data.data.betDistribution);
        console.log('- data.userSegments:', !!response.data.data.userSegments);
        console.log('- data.teamPerformance:', !!response.data.data.teamPerformance);
        
        if (response.data.data.teamPerformance) {
          console.log('📊 Team performance data:');
          console.log('- Length:', response.data.data.teamPerformance.length);
          
          if (response.data.data.teamPerformance.length > 0) {
            console.log('- Sample team:', JSON.stringify(response.data.data.teamPerformance[0], null, 2));
          } else {
            console.log('⚠️ Team performance array is empty');
          }
        } else {
          console.log('❌ Team performance data is missing');
        }
      } else {
        console.log('❌ Data object is missing');
      }
    } else {
      console.log('❌ Invalid response format');
      console.log('Full response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('💡 Make sure the backend server is running on port 3000');
  }
}

testAdvancedStatistics();
