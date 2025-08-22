# Gretna CMA Test - 19863 Cottonwood Street

## Subject Property Details

- **Address**: 19863 Cottonwood Street
- **City**: Gretna
- **State**: NE
- **County**: Sarpy
- **Bedrooms**: 5
- **Bathrooms**: 3
- **Above Grade SQFT**: 1,890
- **Total Finished Below Grade**: 1,686
- **Garage Spaces**: 3
- **School District**: Gretna

## Expected Comparable Properties (from PDF)

1. **19756 Briar Street** - $639,000 (PENDING) - $299.86/sqft
2. **19817 Cottonwood Street** - $623,900 (ACTIVE) - $340.00/sqft
3. **19859 Cottonwood Street** - $564,900 (SOLD 5/7/2025) - $300.80/sqft
4. **7707 S 199 Street** - $528,000 (SOLD 6/6/2025) - $279.37/sqft
5. **19856 Birch Avenue** - $442,500 (SOLD 7/10/2025) - $290.93/sqft
6. **8008 S 200 Street** - $439,900 (NEW) - $286.95/sqft

## Test Curl Commands

### Basic Test - City Only

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12" | jq '.'
```

### Test with Full Address

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=19863 Cottonwood Street&city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12" | jq '.'
```

### Test with County Filter

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=19863 Cottonwood Street&city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&county=Sarpy" | jq '.'
```

### Test with Multiple Residential Areas

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=19863 Cottonwood Street&city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&residential_area=Cottonwood,Briar,Birch" | jq '.'
```

### Test with Street Names as Residential Areas

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=19863 Cottonwood Street&city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&residential_area=Cottonwood Street,Briar Street,Birch Avenue" | jq '.'
```

### Comprehensive Test with All Parameters

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=19863 Cottonwood Street&city=Gretna&sqft=1890&radius_miles=5&sqft_delta=1000&months_back=12&residential_area=Cottonwood,Briar,Birch&price_range=400k_750k" | jq '.'
```

### Debug Test - No Filters (Get All Gretna Properties)

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?city=Gretna&radius_miles=10&sqft_delta=2000&months_back=24" | jq '.'
```

## Debugging Steps

1. **Check if MLS data contains these properties**:

   ```bash
   curl -X GET "http://localhost:3000/api/cma-comparables?city=Gretna&radius_miles=10&months_back=24" | jq '.combined[] | select(.address | contains("Cottonwood"))'
   ```

2. **Look for specific MLS numbers**:

   ```bash
   curl -X GET "http://localhost:3000/api/cma-comparables?city=Gretna&radius_miles=10&months_back=24" | jq '.combined[] | select(.mlsNumber == "22516445" or .mlsNumber == "22516866" or .mlsNumber == "22502674")'
   ```

3. **Check raw API response structure**:
   ```bash
   curl -X GET "http://localhost:3000/api/cma-comparables?city=Gretna&sqft=1890&radius_miles=2&sqft_delta=500&months_back=6" | jq 'keys'
   ```

## Potential Issues

1. **MLS Data Source**: Our API might be using different MLS data than the PDF report
2. **Date Range**: PDF shows recent sales (2025), our API might have different date filters
3. **Property Status**: Need to ensure we're getting ACTIVE, PENDING, and SOLD properties
4. **Search Radius**: PDF comps are very close (same street), might need smaller radius
5. **Data Fields**: Property addresses in our API might be formatted differently

## Next Steps

1. Run the debug curl to see what properties are available in Gretna
2. Compare MLS numbers if available
3. Check if our API is hitting the right MLS database
4. Verify date filters are working correctly
5. Check if property status filters are working (ACTIVE, PENDING, SOLD)
