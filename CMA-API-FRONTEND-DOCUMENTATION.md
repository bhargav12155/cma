# CMA API Frontend Documentation

## Available Property Fields

The CMA API provides the following fields for property data that can be used in your frontend application:

```javascript
// Updated CMA API - All available fields:
[
  "address",      
  "baths",        
  "beds",         
  "city",         
  "daysOnMarket", 
  "garageSpaces", 
  "id",           
  "images",       
  "listPrice",    
  "mlsNumber",    
  "openHouseDetected", 
  "placeholder",  
  "sqft",         
  "subdivision",  
  "yearBuilt",
  "time",         // Timestamp field
  "openHouseDate",      // Date of the open house (YYYY-MM-DD)
  "openHouseTime",      // Formatted time range for open house
  "openHouseStartTime", // Start time of open house
  "openHouseEndTime",   // End time of open house
  "hasOpenHouse",       // Boolean flag for open house availability
  "openHouseInstructions" // Special instructions for showing
]
```

The above format matches the API response structure from `open-houses.tsx:64` with the addition of open house related fields that are fetched from the server.js implementation.
]
```

## Usage Example

Here's how you can use these fields in your frontend application:

```javascript
// Example of accessing property data
function displayPropertyCard(property) {
  return `
    <div class="property-card">
      <img src="${property.images[0] || property.placeholder}" alt="${property.address}">
      <h3>${property.address}</h3>
      <p>${property.city}</p>
      <p>$${property.listPrice.toLocaleString()}</p>
      <p>${property.beds} beds | ${property.baths} baths | ${property.sqft} sqft</p>
      <p>Built: ${property.yearBuilt}</p>
      <p>Days on Market: ${property.daysOnMarket}</p>
      <p>Garage: ${property.garageSpaces} spaces</p>
      <p>Last Updated: ${new Date(property.time).toLocaleString()}</p>
      
      ${property.hasOpenHouse ? `
        <div class="open-house-info">
          <span class="open-house-badge">Open House</span>
          <p>Date: ${property.openHouseDate}</p>
          <p>Time: ${property.openHouseTime}</p>
          ${property.openHouseInstructions ? `<p>Notes: ${property.openHouseInstructions}</p>` : ''}
        </div>
      ` : ''}
      
      <p>MLS#: ${property.mlsNumber}</p>
    </div>
  `;
}

// Example of filtering properties by time
function getRecentProperties(properties, daysAgo = 7) {
  const cutoffTime = new Date();
  cutoffTime.setDate(cutoffTime.getDate() - daysAgo);
  
  return properties.filter(property => {
    const propertyTime = new Date(property.time);
    return propertyTime >= cutoffTime;
  });
}
```

## API Endpoints

### Get Property Search Results

```
GET /api/property-search
```

Query parameters:
- `city`: Filter by city name
- `min_price`: Minimum price
- `max_price`: Maximum price
- `beds`: Number of bedrooms
- `min_beds`: Minimum number of bedrooms
- `max_beds`: Maximum number of bedrooms
- `baths`: Number of bathrooms
- `min_baths`: Minimum number of bathrooms
- `max_baths`: Maximum number of bathrooms
- `min_sqft`: Minimum square footage
- `max_sqft`: Maximum square footage
- `property_type`: Property type (Residential, Commercial, etc.)
- `status`: Listing status (Active, Pending, Sold)
- `sort_by`: Field to sort by
- `sort_order`: Sort order (asc, desc)
- `limit`: Number of results to return
- `offset`: Offset for pagination
- `time`: Filter by timestamp or date

### Example Search Criteria

```javascript
meta: {
  apiUrl: apiUrl.substring(0, 200) + "...", // Truncated for readability
  searchCriteria: [
    "city",
    "min_price",
    "max_price",
    "property_type",
    "min_sqft",
    "max_sqft", 
    "beds",
    "baths",
    "limit",
    "sort_by",
    "focus",
    "time"  // Include time parameter in search criteria
  ]
}

### Get CMA Comparables

```
GET /api/cma-comparables
```

Query parameters:
- `address`: Property address
- `city`: City name
- `zip_code`: ZIP code
- `sqft`: Square footage
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate
- `radius_miles`: Search radius in miles
- `status`: Property status (active, closed, both)

## Response Format

```javascript
{
  "success": true,
  "count": 15,
  "properties": [
    {
      "address": "4119 S 213th Street, Elkhorn NE 68022",
      "baths": 3,
      "beds": 4,
      "city": "Elkhorn",
      "daysOnMarket": 0,
      "garageSpaces": 2,
      "id": "d58c3443fc1c2e89e8bac1ec070ffb6",
      "images": ["https://cdnparap70.paragonrels.com/ParagonImages/Property/224"],
      "listPrice": 375000,
      "mlsNumber": "22422908",
      "openHouseDetected": false,
      "placeholder": true,
      "sqft": 1795,
      "subdivision": "WESTBURY CREEK",
      "yearBuilt": 2024,
      "time": "2025-10-14T12:30:00Z",
      "openHouseDate": "2025-10-20",
      "openHouseTime": "1:00 PM - 4:00 PM",
      "openHouseStartTime": "1:00 PM",
      "openHouseEndTime": "4:00 PM",
      "hasOpenHouse": true,
      "openHouseInstructions": "Park on street, sign in at front door"
    },
    // Additional properties...
  ]
}
```

## Field Descriptions

- **time**: Represents when the property data was last updated or when the listing was created/modified. Can be used for timestamps or sorting properties by recency.

- **openHouseDate**: Date of the scheduled open house in YYYY-MM-DD format.

- **openHouseTime**: Formatted time range for the open house, e.g., "1:00 PM - 4:00 PM".

- **openHouseStartTime**: Start time of the open house, formatted as "1:00 PM".

- **openHouseEndTime**: End time of the open house, formatted as "4:00 PM".

- **hasOpenHouse**: Boolean flag indicating if an open house is scheduled for this property.

- **openHouseInstructions**: Special instructions or notes for the open house showing.

## Error Handling

```javascript
{
  "success": false,
  "error": "Invalid parameters",
  "message": "Detailed error message"
}
```