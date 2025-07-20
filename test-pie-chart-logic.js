// Test script to verify pie chart calculation logic
const testData = {
  statusDistribution: [
    {
      label: 'Ganadas',
      value: 15,
      percentage: 30,
      color: '#10B981'
    },
    {
      label: 'Perdidas',
      value: 25,
      percentage: 50,
      color: '#EF4444'
    },
    {
      label: 'Pendientes',
      value: 10,
      percentage: 20,
      color: '#F59E0B'
    },
    {
      label: 'Canceladas',
      value: 0,
      percentage: 0,
      color: '#6B7280'
    }
  ]
};

// Test the pie chart logic
const activeItems = testData.statusDistribution.filter(item => item.value > 0);
console.log('Active items:', activeItems);

if (activeItems.length === 0) {
  console.log('No data - showing gray background');
} else if (activeItems.length === 1) {
  console.log('Single item - solid color:', activeItems[0].color);
} else {
  // Calculate gradient
  const total = activeItems.reduce((sum, item) => sum + item.value, 0);
  let currentDegree = 0;
  
  const gradientParts = activeItems.map((item) => {
    const percentage = (item.value / total) * 100;
    const startDegree = currentDegree;
    const endDegree = currentDegree + (percentage * 3.6);
    currentDegree = endDegree;
    
    console.log(`${item.label}: ${item.value} (${percentage.toFixed(1)}%) = ${startDegree.toFixed(1)}deg to ${endDegree.toFixed(1)}deg`);
    
    return `${item.color} ${startDegree.toFixed(1)}deg ${endDegree.toFixed(1)}deg`;
  });
  
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;
  console.log('Final gradient:', gradient);
}
