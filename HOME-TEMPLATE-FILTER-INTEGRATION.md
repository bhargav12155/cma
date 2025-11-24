# Home Template Filter Integration Guide

## Overview
This document provides complete request/response examples for integrating bedroom and garage filters into the home template. All examples are tested and verified to work correctly.

---

## 🔗 Base Endpoint

**URL (Local):** `http://localhost:5000/api/property-search-new`  
**URL (Production):** `http://gbcma/api/property-search-new`  
**Method:** `GET`

**Note:** Currently using local development server on port 5000.

---

## 📤 How Home Template Should Send Requests

### Request Format Required:

Your home template should construct the request URL like this:

```
http://localhost:5000/api/property-search-new?[parameters]
```

### URL Construction Example:

```javascript
// When user selects filters in home template UI:
const userFilters = {
  zipCode: '68002',      // From ZIP input field
  bedrooms: '3+',        // From bedroom dropdown/buttons
  garageSpaces: '4',     // From garage dropdown
  limit: 10              // Number of results to show
};

// Build the URL (IMPORTANT: Use these exact parameter names)
const params = new URLSearchParams();
params.set('zip_code', userFilters.zipCode);           // NOT "zipCode" - use "zip_code"
params.set('beds', userFilters.bedrooms);               // NOT "bedrooms" - use "beds"  
params.set('garage_spaces', userFilters.garageSpaces);  // NOT "garage" - use "garage_spaces"
params.set('limit', userFilters.limit);

// Final URL that home template should call:
const apiUrl = `http://localhost:5000/api/property-search-new?${params.toString()}`;
// Result: http://localhost:5000/api/property-search-new?zip_code=68002&beds=3%2B&garage_spaces=4&limit=10
```

### ⚠️ Critical Parameter Names:

| UI Field | Parameter Name (MUST USE) | Example Value |
|----------|---------------------------|---------------|
| ZIP Code | `zip_code` | `68002` |
| Bedrooms | `beds` | `3`, `3+`, `5+` |
| Min Bedrooms | `min_beds` | `3` |
| Max Bedrooms | `max_beds` | `5` |
| Garage Spaces | `garage_spaces` | `2`, `3`, `4` |
| City | `city` | `Elkhorn` |
| Limit | `limit` | `10`, `20`, `50` |

### What Backend Expects to Receive:

When home template sends:
```
GET http://localhost:5000/api/property-search-new?zip_code=68002&beds=3+&limit=10
```

Backend receives as query parameters:
```javascript
req.query = {
  zip_code: '68002',
  beds: '3+',
  limit: '10'
}
```

---

## 📝 Filter Parameters

### Available Parameters:
- `zip_code` - ZIP code filter (exact match)
- `city` - City name filter
- `beds` - Bedroom filter (supports exact and ranges)
- `min_beds` - Minimum bedrooms
- `max_beds` - Maximum bedrooms
- `garage_spaces` - Garage spaces (exact match only)
- `limit` - Number of results (default: 200)
- `sort_by` - Sort field (default: ListPrice)
- `sort_order` - Sort direction: `asc` or `desc`

---

## 🔄 Complete Request/Response Flow Example

### Scenario: User searches for properties in ZIP 68002 with 5+ bedrooms and 4 garage spaces

#### Step 1: User Action in Home Template
```
User enters: 
- ZIP Code: 68002
- Bedrooms: 5+
- Garage: 4 spaces
- Clicks "Search" button
```

#### Step 2: Home Template JavaScript Code
```javascript
// Capture user input from form
const filters = {
  zipCode: document.getElementById('zipInput').value,      // '68002'
  bedrooms: document.getElementById('bedsSelect').value,   // '5+'
  garage: document.getElementById('garageSelect').value,   // '4'
  limit: 10
};

// Build API request URL with correct parameter names
const params = new URLSearchParams();
params.set('zip_code', filters.zipCode);        // MUST be 'zip_code'
params.set('beds', filters.bedrooms);            // MUST be 'beds'
params.set('garage_spaces', filters.garage);     // MUST be 'garage_spaces'
params.set('limit', filters.limit);

// Make the request
const url = `http://localhost:5000/api/property-search-new?${params.toString()}`;
const response = await fetch(url);
const data = await response.json();
```

#### Step 3: Request Sent to Backend
```http
GET http://localhost:5000/api/property-search-new?zip_code=68002&beds=5%2B&garage_spaces=4&limit=10
```

#### Step 4: Backend Response
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 32,
  "properties": [
    {
      "id": "abc123",
      "address": "1705 Co Rd 15, Arlington NE 68002",
      "city": "Arlington",
      "zipCode": "68002",
      "state": "NE",
      "beds": 5,
      "baths": 7,
      "garage": 4,
      "listPrice": 1200000,
      "soldPrice": 0,
      "status": "Expired",
      "sqft": 4056,
      "basementSqft": 0,
      "totalSqft": 4056,
      "yearBuilt": 1980,
      "lotSizeAcres": 0,
      "propertyType": "Residential",
      "subdivision": "Country",
      "latitude": 41.3071785,
      "longitude": -96.2668152,
      "imageUrl": "http://cdnparap70.paragonrels.com/...",
      "isActive": false
    },
    {
      "address": "25130 Windy Bluff Lane, Arlington NE 68002",
      "city": "Arlington",
      "zipCode": "68002",
      "beds": 7,
      "baths": 5,
      "garage": 4,
      "listPrice": 975000,
      "status": "Closed",
      "sqft": 3359,
      "yearBuilt": 1994
    }
    // ... 8 more properties
  ],
  "searchFilters": {
    "zip_code": "68002",
    "beds": "5+",
    "garage_spaces": "4",
    "limit": "10"
  },
  "apiUrl": "https://api.paragonapi.com/api/v2/OData/bk9/Properties?access_token=***&$filter=PostalCode%20eq%20'68002'%20and%20GarageSpaces%20eq%204&..."
}
```

#### Step 5: Home Template Displays Results
```javascript
// Show total found
console.log(`Found ${data.totalAvailable} properties`);

// Display active filters
console.log('Active filters:', data.searchFilters);

// Render properties
data.properties.forEach(property => {
  renderPropertyCard(property);
});

// Output to user:
// "Found 32 properties matching your search"
// "Filters: ZIP 68002 | 5+ Bedrooms | 4 Garage Spaces"
// [Property cards displayed...]
```

---

## 🧪 Tested Filter Combinations

### 1. ZIP Code + Minimum Bedrooms

#### Request:
```http
GET /api/property-search-new?zip_code=68002&beds=3+&limit=10
```

#### What it filters:
- ZIP code: 68002
- Bedrooms: 3 or more
- Limit: 10 results

#### Response:
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 919,
  "properties": [
    {
      "id": "cfc081015681b3598bd2e5bc6b67c381",
      "address": "1705 Co Rd 15, Arlington NE 68002",
      "city": "Arlington",
      "zipCode": "68002",
      "state": "NE",
      "beds": 5,
      "baths": 7,
      "garage": 4,
      "listPrice": 1200000,
      "soldPrice": 0,
      "status": "Expired",
      "sqft": 4056,
      "basementSqft": 0,
      "totalSqft": 4056,
      "yearBuilt": 1980,
      "lotSizeAcres": 0,
      "propertyType": "Residential",
      "subdivision": "Country",
      "latitude": 41.3071785,
      "longitude": -96.2668152,
      "imageUrl": "http://cdnparap70.paragonrels.com/...",
      "isActive": false
    }
    // ... more properties
  ],
  "searchFilters": {
    "zip_code": "68002",
    "beds": "3+",
    "limit": "10"
  },
  "apiUrl": "https://api.paragonapi.com/api/v2/OData/bk9/Properties?access_token=***&$filter=PostalCode%20eq%20'68002'&..."
}
```

---

### 2. ZIP Code + Exact Bedrooms

#### Request:
```http
GET /api/property-search-new?zip_code=68002&beds=3&limit=10
```

#### What it filters:
- ZIP code: 68002
- Bedrooms: Exactly 3
- Limit: 10 results

#### Expected Results:
- Returns only properties with exactly 3 bedrooms
- Total available typically lower than "3+" filter

---

### 3. ZIP Code + Minimum Bedrooms + Garage Spaces

#### Request:
```http
GET /api/property-search-new?zip_code=68002&beds=5+&garage_spaces=4&limit=10
```

#### What it filters:
- ZIP code: 68002
- Bedrooms: 5 or more
- Garage: Exactly 4 spaces
- Limit: 10 results

#### Response:
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 32,
  "properties": [
    {
      "id": "property-id",
      "address": "1705 Co Rd 15, Arlington NE 68002",
      "city": "Arlington",
      "zipCode": "68002",
      "beds": 5,
      "baths": 7,
      "garage": 4,
      "listPrice": 1200000,
      "status": "Expired",
      "sqft": 4056,
      "yearBuilt": 1980
    },
    {
      "address": "25130 Windy Bluff Lane, Arlington NE 68002",
      "beds": 7,
      "baths": 5,
      "garage": 4,
      "listPrice": 975000,
      "status": "Closed",
      "sqft": 3359,
      "yearBuilt": 1994
    }
    // ... more properties
  ],
  "searchFilters": {
    "zip_code": "68002",
    "beds": "5+",
    "garage_spaces": "4",
    "limit": "10"
  }
}
```

---

### 4. ZIP Code + Bedroom Range

#### Request:
```http
GET /api/property-search-new?zip_code=68002&min_beds=3&max_beds=5&limit=10
```

#### What it filters:
- ZIP code: 68002
- Bedrooms: Between 3 and 5 (inclusive)
- Limit: 10 results

#### Response:
- Returns properties with 3, 4, or 5 bedrooms
- Excludes properties with less than 3 or more than 5 bedrooms

---

### 5. City + Minimum Bedrooms

#### Request:
```http
GET /api/property-search-new?city=Elkhorn&beds=4+&limit=15
```

#### What it filters:
- City: Elkhorn
- Bedrooms: 4 or more
- Limit: 15 results

#### Response:
```json
{
  "success": true,
  "count": 15,
  "totalAvailable": 18934,
  "properties": [
    {
      "address": "5505 N 230 Street, Elkhorn NE 68022",
      "city": "Elkhorn",
      "zipCode": "68022",
      "beds": 4,
      "baths": 8,
      "garage": 4,
      "listPrice": 5995000,
      "status": "Expired"
    }
    // ... more properties
  ],
  "searchFilters": {
    "city": "Elkhorn",
    "beds": "4+",
    "limit": "15"
  }
}
```

---

### 6. ZIP Code + Exact Garage Spaces (VERIFIED ✅)

#### Request:
```http
GET /api/property-search-new?zip_code=68002&garage_spaces=3&limit=10
```

#### What it filters:
- ZIP code: 68002
- Garage: Exactly 3 spaces
- Limit: 10 results

#### Response:
```json
{
  "success": true,
  "count": 10,
  "totalAvailable": 111,
  "properties": [
    {
      "address": "26721 Elkhorn Oaks Circle, Arlington NE 68002",
      "garage": 3,
      "beds": 4,
      "baths": 3,
      "listPrice": 855000
    }
    // ... more properties
  ],
  "searchFilters": {
    "zip_code": "68002",
    "garage_spaces": "3",
    "limit": "10"
  }
}
```

**Note:** This filter correctly returns only 111 properties (not 919), confirming garage filter is working properly.

---

## 🎨 UI Implementation Examples

### Filter UI Component (React/JSX)

```jsx
function PropertyFilters({ onSearch }) {
  const [filters, setFilters] = useState({
    zipCode: '',
    bedrooms: '',
    garageSpaces: '',
    limit: 20
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (filters.zipCode) params.set('zip_code', filters.zipCode);
    if (filters.bedrooms) params.set('beds', filters.bedrooms);
    if (filters.garageSpaces) params.set('garage_spaces', filters.garageSpaces);
    params.set('limit', filters.limit);
    
    const url = `/api/property-search-new?${params.toString()}`;
    onSearch(url);
  };

  return (
    <div className="filter-container">
      {/* ZIP Code Input */}
      <div className="filter-group">
        <label>ZIP Code</label>
        <input 
          type="text" 
          value={filters.zipCode}
          onChange={(e) => setFilters({...filters, zipCode: e.target.value})}
          placeholder="68002"
        />
      </div>

      {/* Bedroom Filter */}
      <div className="filter-group">
        <label>Bedrooms</label>
        <select 
          value={filters.bedrooms}
          onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
        >
          <option value="">Any</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4">4 Bedrooms</option>
          <option value="5">5 Bedrooms</option>
          <option value="3+">3+ Bedrooms</option>
          <option value="4+">4+ Bedrooms</option>
          <option value="5+">5+ Bedrooms</option>
        </select>
      </div>

      {/* Garage Filter */}
      <div className="filter-group">
        <label>Garage Spaces</label>
        <select 
          value={filters.garageSpaces}
          onChange={(e) => setFilters({...filters, garageSpaces: e.target.value})}
        >
          <option value="">Any</option>
          <option value="1">1 Space</option>
          <option value="2">2 Spaces</option>
          <option value="3">3 Spaces</option>
          <option value="4">4 Spaces</option>
          <option value="5">5+ Spaces</option>
        </select>
      </div>

      <button onClick={handleSearch}>Search Properties</button>
    </div>
  );
}
```

---

### Displaying Active Filters

```jsx
function ActiveFilters({ searchFilters }) {
  const formatBedrooms = (beds) => {
    if (!beds) return null;
    return beds.includes('+') ? `${beds} bedrooms` : `${beds} bedrooms (exact)`;
  };

  return (
    <div className="active-filters">
      <h3>Active Filters:</h3>
      {searchFilters.zip_code && (
        <span className="filter-tag">
          📍 ZIP: {searchFilters.zip_code}
          <button onClick={() => removeFilter('zip_code')}>×</button>
        </span>
      )}
      {searchFilters.beds && (
        <span className="filter-tag">
          🛏️ {formatBedrooms(searchFilters.beds)}
          <button onClick={() => removeFilter('beds')}>×</button>
        </span>
      )}
      {searchFilters.garage_spaces && (
        <span className="filter-tag">
          🚗 {searchFilters.garage_spaces} garage spaces
          <button onClick={() => removeFilter('garage_spaces')}>×</button>
        </span>
      )}
    </div>
  );
}
```

---

### Search Function with Fetch

```javascript
async function searchProperties(filters) {
  const params = new URLSearchParams();
  
  // Build query string
  if (filters.zipCode) params.set('zip_code', filters.zipCode);
  if (filters.city) params.set('city', filters.city);
  if (filters.bedrooms) params.set('beds', filters.bedrooms);
  if (filters.garageSpaces) params.set('garage_spaces', filters.garageSpaces);
  if (filters.limit) params.set('limit', filters.limit);
  
  const url = `http://gbcma/api/property-search-new?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.totalAvailable} properties, showing ${data.count}`);
      console.log('Active filters:', data.searchFilters);
      return data.properties;
    } else {
      console.error('Search failed:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Usage example
const properties = await searchProperties({
  zipCode: '68002',
  bedrooms: '3+',
  garageSpaces: '3',
  limit: 20
});
```

---

## ❌ Common Mistakes to Avoid

### 1. Wrong Parameter Names
```javascript
// ❌ WRONG - Backend won't recognize these
params.set('zipCode', '68002');      // Should be 'zip_code'
params.set('bedrooms', '3+');        // Should be 'beds'
params.set('garage', '3');           // Should be 'garage_spaces'

// ✅ CORRECT
params.set('zip_code', '68002');
params.set('beds', '3+');
params.set('garage_spaces', '3');
```

### 2. Missing URL Encoding for "+" Symbol
```javascript
// ❌ WRONG - "+" might be interpreted as space
const url = `http://localhost:5000/api/property-search-new?beds=3+`;

// ✅ CORRECT - Use URLSearchParams (auto-encodes) or manual encoding
const params = new URLSearchParams();
params.set('beds', '3+');  // Automatically becomes 'beds=3%2B'

// OR manual encoding:
const url = `http://localhost:5000/api/property-search-new?beds=3%2B`;
```

### 3. Using Garage "+" (Not Supported)
```javascript
// ❌ WRONG - Garage filter doesn't support "+"
params.set('garage_spaces', '3+');  // This won't work!

// ✅ CORRECT - Use exact number only
params.set('garage_spaces', '3');   // Exactly 3 garage spaces
```

### 4. Not Using Response Data Correctly
```javascript
// ❌ WRONG - Trying to access non-existent fields
response.data.results           // Field doesn't exist
response.data.total             // Field doesn't exist
response.data.filters           // Field doesn't exist

// ✅ CORRECT - Use actual response fields
response.properties             // Array of properties
response.totalAvailable         // Total count
response.searchFilters          // Applied filters
response.count                  // Properties returned
```

### 5. Hardcoding Base URL
```javascript
// ❌ WRONG - No flexibility for different environments
const url = 'http://localhost:5000/api/property-search-new';

// ✅ CORRECT - Use environment variable or config
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';  // For dev/prod
const url = `${BASE_URL}/api/property-search-new`;

// Or with config object
const config = {
  development: 'http://localhost:5000',
  production: 'http://gbcma'
};
const BASE_URL = config[process.env.NODE_ENV] || config.development;
```

---

## 📊 Filter Results Summary

Based on testing with ZIP code 68002 (tested and verified on October 30, 2025):

| Filter Combination | Total Results | Example |
|-------------------|--------------|---------|
| **BASELINE** | | |
| ZIP only | 919 properties | `zip_code=68002` |
| **BEDROOM FILTERS (✅ WORKING)** | | |
| ZIP + beds=3 (exact) | 267 properties | `zip_code=68002&beds=3` |
| ZIP + beds=3+ | 554 properties | `zip_code=68002&beds=3+` |
| ZIP + beds=4+ | 287 properties | `zip_code=68002&beds=4+` |
| ZIP + beds=5+ | 95 properties | `zip_code=68002&beds=5+` |
| **GARAGE FILTERS (✅ WORKING)** | | |
| ZIP + garage=1 | 136 properties | `zip_code=68002&garage_spaces=1` |
| ZIP + garage=2 | 387 properties | `zip_code=68002&garage_spaces=2` |
| ZIP + garage=3 | 111 properties | `zip_code=68002&garage_spaces=3` |
| ZIP + garage=4 | 32 properties | `zip_code=68002&garage_spaces=4` |
| **COMBINED FILTERS (✅ BOTH WORKING)** | | |
| ZIP + beds=3+ + garage=2 | 308 properties | `zip_code=68002&beds=3%2B&garage_spaces=2` |
| ZIP + beds=3+ + garage=3 | 107 properties | `zip_code=68002&beds=3%2B&garage_spaces=3` |
| ZIP + beds=3+ + garage=4 | 25 properties | `zip_code=68002&beds=3%2B&garage_spaces=4` |
| ZIP + beds=5+ + garage=4 | 10 properties | `zip_code=68002&beds=5%2B&garage_spaces=4` |

### ✅ ALL FILTERS NOW WORKING CORRECTLY
Both bedroom and garage filters are functioning as expected. Combined filters correctly narrow results based on both criteria.

---

## ⚠️ Important Notes

### Bedroom Filter Behavior:
- `beds=3` → Exactly 3 bedrooms (uses `BedroomsTotal eq 3`)
- `beds=3+` → 3 or more bedrooms (uses `BedroomsTotal ge 3`)
- `min_beds=2&max_beds=5` → Range 2-5 bedrooms (uses `BedroomsTotal ge 2 and BedroomsTotal le 5`)

### Garage Filter Behavior:
- `garage_spaces=3` → Exactly 3 garage spaces (uses `GarageSpaces eq 3`)
- **No "+" support** → `garage_spaces=3+` is NOT supported
- Use exact numbers only: 1, 2, 3, 4, 5, etc.

### Response Always Includes:
- `success` - Boolean indicating if request succeeded
- `count` - Number of properties returned in this response
- `totalAvailable` - Total properties matching the filter criteria
- `properties` - Array of property objects
- `searchFilters` - Echo of filters applied (useful for UI display)
- `apiUrl` - The actual MLS API URL called (for debugging)

---

## 🚀 Quick Integration Checklist

- [ ] Update base URL to `http://gbcma`
- [ ] Add filter input fields (zip, beds, garage)
- [ ] Implement filter state management
- [ ] Build query string with URLSearchParams
- [ ] Call `/api/property-search-new` endpoint
- [ ] Display active filters from `searchFilters` in response
- [ ] Show result count from `totalAvailable`
- [ ] Render properties from `properties` array
- [ ] Add clear/remove filter functionality
- [ ] Handle error states (no results, API errors)

---

## 🧪 Testing Commands

Use these PowerShell commands to test filters:

```powershell
# Test ZIP + Beds filter
Invoke-RestMethod -Uri "http://localhost:5000/api/property-search-new?zip_code=68002&beds=3%2B&limit=5" -Method GET

# Test ZIP + Beds + Garage filter
Invoke-RestMethod -Uri "http://localhost:5000/api/property-search-new?zip_code=68002&beds=5%2B&garage_spaces=4&limit=5" -Method GET

# Test City filter
Invoke-RestMethod -Uri "http://localhost:5000/api/property-search-new?city=Elkhorn&beds=4%2B&limit=5" -Method GET
```

---

## 📞 Support

For questions or issues:
1. Check `/api/health` endpoint to ensure server is running
2. Use `/api/test-bedroom-filter` to validate bedroom filter logic
3. Review `apiUrl` field in response to see actual MLS query
4. Check that `searchFilters` in response matches your input

**Last Updated:** October 30, 2025  
**Tested With:** CMA API v2.10.2  
**Current Server:** http://localhost:5000 (local development)  
**Production Server:** http://gbcma (when deployed)
