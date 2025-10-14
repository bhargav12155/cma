# Open Houses API Guide

This guide documents the CMA API's Open Houses endpoint, which provides structured access to open house data for properties in the MLS.

## Overview

The Open Houses API provides a structured way to access open house information, eliminating the need to parse text from remarks fields. This ensures consistent, reliable access to open house dates, times, and details.

## Endpoint

```
GET /api/open-houses
```

## Query Parameters

| Parameter  | Type   | Required | Default                | Description                                         |
|------------|--------|----------|------------------------|-----------------------------------------------------|
| limit      | number | No       | 50                     | Maximum number of results to return                 |
| community  | string | No       | Default from config    | Community identifier                                |
| start_date | string | No       | Today                  | Start date for open house range (YYYY-MM-DD)        |
| end_date   | string | No       | Today + 7 days         | End date for open house range (YYYY-MM-DD)          |

## Response Format

```json
{
  "success": true,
  "count": 5,
  "properties": [
    {
      "id": "12345",
      "mlsNumber": "12345",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "ST",
      "zipCode": "12345",
      "propertyType": "Residential",
      "listPrice": 350000,
      "beds": 3,
      "baths": 2,
      "sqft": 1800,
      "status": "Active",
      "image": "https://example.com/image.jpg",
      "images": ["https://example.com/image.jpg", "https://example.com/image2.jpg"],
      "latitude": 40.123,
      "longitude": -74.123,
      "openHouse": {
        "hasOpenHouse": true,
        "openHouseDate": "2023-06-15",
        "openHouseStartTime": "13:00",
        "openHouseEndTime": "15:00",
        "openHouseStatus": "scheduled",
        "openHouseDays": ["Thursday"]
      },
      "openHouseDisplay": "Thursday, June 15, 2023 from 1:00 PM to 3:00 PM"
    },
    // Additional properties...
  ],
  "meta": {
    "timingMs": 245,
    "dateRange": {
      "start": "2023-06-15",
      "end": "2023-06-22"
    },
    "community": "example"
  }
}
```

## Open House Data Structure

The `openHouse` object contains structured information:

| Field             | Type     | Description                                             |
|-------------------|----------|---------------------------------------------------------|
| hasOpenHouse      | boolean  | Indicates if the property has an open house             |
| openHouseDate     | string   | Date of the open house in YYYY-MM-DD format             |
| openHouseStartTime| string   | Start time in 24-hour format (HH:MM)                    |
| openHouseEndTime  | string   | End time in 24-hour format (HH:MM)                      |
| openHouseStatus   | string   | Status (usually "scheduled")                            |
| openHouseDays     | string[] | Array of day names (e.g., ["Sunday", "Saturday"])       |
| openHouseDisplay  | string   | Formatted display string for convenience                |

## Example Usage

### Basic Query (Next 7 Days)

```
GET /api/open-houses
```

### Open Houses in a Specific Date Range

```
GET /api/open-houses?start_date=2023-06-01&end_date=2023-06-30
```

### Limited Results

```
GET /api/open-houses?limit=10
```

### Specific Community

```
GET /api/open-houses?community=metropolis
```

## Data Sources

The API extracts open house information from two sources:

1. **Structured Fields**: Primary source - uses `OpenHouseDate`, `OpenHouseStartTime`, and `OpenHouseEndTime` fields when available.

2. **PublicRemarks**: Fallback - parses open house information from remarks fields when structured data isn't available.

## Implementation Notes

- The API automatically determines day of week from the date
- Times are normalized to 24-hour format for consistency
- The API includes a human-readable formatted display string for convenience
- Results are sorted by open house date (ascending)

## Error Responses

On error, the API returns:

```json
{
  "success": false,
  "error": "Error message",
  "meta": {
    "source": "error"
  }
}
```

## Changelog

- **v1.0.0** - Initial release of Open Houses endpoint