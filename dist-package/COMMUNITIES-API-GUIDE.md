# 🏘️ CMA API - Communities Endpoint Guide

## 📋 **Overview**

The Communities API endpoint provides a comprehensive list of all available subdivisions and communities from the MLS data with property counts and location information.

**Version:** v2.9.2  
**Release Date:** September 17, 2025  
**Status:** ✅ Production Ready (Enhanced)

v2.9.2 adds more robust Active status detection across multiple upstream status fields and an optional `debugStatuses=1` parameter to include raw status frequency counts per community for troubleshooting. v2.9.1 previously upgraded the endpoint from a single-page sample to full on-demand aggregation with caching, normalization, substring name filtering, and an `inactiveProperties` field. The former `/api/communities-full` endpoint remains an alias and will be removed in a future release.

---

## 🔗 **Endpoint Details**

### **Base URL:**

```
http://gbcma.us-east-2.elasticbeanstalk.com
```

### **Endpoint:**

```
GET /api/communities
```

### **Full URL:**

```
http://gbcma.us-east-2.elasticbeanstalk.com/api/communities
```

---

> **Deprecation Notice:** The legacy endpoint `/api/communities-full` is an alias of `/api/communities` and will be removed in a future release. Use `/api/communities` exclusively.

---

## 📊 **Parameters**

| Parameter        | Type   | Default       | Options                            | Description                                                                 |
| ---------------- | ------ | ------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `state`          | string | "NE"          | Any state code                     | Filter by state                                                             |
| `property_type`  | string | "Residential" | "Residential", "Commercial", "All" | Filter by property type                                                     |
| `status`         | string | "all"         | "active", "all"                    | Include only active listings or all statuses                                |
| `min_properties` | number | 1             | Any positive integer               | Minimum `totalProperties` required for a community to be returned           |
| `sort_by`        | string | "count"       | "count", "name"                    | Sort communities by property count or alphabetically                        |
| `max_records`    | number | 4000          | 200–10000 (practical)              | Safety cap on how many upstream property records to page through (200/page) |
| `q`              | string | (none)        | Any substring                      | Case-insensitive substring filter applied to community name                 |
| `debugStatuses`  | string | (none)        | "1"                                | When set to 1, include `statusCounts` per community for diagnostic purposes |

---

## 🎯 **Example API Calls**

### **1. Get All Communities**

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities"
```

### **2. Get Active Communities Only**

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active"
```

### **3. Get Communities with 5+ Properties**

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?min_properties=5"
```

### **4. Get All Property Types, Sorted by Name**

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?property_type=All&sort_by=name"
```

### **5. Get Commercial Communities**

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?property_type=Commercial"
```

---

## 📋 **Response Format**

### **Success Response:**

```json
{
  "success": true,
  "count": 412,
  "total_properties_analyzed": 4000,
  "cache": {
    "hit": false,
    "expires_in_ms": 1799000,
    "ttl_ms": 1800000
  },
  "filters": {
    "state": "NE",
    "property_type": "Residential",
    "status": "all",
    "min_properties": 1,
    "q": null
  },
  "communities": [
    {
      "name": "Icehouse Ridge",
      "totalProperties": 41,
      "activeProperties": 41,
      "inactiveProperties": 0,
      "cities": ["Ashland"],
      "primaryCity": "Ashland"
    },
    {
      "name": "Silver Oak Estates",
      "totalProperties": 23,
      "activeProperties": 15,
      "inactiveProperties": 8,
      "cities": ["Gretna"],
      "primaryCity": "Gretna"
    },
    {
      "name": "Indian Creek",
      "totalProperties": 18,
      "activeProperties": 12,
      "inactiveProperties": 6,
      "cities": ["Elkhorn", "Omaha"],
      "primaryCity": "Elkhorn"
    }
  ]
}
```

### **Error Response:**

```json
{
  "success": false,
  "error": "Error message details",
  "message": "Failed to fetch communities data"
}
```

---

## 📊 **Response Fields**

### **Root Level:**

| Field                       | Type    | Description                                                                  |
| --------------------------- | ------- | ---------------------------------------------------------------------------- |
| `success`                   | boolean | API call success status                                                      |
| `count`                     | number  | Number of communities returned after filters                                 |
| `total_properties_analyzed` | number  | Total upstream property records scanned (paged, capped by `max_records`)     |
| `cache`                     | object  | Present when caching is enabled: hit flag, remaining TTL, and configured TTL |
| `filters`                   | object  | Applied filters (includes `q` when provided)                                 |
| `communities`               | array   | Array of community objects                                                   |

### **Community Object:**

| Field                | Type   | Description                                           |
| -------------------- | ------ | ----------------------------------------------------- |
| `name`               | string | Community/subdivision canonical name                  |
| `totalProperties`    | number | Total properties discovered in aggregation            |
| `activeProperties`   | number | Properties considered active (multi-field detection)  |
| `inactiveProperties` | number | `totalProperties - activeProperties` (never negative) |
| `cities`             | array  | Distinct cities (sorted) associated with properties   |
| `primaryCity`        | string | First city encountered (stable canonical primary)     |

---

## 🏘️ **Sample Communities Data**

### **Top Active Communities:**

1. **Icehouse Ridge** (Ashland) - 41 active properties
2. **Ritz Lake** (Fremont) - 27 active properties
3. **Heritage** (Bennington) - 17 active properties
4. **Moss 1st Addition** (Sterling) - 16 active properties
5. **Vogler Fourth Addition** (Weeping Water) - 13 active properties

### **Major Subdivision Areas:**

- **Gretna Area:** Silver Oak Estates, Prairie Ridge, Equestrian Ridge
- **Elkhorn Area:** Indian Creek, Oak Ridge Estates, The Hamptons
- **Omaha Area:** Country Club Oaks, Glen Oaks, Green Meadows
- **Lincoln Area:** Arnold Heights, Echo Hills, Firethorn

---

## 🔧 **Integration Examples**

### **JavaScript/Frontend Integration:**

```javascript
// Get all communities
const getCommunitiesList = async () => {
  const response = await fetch(
    "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?sort_by=name"
  );
  const data = await response.json();
  return data.communities;
};

// Get active communities with minimum properties
const getActiveCommunitiesWithMinProperties = async (minProps = 5) => {
  const response = await fetch(
    `http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active&min_properties=${minProps}`
  );
  const data = await response.json();
  return data.communities;
};

// Usage
const communities = await getCommunitiesList();
console.log(`Found ${communities.length} communities`);

communities.forEach((community) => {
  console.log(
    `${community.name} (${community.primaryCity}): ${community.activeProperties}/${community.totalProperties} active`
  );
});
```

### **React Component Example:**

```jsx
import React, { useState, useEffect } from "react";

const CommunitiesDropdown = ({ onCommunitySelect }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch(
          "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?min_properties=3&sort_by=name"
        );
        const data = await response.json();
        setCommunities(data.communities || []);
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  if (loading) return <div>Loading communities...</div>;

  return (
    <select onChange={(e) => onCommunitySelect(e.target.value)}>
      <option value="">Select a Community</option>
      {communities.map((community, index) => (
        <option key={index} value={community.name}>
          {community.name} ({community.primaryCity}) -{" "}
          {community.activeProperties} active
        </option>
      ))}
    </select>
  );
};

export default CommunitiesDropdown;
```

---

## 🔄 **Using with Other Endpoints**

### **Combine with Property Search:**

```bash
# Get communities first
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active&min_properties=10"

# Use community name to search properties
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?subdivision=Silver Oak Estates&state=NE&StandardStatus=Active"
```

### **Frontend Workflow:**

1. **Load Communities:** Use `/api/communities` to populate dropdown/filter options
2. **User Selection:** User selects a community from the list
3. **Property Search:** Use `/api/property-search-new` with selected community name
4. **Display Results:** Show properties in the selected community

---

## ⚠️ **API Limitations**

### **Pagination & Scan Cap**

- Upstream MLS endpoint enforces a per-page maximum of **200 records**; the service transparently pages until it reaches the requested `max_records` (default 4000) or exhausts results.
- `total_properties_analyzed` reflects how many raw property rows were scanned this run (or sourced from cache).
- Increasing `max_records` improves coverage but increases latency and upstream usage.

### **Caching Behavior**

- Base aggregated dataset (before `min_properties`, `q`, sorting) is cached in-memory for **30 minutes** per key: `state|property_type|status|max_records`.
- Subsequent requests with the same base key but different `q`, `min_properties`, or `sort_by` are served instantly without re-querying upstream.
- No persistence across process restarts; cache is in-memory only.

### **Rate & Resource Considerations**

- Large `max_records` plus high concurrency can elevate API call volume; prefer reusing cached results.
- Use conservative `max_records` (e.g., 4000) for UI dropdowns; raise only for administrative analytics.

### **Data Freshness**

- Data updates when cache expires or parameters change.
- New subdivisions appear once at least one matching property is indexed upstream and within paged range.
- Active vs inactive counts depend on current `StandardStatus` values at aggregation time.

### **Alias Deprecation**

- `/api/communities-full` is now an alias of `/api/communities` and will be removed after deprecation period—migrate to `/api/communities`.

---

## 🚀 **Deployment Information**

### **Version History:**

- **v2.9.0** - September 16, 2025: Initial Communities API release
- **Package:** cma-api-deployable-v2.9.0-FINAL.zip
- **Size:** 113KB

### **Production URL:**

```
http://gbcma.us-east-2.elasticbeanstalk.com/api/communities
```

### **Local Development:**

```
http://localhost:3002/api/communities
```

---

## 🧪 **Testing & Validation**

### **Test Commands:**

```bash
# Basic functionality test
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities" | jq '.success'

# Count validation
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities" | jq '.count'

# Sample community data
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?min_properties=5" | jq '.communities[0:3]'
```

### **Expected Results:**

- ✅ `success: true`
- ✅ `count: 150+` communities
- ✅ Communities with property counts
- ✅ Multiple cities per community where applicable

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

**Empty Communities List:**

- Check `min_properties` parameter (try setting to 1)
- Verify `property_type` parameter (try "All")

**Slow Response:**

- API analyzes 200 properties per request
- Consider caching results for better performance

**Missing Communities:**

- API returns sample-based data
- Some smaller communities may not appear in 200-property sample

### **Debugging:**

```bash
# Check API status
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities" | jq '.success, .count, .total_properties_analyzed'

# Validate filters
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active" | jq '.filters'
```

---

## 📚 **Related Documentation**

- [Property Search API Guide](./API-USAGE-GUIDE.md)
- [Active Listings Guide](./FRONTEND-ACTIVE-LISTINGS-GUIDE.md)
- [Property Fields Reference](./PROPERTY-FIELDS-GUIDE.md)
- [Team Management API](./TEAM-MANAGEMENT-API.md)

---

## 📝 **Changelog**

### **v2.9.2 - September 17, 2025**

- 🩺 **Diagnostics:** Optional `debugStatuses=1` returns `statusCounts` map per community
- 🔍 **Robust Active Logic:** Active detection now evaluates multiple fields (`StandardStatus`, `Status`, `ListingStatus`, `MlsStatus`) and tolerant of abbreviations (e.g. `act`)
- 🧮 **Accuracy:** Prevents undercounting when upstream uses alternative status fields
- 📘 **Docs:** Updated parameter list and field description for `activeProperties`

### **v2.9.1 - September 17, 2025**

- 🚀 **Enhancement:** Full multi-page aggregation replaces single-page sample
- 🗃️ **Caching:** 30‑minute in-memory cache for base aggregation key
- 🔡 **Normalization:** Case-insensitive merging of subdivision name variants
- 🔍 **Filtering:** Added `q` substring parameter
- ➗ **New Metric:** `inactiveProperties` added (`total - active`)
- ♻️ **Alias:** `/api/communities-full` deprecated (now alias of primary endpoint)
- 📐 **Docs:** Updated parameters, response fields, and limitations

### **v2.9.0 - September 16, 2025**

- ✨ **NEW:** Communities API endpoint
- 📊 **Feature:** Property counts per community
- 🏙️ **Feature:** Multiple cities per community support
- 🔍 **Feature:** Active/all status filtering
- 📈 **Feature:** Minimum properties filtering
- 🔤 **Feature:** Sorting by count or name

---

**🔗 Quick Links:**

- [Test Endpoint](http://gbcma.us-east-2.elasticbeanstalk.com/api/communities)
- [Property Search](http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new)
- [API Documentation](./API-USAGE-GUIDE.md)

---

_Last Updated: September 17, 2025 | Version: 2.9.2_
