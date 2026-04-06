// Simple test script to verify the homepage API endpoint
const fetch = require('node-fetch');

async function testHomepageAPI() {
  try {
    console.log('Testing /api/homepage endpoint...');
    
    const response = await fetch('http://localhost:3000/api/homepage', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ API Response Success!');
    console.log('Response structure:');
    console.log('- heroBanners:', result.data?.heroBanners?.length || 0, 'items');
    console.log('- newArrivals:', result.data?.newArrivals?.length || 0, 'items');
    console.log('- topSelling:', result.data?.topSelling?.length || 0, 'items');
    console.log('- categories:', result.data?.categories?.length || 0, 'items');
    console.log('- testimonials:', result.data?.testimonials?.reviews?.length || 0, 'reviews');
    
    // Sample data structure validation
    if (result.data?.newArrivals?.length > 0) {
      console.log('\nSample new arrival product:');
      console.log(JSON.stringify(result.data.newArrivals[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testHomepageAPI();
