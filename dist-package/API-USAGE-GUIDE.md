# 🚀 CMA Real Estate API - Complete Usage Guide

## 📋 Overview

This comprehensive real estate API provides property search capabilities, property details lookup, and comparable market analysis (CMA) functionality. Built for real estate professionals and applications requiring detailed property data from the Paragon MLS system.

## 🌐 Available Endpoints

### Primary Endpoints:

- `GET /api/properties/search` - Advanced property search with filtering
- `GET /api/property-search` - Basic property search
- `GET /api/property-search-new` - Enhanced property search with StandardStatus support
- `GET /api/cma-comparables` - CMA comparable properties analysis
- `GET /api/comps` - Property comparables
- `GET /api/property-reference` - Property reference lookup
- `GET /api/communities` - Available communities/subdivisions list ⭐ **NEW v2.9.0**
- `GET /api/health` - API health check

### Web Interface:

- `GET /` - Full CMA web application interface

## � Authentication

This API requires Bearer Token authentication for property data access. Include the authorization header in your requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&limit=10"
```

**Note**: The `/api/health` endpoint does not require authentication.

## 🔗 Base URLs

**Production:**

```
https://gbcma.us-east-2.elasticbeanstalk.com
```

**Local Development:**

```
http://localhost:3002
```

## 📊 Property Search Response Format

**Endpoint:** `GET /api/properties/search`

```json
{
  "success": true,
  "count": 25,
  "totalAvailable": "unknown",
  "properties": [
    {
      "id": "bee7e16cc5de4d1b58ec1d079f69d8f3",
      "address": "19863 Cottonwood Street",
      "city": "Gretna",
      "state": "NE",
      "zipCode": "68028",
      "listPrice": 575000,
      "soldPrice": null,
      "sqft": 1890,
      "basementSqft": 1686,
      "totalSqft": 3576,
      "beds": 5,
      "baths": 3,
      "garage": 3,
      "yearBuilt": 2017,
      "status": "Active",
      "propertyType": "Residential",
      "subdivision": "REMINGTON WEST",
      "style": ["Ranch", "Traditional"],
      "condition": "Excellent",
      "description": "Beautiful ranch home featuring granite countertops, hardwood floors, and finished basement. Located in desirable Remington West subdivision with access to community amenities.",
      "lotSizeSqft": 8712,
      "pricePerSqft": 304,
      "distance_miles": 0,
      "imageUrl": "https://photos.paragonmls.com/...",
      "isActive": true,
      "listAgent": {
        "name": "Mike Connell",
        "phone": "",
        "email": "",
        "mlsId": ""
      },
      "listOffice": {
        "name": "Celebrity Homes Inc",
        "phone": "",
        "mlsId": ""
      }
    }
  ],
  "searchFilters": {
    "city": "Gretna",
    "min_sqft": "690",
    "max_sqft": "3090"
  },
  "apiUrl": "https://api.paragonapi.com/..."
}
```

## 🏠 Property Details Response Format

**Endpoint:** `GET /api/property-details/:id`

```json
{
  "success": true,
  "property": {
    "id": "bee7e16cc5de4d1b58ec1d079f69d8f3",
    "address": "19863 Cottonwood Street",
    "city": "Gretna",
    "state": "NE",
    "zipCode": "68028",
    "coordinates": {
      "latitude": 41.180872,
      "longitude": -96.228298
    },
    "listPrice": 575000,
    "sqft": 1890,
    "basementSqft": 1686,
    "totalSqft": 3576,
    "beds": 5,
    "baths": 3,
    "garage": 3,
    "yearBuilt": 2017,
    "propertyType": "Residential",
    "subdivision": "REMINGTON WEST",
    "style": ["Ranch", "Traditional"],
    "images": ["url1", "url2", "url3"],
    "description": "Beautiful ranch home...",
    "features": ["Granite Counters", "Hardwood Floors"]
  }
}
```

---

## 🎯 Common Use Cases & Examples

### 1. 🏠 Basic Property Search by City

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&limit=10"
  -H "Content-Type: application/json"
```

### 2. 📊 Property Comparables Analysis

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/cma-comparables?city=Gretna&min_sqft=1500&limit=10"
  -H "Content-Type: application/json"
```

### 3. 💰 Price Range Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_price=200000&max_price=800000&limit=15"
  -H "Content-Type: application/json"
```

### 4. 📏 Square Footage Filter

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_sqft=1500&max_sqft=3500&limit=20"
  -H "Content-Type: application/json"
```

### 5. 🛏️ Bedrooms & Bathrooms

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_bedrooms=3&max_bedrooms=5&min_bathrooms=2&limit=10"
  -H "Content-Type: application/json"
```

### 6. 🏗️ Year Built Range

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_year_built=2000&max_year_built=2020&limit=12"
  -H "Content-Type: application/json"
```

### 7. 🚗 Garage Spaces

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&garage_spaces=3&min_price=300000&limit=8"
  -H "Content-Type: application/json"
```

### 8. 🌊 Waterfront Properties

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&waterfront=true&min_price=500000&limit=5"
  -H "Content-Type: application/json"
```

### 9. 🆕 New Construction

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&new_construction=true&min_year_built=2020&limit=10"
  -H "Content-Type: application/json"
```

### 10. 🏘️ Subdivision Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?subdivision=Linden+Estates&min_price=400000&limit=8"
  -H "Content-Type: application/json"
```

### 11. 🎯 Advanced CMA Search (Real Example)

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?address=19863+Cottonwood+Street%2C+Gretna+NE+68028&city=Gretna&latitude=41.180872&longitude=-96.228298&min_sqft=690&max_sqft=3090&min_year_built=2013&max_year_built=2025&limit=200&sort_by=ListPrice&sort_order=desc"
  -H "Accept: */*"
  -H "Accept-Language: en-US,en;q=0.9,es;q=0.8"
  -H "Connection: keep-alive"
  -H "Referer: https://gbcma.us-east-2.elasticbeanstalk.com/"
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
  --insecure
```

### 2. 📊 Property Comparables Analysis

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/cma-comparables?city=Gretna&min_sqft=1500&limit=10" \
  -H "Content-Type: application/json"
```

### 3. �💰 Price Range Search

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_price=200000&max_price=800000&limit=15" \
  -H "Content-Type: application/json"
```

### 4. 📏 Square Footage Filter

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_sqft=1500&max_sqft=3500&limit=20" \
  -H "Content-Type: application/json"
```

### 5. 🛏️ Bedrooms & Bathrooms

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_bedrooms=3&max_bedrooms=5&min_bathrooms=2&limit=10" \
  -H "Content-Type: application/json"
```

### 6. 🏗️ Year Built Range

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_year_built=2000&max_year_built=2020&limit=12" \
  -H "Content-Type: application/json"
```

### 7. 🚗 Garage Spaces

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&garage_spaces=3&min_price=300000&limit=8" \
  -H "Content-Type: application/json"
```

### 8. 🌊 Waterfront Properties

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&waterfront=true&min_price=500000&limit=5" \
  -H "Content-Type: application/json"
```

### 9. 🆕 New Construction

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&new_construction=true&min_year_built=2020&limit=10" \
  -H "Content-Type: application/json"
```

### 10. 🏘️ Subdivision Search

```bash
curl -X GET "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?subdivision=Linden+Estates&min_price=400000&limit=8" \
  -H "Content-Type: application/json"
```

### 11. �️ Communities/Subdivisions List ⭐ **NEW v2.9.0**

Get all available communities with property counts:

```bash
# Get all communities
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities"

# Get active communities only
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active&min_properties=5"

# Get communities sorted by name
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?sort_by=name"
```

**Response Format:**

```json
{
  "success": true,
  "count": 161,
  "communities": [
    {
      "name": "Silver Oak Estates",
      "totalProperties": 23,
      "activeProperties": 15,
      "cities": ["Gretna"],
      "primaryCity": "Gretna"
    }
  ]
}
```

**📖 See detailed documentation:** [Communities API Guide](./COMMUNITIES-API-GUIDE.md)

### 12. �🎯 Advanced CMA Search (Real Example)

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?address=19863+Cottonwood+Street%2C+Gretna+NE+68028&city=Gretna&latitude=41.180872&longitude=-96.228298&min_sqft=690&max_sqft=3090&min_year_built=2013&max_year_built=2025&limit=200&sort_by=ListPrice&sort_order=desc" \
  -H "Accept: */*" \
  -H "Accept-Language: en-US,en;q=0.9,es;q=0.8" \
  -H "Connection: keep-alive" \
  -H "Referer: http://gbcma.us-east-2.elasticbeanstalk.com/" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36" \
  --insecure
```

---

## 👨‍💼 Agent Search Examples

### 12. 🔍 Buyer Agent by MLS ID

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?buyer_agent_mls_id=969503&limit=10" \
  -H "Content-Type: application/json"
```

### 13. 🔎 Agent Name Wildcard Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?agent=mike&limit=15" \
  -H "Content-Type: application/json"
```

### 14. 📋 Listing Agent Search by Name

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?listing_agent_name=Deb&max_price=3000000&limit=10" \
  -H "Content-Type: application/json"
```

### 15. 🏢 Search Properties with Agent Information

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?city=Omaha&limit=5" \
  -H "Content-Type: application/json" | jq '.properties[] | {address, listPrice, listAgent, listOffice}'
```

---

## 🎯 CMA (Comparable Market Analysis) Examples

### 15. 📊 Full CMA Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_sqft=1800&max_sqft=2800&min_price=300000&max_price=700000&min_year_built=1990&garage_spaces=2&limit=50" \
  -H "Content-Type: application/json"
```

### 16. 🏡 Luxury Property Comp

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_price=1000000&min_sqft=4000&min_bedrooms=4&min_bathrooms=3&garage_spaces=3&limit=25" \
  -H "Content-Type: application/json"
```

### 17. 🏠 Starter Home Analysis

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&max_price=350000&min_bedrooms=2&max_bedrooms=3&min_sqft=1000&max_sqft=2000&limit=30" \
  -H "Content-Type: application/json"
```

---

## 🔧 Advanced Combinations

### 18. 🎯 Investment Property Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?property_type=Residential+Income&min_price=200000&max_price=1000000&limit=15" \
  -H "Content-Type: application/json"
```

### 19. 📍 Address-Based Search

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?address=Linden+Estates&city=Omaha&min_sqft=2500&limit=20" \
  -H "Content-Type: application/json"
```

### 20. 🏆 Premium Properties

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_price=800000&min_sqft=3500&min_bedrooms=4&garage_spaces=3&waterfront=true&limit=10" \
  -H "Content-Type: application/json"
```

### 21. 🔄 Comprehensive Market Analysis

```bash
curl -X GET "https://gbcma.us-east-2.elasticbeanstalk.com/api/properties/search?city=Omaha&min_price=250000&max_price=2000000&min_sqft=1200&max_sqft=6000&min_year_built=1980&sort_by=ListPrice&sort_order=desc&limit=100" \
  -H "Content-Type: application/json"
```

---

## 📮 ZIP Code Property Search Examples

### 22. 🔍 Basic ZIP Code Search

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007"
```

### 23. 📮 ZIP Code with Limit

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&limit=20"
```

### 24. 💰 ZIP Code with Price Range

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68028&min_price=200000&max_price=800000"
```

### 25. 📏 ZIP Code with Square Footage Filter

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&min_sqft=1500&max_sqft=3500"
```

### 26. 🛏️ ZIP Code with Bedrooms/Bathrooms

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&min_beds=3&max_beds=5&min_baths=2"
```

### 27. 📅 ZIP Code with Sorting (Newest First)

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&sort_by=newest&limit=15"
```

### 28. 💲 ZIP Code with Price Sorting (High to Low)

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&sort_by=price&sort_order=desc&limit=10"
```

### 29. 🎯 ZIP Code Multiple Filters Combined

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68028&min_price=300000&max_price=700000&min_sqft=1800&max_sqft=3000&min_year_built=2000&sort_by=price&sort_order=desc&limit=25"
```

### 30. 🏠 MLS Number Property Lookup

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?mls_number=22524913"
```

### 31. 📋 Alternative MLS Search

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?mls_number=22524913"
```

### 32. 🔗 Using Listing ID Parameter

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?listing_id=22524913"
```

### 33. 🏠 Local Development ZIP Search

```bash
curl "http://localhost:3002/api/property-search-new?zip_code=68007"
```

### 34. 📊 ZIP Code with JSON Formatting

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007" | jq
```

### 35. 🔢 Property Count by Status

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-count"
```

### 36. 📋 Test New Fields (ZIP, State, Description)

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?zip_code=68007&limit=5" | jq '.properties[] | {address, city, state, zipCode, baths, description, lotSizeSqft, condition, style}'
```

### 37. 🔍 Verify New Field Data

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?mls_number=22524913" | jq '.properties[0] | {zipCode, state, description, baths, lotSizeSqft, basementSqft, totalSqft, condition, style}'
```

---

## 📝 Complete Parameter Reference

| Parameter              | Type    | Description                        | Example            |
| ---------------------- | ------- | ---------------------------------- | ------------------ |
| **Property IDs**       |
| `mls_number`           | string  | MLS/Listing ID                     | `969503`           |
| `listing_id`           | string  | Listing ID                         | `22514045`         |
| **Agent Search**       |
| `agent`                | string  | Agent name search (any agent type) | `mike`             |
| `buyer_agent_mls_id`   | string  | Buyer agent MLS ID                 | `969503`           |
| `buyer_agent_name`     | string  | Buyer agent name (wildcard)        | `Andrew`           |
| `listing_agent_mls_id` | string  | Listing agent MLS ID               | `966012`           |
| `listing_agent_name`   | string  | Listing agent name (wildcard)      | `Deb`              |
| **Location**           |
| `address`              | string  | Property address (partial match)   | `Linden Estates`   |
| `city`                 | string  | City name                          | `Omaha`            |
| `state`                | string  | State code                         | `NE`               |
| `zip_code`             | string  | ZIP code                           | `68007`            |
| `subdivision`          | string  | Subdivision name                   | `Bennington Lake`  |
| **Property Specs**     |
| `min_sqft`             | number  | Minimum square feet                | `1500`             |
| `max_sqft`             | number  | Maximum square feet                | `3500`             |
| `above_grade_sqft`     | number  | Above grade sq ft                  | `2000`             |
| `basement_sqft`        | number  | Basement sq ft                     | `800`              |
| `total_sqft`           | number  | Total building sq ft               | `2800`             |
| **Price Range**        |
| `min_price`            | number  | Minimum price                      | `200000`           |
| `max_price`            | number  | Maximum price                      | `800000`           |
| **Year Built**         |
| `min_year_built`       | number  | Minimum year built                 | `1990`             |
| `max_year_built`       | number  | Maximum year built                 | `2020`             |
| **Bedrooms/Bathrooms** |
| `bedrooms`             | number  | Exact bedroom count                | `3`                |
| `min_bedrooms`         | number  | Minimum bedrooms                   | `2`                |
| `max_bedrooms`         | number  | Maximum bedrooms                   | `5`                |
| `bathrooms`            | number  | Exact bathroom count               | `2`                |
| `min_bathrooms`        | number  | Minimum bathrooms                  | `1`                |
| `max_bathrooms`        | number  | Maximum bathrooms                  | `4`                |
| **Features**           |
| `garage_spaces`        | number  | Garage spaces                      | `2`                |
| `waterfront`           | boolean | Waterfront property                | `true`             |
| `new_construction`     | boolean | New construction                   | `true`             |
| `property_type`        | string  | Property type                      | `Residential`      |
| `property_condition`   | string  | Property condition                 | `Recently Updated` |
| **Sorting/Pagination** |
| `sort_by`              | string  | Sort field                         | `ListPrice`        |
| `sort_order`           | string  | Sort direction                     | `desc`             |
| `limit`                | number  | Result limit                       | `50`               |
| `offset`               | number  | Result offset                      | `0`                |

---

## � Recently Added Fields (v2.2.0)

The following critical fields have been added to address common frontend requirements:

### ✅ Critical Fields Added:

- **`baths`** - Bathroom count (was already implemented but now guaranteed)
- **`zipCode`** - ZIP code extracted from address or PostalCode field
- **`state`** - State abbreviation extracted from address or StateOrProvince field
- **`description`** - Property description from PublicRemarks/PrivateRemarks

### 🔶 Enhanced Fields:

- **`lotSizeSqft`** - Lot size in square feet (converted from acres if needed)
- **`basementSqft`** - Now guaranteed not null (defaults to 0)
- **`totalSqft`** - Now guaranteed not 0 if sqft is available
- **`condition`** - Improved to join multiple conditions
- **`style`** - Now returns array of all architectural styles

### 🎯 Field Mapping Strategy:

```javascript
// The API now uses this fallback strategy:
zipCode: prop.PostalCode || extractedFromAddress,
state: prop.StateOrProvince || extractedFromAddress,
description: prop.PublicRemarks || prop.PrivateRemarks || "",
baths: prop.BathroomsTotalInteger || prop.BathroomsTotal || 0,
```

---

## �🏠 Property Response Fields

Each property in the API response includes these standardized fields:

| Field            | Type    | Description                 | Example                       |
| ---------------- | ------- | --------------------------- | ----------------------------- |
| `id`             | string  | Unique property identifier  | `bee7e16cc5de4d1b...`         |
| `address`        | string  | Property street address     | `19863 Cottonwood St`         |
| `city`           | string  | City name                   | `Gretna`                      |
| `state`          | string  | State abbreviation          | `NE`                          |
| `zipCode`        | string  | ZIP code                    | `68028`                       |
| `description`    | string  | Property description        | `Beautiful ranch home...`     |
| `listPrice`      | number  | Current/original list price | `575000`                      |
| `soldPrice`      | number  | Final sold price (if sold)  | `570000`                      |
| `sqft`           | number  | Above-grade living area     | `1890`                        |
| `basementSqft`   | number  | Finished basement area      | `1686`                        |
| `totalSqft`      | number  | Total finished square feet  | `3576`                        |
| `lotSizeSqft`    | number  | Lot size in square feet     | `8712`                        |
| `beds`           | number  | Number of bedrooms          | `5`                           |
| `baths`          | number  | Number of bathrooms         | `3`                           |
| `garage`         | number  | Garage spaces               | `3`                           |
| `yearBuilt`      | number  | Year constructed            | `2017`                        |
| `status`         | string  | Property status             | `Active`                      |
| `propertyType`   | string  | Type of property            | `Residential`                 |
| `subdivision`    | string  | Subdivision name            | `REMINGTON WEST`              |
| `style`          | array   | Architectural styles        | `["Ranch", "Traditional"]`    |
| `condition`      | string  | Property condition          | `Excellent`                   |
| `pricePerSqft`   | number  | Price per square foot       | `304`                         |
| `distance_miles` | number  | Distance from search center | `1.2`                         |
| `imageUrl`       | string  | Primary property image      | `https://photos...`           |
| `isActive`       | boolean | Currently on market         | `true`                        |
| `coordinates`    | object  | Latitude/longitude          | `{lat: 41.18, lng: -96.22}`   |
| `listAgent`      | object  | Listing agent information   | `{name, phone, email, mlsId}` |
| `listOffice`     | object  | Listing office information  | `{name, phone, mlsId}`        |

---

## 📊 CMA Analysis Features

The API provides specialized features for Comparative Market Analysis:

### Distance Calculations

- Automatic distance calculation from subject property
- Haversine formula for accurate geographic distance
- Results sorted by proximity when address provided

### Square Footage Analysis

- Separate tracking of above-grade vs basement square footage
- Total finished area calculations
- Price-per-square-foot metrics

### Market Status Categorization

- Active listings (currently for sale)
- Sold/closed properties (with sale dates)
- Expired/cancelled listings
- Pending sales

### Property Matching Algorithm

- Intelligent property lookup by address
- Fuzzy matching for address variations
- MLS number and listing ID support

### Agent Information

- Listing agent details included in every property response
- Agent name and office information available
- Search properties by agent name with flexible matching
- Agent contact fields structure maintained for future expansion

---

## 🎨 Frontend Integration Examples

### JavaScript Fetch API

```javascript
// Fetch comparable properties for CMA
const fetchComparableProperties = async (searchCriteria) => {
  const params = new URLSearchParams();

  // Add search criteria
  if (searchCriteria.city) params.set("city", searchCriteria.city);
  if (searchCriteria.minPrice) params.set("min_price", searchCriteria.minPrice);
  if (searchCriteria.maxPrice) params.set("max_price", searchCriteria.maxPrice);
  if (searchCriteria.minSqft) params.set("min_sqft", searchCriteria.minSqft);
  if (searchCriteria.maxSqft) params.set("max_sqft", searchCriteria.maxSqft);
  if (searchCriteria.minYearBuilt)
    params.set("min_year_built", searchCriteria.minYearBuilt);
  if (searchCriteria.maxYearBuilt)
    params.set("max_year_built", searchCriteria.maxYearBuilt);

  try {
    const response = await fetch(`/api/properties/search?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      // Categorize results by status
      const active = data.properties.filter((p) => p.isActive);
      const sold = data.properties.filter((p) => !p.isActive && p.soldPrice);

      return {
        success: true,
        active,
        sold,
        all: data.properties,
        count: data.count,
      };
    } else {
      throw new Error(data.error || "API request failed");
    }
  } catch (error) {
    console.error("Property search error:", error);
    return { success: false, error: error.message };
  }
};

// Get detailed property information
const getPropertyDetails = async (propertyId) => {
  try {
    const response = await fetch(`/api/property-details/${propertyId}`);
    const data = await response.json();

    if (data.success) {
      return data.property;
    } else {
      throw new Error(data.error || "Failed to fetch property details");
    }
  } catch (error) {
    console.error("Property details error:", error);
    return null;
  }
};

// Example usage in a CMA application
const performCMAAnalysis = async (subjectProperty) => {
  const searchCriteria = {
    city: subjectProperty.city,
    minSqft: Math.floor(subjectProperty.sqft * 0.7), // 30% range
    maxSqft: Math.ceil(subjectProperty.sqft * 1.3),
    minYearBuilt: subjectProperty.yearBuilt - 10,
    maxYearBuilt: subjectProperty.yearBuilt + 10,
    minPrice: Math.floor(subjectProperty.estimatedValue * 0.8),
    maxPrice: Math.ceil(subjectProperty.estimatedValue * 1.2),
  };

  const results = await fetchComparableProperties(searchCriteria);

  if (results.success) {
    // Calculate average prices for active and sold properties
    const activeAvg =
      results.active.length > 0
        ? results.active.reduce((sum, p) => sum + p.listPrice, 0) /
          results.active.length
        : 0;

    const soldAvg =
      results.sold.length > 0
        ? results.sold.reduce((sum, p) => sum + p.soldPrice, 0) /
          results.sold.length
        : 0;

    return {
      activeComps: results.active,
      soldComps: results.sold,
      averageActivePrice: activeAvg,
      averageSoldPrice: soldAvg,
      totalComps: results.count,
    };
  }

  return null;
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from "react";

const PropertyComparables = ({ subjectPropertyId }) => {
  const [loading, setLoading] = useState(true);
  const [comparables, setComparables] = useState([]);
  const [subjectProperty, setSubjectProperty] = useState(null);

  useEffect(() => {
    const loadComparables = async () => {
      setLoading(true);

      // First get the subject property details
      const subject = await getPropertyDetails(subjectPropertyId);
      if (!subject) return;

      setSubjectProperty(subject);

      // Then find comparable properties
      const searchCriteria = {
        city: subject.city,
        minSqft: Math.floor(subject.sqft * 0.8),
        maxSqft: Math.ceil(subject.sqft * 1.2),
        minYearBuilt: subject.yearBuilt - 15,
        maxYearBuilt: subject.yearBuilt + 15,
      };

      const results = await fetchComparableProperties(searchCriteria);
      if (results.success) {
        setComparables(results.all);
      }

      setLoading(false);
    };

    if (subjectPropertyId) {
      loadComparables();
    }
  }, [subjectPropertyId]);

  if (loading) return <div>Loading comparables...</div>;

  return (
    <div className="property-comparables">
      <h2>Comparable Properties Analysis</h2>

      {subjectProperty && (
        <div className="subject-property">
          <h3>Subject Property</h3>
          <p>
            {subjectProperty.address}, {subjectProperty.city}
          </p>
          <p>
            {subjectProperty.sqft} sqft • {subjectProperty.beds} beds •{" "}
            {subjectProperty.baths} baths
          </p>
          <p>
            Built: {subjectProperty.yearBuilt} • Price: $
            {subjectProperty.listPrice?.toLocaleString()}
          </p>
        </div>
      )}

      <div className="comparables-grid">
        {comparables.map((comp) => (
          <div key={comp.id} className="comparable-card">
            <img src={comp.imageUrl} alt={comp.address} />
            <div className="comp-details">
              <h4>{comp.address}</h4>
              <p>
                {comp.sqft} sqft • {comp.beds} beds • {comp.baths} baths
              </p>
              <p>Built: {comp.yearBuilt}</p>
              <p className="price">
                ${(comp.soldPrice || comp.listPrice)?.toLocaleString()}
                {comp.isActive ? " (Active)" : " (Sold)"}
              </p>
              <p className="price-per-sqft">${comp.pricePerSqft}/sqft</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyComparables;
```

---

## 📈 Status Fields in Response

Properties include these status-related fields:

- `status`: Standardized status (`Active`, `Closed`, `Pending`, etc.)
- `isActive`: Boolean indicating if currently on market
- `listPrice`: Current or original listing price
- `soldPrice`: Final sale price (if sold)
- `closeDate`: Date property closed (if sold)
- `onMarketDate`: Date property went on market

---

## 🚀 Performance Tips

1. **Use appropriate limits**: Don't request more than needed (default: 50, max recommended: 200)
2. **Combine filters**: Use multiple parameters for precise results
3. **Sort strategically**: Use `sort_by` and `sort_order` for relevant ordering
4. **Cache results**: Results can be cached on frontend for better UX
5. **Distance searches**: Include latitude/longitude for accurate distance calculations

---

## ⚠️ Important Notes

- **Comprehensive Data**: API returns ALL properties regardless of status for maximum flexibility
- **Smart Matching**: Address search supports fuzzy matching and variations
- **Real-time Data**: Connected to live Paragon MLS system
- **Standardized Fields**: All responses use consistent field names (sqft, beds, baths, etc.)
- **Image Support**: Includes primary property images when available
- **Geographic Data**: Coordinates and distance calculations included
- **Agent Information**: Listing agent and office details included in property responses
- **Flexible Agent Search**: Search by agent name using the `agent` parameter for broad matching

---

## 🆘 Error Handling

```javascript
// Robust error handling example
const safePropertySearch = async (criteria) => {
  try {
    const response = await fetch(
      "/api/properties/search?" + new URLSearchParams(criteria)
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log(`Found ${data.count} properties`);
      return data;
    } else {
      console.error("API Error:", data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error("Network/Parse Error:", error);
    return { success: false, error: error.message };
  }
};

// Health check example
const checkAPIHealth = async () => {
  try {
    const response = await fetch("/api/health");
    const health = await response.json();
    console.log("API Status:", health.status);
    return health.status === "healthy";
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
};
```

---

## 🔧 Environment Configuration

For deployment, ensure these environment variables are set:

```bash
# Required
PARAGON_API_TOKEN=your_paragon_mls_token

# Optional
PORT=3002
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 📚 Additional Resources

- **GitHub Repository**: [cma-real-estate-api](https://github.com/bhargav12155/cma)
- **Live Demo**: Access the web interface at your deployed URL
- **Support**: Contact for API access and integration support

---

_Last Updated: September 7, 2025 - Version 2.2.0 - Added Critical Missing Fields (zipCode, state, description, lotSizeSqft, enhanced baths/condition/style)_
