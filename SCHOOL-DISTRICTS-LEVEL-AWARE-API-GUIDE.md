# School Districts API - Level-Aware Implementation Guide

## Overview

The `/api/districts` endpoint provides comprehensive school district information with true Elementary/Middle/High differentiation. This implementation addresses the need for accurate district-level filtering and property aggregation based on school service levels.

## API Contract

### Endpoint

```
GET /api/districts
```

### Query Parameters

| Parameter        | Type   | Default        | Description                                                     |
| ---------------- | ------ | -------------- | --------------------------------------------------------------- |
| `state`          | string | `"NE"`         | State abbreviation                                              |
| `level`          | string | `"elementary"` | **Required** - Service level: "elementary", "middle", or "high" |
| `status`         | string | `"active"`     | Property status filter                                          |
| `min_properties` | number | `3`            | Minimum properties to include district                          |
| `max_records`    | number | `2000`         | Maximum districts to return                                     |
| `q`              | string | optional       | Search filter for district/city/community names                 |

### Response Format

```json
{
  "success": true,
  "count": 15,
  "totalCommunities": 89,
  "filters": {
    "state": "NE",
    "level": "elementary",
    "status": "active",
    "min_properties": 3,
    "max_records": 2000,
    "q": null
  },
  "districts": [
    {
      "name": "Millard Public Schools",
      "level": "elementary",
      "state": "NE",
      "cities": ["Omaha", "Millard"],
      "communities": [
        {
          "name": "Shadow Ridge",
          "city": "Omaha",
          "propertyCount": 45
        },
        {
          "name": "Sterling Ridge",
          "city": "Omaha",
          "propertyCount": 32
        }
      ],
      "totalCommunities": 8,
      "totalActiveProperties": 234,
      "propertyCount": 234
    }
  ]
}
```

## Level-Specific Semantics

### Elementary Level ("elementary")

- **Grades**: K-5 or K-6 depending on district
- **MLS Field**: `ElementarySchoolDistrict`
- **Communities**: All subdivisions served by elementary schools in this district

### Middle Level ("middle")

- **Grades**: 6-8 or 5-8 depending on district structure
- **MLS Fields**: `MiddleSchoolDistrict` OR `MiddleOrJuniorSchoolDistrict`
- **Communities**: Subdivisions served by middle/junior high schools

### High Level ("high")

- **Grades**: 9-12
- **MLS Field**: `HighSchoolDistrict`
- **Communities**: All subdivisions feeding into high schools in this district

## Key Features

### True Level Differentiation

- Different districts may serve different levels
- Property counts vary by level within same geographic area
- Community assignments can differ by school level

### Dynamic Property Aggregation

- Real-time property counts from MLS data
- Level-specific filtering before aggregation
- Minimum properties filter applied after level filtering

### Comprehensive Search

- Search across district names, cities, and communities
- Level-aware result filtering
- Proper handling of unified K-12 vs specialized districts

## Enhanced Property Search Integration

The existing `/api/property-search-new` endpoint has been enhanced with school district filtering:

### New Parameters

| Parameter             | Type   | Description                                                |
| --------------------- | ------ | ---------------------------------------------------------- |
| `school_district`     | string | Any district name (searches all levels)                    |
| `elementary_district` | string | Specific elementary district                  -y6u7i.ik8     .l/;;pl./]
1        |
| `middle_district`     | string | Specific middle/junior district                            |
| `high_district`       | string | Specific high school district                              |
| `school_level`        | string | When used with `school_district`, limits to specific level |

### Example Usage

```bash
# Find properties in Millard elementary district
curl "http://localhost:3001/api/property-search-new?elementary_district=Millard+Public+Schools&limit=10"

# Find properties in any Gretna district (all levels)
curl "http://localhost:3001/api/property-search-new?school_district=Gretna+Public+Schools&limit=10"

# Find properties in Westside high school district specifically
curl "http://localhost:3001/api/property-search-new?school_district=Westside+Community+Schools&school_level=high&limit=10"
```

## Testing Commands

### Level Comparison Tests

```bash
# Elementary districts
curl "http://localhost:3001/api/districts?level=elementary&min_properties=3&max_records=50" | jq '{count: .count, names: (.districts | map(.name) | unique)}'

# Middle school districts
curl "http://localhost:3001/api/districts?level=middle&min_properties=3&max_records=50" | jq '{count: .count, names: (.districts | map(.name) | unique)}'

# High school districts
curl "http://localhost:3001/api/districts?level=high&min_properties=3&max_records=50" | jq '{count: .count, names: (.districts | map(.name) | unique)}'
```

### District-Specific Testing

```bash
# Search for Gretna districts
curl "http://localhost:3001/api/districts?level=elementary&q=gretna" | jq '.districts[] | {name, propertyCount, totalCommunities}'

# Get Millard elementary data
curl "http://localhost:3001/api/districts?level=elementary&q=millard" | jq '.districts[0] | {name, cities, totalActiveProperties, communities: (.communities | length)}'

# Compare Elkhorn across levels
curl "http://localhost:3001/api/districts?level=elementary&q=elkhorn" | jq '.districts[0].totalActiveProperties'
curl "http://localhost:3001/api/districts?level=middle&q=elkhorn" | jq '.districts[0].totalActiveProperties'
curl "http://localhost:3001/api/districts?level=high&q=elkhorn" | jq '.districts[0].totalActiveProperties'
```

### Property Search Integration Tests

```bash
# Test level-specific property searches
curl "http://localhost:3001/api/property-search-new?elementary_district=Omaha+Public+Schools&limit=5" | jq '.properties | length'

curl "http://localhost:3001/api/property-search-new?middle_district=Millard+Public+Schools&limit=5" | jq '.properties[0] | {address, schoolMiddleDistrict}'

curl "http://localhost:3001/api/property-search-new?high_district=Westside+Community+Schools&limit=5" | jq '.properties[0] | {address, schoolHighDistrict}'
```

## Success Criteria Validation

✅ **Level Differentiation**: Same district request with different levels yields different property counts
✅ **Accurate Aggregation**: Property counts reflect only the requested school level
✅ **Proper Filtering**: `min_properties` applied after level-specific aggregation
✅ **Search Integration**: Property search endpoints accept district filters with level awareness
✅ **Performance**: Reasonable response times with caching for district data

## Troubleshooting

### Common Issues

1. **Empty Results**: Check if district names match exactly (case-sensitive)
2. **Unexpected Counts**: Verify MLS data has proper school district fields populated
3. **Performance**: Use `max_records` parameter to limit large result sets
4. **Level Confusion**: Ensure using correct level parameter values

### Debug Queries

```bash
# Check district mapping
curl "http://localhost:3001/api/districts?level=elementary&max_records=5" | jq '.districts[] | {name, cities, level}'

# Verify property field population
curl "http://localhost:3001/api/property-search-new?city=Omaha&limit=3" | jq '.properties[] | {address, schoolElementaryDistrict, schoolMiddleDistrict, schoolHighDistrict}'
```

## Implementation Notes

- **Caching**: District data includes 5-15 minute caching for performance
- **Fallback**: Default level is "elementary" for backward compatibility
- **Field Mapping**: Handles both `MiddleSchoolDistrict` and `MiddleOrJuniorSchoolDistrict` fields
- **Error Handling**: Graceful degradation when MLS data is unavailable
- **Scalability**: Configurable limits and pagination support
