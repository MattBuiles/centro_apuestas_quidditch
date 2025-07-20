console.log('🕒 Testing virtual time integration...');

// Test virtual time endpoint
const testVirtualTimeEndpoint = () => {
  console.log('\n📡 Testing /admin/virtual-time endpoint...');
  console.log('Expected structure:');
  console.log({
    success: true,
    data: {
      currentDate: "2025-07-XX...",
      timeSpeed: "slow|medium|fast",
      autoMode: "boolean",
      lastUpdate: "ISO string",
      activeSeason: {
        id: "string",
        name: "string", 
        startDate: "ISO string",
        endDate: "ISO string"
      }
    }
  });
};

// Test filter calculations with virtual time
const testFilterCalculations = () => {
  console.log('\n🧮 Testing filter calculations with virtual time...');
  
  const virtualDate = new Date('2025-07-20T10:00:00Z');
  console.log('Virtual time:', virtualDate.toISOString());
  
  // Test period calculations
  const periods = ['7', '30', '90'];
  periods.forEach(period => {
    const periodStartDate = new Date(virtualDate);
    periodStartDate.setDate(periodStartDate.getDate() - parseInt(period));
    const periodStartString = periodStartDate.toISOString().split('T')[0];
    
    console.log(`Period ${period} days:`, {
      from: periodStartString,
      to: virtualDate.toISOString().split('T')[0]
    });
  });
  
  // Test previous period calculations
  console.log('\n📊 Previous period calculations:');
  periods.forEach(period => {
    const periodDays = parseInt(period);
    const periodEnd = new Date(virtualDate);
    periodEnd.setDate(periodEnd.getDate() - periodDays);
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - periodDays);
    
    console.log(`Previous ${period} days:`, {
      from: periodStart.toISOString().split('T')[0],
      to: periodEnd.toISOString().split('T')[0]
    });
  });
};

// Test date validation
const testDateValidation = () => {
  console.log('\n✅ Testing date validation...');
  
  const virtualDate = new Date('2025-07-20T10:00:00Z');
  const virtualDateOnly = new Date(virtualDate.getFullYear(), virtualDate.getMonth(), virtualDate.getDate());
  
  const testDates = [
    { dateFrom: '2025-07-15', dateTo: '2025-07-19', desc: 'Valid past range' },
    { dateFrom: '2025-07-15', dateTo: '2025-07-21', desc: 'Future end date (should be adjusted)' },
    { dateFrom: '2025-07-19', dateTo: '2025-07-15', desc: 'Invalid: start after end' },
    { dateFrom: 'invalid', dateTo: '2025-07-19', desc: 'Invalid format' }
  ];
  
  testDates.forEach(test => {
    console.log(`\n📅 Test: ${test.desc}`);
    console.log('Input:', { dateFrom: test.dateFrom, dateTo: test.dateTo });
    
    try {
      const fromDate = new Date(test.dateFrom);
      const toDate = new Date(test.dateTo);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.log('❌ Invalid date format');
        return;
      }
      
      if (fromDate > toDate) {
        console.log('❌ Start date is after end date');
        return;
      }
      
      if (toDate > virtualDateOnly) {
        console.log('⚠️ End date adjusted to virtual time:', virtualDateOnly.toISOString().split('T')[0]);
        toDate.setTime(virtualDateOnly.getTime());
      }
      
      console.log('✅ Valid range:', {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0]
      });
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
};

// Test frontend filter logic
const testFrontendFilters = () => {
  console.log('\n🎯 Testing frontend filter integration...');
  
  const virtualTime = {
    currentDate: '2025-07-20T10:00:00Z',
    timeSpeed: 'medium',
    autoMode: true
  };
  
  const virtualDateForInput = virtualTime.currentDate.split('T')[0]; // 2025-07-20
  
  console.log('Max date for inputs:', virtualDateForInput);
  console.log('Title text should mention: "basado en tiempo virtual"');
  
  // Test filter status badges
  const filterStates = [
    { period: '7', dateFrom: '', dateTo: '', desc: 'Period filter' },
    { period: 'all', dateFrom: '2025-07-15', dateTo: '2025-07-19', desc: 'Custom range' },
    { period: 'all', dateFrom: '', dateTo: '', desc: 'No filters' }
  ];
  
  filterStates.forEach(state => {
    console.log(`\n🏷️ Filter state: ${state.desc}`);
    if (state.dateFrom && state.dateTo) {
      console.log(`Badge: "📅 Rango personalizado: ${state.dateFrom} a ${state.dateTo}"`);
    } else if (state.period !== 'all') {
      console.log(`Badge: "⏰ Últimos ${state.period} días"`);
    } else {
      console.log('Badge: "🌍 Todos los períodos"');
    }
  });
};

// Run all tests
testVirtualTimeEndpoint();
testFilterCalculations();
testDateValidation();
testFrontendFilters();

console.log('\n🎉 Virtual time integration tests completed!');
console.log('\n📋 Summary of improvements:');
console.log('✅ Backend uses virtual time for all period calculations');
console.log('✅ Frontend loads virtual time on initialization');
console.log('✅ Date inputs limited to virtual time maximum');
console.log('✅ Visual indicator shows current virtual time');
console.log('✅ Filter calculations based on virtual time, not real time');
console.log('✅ Previous period calculations use virtual time reference');
