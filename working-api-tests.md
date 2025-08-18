# Simple CMA API Test Commands
✅ Server Status: RUNNING on http://localhost:3001
✅ Gemini AI: WORKING 
❌ MLS API: Requires valid Paragon credentials

## PowerShell Commands (TESTED & WORKING)

### 1. Generate Property Description (AI)
$body = @{prompt="Write a compelling real estate description for a 3-bedroom, 2-bathroom ranch home in Omaha, Nebraska. 1,800 sq ft, built in 2005, 2-car garage, finished basement. Keep it under 200 words."} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/generate-text" -Method Post -Body $body -ContentType "application/json"

### 2. Generate Listing Strategy (AI)
$body = @{prompt="As a real estate agent in Omaha, provide a listing strategy for a $350,000 home in average condition. Market shows 15 days average DOM. Suggest pricing and marketing approach in 2-3 sentences."} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/generate-text" -Method Post -Body $body -ContentType "application/json"

### 3. Test MLS Comps (Will fail without valid credentials)
Invoke-RestMethod -Uri "http://localhost:3001/api/comps?city=Omaha&sqft_min=1500&sqft_max=2000" -Method Get

## Traditional Curl Commands (For Linux/Mac/WSL)

### 1. Generate Property Description
curl -X POST http://localhost:3001/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a compelling real estate description for a 3-bedroom, 2-bathroom ranch home in Omaha, Nebraska. 1,800 sq ft, built in 2005, 2-car garage, finished basement. Keep it under 200 words."}'

### 2. Generate Listing Strategy  
curl -X POST http://localhost:3001/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "As a real estate agent in Omaha, provide a listing strategy for a $350,000 home in average condition. Market shows 15 days average DOM. Suggest pricing and marketing approach in 2-3 sentences."}'

### 3. Test MLS Comps
curl "http://localhost:3001/api/comps?city=Omaha&sqft_min=1500&sqft_max=2000"

## More AI Prompts to Try

### Market Analysis Prompt
$body = @{prompt="Analyze the Omaha real estate market for properties around $300-400k. What are the key selling points buyers look for? Keep response under 150 words."} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/generate-text" -Method Post -Body $body -ContentType "application/json"

### Renovation Suggestions
$body = @{prompt="List 5 cost-effective home improvements that add the most value for a 1990s ranch home in Nebraska. Include approximate costs and ROI."} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/generate-text" -Method Post -Body $body -ContentType "application/json"

## Test Results:
✅ Gemini AI API: Successfully generating property descriptions and strategies
❌ Paragon MLS API: Authentication fails (expected - needs valid credentials)
✅ Server: Running stable on port 3001

## Next Steps for Production:
1. Add valid MLS API credentials to environment variables
2. Implement error handling for API rate limits
3. Add caching for frequently requested data
4. Deploy to AWS with proper environment configuration
