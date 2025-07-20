console.log('🔧 Testing filter functionality...');

// Test the filter logic
const testFilters = [
  { period: '7', status: 'all', userId: 'all', dateFrom: '', dateTo: '' },
  { period: '30', status: 'all', userId: 'all', dateFrom: '', dateTo: '' },
  { period: 'all', status: 'all', userId: 'all', dateFrom: '', dateTo: '' },
  { period: '30', status: 'all', userId: 'all', dateFrom: '2025-07-01', dateTo: '2025-07-20' },
];

testFilters.forEach((filters, index) => {
  console.log(`\n🧪 Test ${index + 1}: Filters:`, filters);
  
  const params = new URLSearchParams();
  
  if (filters.period !== 'all') {
    params.append('period', filters.period);
  }
  if (filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.userId !== 'all') {
    params.append('userId', filters.userId);
  }
  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom);
  }
  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo);
  }
  
  console.log('📡 Generated URL params:', params.toString());
  console.log('🔗 Full URL would be:', `/admin/statistics/advanced?${params.toString()}`);
});

console.log('\n✅ Filter test completed');
