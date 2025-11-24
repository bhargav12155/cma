# Filter Endpoints Documentation

## Overview
This document provides comprehensive information about the bedroom and garage filter endpoints for the CMA (Comparative Market Analysis) application. These endpoints are used by the frontend to search and filter properties.

## Base URL
```
http://gbcma
```

---

## 🛏️ Bedroom Filter Endpoints

### 1. Property Search with Bedroom Filter
**Endpoint:** `/api/property-search-new`  
**Method:** `GET`  
**Description:** Main endpoint used by the home template for property searches with bedroom filtering

#### Parameters:
- `beds` - Bedroom filter (supports ranges and exact counts)
- `zip_code` - ZIP code filter
- `city` - City filter
- `limit` - Number of results to return (default: 200)

#### Bedroom Filter Formats:
| Format | Description | Example | API Query Generated |
|--------|-------------|---------|-------------------|
| `beds=3` | Exactly 3 bedrooms | `beds=3` | `BedroomsTotal eq 3` |
| `beds=3+` | 3 or more bedrooms | `beds=3%2B` | `BedroomsTotal ge 3` |
| `min_beds=2&max_beds=5` | Range: 2-5 bedrooms | `min_beds=2&max_beds=5` | `BedroomsTotal ge 2 and BedroomsTotal le 5` |
| `beds=4+&max_beds=6` | Complex: 4-6 bedrooms | `beds=4%2B&max_beds=6` | `BedroomsTotal ge 4 and BedroomsTotal le 6` |

#### Example Requests:
```bash
# Exact bedroom count
GET /api/property-search-new?beds=3&limit=10

# Minimum bedroom count  
GET /api/property-search-new?beds=3%2B&limit=10

# Bedroom range
GET /api/property-search-new?min_beds=2&max_beds=5&limit=10

# Combined with ZIP code
GET /api/property-search-new?zip_code=68022&beds=5%2B&limit=10
```

#### Response Format:
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 586723,
  "properties": [
    {
      "id": "property-id",
      "address": "123 Main St, City NE 68022",
      "city": "City",
      "zipCode": "68022",
      "beds": 4,
      "baths": 3,
      "garage": 2,
      "listPrice": 350000,
      "status": "Active",
      "sqft": 2100,
      "yearBuilt": 2010
    }
  ],
  "searchFilters": {
    "beds": "3+",
    "zip_code": "68022",
    "limit": "10"
  },
  "apiUrl": "https://api.paragonapi.com/api/v2/OData/bk9/Properties?..."
}
```

### 2. Bedroom Filter Testing Endpoint
**Endpoint:** `/api/test-bedroom-filter`  
**Method:** `GET`  
**Description:** Test endpoint to validate bedroom filter logic without actual property search

#### Parameters:
- `beds` - Bedroom filter to test
- `min_beds` - Minimum bedroom count
- `max_beds` - Maximum bedroom count

#### Example Requests:
```bash
# Test exact bedroom filter
GET /api/test-bedroom-filter?beds=3

# Test range filter
GET /api/test-bedroom-filter?beds=3%2B

# Test complex range
GET /api/test-bedroom-filter?min_beds=2&max_beds=5
```

#### Response Format:
```json
{
  "success": true,
  "message": "Bedroom filter test completed",
  "input": {
    "beds": "3+"
  },
  "filters_applied": ["3+ bedrooms"],
  "mls_query_parts": ["BedroomsTotal ge 3"],
  "explanations": ["✅ \"3+\" means find properties with 3 or more bedrooms"],
  "summary": {
    "total_filters": 1,
    "valid_filters": 1,
    "combined_mls_query": "BedroomsTotal ge 3"
  },
  "examples": {
    "beds=3": "Find properties with exactly 3 bedrooms",
    "beds=3+": "Find properties with 3 or more bedrooms",
    "min_beds=2&max_beds=5": "Find properties with 2-5 bedrooms",
    "beds=4+&max_beds=6": "Find properties with 4-6 bedrooms"
  }
}
```

---

## 🚗 Garage Filter Endpoints

### 1. Property Search with Garage Filter
**Endpoint:** `/api/property-search-new`  
**Method:** `GET`  
**Description:** Main endpoint for property searches with garage filtering

#### Parameters:
- `garage_spaces` - Garage spaces filter (exact count only)
- `zip_code` - ZIP code filter
- `city` - City filter
- `limit` - Number of results to return

#### Garage Filter Format:
| Format | Description | Example | API Query Generated |
|--------|-------------|---------|-------------------|
| `garage_spaces=2` | Exactly 2 garage spaces | `garage_spaces=2` | `GarageSpaces eq 2` |
| `garage_spaces=3` | Exactly 3 garage spaces | `garage_spaces=3` | `GarageSpaces eq 3` |
| `garage_spaces=4` | Exactly 4 garage spaces | `garage_spaces=4` | `GarageSpaces eq 4` |

**Note:** Unlike bedroom filters, garage filters only support exact matches. No "+" suffix or range functionality is currently implemented.

#### Example Requests:
```bash
# Exact garage count
GET /api/property-search-new?garage_spaces=3&limit=10

# Combined with ZIP code
GET /api/property-search-new?zip_code=68022&garage_spaces=2&limit=10

# Combined with bedrooms and ZIP
GET /api/property-search-new?zip_code=68022&beds=4%2B&garage_spaces=3&limit=10
```

#### Response Format:
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 387,
  "properties": [
    {
      "id": "property-id", 
      "address": "456 Oak Ave, City NE 68022",
      "garage": 3,
      "beds": 4,
      "baths": 3,
      "listPrice": 425000,
      "status": "Active"
    }
  ],
  "searchFilters": {
    "zip_code": "68022",
    "garage_spaces": "3",
    "beds": "4+",
    "limit": "10"
  },
  "apiUrl": "https://api.paragonapi.com/api/v2/OData/bk9/Properties?..."
}
```

---

## 🔗 Combined Filter Examples

### Multi-Criteria Search
```bash
# ZIP + Bedrooms + Garage
GET /api/property-search-new?zip_code=68022&beds=5%2B&garage_spaces=3&limit=10

# City + Bedrooms
GET /api/property-search-new?city=Elkhorn&beds=4%2B&limit=15

# ZIP + Bedroom Range
GET /api/property-search-new?zip_code=68002&min_beds=3&max_beds=5&limit=20
```

---

## 📊 Frontend Integration Guidelines

### 1. Filter UI Components

#### Bedroom Filter UI:
```javascript
// Bedroom filter options for dropdown/buttons
const bedroomOptions = [
  { value: '1', label: '1 Bedroom' },
  { value: '2', label: '2 Bedrooms' },
  { value: '3', label: '3 Bedrooms' },
  { value: '4', label: '4 Bedrooms' },
  { value: '5', label: '5 Bedrooms' },
  { value: '3+', label: '3+ Bedrooms' },
  { value: '4+', label: '4+ Bedrooms' },
  { value: '5+', label: '5+ Bedrooms' }
];
```

#### Garage Filter UI:
```javascript
// Garage filter options
const garageOptions = [
  { value: '1', label: '1 Garage Space' },
  { value: '2', label: '2 Garage Spaces' },
  { value: '3', label: '3 Garage Spaces' },
  { value: '4', label: '4 Garage Spaces' },
  { value: '5', label: '5+ Garage Spaces' }
];
```

### 2. Building Search URLs

#### JavaScript Example:
```javascript
function buildSearchUrl(filters) {
  const baseUrl = '/api/property-search-new';
  const params = new URLSearchParams();
  
  // Add filters
  if (filters.zipCode) params.set('zip_code', filters.zipCode);
  if (filters.city) params.set('city', filters.city);
  if (filters.bedrooms) params.set('beds', filters.bedrooms);
  if (filters.garageSpaces) params.set('garage_spaces', filters.garageSpaces);
  if (filters.limit) params.set('limit', filters.limit);
  
  return `${baseUrl}?${params.toString()}`;
}

// Usage
const searchUrl = buildSearchUrl({
  zipCode: '68022',
  bedrooms: '4+',
  garageSpaces: '3',
  limit: 20
});
```

### 3. Displaying Active Filters

#### Active Filter Display:
```javascript
function displayActiveFilters(searchFilters) {
  const filterDisplay = [];
  
  if (searchFilters.zip_code) {
    filterDisplay.push(`ZIP: ${searchFilters.zip_code}`);
  }
  
  if (searchFilters.beds) {
    const bedsLabel = searchFilters.beds.includes('+') 
      ? `${searchFilters.beds} bedrooms` 
      : `${searchFilters.beds} bedrooms (exact)`;
    filterDisplay.push(`Beds: ${bedsLabel}`);
  }
  
  if (searchFilters.garage_spaces) {
    filterDisplay.push(`Garage: ${searchFilters.garage_spaces} spaces`);
  }
  
  return filterDisplay;
}
```

### 4. Error Handling

#### Common Error Scenarios:
```javascript
// Handle API errors
function handleSearchError(error) {
  if (error.message.includes('Invalid beds parameter')) {
    return 'Please enter a valid bedroom count (1-20)';
  }
  if (error.message.includes('Cannot GET')) {
    return 'Search endpoint not available';
  }
  return 'Search failed. Please try again.';
}
```

---

## 🔍 Filter Validation Rules

### Bedroom Filters:
- **Valid formats:** `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `3+`, `4+`, `5+`, etc.
- **Range:** 1-20 bedrooms
- **Invalid examples:** `abc`, `0`, `21`, `-1`

### Garage Filters:
- **Valid formats:** `1`, `2`, `3`, `4`, `5`, `6`, etc.
- **Range:** 1-10 garage spaces
- **Invalid examples:** `abc`, `0`, `2+` (plus not supported), `-1`

---

## 📈 Performance Considerations

### Optimization Tips:
1. **Limit Results:** Always include a reasonable `limit` parameter (10-50)
2. **Cache Results:** Consider caching frequent searches
3. **Debounce Input:** Debounce filter changes to avoid excessive API calls
4. **Progressive Loading:** Load initial results quickly, then fetch more as needed

### Example Limits by Use Case:
- **Quick Preview:** `limit=5`
- **Standard Search:** `limit=20`
- **Detailed Analysis:** `limit=50`
- **Export/Report:** `limit=200`

---

## 🚀 Quick Start Examples

### Basic Property Search:
```bash
# Get 5 properties with 3+ bedrooms in ZIP 68022
curl "http://gbcma/api/property-search-new?zip_code=68022&beds=3%2B&limit=5"
```

### Test Bedroom Filter:
```bash
# Test if "4+" bedroom filter works
curl "http://gbcma/api/test-bedroom-filter?beds=4%2B"
```

### Combined Filters:
```bash
# Luxury homes: 5+ beds, 3+ garage, specific ZIP
curl "http://gbcma/api/property-search-new?zip_code=68022&beds=5%2B&garage_spaces=3&limit=10"
```

---

## 📞 Support

For questions or issues with these endpoints:
1. Check the `/api/health` endpoint to ensure the server is running
2. Use `/api/test-bedroom-filter` to validate bedroom filter logic
3. Review the `apiUrl` field in responses to see the actual MLS query generated
4. Check server logs for detailed error information

**Last Updated:** October 29, 2025  
**API Version:** 2.10.2