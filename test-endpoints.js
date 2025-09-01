// Test script for CMA API endpoints
const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "http://localhost:3002";

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.status === expectedStatus) {
      console.log(`✅ ${name} - Status: ${response.status}`);
      if (data.properties) {
        console.log(`📊 Found ${data.properties.length} properties`);
      } else if (data.count !== undefined) {
        console.log(`📊 Total count: ${data.count}`);
      }
    } else {
      console.log(`❌ ${name} - Status: ${response.status}`);
      console.log(`Error: ${data.error || data.message || "Unknown error"}`);
    }

    return { success: response.status === expectedStatus, data };
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 CMA API Endpoint Tests");
  console.log(`🔗 Base URL: ${API_BASE}`);
  console.log("=" * 50);

  const tests = [
    {
      name: "Health Check",
      url: `${API_BASE}/api/health`,
    },
    {
      name: "Server Status",
      url: `${API_BASE}/api/status`,
    },
    {
      name: "Bearer Token Property Search - Basic",
      url: `${API_BASE}/api/properties/search?status=Active&limit=5`,
    },
    {
      name: "Bearer Token Property Search - $500K+ Houses, 5+ Beds",
      url: `${API_BASE}/api/properties/search?minPrice=500000&bedrooms=5&propertyType=House&status=Active&limit=5`,
    },
    {
      name: "Bearer Token Property Search - Omaha Only",
      url: `${API_BASE}/api/properties/search?city=Omaha&status=Active&limit=10`,
    },
    {
      name: "Legacy Property Search - Comprehensive",
      url: `${API_BASE}/api/property-search?city=Omaha&price_range=500k%2B&beds=5%2B&property_type=House&status=For%20Sale&limit=5`,
    },
    {
      name: "CMA Comparables",
      url: `${API_BASE}/api/cma-comparables?address=1234%20Main%20St&city=Omaha&sqft=2000&radius_miles=2`,
    },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    if (result.success) passed++;
  }

  console.log("\n" + "=" * 50);
  console.log(`📊 Test Results: ${passed}/${total} passed`);

  if (passed === total) {
    console.log("🎉 All tests passed! API is ready for deployment.");
  } else {
    console.log("⚠️  Some tests failed. Check the errors above.");
  }
}

// Run tests
runTests().catch(console.error);
