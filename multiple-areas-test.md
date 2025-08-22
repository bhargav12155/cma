# CMA API Test - Multiple Residential Areas

## Overview

The CMA Comparables API now supports multiple residential areas/neighborhoods using comma-separated values.

## API Endpoint

`GET /api/cma-comparables`

## Updated Parameters

- `residential_area`: Now accepts comma-separated list of residential areas/neighborhoods
  - Example: `residential_area=West Omaha,Benson,Dundee`

## Curl Test Examples

### Single Residential Area (backward compatible)

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=1234 Dodge St&city=Omaha&sqft=2000&radius_miles=3&sqft_delta=500&months_back=6&residential_area=West Omaha"
```

### Multiple Residential Areas (new feature)

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=1234 Dodge St&city=Omaha&sqft=2000&radius_miles=3&sqft_delta=500&months_back=6&residential_area=West Omaha,Benson,Dundee"
```

### Complete Test with All Parameters

```bash
curl -X GET "http://localhost:3000/api/cma-comparables?address=1234 Dodge St&city=Omaha&sqft=2000&latitude=41.2587&longitude=-95.9378&radius_miles=3&sqft_delta=500&months_back=6&residential_area=West Omaha,Benson,Dundee&price_range=200k_400k&lot_size=large&waterfront=false"
```

## Backend Processing

The server now:

1. Splits the `residential_area` parameter by commas
2. Trims whitespace from each area
3. Filters out empty values
4. Creates OR conditions to match any of the specified areas
5. Searches both SubdivisionName and UnparsedAddress fields for each area

## Filter Logic

For multiple areas like "West Omaha,Benson,Dundee", the server generates:

```odata
(
  (contains(tolower(SubdivisionName),'west omaha') or contains(tolower(UnparsedAddress),'west omaha')) or
  (contains(tolower(SubdivisionName),'benson') or contains(tolower(UnparsedAddress),'benson')) or
  (contains(tolower(SubdivisionName),'dundee') or contains(tolower(UnparsedAddress),'dundee'))
)
```

## Frontend Changes

1. Form now supports multiple residential area inputs
2. Users can add/remove residential areas dynamically
3. Empty areas are filtered out before sending to API
4. Areas are joined with commas for API transmission

## Testing the Feature

1. Start the server: `node server.js`
2. Access the web interface and test the multiple residential areas form
3. Use the curl commands above to test the API directly
4. Check browser network tab to see API calls with multiple areas

## Expected Response

The API returns the same structure but with comparables matching ANY of the specified residential areas:

```json
{
  "active": [...],
  "closed": [...],
  "combined": [...],
  "counts": {
    "active": 10,
    "closed": 25,
    "total": 35
  }
}
```
