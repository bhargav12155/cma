# Gretna CMA Issue Analysis & Curl Commands

## 🚨 KEY ISSUES IDENTIFIED

### 1. **Data Source Mismatch**

- Our API is returning different properties than the PDF report
- The PDF shows specific MLS#s (22516445, 22516866, 22502674, etc.) that we're not finding
- This suggests we may be using a different MLS database or data source

### 2. **Missing Recent Sales Data**

- PDF shows sales from 2025 (very recent)
- Our API might not have the most current listings

### 3. **Property Filtering Issues**

- Many properties have 0 sqft or $0 prices (likely vacant lots)
- Need better filtering for actual homes

## 🧪 TEST CURL COMMANDS

### Basic Gretna Test (Current API)

```bash
# Test 1: Basic search with filters for actual houses
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12" | jq '.combined[] | select(.sqft > 1000 and (.soldPrice // .listPrice) > 100000) | {address, price: (.soldPrice // .listPrice), status, sqft, subdivision, closeDate}' | head -10
```

### Test with Multiple Residential Areas

```bash
# Test 2: Using subdivision names as residential areas
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&residential_area=Remington West,REMINGTON WEST,Cottonwood" | jq '.combined[] | select(.sqft > 1000 and (.soldPrice // .listPrice) > 100000) | {address, price: (.soldPrice // .listPrice), status, sqft, subdivision}'
```

### Test with Street Names

```bash
# Test 3: Search for specific streets from PDF
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&residential_area=Cottonwood Street,Briar Street,Birch Avenue" | jq '.combined[] | select(.sqft > 1000) | {address, price: (.soldPrice // .listPrice), status, sqft}'
```

### Debug: Check All Gretna Properties

```bash
# Test 4: See all available Gretna properties with actual houses
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&radius_miles=10&months_back=24" | jq '.combined[] | select(.sqft > 1000 and (.soldPrice // .listPrice) > 100000) | {address, price: (.soldPrice // .listPrice), status, sqft, subdivision}' | head -20
```

### Search for Specific Addresses from PDF

```bash
# Test 5: Look for exact addresses from PDF
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&radius_miles=10&months_back=24" | jq '.combined[] | select(.address | test("19756|19817|19859|7707|19856|8008"; "i"))'
```

### Search by Subdivision

```bash
# Test 6: Subject property is in "REMINGTON WEST" - find similar
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12" | jq '.combined[] | select(.subdivision | test("REMINGTON|Remington"; "i")) | {address, price: (.soldPrice // .listPrice), status, sqft, subdivision}'
```

## 📊 COMPARISON: PDF vs API Results

### PDF Properties (Expected):

1. **19756 Briar Street** - $639,000 (PENDING) - $299.86/sqft
2. **19817 Cottonwood Street** - $623,900 (ACTIVE) - $340.00/sqft
3. **19859 Cottonwood Street** - $564,900 (SOLD 5/7/2025) - $300.80/sqft
4. **7707 S 199 Street** - $528,000 (SOLD 6/6/2025) - $279.37/sqft
5. **19856 Birch Avenue** - $442,500 (SOLD 7/10/2025) - $290.93/sqft
6. **8008 S 200 Street** - $439,900 (NEW) - $286.95/sqft

### API Results (Sample):

1. **410 Highland Drive** - $273,000 (Active) - 1636 sqft
2. **20555 Margo Street** - $276,990 (Active) - 1511 sqft
3. **8114 S 199 Street** - $372,900 (Active) - 1986 sqft ⭐ _Closest match_

## 🔍 ROOT CAUSE ANALYSIS

### Possible Issues:

1. **Different MLS System**: Our API might use a different MLS than the PDF report
2. **Data Lag**: MLS data might not be real-time or current
3. **Access Permissions**: Limited access to certain listings or recent data
4. **Geographic Filtering**: Search parameters might be too restrictive
5. **Status Filtering**: Not including all property statuses (PENDING, NEW, etc.)

### Immediate Action Items:

1. **Verify MLS Data Source**: Check which MLS our Paragon API is connected to
2. **Test Date Ranges**: Try different months_back values (6, 12, 24)
3. **Expand Radius**: Test with larger radius_miles (5, 10, 15)
4. **Check Status Types**: Ensure we're getting ACTIVE, PENDING, SOLD, NEW statuses
5. **Validate Property Types**: Make sure we're not filtering out relevant property types

## 🧪 COMPREHENSIVE TEST

```bash
# Ultimate test - get everything in Gretna area
curl -X GET "http://localhost:3001/api/cma-comparables?city=Gretna&radius_miles=15&sqft_delta=2000&months_back=36" | jq '{total: .counts.total, sample_properties: (.combined[0:5] | map({address, price: (.soldPrice // .listPrice), status, sqft, subdivision}))}'
```

## 🎯 EXPECTED VS ACTUAL

The core issue is that **our API is not returning the same properties as the PDF report**. This suggests either:

1. **Different data source** (different MLS system)
2. **Data synchronization issues** (delayed updates)
3. **Search algorithm differences** (different matching criteria)
4. **Access level differences** (restricted access to certain listings)

The curl commands above will help identify which of these is the root cause.
