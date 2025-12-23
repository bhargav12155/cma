# Property Search API - UI Filters Guide

**Version:** 2.11.2
**Last Updated:** December 22, 2025
**Base URL:** `https://gbcma.us-east-2.elasticbeanstalk.com`

## Endpoint

```
GET /api/property-search-new
```

---

## All Available Filter Parameters

### Basic Filters

| Parameter        | Type   | Example         | Description                    |
| ---------------- | ------ | --------------- | ------------------------------ |
| `city`           | string | `Omaha`         | City name                      |
| `StandardStatus` | string | `Active`        | Property status                |
| `property_type`  | string | `Residential`   | Property type                  |
| `limit`          | number | `20`            | Results per page (default: 20) |
| `offset`         | number | `0`             | Pagination offset              |
| `sort_by`        | string | `ListPrice`     | Sort field                     |
| `sort_order`     | string | `asc` or `desc` | Sort direction                 |

### Price & Size Filters

| Parameter   | Type   | Example  | Description         |
| ----------- | ------ | -------- | ------------------- |
| `min_price` | number | `200000` | Minimum list price  |
| `max_price` | number | `500000` | Maximum list price  |
| `min_sqft`  | number | `1500`   | Minimum square feet |
| `max_sqft`  | number | `3000`   | Maximum square feet |
| `lot_size`  | string | `0.5-1`  | Lot size in acres   |

### Beds & Baths

| Parameter   | Type   | Example | Description       |
| ----------- | ------ | ------- | ----------------- |
| `min_beds`  | number | `3`     | Minimum bedrooms  |
| `min_baths` | number | `2`     | Minimum bathrooms |

### Property Features (Zillow-Style)

| Parameter          | Type    | Example                             | Description                      |
| ------------------ | ------- | ----------------------------------- | -------------------------------- |
| `has_basement`     | boolean | `true`                              | Properties with basement         |
| `stories`          | string  | `1`, `2`, `ranch`, `split`, `multi` | Number of stories or style       |
| `senior_community` | boolean | `true` or `false`                   | 55+ senior communities           |
| `has_pool`         | boolean | `true`                              | Properties with pool             |
| `has_fireplace`    | boolean | `true`                              | Properties with fireplace        |
| `has_ac`           | boolean | `true`                              | Properties with air conditioning |
| `has_virtual_tour` | boolean | `true`                              | Properties with virtual tour     |
| `max_dom`          | number  | `30`                                | Max days on market               |
| `view`             | string  | `water,mountain`                    | View types (comma-separated)     |

### Additional Filters

| Parameter          | Type    | Example        | Description                   |
| ------------------ | ------- | -------------- | ----------------------------- |
| `min_year_built`   | number  | `2000`         | Minimum year built            |
| `max_year_built`   | number  | `2024`         | Maximum year built            |
| `garage_spaces`    | number  | `2`            | Minimum garage spaces         |
| `min_garage`       | number  | `2`            | Minimum garage spaces (alias) |
| `waterfront`       | boolean | `true`         | Waterfront properties         |
| `new_construction` | boolean | `true`         | New construction only         |
| `max_hoa`          | number  | `200`          | Maximum HOA fee               |
| `house_style`      | string  | `Ranch`        | House style                   |
| `keywords`         | string  | `pool,granite` | Keywords search               |
| `photo_only`       | boolean | `true`         | Only with photos              |

---

## Request/Response Examples

### 1. Basic Search

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 1234,
  "properties": [
    {
      "listingId": "22510279",
      "address": "123 Main St, Omaha, NE 68102",
      "listPrice": 350000,
      "beds": 4,
      "baths": 3,
      "sqft": 2500,
      "propertyType": "Residential",
      "propertySubType": "Single Family Residence",
      "status": "Active",
      "photos": ["https://..."],
      "latitude": 41.2565,
      "longitude": -95.9345
    }
  ]
}
```

---

### 2. Price Range Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_price=300000&max_price=500000&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 456,
  "properties": [
    {
      "listingId": "22510280",
      "address": "456 Oak Ave, Omaha, NE 68114",
      "listPrice": 425000,
      "beds": 4,
      "baths": 2.5,
      "sqft": 2800,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 3. Beds & Baths Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_beds=4&min_baths=3&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 234,
  "properties": [
    {
      "listingId": "22510281",
      "address": "789 Elm St, Omaha, NE 68124",
      "listPrice": 475000,
      "beds": 5,
      "baths": 3.5,
      "sqft": 3200,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 4. Has Basement Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&has_basement=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 892,
  "properties": [
    {
      "listingId": "22510282",
      "address": "321 Pine Rd, Omaha, NE 68132",
      "listPrice": 385000,
      "beds": 4,
      "baths": 3,
      "sqft": 2600,
      "basement": "Full",
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 5. Stories Filter (Ranch Style)

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&stories=ranch&limit=5
```

**Supported Values:**

- `1` - Single story homes
- `2` - Two story homes
- `ranch` - Ranch style homes
- `split` - Split level homes
- `multi` - Multi-level homes

**Response:**

```json
{
  "count": 5,
  "total": 456,
  "properties": [
    {
      "listingId": "22510283",
      "address": "555 Cedar Ln, Omaha, NE 68144",
      "listPrice": 320000,
      "beds": 3,
      "baths": 2,
      "sqft": 1800,
      "architecturalStyle": ["Ranch"],
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 6. Stories Filter (2-Story)

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&stories=2&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 567,
  "properties": [
    {
      "listingId": "22510284",
      "address": "777 Maple Dr, Omaha, NE 68154",
      "listPrice": 450000,
      "beds": 4,
      "baths": 2.5,
      "sqft": 2900,
      "levels": ["Two"],
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 7. Senior Community Filter (55+)

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&senior_community=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 89,
  "properties": [
    {
      "listingId": "22510285",
      "address": "999 Senior Way, Omaha, NE 68164",
      "listPrice": 275000,
      "beds": 2,
      "baths": 2,
      "sqft": 1500,
      "seniorCommunityYN": true,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 8. Has Pool Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&has_pool=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 67,
  "properties": [
    {
      "listingId": "22510286",
      "address": "111 Pool Dr, Omaha, NE 68116",
      "listPrice": 525000,
      "beds": 4,
      "baths": 3,
      "sqft": 3100,
      "poolFeatures": ["In Ground", "Heated"],
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 9. Max Days on Market Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&max_dom=30&limit=5
```

**Description:** Returns properties listed within the last 30 days.

**Response:**

```json
{
  "count": 5,
  "total": 234,
  "properties": [
    {
      "listingId": "22510287",
      "address": "222 New Listing Ct, Omaha, NE 68118",
      "listPrice": 399000,
      "beds": 3,
      "baths": 2.5,
      "sqft": 2200,
      "onMarketDate": "2024-12-15",
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 10. Has Fireplace Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&has_fireplace=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 678,
  "properties": [
    {
      "listingId": "22510288",
      "address": "333 Cozy Home Ln, Omaha, NE 68122",
      "listPrice": 365000,
      "beds": 4,
      "baths": 2,
      "sqft": 2400,
      "fireplaceYN": true,
      "fireplaceFeatures": ["Gas", "Living Room"],
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 11. Has Air Conditioning Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&has_ac=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 1100,
  "properties": [
    {
      "listingId": "22510289",
      "address": "444 Cool Breeze Ave, Omaha, NE 68128",
      "listPrice": 340000,
      "beds": 3,
      "baths": 2,
      "sqft": 2000,
      "cooling": ["Central Air"],
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 12. Has Virtual Tour Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&has_virtual_tour=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 345,
  "properties": [
    {
      "listingId": "22510290",
      "address": "555 Virtual View St, Omaha, NE 68134",
      "listPrice": 415000,
      "beds": 4,
      "baths": 3,
      "sqft": 2700,
      "virtualTourURLUnbranded": "https://...",
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 13. Square Footage Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_sqft=2000&max_sqft=3000&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 567,
  "properties": [
    {
      "listingId": "22510291",
      "address": "666 Spacious Dr, Omaha, NE 68136",
      "listPrice": 395000,
      "beds": 4,
      "baths": 2.5,
      "sqft": 2500,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 14. Year Built Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_year_built=2015&max_year_built=2024&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 234,
  "properties": [
    {
      "listingId": "22510292",
      "address": "777 Modern Home Way, Omaha, NE 68138",
      "listPrice": 475000,
      "beds": 4,
      "baths": 3,
      "sqft": 2800,
      "yearBuilt": 2020,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 15. Garage Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_garage=2&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 890,
  "properties": [
    {
      "listingId": "22510293",
      "address": "888 Garage Haven Ct, Omaha, NE 68142",
      "listPrice": 355000,
      "beds": 3,
      "baths": 2,
      "sqft": 2100,
      "garageSpaces": 3,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 16. Waterfront Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&waterfront=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 45,
  "properties": [
    {
      "listingId": "22510294",
      "address": "999 Lakefront Dr, Omaha, NE 68144",
      "listPrice": 650000,
      "beds": 5,
      "baths": 4,
      "sqft": 3500,
      "waterfrontYN": true,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 17. New Construction Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&new_construction=true&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 123,
  "properties": [
    {
      "listingId": "22510295",
      "address": "100 Brand New Blvd, Omaha, NE 68146",
      "listPrice": 525000,
      "beds": 4,
      "baths": 3.5,
      "sqft": 3000,
      "newConstructionYN": true,
      "yearBuilt": 2024,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 18. Max HOA Filter

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&max_hoa=200&limit=5
```

**Response:**

```json
{
  "count": 5,
  "total": 678,
  "properties": [
    {
      "listingId": "22510296",
      "address": "200 Low HOA Ln, Omaha, NE 68148",
      "listPrice": 295000,
      "beds": 3,
      "baths": 2,
      "sqft": 1800,
      "associationFee": 150,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 19. Combined Filters (Complex Search)

**Request:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&min_price=300000&max_price=500000&min_beds=4&min_baths=2&has_basement=true&has_ac=true&min_garage=2&limit=10
```

**Response:**

```json
{
  "count": 10,
  "total": 156,
  "properties": [
    {
      "listingId": "22510297",
      "address": "300 Perfect Home St, Omaha, NE 68150",
      "listPrice": 425000,
      "beds": 4,
      "baths": 3,
      "sqft": 2600,
      "basement": "Full",
      "cooling": ["Central Air"],
      "garageSpaces": 2,
      "propertyType": "Residential",
      "status": "Active"
    }
  ]
}
```

---

### 20. Sorting Results

**Request (Price Low to High):**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&sort_by=ListPrice&sort_order=asc&limit=5
```

**Request (Price High to Low):**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&sort_by=ListPrice&sort_order=desc&limit=5
```

**Request (Newest First):**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&sort_by=OnMarketDate&sort_order=desc&limit=5
```

---

### 21. Pagination

**First Page:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&limit=20&offset=0
```

**Second Page:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&limit=20&offset=20
```

**Third Page:**

```
GET /api/property-search-new?city=Omaha&StandardStatus=Active&limit=20&offset=40
```

---

## Filter Combinations (UI Checkbox Mappings)

### Zillow-Style "More Filters" Section

| UI Label         | API Parameter      | Values |
| ---------------- | ------------------ | ------ |
| Basement         | `has_basement`     | `true` |
| Pool             | `has_pool`         | `true` |
| Fireplace        | `has_fireplace`    | `true` |
| Air Conditioning | `has_ac`           | `true` |
| Virtual Tour     | `has_virtual_tour` | `true` |
| 55+ Community    | `senior_community` | `true` |
| Waterfront       | `waterfront`       | `true` |
| New Construction | `new_construction` | `true` |

### Stories Dropdown/Select

| UI Label     | API Value       |
| ------------ | --------------- |
| Single Story | `stories=1`     |
| Two Story    | `stories=2`     |
| Ranch        | `stories=ranch` |
| Split Level  | `stories=split` |
| Multi-Level  | `stories=multi` |

### Days on Market Dropdown

| UI Label | API Value        |
| -------- | ---------------- |
| Any      | (omit parameter) |
| 1 Day    | `max_dom=1`      |
| 7 Days   | `max_dom=7`      |
| 14 Days  | `max_dom=14`     |
| 30 Days  | `max_dom=30`     |
| 60 Days  | `max_dom=60`     |
| 90 Days  | `max_dom=90`     |

---

## Error Responses

### Invalid Parameter

```json
{
  "error": "Invalid parameter value",
  "message": "min_price must be a number"
}
```

### No Results

```json
{
  "count": 0,
  "total": 0,
  "properties": []
}
```

---

## Notes for UI Implementation

1. **Boolean Filters**: Only send `true` - don't send `false` (omit the parameter)
2. **Multiple Values**: Use comma separation for arrays (e.g., `view=water,mountain`)
3. **Case Sensitivity**: City names are case-insensitive
4. **Default Limit**: 20 results per page
5. **Max Limit**: 100 results per page
6. **Pagination**: Use `offset` for pagination, not `page`

---

## Quick Reference - All Parameters

```
/api/property-search-new?
  city=Omaha&
  StandardStatus=Active&
  min_price=200000&
  max_price=500000&
  min_beds=3&
  min_baths=2&
  min_sqft=1500&
  max_sqft=3000&
  min_year_built=2000&
  max_year_built=2024&
  min_garage=2&
  has_basement=true&
  has_pool=true&
  has_fireplace=true&
  has_ac=true&
  has_virtual_tour=true&
  senior_community=true&
  waterfront=true&
  new_construction=true&
  max_hoa=300&
  max_dom=30&
  stories=ranch&
  sort_by=ListPrice&
  sort_order=asc&
  limit=20&
  offset=0
```
