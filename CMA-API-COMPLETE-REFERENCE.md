# CMA API Complete Reference & Zip Code Data Analysis

**Generated on:** October 15, 2025  
**Server URL:** http://localhost:3002  
**Version:** 2.10.1  

---

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Available Endpoints](#available-endpoints)
3. [Property Search APIs](#property-search-apis)
4. [Zip Code Analysis](#zip-code-analysis)
5. [CMA & Comparables](#cma--comparables)
6. [Team Management](#team-management)
7. [Communities & Cities](#communities--cities)
8. [Optimization APIs](#optimization-apis)
9. [Response Examples](#response-examples)
10. [Testing Commands](#testing-commands)

---

## 🚀 API Overview

The CMA (Comparative Market Analysis) API is a comprehensive real estate data platform providing:

- **Property Search & Filtering**
- **CMA Analysis & Comparables**
- **Team & Agent Management**
- **Community & Subdivision Data**
- **Property Image Optimization**
- **Advanced Search Capabilities**

### Server Information
- **Port:** 3002
- **Framework:** Express.js with CORS
- **Authentication:** Bearer Token (Paragon API)
- **Data Source:** Paragon MLS API
- **Image Processing:** Optimized caching system

---

## 🔗 Available Endpoints

### Core Property APIs
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/property-search` | GET | Main property search | zip_code, city, price, beds, baths, sqft, status |
| `/api/property-search-new` | GET | Enhanced search with validation | All search params + agent filters |
| `/api/property-search-advanced` | GET | Advanced filtering & sorting | Complex filters + post-processing |
| `/api/property-search-optim` | GET | Cached & optimized search | Paginated with caching |

### CMA & Analysis APIs
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/cma-comparables` | GET | CMA comparable properties | address, city, zip_code, sqft, radius |
| `/api/comps` | GET | Property comparisons | city, sqft_min, sqft_max |
| `/api/future-properties` | GET | New construction & future listings | city, min_price, property_type |

### Geographic & Community APIs
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/communities` | GET | Subdivision analysis | state, property_type, min_properties |
| `/api/communities-full` | GET | Complete community aggregation | Full property counts |
| `/api/cities` | GET | City-based property statistics | state, property_type, status |

### Team Management APIs
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/teams` | GET/POST | Team CRUD operations | name, description |
| `/api/teams/:id/members` | GET/POST | Team member management | agent_name, agent_mls_id |
| `/api/team-properties` | GET | Properties by team agents | agent_ids, city, status |

### Utility & System APIs
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/health` | GET | Server health check | None |
| `/api/status` | GET | Server status & metrics | None |
| `/api/property-count` | GET | Property statistics by status | status |
| `/api/mls-fields` | GET | Available MLS field analysis | None |

---

## 🏠 Property Search APIs

### 1. Basic Property Search (`/api/property-search`)

**Purpose:** Primary property search with comprehensive filtering

**Key Parameters:**
```
zip_code          - ZIP code filter (e.g., 68028)
city              - City name (e.g., "Omaha")
min_price         - Minimum price filter
max_price         - Maximum price filter
property_type     - "Residential", "Commercial", etc.
status           - "For Sale", "Sold", "All"
beds             - Number of bedrooms
baths            - Number of bathrooms
min_sqft         - Minimum square footage
max_sqft         - Maximum square footage
sort_by          - "price", "sqft", "beds", "newest"
limit            - Results limit (default: 50)
```

**Example Usage:**
```bash
curl "http://localhost:3002/api/property-search?zip_code=68028&status=For Sale&limit=25"
```

### 2. Enhanced Property Search (`/api/property-search-new`)

**Purpose:** Advanced search with agent filtering and data validation

**Additional Parameters:**
```
buyer_agent_mls_id    - Buyer agent MLS ID
listing_agent_mls_id  - Listing agent MLS ID
agent_name           - Agent name (wildcard search)
subdivision          - Subdivision/community name
waterfront           - "true" for waterfront properties
new_construction     - "true" for new construction
```

**Example Usage:**
```bash
curl "http://localhost:3002/api/property-search-new?city=Gretna&zip_code=68028&new_construction=true"
```

### 3. Advanced Property Search (`/api/property-search-advanced`)

**Purpose:** High-performance search with post-filtering and caching

**Advanced Features:**
- Local post-filtering for complex queries
- Performance optimization
- Enhanced sorting options
- Waterfront and new construction detection

---

## 📍 Zip Code Analysis

### Supported Zip Codes (Nebraska Focus)

Based on the API configuration and testing, here are key zip codes with property data:

#### Primary Coverage Areas

| Zip Code | City/Area | Property Types | Status Coverage |
|----------|-----------|----------------|-----------------|
| **68028** | Gretna | Residential, New Construction | Active, Sold |
| **68007** | Bellevue | Residential, Commercial | Active, Sold |
| **68046** | Papillion | Residential, Townhomes | Active, Sold |
| **68022** | Elkhorn | Residential, Rural | Active, Sold |
| **68154** | West Omaha | Residential, Luxury | Active, Sold |
| **68130** | Central Omaha | Residential, Commercial | Active, Sold |

#### Zip Code Property Distribution

**Sample API Call for Zip Analysis:**
```bash
# Get all properties in zip code 68028
curl "http://localhost:3002/api/property-search?zip_code=68028&limit=200"

# Get sold properties in last 12 months
curl "http://localhost:3002/api/property-search?zip_code=68028&status=Sold"

# Get active new construction
curl "http://localhost:3002/api/property-search?zip_code=68028&status=For Sale&new_construction=true"
```

### Zip Code Data Fields Available

For each zip code, the API provides:

**Property Basics:**
- Property ID (ListingKey)
- Address (UnparsedAddress)
- City, State, Zip Code
- Property Type & Subtype

**Financial Data:**
- List Price & Sold Price
- Price per Square Foot
- Days on Market
- Original List Price

**Physical Characteristics:**
- Square Footage (Above & Below Grade)
- Bedrooms & Bathrooms
- Garage Spaces
- Year Built
- Lot Size (Acres & Sq Ft)

**Property Features:**
- Architectural Style
- Property Condition
- Waterfront Status
- New Construction Flag
- Subdivision Name

**Location Data:**
- Latitude & Longitude
- School Districts (Elementary, Middle, High)
- Community/Subdivision

---

## 🔍 CMA & Comparables

### CMA Analysis API (`/api/cma-comparables`)

**Purpose:** Generate comparable properties for CMA analysis

**Key Parameters:**
```
zip_code          - Target zip code
city              - Target city
sqft              - Subject property square footage
sqft_delta        - Sq ft variance (default: 1200)
radius_miles      - Search radius (default: 5)
months_back       - Months for sold comps (default: 12)
status           - "active", "closed", "both"
```

**Example CMA Call:**
```bash
curl "http://localhost:3002/api/cma-comparables?zip_code=68028&city=Gretna&sqft=2500&radius_miles=3"
```

**CMA Response Includes:**
- Active comparable properties
- Recently sold comparables (last 12 months)
- Distance calculations from subject property
- Price per square foot analysis
- Property feature comparisons

### Future Properties Analysis

**API:** `/api/future-properties`

**Purpose:** Identify new construction and upcoming properties

**Parameters:**
```
city              - Target city
min_price         - Minimum price (default: $700,000)
property_type     - Property type filter
limit            - Results limit
```

---

## 👥 Team Management

### Team Structure
The API supports real estate team management with:

**Team Entities:**
- Team ID & Name
- Team Description
- Creation Date
- Member Count

**Team Member Data:**
- Agent Name
- Agent MLS ID
- Agent Phone
- Date Added to Team

### Team Property Queries

**Get Team Properties:**
```bash
curl "http://localhost:3002/api/team-properties?agent_ids=969503,480248&city=Omaha"
```

**Team Management:**
```bash
# Create team
curl -X POST "http://localhost:3002/api/teams" -H "Content-Type: application/json" -d '{"name":"Golden Brick Team"}'

# Add member
curl -X POST "http://localhost:3002/api/teams/1/members" -H "Content-Type: application/json" -d '{"agent_name":"Mike Bjork","agent_mls_id":"969503"}'
```

---

## 🏘️ Communities & Cities

### Community Analysis (`/api/communities`)

**Purpose:** Analyze subdivisions and communities by property count

**Parameters:**
```
state            - State filter (default: "NE")
property_type    - Property type filter
status          - "active" or "all"
min_properties  - Minimum property count
sort_by         - "count" or "name"
```

**Sample Response Data:**
- Community name
- Total properties
- Active vs inactive properties
- Primary city
- Property count statistics

### City Statistics (`/api/cities`)

**Provides:**
- Property counts by city
- Community counts per city
- Active vs total property breakdown
- Geographic distribution analysis

---

## ⚡ Optimization APIs

### Optimized Property Search (`/api/property-search-optim`)

**Features:**
- Caching (5-minute TTL)
- Pagination support
- Data level filtering (minimal, list, detail)
- Progressive loading

**Parameters:**
```
page             - Page number (0-based)
limit           - Results per page
dataLevel       - "minimal", "list", "detail"
includeImages   - "true"/"false"
```

### Image Optimization (`/api/properties/:id/images-optim`)

**Features:**
- Paginated image loading
- Size optimization parameters
- Bandwidth reduction
- Caching support

---

## 📊 Response Examples

### Property Search Response Structure

```json
{
  "success": true,
  "count": 25,
  "totalAvailable": 147,
  "properties": [
    {
      "id": "12345",
      "address": "123 Main St",
      "city": "Gretna",
      "zipCode": "68028",
      "listPrice": 450000,
      "sqft": 2400,
      "beds": 4,
      "baths": 3,
      "garage": 2,
      "yearBuilt": 2020,
      "status": "Active",
      "propertyType": "Residential",
      "subdivision": "Prairie View",
      "latitude": 41.1234,
      "longitude": -96.2345,
      "imageUrl": "https://...",
      "pricePerSqft": 188,
      "isActive": true,
      "newConstruction": true
    }
  ],
  "searchCriteria": {
    "zip_code": "68028",
    "status": "For Sale"
  }
}
```

### CMA Response Structure

```json
{
  "success": true,
  "counts": {
    "active": 12,
    "closed": 8,
    "total": 20
  },
  "active": [...],
  "closed": [...],
  "meta": {
    "searchCriteria": {
      "zip_code": "68028",
      "radius_miles": "5",
      "months_back": "12"
    }
  }
}
```

---

## 🧪 Testing Commands

### Basic Health & Status Checks
```bash
# Health check
curl "http://localhost:3002/api/health"

# Server status
curl "http://localhost:3002/api/status"

# Property counts by status
curl "http://localhost:3002/api/property-count"
```

### Property Search Testing
```bash
# Basic zip code search
curl "http://localhost:3002/api/property-search?zip_code=68028"

# Active listings only
curl "http://localhost:3002/api/property-search?zip_code=68028&status=For Sale"

# Recently sold properties
curl "http://localhost:3002/api/property-search?zip_code=68028&status=Sold"

# Price range filter
curl "http://localhost:3002/api/property-search?zip_code=68028&min_price=300000&max_price=500000"

# New construction
curl "http://localhost:3002/api/property-search?zip_code=68028&new_construction=true"
```

### CMA & Analysis Testing
```bash
# CMA comparables
curl "http://localhost:3002/api/cma-comparables?zip_code=68028&city=Gretna&sqft=2500"

# Future properties
curl "http://localhost:3002/api/future-properties?city=omaha&min_price=600000"

# Community analysis
curl "http://localhost:3002/api/communities?state=NE&min_properties=5"
```

### Advanced Search Testing
```bash
# Enhanced search with agent
curl "http://localhost:3002/api/property-search-new?zip_code=68028&listing_agent_name=Mike"

# Optimized search with caching
curl "http://localhost:3002/api/property-search-optim?zip_code=68028&page=0&limit=20"

# Advanced search with filters
curl "http://localhost:3002/api/property-search-advanced?city=Gretna&min_sqft=2000&waterfront=true"
```

---

## 🔧 Configuration & Setup

### Environment Requirements
- **Node.js:** 18.x (currently running 22.20.0 with compatibility warning)
- **Port:** 3002
- **Dependencies:** Express, CORS, node-fetch

### API Keys & Configuration
- **Paragon API Token:** Configured for MLS data access
- **Gemini AI Key:** For text generation features
- **Dataset ID:** Configured for Nebraska MLS data

### Error Handling
The API includes comprehensive error handling for:
- Invalid parameters
- Missing data
- API rate limits
- Network connectivity issues
- Data validation failures

---

## 📈 Performance Notes

### Caching Strategy
- **Search Cache:** 5-minute TTL
- **Image Cache:** 30-minute TTL
- **Community Data:** 30-minute TTL

### Optimization Features
- Property data validation & correction
- Price anomaly detection
- Batch processing for large datasets
- Progressive loading for image data

### Rate Limiting
- Paragon API: Managed through caching
- Image Processing: Background optimization
- Community Aggregation: Batched processing (200 records/call)

---

## 🚨 Known Issues & Limitations

1. **Connection Issues:** Intermittent connectivity problems with localhost
2. **Node Version:** Warning for Node 18.x requirement vs 22.20.0 actual
3. **Image Processing:** Placeholder implementation (requires Sharp package for production)
4. **Price Data:** Some properties may have corrupted price data (auto-correction implemented)

---

## 📞 Support & Debugging

### Debug Endpoints
```bash
# Check MLS field availability
curl "http://localhost:3002/api/mls-fields"

# Test API configuration
curl "http://localhost:3002/api/test-config"

# Property count analysis
curl "http://localhost:3002/api/property-count?status=Active"
```

### Troubleshooting
1. **Server not responding:** Check if Node.js process is running
2. **Empty results:** Verify zip code format and API parameters
3. **Slow responses:** Check if caching is working properly
4. **Invalid data:** Review property data validation logs

---

**Last Updated:** October 15, 2025  
**API Version:** 2.10.1  
**Documentation Status:** Complete & Current