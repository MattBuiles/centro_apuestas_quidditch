console.log('🧪 Testing improved filter functionality...');

// Test cases for the improved filter logic
const testCases = [
  {
    name: "Period 7 days selected",
    initialFilters: { period: '30', status: 'all', userId: 'all', dateFrom: '2025-07-01', dateTo: '2025-07-15' },
    change: { key: 'period', value: '7' },
    expectedResult: { period: '7', status: 'all', userId: 'all', dateFrom: '', dateTo: '' }
  },
  {
    name: "Custom date FROM set",
    initialFilters: { period: '30', status: 'all', userId: 'all', dateFrom: '', dateTo: '' },
    change: { key: 'dateFrom', value: '2025-07-01' },
    expectedResult: { period: 'all', status: 'all', userId: 'all', dateFrom: '2025-07-01', dateTo: '' }
  },
  {
    name: "Custom date TO set",
    initialFilters: { period: '30', status: 'all', userId: 'all', dateFrom: '', dateTo: '' },
    change: { key: 'dateTo', value: '2025-07-15' },
    expectedResult: { period: 'all', status: 'all', userId: 'all', dateFrom: '', dateTo: '2025-07-15' }
  }
];

// Simulate the improved handleFilterChange function
function improvedHandleFilterChange(prevFilters, key, value) {
  const newFilters = { ...prevFilters, [key]: value };
  
  // If user selects a predefined period, clear custom date range
  if (key === 'period' && value !== 'all') {
    newFilters.dateFrom = '';
    newFilters.dateTo = '';
  }
  
  // If user sets custom date range, set period to 'all' to use custom range
  if ((key === 'dateFrom' || key === 'dateTo') && value) {
    newFilters.period = 'all';
  }
  
  return newFilters;
}

// Generate URL params based on improved logic
function generateImprovedParams(filters) {
  const params = new URLSearchParams();
  
  // Only send period if no custom date range is set
  if (filters.dateFrom && filters.dateTo) {
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
  } else if (filters.period !== 'all') {
    params.append('period', filters.period);
  }
  
  if (filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.userId !== 'all') {
    params.append('userId', filters.userId);
  }
  
  return params.toString();
}

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
  console.log('📋 Initial filters:', testCase.initialFilters);
  console.log('🔄 Change:', testCase.change);
  
  const result = improvedHandleFilterChange(
    testCase.initialFilters, 
    testCase.change.key, 
    testCase.change.value
  );
  
  console.log('📊 Result filters:', result);
  console.log('✅ Expected:', testCase.expectedResult);
  
  const matches = JSON.stringify(result) === JSON.stringify(testCase.expectedResult);
  console.log(matches ? '✅ PASS' : '❌ FAIL');
  
  const urlParams = generateImprovedParams(result);
  console.log('🔗 Generated URL params:', urlParams);
});

console.log('\n🎯 Testing URL parameter generation scenarios:');

const paramTests = [
  { filters: { period: '7', status: 'all', userId: 'all', dateFrom: '', dateTo: '' }, desc: 'Period only' },
  { filters: { period: 'all', status: 'won', userId: 'all', dateFrom: '2025-07-01', dateTo: '2025-07-15' }, desc: 'Custom dates + status' },
  { filters: { period: 'all', status: 'all', userId: 'user123', dateFrom: '', dateTo: '' }, desc: 'User filter only' },
  { filters: { period: 'all', status: 'all', userId: 'all', dateFrom: '', dateTo: '' }, desc: 'No filters (all)' }
];

paramTests.forEach((test, index) => {
  console.log(`\n🔗 URL Test ${index + 1}: ${test.desc}`);
  console.log('📋 Filters:', test.filters);
  const params = generateImprovedParams(test.filters);
  console.log('📡 URL params:', params || '(empty)');
  console.log('🌐 Full URL:', `/admin/statistics/advanced${params ? '?' + params : ''}`);
});

console.log('\n✅ All filter tests completed!');
