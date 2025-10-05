# Advanced Property Search API - Complete Guide (v2.10.0)

This comprehensive guide covers the new non‑breaking endpoint `GET /api/property-search-advanced` - from technical reference to practical integration examples.

## 🚀 Quick Start

```bash
# Basic multi-status search
curl "https://<domain>/api/property-search-advanced?status=Active,Pending&limit=10"

# Advanced filters with sorting
curl "https://<domain>/api/property-search-advanced?status=Active&min_sqft=1800&new_construction=1&sort_by=ListPrice&sort_order=asc&limit=25"
```

## 📋 API Reference

### Base Endpoint

```
GET /api/property-search-advanced
```

### Complete Parameter Reference (Phase 1)

| Parameter                 | Type        | Description                                                                                               | Example                     |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Location Filters**      |
| `city`                    | string      | Case-insensitive exact match                                                                              | `city=Omaha`                |
| `subdivision`             | string      | Case-insensitive substring match                                                                          | `subdivision=remington`     |
| `property_type`           | string      | Exact PropertyType match                                                                                  | `property_type=Residential` |
| **Status & Availability** |
| `status`                  | string/list | Multi-status support                                                                                      | `status=Active,Pending`     |
| **Size & Structure**      |
| `min_sqft`                | number      | Minimum living area                                                                                       | `min_sqft=1500`             |
| `max_sqft`                | number      | Maximum living area                                                                                       | `max_sqft=3000`             |
| `min_year_built`          | number      | Minimum construction year (1800+)                                                                         | `min_year_built=2015`       |
| `max_year_built`          | number      | Maximum construction year                                                                                 | `max_year_built=2023`       |
| `min_garage`              | number      | Minimum garage spaces                                                                                     | `min_garage=2`              |
| **Feature Flags**         |
| `waterfront`              | boolean     | Waterfront properties only                                                                                | `waterfront=true`           |
| `new_construction`        | boolean     | New construction (flag OR year≥current-2)                                                                 | `new_construction=1`        |
| `photo_only`              | boolean     | Properties with photos only                                                                               | `photo_only=true`           |
| **Sorting & Limits**      |
| `sort_by`                 | enum        | Sort field: `ModificationTimestamp`\|`ListPrice`\|`ClosePrice`\|`DaysOnMarket`\|`LivingArea`\|`YearBuilt` | `sort_by=ListPrice`         |
| `sort_order`              | enum        | `asc` or `desc` (default `desc`)                                                                          | `sort_order=asc`            |
| `limit`                   | number      | Results limit (default 100, max 500)                                                                      | `limit=50`                  |

### Advanced Filter Logic

- **Multi-status**: Comma-separated (`status=Active,Pending`) or repeated params (`status=Active&status=Pending`)
- **Boolean values**: Accepts `true/1/yes/y` (case-insensitive)
- **Year constraints**: Auto-clamped to 1800..current year, `max >= min` enforced
- **Invalid params**: Collected in `meta.ignoredParams` (non-fatal)

## 📝 Response Schema

### Successful Response

```json
{
  "success": true,
  "count": 2,
  "properties": [
    {
      "id": "123456789",
      "mlsNumber": "22104567",
      "address": "10512 Remington Dr",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68136",
      "subdivision": "Remington",
      "propertyType": "Residential",
      "propertySubType": "Single Family Residence",
      "architecturalStyle": "Ranch",
      "listPrice": 445000,
      "closePrice": null,
      "pricePerSqft": 202,
      "beds": 4,
      "baths": 3,
      "livingArea": 2200,
      "belowGradeFinishedArea": 650,
      "lotSquareFeet": 9148,
      "garageSpaces": 3,
      "yearBuilt": 2023,
      "daysOnMarket": 11,
      "listingContractDate": "2025-09-07T00:00:00Z",
      "modificationTimestamp": "2025-09-18T15:55:10Z",
      "status": "Active",
      "images": [
        "https://cdn.example.com/123/photo1.jpg",
        "https://cdn.example.com/123/photo2.jpg"
      ],
      "image": "https://cdn.example.com/123/photo1.jpg",
      "hasBasement": true,
      "isWaterfront": false,
      "isNewConstruction": true,
      "latitude": 41.20091,
      "longitude": -96.16022
    }
  ],
  "meta": {
    "appliedFilters": {
      "statuses": ["Active", "Pending"],
      "min_sqft": 1800,
      "sort_by": "ListPrice",
      "sort_order": "asc",
      "limit": 25
    },
    "ignoredParams": [],
    "sort": { "by": "ListPrice", "order": "asc" },
    "timingMs": 142,
    "source": "live"
  }
}
```

### Computed Fields Reference

| Field               | Computation Logic                               |
| ------------------- | ----------------------------------------------- |
| `pricePerSqft`      | `Math.round(listPrice / totalSqft)` if both > 0 |
| `daysOnMarket`      | Days since `OnMarketDate` or 0 if missing       |
| `isNewConstruction` | Feed flag OR `YearBuilt >= currentYear - 2`     |
| `hasBasement`       | `belowGradeFinishedArea > 0`                    |
| `images`            | Raw URLs from feed `Media[]` array              |
| `image`             | First image from `images` array                 |

### Error Response

```json
{
  "success": false,
  "error": "Upstream error 400: Cannot select field DaysOnMarket"
}
```

## 🔄 Migration from Legacy API

### Key Differences vs `/api/property-search-new`

| Feature              | Legacy            | Advanced                                |
| -------------------- | ----------------- | --------------------------------------- |
| **Multi-status**     | ❌ Single only    | ✅ Comma-separated                      |
| **Meta diagnostics** | Minimal           | Full `appliedFilters` + `ignoredParams` |
| **Photo filtering**  | ❌ Not available  | ✅ `photo_only=true`                    |
| **New construction** | Simple flag       | Flag OR year heuristic                  |
| **Error resilience** | Some silent fails | Explicit ignored params                 |
| **Breaking changes** | N/A               | Zero - preserves old route              |

### Migration Strategy

1. **Phase 1**: Frontend experiments use advanced endpoint only
2. **Phase 2**: Collect telemetry on `ignoredParams` and error rates
3. **Phase 3**: Gradually migrate default search flows
4. **Phase 4**: Optional deprecation of legacy endpoint

## 💡 Usage Examples

### Basic Searches

```bash
# Multi-status with size filter
curl "https://<domain>/api/property-search-advanced?status=Active,Pending&min_sqft=1500&limit=20"

# City-specific with photos
curl "https://<domain>/api/property-search-advanced?city=Omaha&photo_only=1&status=Active&limit=30"
```

### Advanced Filtering

```bash
# New construction with garage requirements
curl "https://<domain>/api/property-search-advanced?new_construction=1&min_garage=3&status=Active,Pending&limit=15"

# Year range with waterfront
curl "https://<domain>/api/property-search-advanced?min_year_built=2010&max_year_built=2020&waterfront=true&limit=25"

# Subdivision search with sorting
curl "https://<domain>/api/property-search-advanced?subdivision=remington&sort_by=ListPrice&sort_order=desc&limit=40"
```

### Complex Combined Filters

```bash
# Premium search: New construction, waterfront, photos, garage
curl "https://<domain>/api/property-search-advanced?status=Active&new_construction=1&waterfront=1&photo_only=1&min_garage=2&min_sqft=2000&sort_by=ListPrice&limit=10"

# Investment search: Specific year range with size constraints
curl "https://<domain>/api/property-search-advanced?status=Active,Pending&min_year_built=2015&max_year_built=2023&min_sqft=1800&max_sqft=2500&sort_by=DaysOnMarket&sort_order=asc&limit=50"
```

## 🛠️ Integration Tips

### Performance Optimization

- **Limit control**: Use `limit≤100` for UI lists, `limit≤25` for cards
- **Avoid broad queries**: Don't combine large city + no status + high limit
- **Status specificity**: Always include status filter when possible

### Error Handling

```javascript
// Example response handling
const response = await fetch(
  "/api/property-search-advanced?status=Active&min_sqft=1500"
);
const data = await response.json();

if (!data.success) {
  console.error("Search failed:", data.error);
  return;
}

// Check for ignored parameters
if (data.meta.ignoredParams.length > 0) {
  console.warn("Ignored params:", data.meta.ignoredParams);
}

// Process results
data.properties.forEach((property) => {
  console.log(`${property.address}: $${property.listPrice}`);
});
```

### Multi-Status Best Practices

```javascript
// Preferred: comma syntax
"?status=Active,Pending";

// Also supported: repeated params
"?status=Active&status=Pending";

// Normalized internally to: ["Active", "Pending"]
```

## 🧪 Testing & Validation

### Sample Test Script

```bash
#!/usr/bin/env bash
BASE="https://<your-domain>"

echo "=== Multi-Status + Size Filter ==="
curl -s "$BASE/api/property-search-advanced?status=Active,Pending&min_sqft=1500&limit=5" | jq '.count,.meta.appliedFilters'

echo "=== New Construction with Photos ==="
curl -s "$BASE/api/property-search-advanced?new_construction=1&photo_only=1&status=Active&limit=5" | jq '.count,.properties[0].isNewConstruction'

echo "=== Subdivision Search ==="
curl -s "$BASE/api/property-search-advanced?subdivision=remington&limit=5" | jq '.count,.properties[0].subdivision'

echo "=== Ignored Parameters Test ==="
curl -s "$BASE/api/property-search-advanced?status=Active&invalid_param=test&limit=5" | jq '.meta.ignoredParams'
```

### Parameter Validation Examples

```bash
# Valid year constraints
curl "...?min_year_built=2000&max_year_built=2023"  # ✅ Valid range

# Auto-corrected constraints
curl "...?min_year_built=2025&max_year_built=1990"  # → min=1990, max=2025

# Boolean flexibility
curl "...?photo_only=1"        # ✅ true
curl "...?photo_only=true"     # ✅ true
curl "...?photo_only=yes"      # ✅ true
curl "...?photo_only=random"   # → ignored
```

## 🔮 Future Roadmap (Phase 2+)

Planned extensions (not yet implemented):

| Feature               | Parameter                           | Description               |
| --------------------- | ----------------------------------- | ------------------------- |
| **Geographic**        | `radius_miles` + `lat,lng`          | Geo-radius search         |
| **Market Timing**     | `min_dom`, `max_dom`                | Days on market range      |
| **Value Analysis**    | `min_price_per_sqft`                | Price efficiency filter   |
| **Basement Features** | `has_basement`, `min_basement_sqft` | Basement-specific filters |
| **Media Enhancement** | `virtual_tour=true`                 | Virtual tour availability |

## 📚 Related Documentation

- **`advancedSearchParamParser.js`** - Parameter validation logic
- **`ADVANCED-PROPERTY-SEARCH-API-REFERENCE.md`** - Technical reference (deprecated in favor of this guide)
- **`server.js`** - Main endpoint implementation

## 📋 Changelog

- **v2.10.0** - Initial release of `/api/property-search-advanced` (Phase 1 scope)
- **v2.9.2** - Enhanced active detection for communities endpoint
- **v2.9.1** - Communities caching and normalization

---

**Version**: 2.10.0  
**Last Updated**: September 21, 2025  
**Endpoint**: `/api/property-search-advanced`
