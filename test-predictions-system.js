// Test script for predictions system
import { PredictionsService } from './src/services/predictionsService.js';

console.log('🧪 Testing Predictions System...');

async function testPredictions() {
  try {
    const predictionsService = new PredictionsService();
    
    // Use the scheduled match ID we found
    const matchId = 'ea4f06d3-b02a-4f13-84d3-b230c62eb37f';
    
    console.log('📝 Testing prediction submission...');
    const success = await predictionsService.submitPrediction(matchId, 'home', 3);
    
    if (success) {
      console.log('✅ Prediction submitted successfully!');
      
      // Try to get the prediction back
      console.log('📖 Testing prediction retrieval...');
      const userPrediction = await predictionsService.getUserPrediction(matchId);
      console.log('User prediction:', userPrediction);
      
      // Get prediction stats
      console.log('📊 Testing prediction stats...');
      const stats = await predictionsService.getMatchPredictionStats(matchId);
      console.log('Prediction stats:', stats);
      
    } else {
      console.log('❌ Prediction submission failed');
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testPredictions().then(() => {
  console.log('🧪 Test completed');
}).catch(error => {
  console.error('🚨 Test error:', error);
});
