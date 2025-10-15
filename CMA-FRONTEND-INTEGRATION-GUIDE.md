# CMA Frontend Integration Guide

## Complete Property Data Structure

### All Available Fields

The CMA API provides comprehensive property data with the following fields for frontend integration:

```javascript
// Complete CMA API Property Fields
const propertyFields = [
  // Basic Property Information
  'id',                        // Unique property identifier
  'address',                   // Full property address
  'city',                      // City name
  'state',                     // State abbreviation
  'zipCode',                   // ZIP code
  'latitude',                  // Geographic latitude
  'longitude',                 // Geographic longitude
  
  // Property Details
  'beds',                      // Number of bedrooms
  'baths',                     // Number of bathrooms
  'livingArea',                // Living area square footage
  'lotSquareFeet',            // Lot size in square feet
  'yearBuilt',                 // Year property was built
  'garageSpaces',             // Number of garage spaces
  'hasBasement',              // Boolean: Has basement
  'belowGradeFinishedArea',   // Finished basement area
  'architecturalStyle',       // Architectural style description
  'propertyType',             // Property type (Residential, etc.)
  'propertySubType',          // Sub-type (Single Family, Condo, etc.)
  'subdivision',              // Subdivision name
  
  // Financial Information
  'listPrice',                // Current listing price
  'closePrice',               // Sold price (for closed properties)
  'pricePerSqft',            // Price per square foot
  
  // Listing Information
  'mlsNumber',                // MLS listing number
  'status',                   // Listing status (Active, Pending, Sold)
  'daysOnMarket',             // Days on market
  'listingContractDate',      // Date listing contract was signed
  'modificationTimestamp',    // Last modification timestamp
  
  // Property Features
  'isNewConstruction',        // Boolean: New construction
  'isWaterfront',            // Boolean: Waterfront property
  
  // Media
  'image',                    // Primary image URL
  'images',                   // Array of all image URLs
  
  // Open House Information
  'OpenHouse',                // Boolean: Has open house scheduled
  'openHouseDate',            // Open house date (YYYY-MM-DD)
  'openHouseTime'             // Open house time range
];
```

## CMA API Endpoints

### 1. Get CMA Comparables

```
GET /api/cma-comparables
```

**Purpose**: Retrieve comparable properties for CMA analysis with complete property and open house data.

**Query Parameters**:
```javascript
{
  address: "4119 S 213th Street",      // Target property address
  city: "Elkhorn",                     // City name
  zipCode: "68022",                    // ZIP code (alternative to city)
  state: "NE",                         // State abbreviation
  livingArea: 1800,                    // Square footage for comparison
  latitude: 41.2524,                   // Latitude coordinate
  longitude: -96.0017,                 // Longitude coordinate
  radius_miles: 5,                     // Search radius in miles
  status: "both",                      // "active", "closed", or "both"
  propertyType: "Residential",         // Filter by property type
  beds: 4,                            // Number of bedrooms
  baths: 3,                           // Number of bathrooms
  min_price: 300000,                  // Minimum price
  max_price: 500000,                  // Maximum price
  yearBuilt: 2020,                    // Year built filter
  hasBasement: true,                  // Basement filter
  isWaterfront: false,                // Waterfront filter
  garageSpaces: 2                     // Garage spaces filter
}
```

### 2. Property Search with Complete Data

```
GET /api/property-search
```

**Query Parameters**:
```javascript
{
  // Location Filters
  city: "Elkhorn",
  state: "NE", 
  zipCode: "68022",
  subdivision: "WESTBURY CREEK",
  
  // Price Filters
  min_price: 300000,
  max_price: 500000,
  
  // Property Specifications
  beds: 4,
  min_beds: 3,
  max_beds: 5,
  baths: 3,
  min_baths: 2,
  max_baths: 4,
  min_livingArea: 1500,
  max_livingArea: 2500,
  min_lotSquareFeet: 5000,
  max_lotSquareFeet: 20000,
  
  // Property Features
  propertyType: "Residential",
  propertySubType: "Single Family Detached",
  architecturalStyle: "Contemporary",
  yearBuilt: 2020,
  min_yearBuilt: 2015,
  max_yearBuilt: 2025,
  garageSpaces: 2,
  hasBasement: true,
  isNewConstruction: false,
  isWaterfront: false,
  
  // Listing Filters
  status: "Active",
  daysOnMarket: 30,
  max_daysOnMarket: 60,
  
  // Open House Filters
  OpenHouse: true,
  openHouseDate: "2025-10-20",
  
  // Sorting & Pagination
  sort_by: "listPrice",
  sort_order: "desc",
  limit: 50,
  offset: 0
}
```

## Complete Property Data Structure

```javascript
{
  // Identifiers
  "id": "d58c3443fc1c2e89e8bac1ec070ffb6",
  "mlsNumber": "22422908",
  
  // Location
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
  "livingArea": 1795,                    // Square feet
  "lotSquareFeet": 8500,
  "yearBuilt": 2024,
  "garageSpaces": 2,
  "hasBasement": true,
  "belowGradeFinishedArea": 800,
  "architecturalStyle": "Contemporary",
  "propertyType": "Residential",
  "propertySubType": "Single Family Detached",
  
  // Financial
  "listPrice": 375000,
  "closePrice": null,                    // Only for sold properties
  "pricePerSqft": 209,
  
  // Listing Information
  "status": "Active",
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
    "https://cdnparap70.paragonrels.com/ParagonImages/Property/224/Kitchen.jpg",
    "https://cdnparap70.paragonrels.com/ParagonImages/Property/224/LivingRoom.jpg"
  ],
  
  // Open House Information
  "OpenHouse": true,
  "openHouseDate": "2025-10-20", 
  "openHouseTime": "1:00 PM - 4:00 PM"
}
```

## Frontend Implementation Examples

### 1. Complete Property Card Component

```javascript
function createPropertyCard(property) {
  return `
    <div class="property-card" data-id="${property.id}">
      <!-- Property Image -->
      <div class="property-image">
        <img src="${property.image || property.images[0]}" alt="${property.address}">
        ${property.OpenHouse ? '<span class="open-house-badge">Open House</span>' : ''}
        ${property.isNewConstruction ? '<span class="new-construction-badge">New</span>' : ''}
        ${property.isWaterfront ? '<span class="waterfront-badge">Waterfront</span>' : ''}
      </div>
      
      <!-- Property Details -->
      <div class="property-details">
        <h3 class="property-address">${property.address}</h3>
        <p class="property-location">${property.city}, ${property.state} ${property.zipCode}</p>
        ${property.subdivision ? `<p class="subdivision">${property.subdivision}</p>` : ''}
        
        <!-- Price Information -->
        <div class="price-info">
          <span class="list-price">$${property.listPrice.toLocaleString()}</span>
          ${property.closePrice ? `<span class="close-price">Sold: $${property.closePrice.toLocaleString()}</span>` : ''}
          <span class="price-per-sqft">$${property.pricePerSqft}/sq ft</span>
        </div>
        
        <!-- Property Specs -->
        <div class="property-specs">
          <span class="beds">${property.beds} beds</span>
          <span class="baths">${property.baths} baths</span>
          <span class="sqft">${property.livingArea.toLocaleString()} sq ft</span>
          ${property.lotSquareFeet ? `<span class="lot">${property.lotSquareFeet.toLocaleString()} sq ft lot</span>` : ''}
        </div>
        
        <!-- Additional Features -->
        <div class="property-features">
          <span class="year-built">Built: ${property.yearBuilt}</span>
          ${property.garageSpaces ? `<span class="garage">${property.garageSpaces} car garage</span>` : ''}
          ${property.hasBasement ? '<span class="basement">Basement</span>' : ''}
          ${property.architecturalStyle ? `<span class="style">${property.architecturalStyle}</span>` : ''}
        </div>
        
        <!-- Listing Information -->
        <div class="listing-info">
          <span class="status status-${property.status.toLowerCase()}">${property.status}</span>
          <span class="days-on-market">${property.daysOnMarket} days on market</span>
          <span class="mls">MLS# ${property.mlsNumber}</span>
        </div>
        
        <!-- Open House Information -->
        ${property.OpenHouse ? `
          <div class="open-house-info">
            <h4>Open House</h4>
            <p class="open-house-date">${formatDate(property.openHouseDate)}</p>
            <p class="open-house-time">${property.openHouseTime}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
```

### 2. Advanced Filtering Functions

```javascript
// Filter by property features
function filterByFeatures(properties, filters) {
  return properties.filter(property => {
    // Price range
    if (filters.minPrice && property.listPrice < filters.minPrice) return false;
    if (filters.maxPrice && property.listPrice > filters.maxPrice) return false;
    
    // Bedrooms/Bathrooms
    if (filters.minBeds && property.beds < filters.minBeds) return false;
    if (filters.maxBeds && property.beds > filters.maxBeds) return false;
    if (filters.minBaths && property.baths < filters.minBaths) return false;
    if (filters.maxBaths && property.baths > filters.maxBaths) return false;
    
    // Square footage
    if (filters.minLivingArea && property.livingArea < filters.minLivingArea) return false;
    if (filters.maxLivingArea && property.livingArea > filters.maxLivingArea) return false;
    
    // Year built
    if (filters.minYearBuilt && property.yearBuilt < filters.minYearBuilt) return false;
    if (filters.maxYearBuilt && property.yearBuilt > filters.maxYearBuilt) return false;
    
    // Boolean features
    if (filters.hasBasement !== undefined && property.hasBasement !== filters.hasBasement) return false;
    if (filters.isNewConstruction !== undefined && property.isNewConstruction !== filters.isNewConstruction) return false;
    if (filters.isWaterfront !== undefined && property.isWaterfront !== filters.isWaterfront) return false;
    if (filters.OpenHouse !== undefined && property.OpenHouse !== filters.OpenHouse) return false;
    
    // Property type
    if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
    if (filters.propertySubType && property.propertySubType !== filters.propertySubType) return false;
    
    // Location
    if (filters.city && property.city !== filters.city) return false;
    if (filters.state && property.state !== filters.state) return false;
    if (filters.zipCode && property.zipCode !== filters.zipCode) return false;
    
    return true;
  });
}

// Sort properties by different criteria
function sortProperties(properties, sortBy, sortOrder = 'asc') {
  return properties.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}
```

### 3. CMA Analysis Functions

```javascript
// Calculate CMA statistics
function calculateCMAStats(comparables) {
  const activeListings = comparables.filter(p => p.status === 'Active');
  const soldProperties = comparables.filter(p => p.status === 'Sold');
  
  return {
    totalComparables: comparables.length,
    activeListings: activeListings.length,
    soldProperties: soldProperties.length,
    
    // Price statistics
    avgListPrice: calculateAverage(activeListings, 'listPrice'),
    avgSoldPrice: calculateAverage(soldProperties, 'closePrice'),
    avgPricePerSqft: calculateAverage(comparables, 'pricePerSqft'),
    
    // Market statistics
    avgDaysOnMarket: calculateAverage(soldProperties, 'daysOnMarket'),
    avgLivingArea: calculateAverage(comparables, 'livingArea'),
    
    // Open house statistics
    openHouseCount: comparables.filter(p => p.OpenHouse).length,
    openHousePercentage: (comparables.filter(p => p.OpenHouse).length / comparables.length) * 100
  };
}

function calculateAverage(properties, field) {
  const validValues = properties
    .map(p => p[field])
    .filter(value => value != null && !isNaN(value));
    
  return validValues.length > 0 
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length 
    : 0;
}

// Generate CMA report
function generateCMAReport(targetProperty, comparables) {
  const stats = calculateCMAStats(comparables);
  
  return {
    targetProperty: targetProperty,
    comparables: comparables,
    statistics: stats,
    priceRecommendation: {
      suggestedPrice: stats.avgListPrice,
      priceRange: {
        low: stats.avgListPrice * 0.95,
        high: stats.avgListPrice * 1.05
      },
      confidence: calculateConfidence(comparables.length)
    },
    marketInsights: {
      isHotMarket: stats.avgDaysOnMarket < 30,
      isPricedRight: Math.abs(targetProperty.listPrice - stats.avgListPrice) / stats.avgListPrice < 0.1,
      hasCompetitiveAdvantage: targetProperty.OpenHouse && stats.openHousePercentage < 50
    }
  };
}
```

### 4. Open House Calendar Integration

```javascript
// Create open house calendar
function createOpenHouseCalendar(properties) {
  const openHouseProperties = properties.filter(p => p.OpenHouse);
  const groupedByDate = {};
  
  openHouseProperties.forEach(property => {
    const date = property.openHouseDate;
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(property);
  });
  
  return Object.keys(groupedByDate)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => ({
      date: date,
      displayDate: formatDate(date),
      properties: groupedByDate[date].sort((a, b) => 
        a.openHouseTime.localeCompare(b.openHouseTime)
      )
    }));
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
```

## API Response Format

### Success Response
```javascript
{
  "success": true,
  "count": 25,
  "properties": [
    // Array of complete property objects
  ],
  "meta": {
    "searchCriteria": {
      "city": "Elkhorn",
      "minPrice": 300000,
      "maxPrice": 500000,
      "beds": 4,
      "status": "Active"
    },
    "totalPages": 3,
    "currentPage": 1,
    "resultsPerPage": 50
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Invalid parameters",
  "message": "Required parameter 'city' or 'zipCode' is missing",
  "code": 400
}
```

## Field Validation & Data Types

```javascript
const fieldTypes = {
  // String fields
  id: 'string',
  address: 'string',
  city: 'string',
  state: 'string',
  zipCode: 'string',
  subdivision: 'string',
  architecturalStyle: 'string',
  propertyType: 'string',
  propertySubType: 'string',
  status: 'string',
  mlsNumber: 'string',
  
  // Number fields
  beds: 'number',
  baths: 'number',
  livingArea: 'number',
  lotSquareFeet: 'number',
  yearBuilt: 'number',
  garageSpaces: 'number',
  belowGradeFinishedArea: 'number',
  listPrice: 'number',
  closePrice: 'number',
  pricePerSqft: 'number',
  daysOnMarket: 'number',
  latitude: 'number',
  longitude: 'number',
  
  // Boolean fields
  hasBasement: 'boolean',
  isNewConstruction: 'boolean',
  isWaterfront: 'boolean',
  OpenHouse: 'boolean',
  
  // Date/Time fields
  listingContractDate: 'datetime',
  modificationTimestamp: 'datetime',
  openHouseDate: 'date',
  openHouseTime: 'string', // Formatted time range
  
  // Array fields
  images: 'array',
  
  // URL fields
  image: 'url'
};
```

This comprehensive guide provides all the property fields and open house data structure needed for complete CMA frontend integration.