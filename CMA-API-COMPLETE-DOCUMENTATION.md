# CMA API Server Documentation

## Overview
Complete Real Estate CMA (Comparative Market Analysis) API Server with Paragon MLS integration, featuring comprehensive property search, team management, open house scheduling, and advanced filtering capabilities.

## Table of Contents
- [Server Configuration](#server-configuration)
- [API Endpoints](#api-endpoints)
- [Property Data Structure](#property-data-structure)
- [Authentication & Security](#authentication--security)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Server Configuration

### Environment Variables
```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development        # Environment mode
```

### Paragon API Configuration
```javascript
const paragonApiConfig = {
  serverToken: "YOUR_SERVER_TOKEN",
  datasetId: "bk9",
  apiUrl: "https://api.paragonapi.com/api/v2/OData",
  platformApiUrl: "https://paragonapi.com/platform/mls/bk9",
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  appId: "YOUR_APP_ID"
};
```

## API Endpoints

### Core Endpoints

#### 1. Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-10-15T12:00:00.000Z",
  "services": {
    "gemini_ai": "configured",
    "paragon_api": "configured"
  }
}
```

#### 2. Server Status
```
GET /api/status
```
**Response:**
```json
{
  "server": "Simple CMA Backend",
  "version": "1.0.0",
  "environment": "development",
  "port": 3001,
  "uptime": 3600,
  "timestamp": "2025-10-15T12:00:00.000Z",
  "memory": {
    "rss": 50000000,
    "heapTotal": 30000000,
    "heapUsed": 20000000
  }
}
```

### Property Search Endpoints

#### 1. Comprehensive Property Search
```
GET /api/property-search
```

**Query Parameters:**
```javascript
{
  // Property Identification
  mls_number: "22422908",              // MLS number lookup
  listing_id: "22422908",              // Listing ID lookup
  id: "property-uuid",                 // Property ID lookup
  
  // Location Filters
  city: "Elkhorn",                     // City name
  zip_code: "68022",                   // ZIP code
  latitude: 41.2524,                   // Latitude coordinate
  longitude: -96.0017,                 // Longitude coordinate
  radius_miles: 5,                     // Search radius (default: 5)
  
  // Price Filters
  min_price: 300000,                   // Minimum price
  max_price: 500000,                   // Maximum price
  price_range: "300k-500k",           // Price range shorthand
  
  // Property Type
  property_type: "Residential",        // Property type filter
  
  // Size Filters
  min_sqft: 1500,                     // Minimum square footage
  max_sqft: 2500,                     // Maximum square footage
  beds: "4",                          // Exact bedrooms (supports "4+")
  min_beds: 3,                        // Minimum bedrooms
  max_beds: 5,                        // Maximum bedrooms
  min_baths: 2,                       // Minimum bathrooms
  max_baths: 4,                       // Maximum bathrooms
  
  // Status Filters
  status: "For Sale",                 // "For Sale", "Sold", "All"
  
  // Property Features
  min_year_built: 2015,               // Minimum year built
  max_year_built: 2025,               // Maximum year built
  garage_spaces: 2,                   // Minimum garage spaces
  waterfront: "true",                 // Waterfront property
  new_construction: "true",           // New construction
  
  // Open House Filters
  has_open_house: "true",             // Has open house
  open_house_date: "2025-10-20",     // Open house date
  open_house_start_time: "13:00",    // Start time filter
  open_house_end_time: "16:00",      // End time filter
  
  // Sorting & Pagination
  sort_by: "price",                   // "price", "sqft", "beds", "date"
  sort_order: "desc",                 // "asc" or "desc"
  limit: 50,                          // Results limit (default: 50)
  offset: 0                           // Results offset (default: 0)
}
```

**Sample Request:**
```javascript
GET /api/property-search?city=Elkhorn&status=For%20Sale&min_price=300000&max_price=500000&beds=4&has_open_house=true
```

#### 2. CMA Comparables Analysis
```
GET /api/cma-comparables
```

**Query Parameters:**
```javascript
{
  // Target Property
  address: "4119 S 213th Street",     // Target property address
  city: "Elkhorn",                    // Target city
  zip_code: "68022",                  // Target ZIP code
  sqft: 1800,                         // Target square footage
  latitude: 41.2524,                  // Target latitude
  longitude: -96.0017,                // Target longitude
  
  // Comparison Criteria
  radius_miles: 5,                    // Search radius (default: 5)
  sqft_delta: 1200,                   // Sqft variance (default: 1200)
  months_back: 12,                    // Months for sold comps (default: 12)
  
  // Advanced Filters
  year_built_range: 10,               // Year built variance
  residential_area: "Elkhorn,Waterloo", // Multiple areas (comma-separated)
  price_range: "300k_500k",           // Predefined price ranges
  lot_size: "quarter_half",           // Lot size categories
  waterfront: "true",                 // Waterfront filter
  new_construction: "true",           // New construction filter
  same_subdivision: "true",           // Same subdivision only
  
  // Custom Price Range
  min_price: 350000,                  // Custom minimum price
  max_price: 450000,                  // Custom maximum price
  
  // Property Type
  property_type: "Residential",       // Property type filter
  
  // Status Selection
  status: "both",                     // "active", "closed", "both"
  exclude_zero_price: "true"          // Exclude $0 properties
}
```

**Sample Request:**
```javascript
GET /api/cma-comparables?address=4119%20S%20213th%20Street&city=Elkhorn&sqft=1800&radius_miles=3&status=both
```

#### 3. Advanced Property Search
```
GET /api/property-search-advanced
```
Enhanced property search with sophisticated filtering and post-processing capabilities.

#### 4. New Property Search (Testing)
```
GET /api/property-search-new
```
Alternative property search endpoint with additional validation and price correction algorithms.

### Team Management Endpoints

#### 1. Create Team
```
POST /api/teams
Content-Type: application/json

{
  "name": "Golden Brick Team",
  "description": "Premium real estate agents"
}
```

#### 2. Get All Teams
```
GET /api/teams
```

#### 3. Get Team by ID
```
GET /api/teams/:teamId
```

#### 4. Update Team
```
PUT /api/teams/:teamId
Content-Type: application/json

{
  "name": "Updated Team Name",
  "description": "Updated description"
}
```

#### 5. Delete Team
```
DELETE /api/teams/:teamId
```

#### 6. Add Team Member
```
POST /api/teams/:teamId/members
Content-Type: application/json

{
  "agent_name": "Mike Bjork",
  "agent_mls_id": "969503",
  "agent_phone": "402-522-6131"
}
```

#### 7. Remove Team Member
```
DELETE /api/teams/:teamId/members/:memberId
```

#### 8. Get Team Properties
```
GET /api/teams/:teamId/properties
```

**Query Parameters:**
```javascript
{
  city: "Elkhorn",                    // Filter by city
  status: "Active",                   // "Active" or "Sold"
  sort_by: "price",                   // Sorting criteria
  limit: 50                           // Results limit
}
```

#### 9. Get Team Featured Listings
```
GET /api/teams/:teamId/featured-listings
```

### Specialized Endpoints

#### 1. Future Properties (Under Construction)
```
GET /api/future-properties
```

**Query Parameters:**
```javascript
{
  city: "Elkhorn",                    // City filter
  min_price: 400000,                  // Price filters
  max_price: 800000,
  min_sqft: 1800,                     // Size filters
  max_sqft: 3000,
  construction_stage: "all",          // Construction stage filter
  limit: 25                           // Results limit
}
```

#### 2. Communities/Subdivisions
```
GET /api/communities-full
```
Get aggregated data for all communities/subdivisions with property counts.

#### 3. Property Count
```
GET /api/property-count
```
Get total property count for data availability assessment.

#### 4. Property Details from Address
```
POST /api/property-details-from-address
Content-Type: application/json

{
  "address": "4119 S 213th Street, Elkhorn NE"
}
```

### Legacy/Compatibility Endpoints

#### 1. Comps (Legacy)
```
GET /api/comps
```

#### 2. Property Reference Proxy
```
GET /api/property-reference
```
Generic proxy for OData-style queries to Paragon API.

## Property Data Structure

### Complete Property Object
```javascript
{
  // Core Identifiers
  "id": "d58c3443fc1c2e89e8bac1ec070ffb6",
  "mlsNumber": "22422908",
  
  // Address and Location
  "address": "4119 S 213th Street, Elkhorn NE 68022",
  "city": "Elkhorn",
  "state": "NE",
  "zipCode": "68022",
  "latitude": 41.2524,
  "longitude": -96.0017,
  "subdivision": "WESTBURY CREEK",
  
  // Property Specifications
  "beds": 4,
  "baths": 3,
  "livingArea": 1795,                    // Above-grade finished area
  "lotSquareFeet": 8500,                 // Lot size in square feet
  "yearBuilt": 2024,
  "garageSpaces": 2,
  "hasBasement": true,
  "belowGradeFinishedArea": 800,         // Finished basement area
  "architecturalStyle": "Contemporary",
  "propertyType": "Residential",
  "propertySubType": "Single Family Detached",
  
  // Financial Information
  "listPrice": 375000,
  "closePrice": null,                    // Only for sold properties
  "pricePerSqft": 209,
  
  // Listing Information
  "status": "Active",                    // Active, Closed, Pending, etc.
  "daysOnMarket": 0,
  "listingContractDate": "2025-10-14T00:00:00Z",
  "modificationTimestamp": "2025-10-14T12:30:00Z",
  
  // Property Features
  "isNewConstruction": true,
  "isWaterfront": false,
  
  // Media
  "image": "https://cdnparap70.paragonrels.com/ParagonImages/Property/224/Main.jpg",
  "images": [
    "https://cdnparap70.paragonrels.com/ParagonImages/Property/224/Main.jpg",
    "https://cdnparap70.paragonrels.com/ParagonImages/Property/224/Kitchen.jpg"
  ],
  
  // Open House Information
  "OpenHouse": true,
  "openHouseDate": "2025-10-20",
  "openHouseTime": "1:00 PM - 4:00 PM",
  
  // Legacy Fields (for backward compatibility)
  "sqft": 1795,                          // Same as livingArea
  "basementSqft": 800,                   // Same as belowGradeFinishedArea
  "garage": 2,                           // Same as garageSpaces
  "soldPrice": null,                     // Same as closePrice
  "closeDate": null,
  "onMarketDate": "2025-10-14T00:00:00Z",
  "lotSizeAcres": 0.195,
  "lotSizeSqft": 8500,                   // Same as lotSquareFeet
  "waterfront": false,                   // Same as isWaterfront
  "newConstruction": true,               // Same as isNewConstruction
  "isActive": true,
  "imageUrl": "https://cdnparap70.paragonrels.com/...", // Same as image
  "condition": "New",
  "style": "Contemporary",               // Same as architecturalStyle
  "time": "2025-10-14T12:30:00Z"
}
```

### Open House Fields Detail
```javascript
{
  "OpenHouse": true,                     // Boolean: Has open house scheduled
  "openHouseDate": "2025-10-20",        // Date: YYYY-MM-DD format
  "openHouseTime": "1:00 PM - 4:00 PM", // String: Formatted time range
  "openHouseStartTime": "1:00 PM",      // String: Start time
  "openHouseEndTime": "4:00 PM",        // String: End time
  "hasOpenHouse": true,                 // Boolean: Legacy compatibility
  "openHouseInstructions": "Park on street, sign in at front door"
}
```

## Authentication & Security

### API Token Configuration
The server uses Paragon MLS API tokens for data access:

1. **Server Token**: For OData API access (historical/closed data)
2. **Bearer Token**: For Platform API access (active listings)
3. **Client Credentials**: OAuth flow for token refresh

### CORS Configuration
```javascript
app.use(cors()); // Allows all origins - configure for production
```

### Rate Limiting
Currently not implemented - recommended for production deployment.

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description",
  "code": 400,
  "searchCriteria": {...}
}
```

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API token)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (server/API error)

### Error Scenarios
1. **Invalid Paragon API Token**: Configure valid tokens in `paragonApiConfig`
2. **Rate Limiting**: Paragon API may throttle requests
3. **Invalid Parameters**: Validation errors for search criteria
4. **Network Issues**: API connectivity problems

## Usage Examples

### 1. Basic Property Search
```javascript
// Search for 4-bedroom homes in Elkhorn under $500k
fetch('/api/property-search?city=Elkhorn&beds=4&max_price=500000&status=For%20Sale')
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.count} properties`);
    data.properties.forEach(property => {
      console.log(`${property.address} - $${property.listPrice.toLocaleString()}`);
    });
  });
```

### 2. CMA Comparables Analysis
```javascript
// Get comparable properties for CMA analysis
fetch('/api/cma-comparables?address=4119%20S%20213th%20Street&city=Elkhorn&sqft=1800&radius_miles=3&status=both')
  .then(response => response.json())
  .then(data => {
    console.log(`Active Comparables: ${data.counts.active}`);
    console.log(`Sold Comparables: ${data.counts.closed}`);
    
    // Calculate average prices
    const activeAvg = data.active.reduce((sum, prop) => sum + prop.listPrice, 0) / data.active.length;
    const soldAvg = data.closed.reduce((sum, prop) => sum + prop.soldPrice, 0) / data.closed.length;
    
    console.log(`Average Active Price: $${activeAvg.toLocaleString()}`);
    console.log(`Average Sold Price: $${soldAvg.toLocaleString()}`);
  });
```

### 3. Open House Filtering
```javascript
// Find properties with open houses this weekend
fetch('/api/property-search?has_open_house=true&city=Elkhorn&status=For%20Sale')
  .then(response => response.json())
  .then(data => {
    const openHouses = data.properties.filter(p => p.OpenHouse);
    console.log('Open Houses This Weekend:');
    
    openHouses.forEach(property => {
      console.log(`${property.address}`);
      console.log(`  Date: ${property.openHouseDate}`);
      console.log(`  Time: ${property.openHouseTime}`);
      console.log(`  Price: $${property.listPrice.toLocaleString()}`);
    });
  });
```

### 4. Team Management
```javascript
// Create a new team
fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Golden Brick Team',
    description: 'Premium real estate agents'
  })
})
.then(response => response.json())
.then(team => {
  console.log(`Created team: ${team.name} (ID: ${team.id})`);
  
  // Add team members
  return fetch(`/api/teams/${team.id}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_name: 'Mike Bjork',
      agent_mls_id: '969503',
      agent_phone: '402-522-6131'
    })
  });
})
.then(response => response.json())
.then(result => {
  console.log('Added team member successfully');
});
```

### 5. Future Properties Search
```javascript
// Search for under-construction properties
fetch('/api/future-properties?city=Elkhorn&min_price=400000&construction_stage=all')
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.count} future properties`);
    
    data.properties.forEach(property => {
      console.log(`${property.address}`);
      console.log(`  Expected: ${property.yearBuilt}`);
      console.log(`  Price: $${property.listPrice.toLocaleString()}`);
      console.log(`  Stage: ${property.condition}`);
    });
  });
```

## Frontend Integration

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';

const PropertySearch = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchProperties = async (filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/property-search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.properties);
      } else {
        console.error('Search error:', data.error);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    setLoading(false);
  };
  
  return (
    <div className="property-search">
      <div className="search-filters">
        <input 
          type="text" 
          placeholder="City"
          onChange={(e) => searchProperties({ city: e.target.value })}
        />
        {/* Add more filter inputs */}
      </div>
      
      <div className="search-results">
        {loading ? (
          <div>Loading properties...</div>
        ) : (
          properties.map(property => (
            <div key={property.id} className="property-card">
              <img src={property.image} alt={property.address} />
              <h3>{property.address}</h3>
              <p>${property.listPrice?.toLocaleString()}</p>
              <p>{property.beds} beds • {property.baths} baths • {property.livingArea} sq ft</p>
              {property.OpenHouse && (
                <div className="open-house">
                  🏠 Open House: {property.openHouseDate} at {property.openHouseTime}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
```

## Deployment

### Production Configuration
1. **Environment Variables**: Set production API tokens
2. **CORS**: Configure specific origins
3. **Rate Limiting**: Implement request throttling
4. **Logging**: Add comprehensive logging
5. **SSL/TLS**: Use HTTPS in production
6. **Error Monitoring**: Integrate error tracking

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=3001
PARAGON_SERVER_TOKEN=your_production_token
PARAGON_CLIENT_ID=your_client_id
PARAGON_CLIENT_SECRET=your_client_secret
```

## API Rate Limits & Best Practices

### Paragon API Limits
- Standard rate limits apply per Paragon API documentation
- Implement caching for frequently accessed data
- Use appropriate `$select` fields to minimize payload size
- Consider pagination for large result sets

### Performance Optimization
1. **Caching**: Implement Redis/memory caching for communities and static data
2. **Pagination**: Use `limit` and `offset` parameters effectively
3. **Field Selection**: Only request needed fields using `$select`
4. **Geographic Filtering**: Use coordinates and radius for efficient location-based searches

## Support & Maintenance

### Logging
The server includes comprehensive logging for:
- API requests and responses
- Error tracking and debugging
- Performance monitoring
- Property field analysis

### Health Monitoring
- `/api/health` - Service health status
- `/api/status` - Server performance metrics
- Error rates and response times

### Updates & Versioning
- API versioning strategy for breaking changes
- Backward compatibility maintenance
- Regular Paragon API integration updates

---

**Version**: 2.10.1  
**Last Updated**: October 15, 2025  
**License**: Private - Real Estate CMA Application