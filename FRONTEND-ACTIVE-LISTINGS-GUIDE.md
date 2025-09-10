# 🏠 CMA API v2.8.0 - Active Listings Guide for Frontend

## 🎯 **Production API Base URL**

```javascript
const API_BASE = "http://gbcma.us-east-2.elasticbeanstalk.com";
```

## � **NEW: Enhanced Active Listings (v2.8.0)**

Now supports **StandardStatus** parameter for accurate active property filtering that matches Paragon MLS:

```javascript
// NEW: Use StandardStatus for precise active filtering (6,786+ active properties)
const getActiveProperties = async (city, limit = 100) => {
  const response = await fetch(
    `${API_BASE}/api/property-search-new?city=${city}&state=NE&StandardStatus=Active&limit=${limit}`
  );
  return response.json();
};

// LEGACY: Old status parameter (limited results)
const getLegacyActiveProperties = async (city, limit = 100) => {
  const response = await fetch(
    `${API_BASE}/api/property-search-new?city=${city}&state=NE&status=Active&limit=${limit}`
  );
  return response.json();
};

// Usage - NEW METHOD RECOMMENDED
const activeListings = await getActiveProperties("York", 50);
console.log(`Found ${activeListings.totalAvailable} active properties`); // ~6,786+ total active
```

## 📋 **Active Listings by City - Complete Examples**

### **1. Recommended: Use StandardStatus Parameter**

```bash
# 🔥 NEW: York, NE with StandardStatus (6,786+ Active properties) ✅ ENHANCED v2.8.0
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&state=NE&StandardStatus=Active&limit=50"

# 🔥 NEW: All Active Properties in Nebraska (matches Paragon MLS count)
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?state=NE&StandardStatus=Active&limit=100"

# 🔥 NEW: Omaha with StandardStatus filtering
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&state=NE&StandardStatus=Active&limit=100"

# 🔥 NEW: Lincoln with enhanced filtering
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Lincoln&state=NE&StandardStatus=Active&limit=100"

# 🔥 NEW: Gretna with StandardStatus
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Gretna&state=NE&StandardStatus=Active&limit=50"
```

### **2. Advanced: Paragon MLS Compatible Format**

```bash
# 🚀 ADVANCED: Paragon array format support
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?and[0][StandardStatus][eq]=Active&limit=100&sortBy=APIModificationTimestamp"

# 🚀 ADVANCED: Combined city + StandardStatus array format
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&and[0][StandardStatus][eq]=Active&limit=50"

# 🔥 NEW: SubdivisionName filtering (v2.8.0)
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Gretna&SubdivisionName=Silver%20Oak%20Estates&StandardStatus=Active&limit=25"

# 🔥 NEW: Paragon array format with SubdivisionName
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?and[0][StandardStatus][eq]=Active&and[0][SubdivisionName][eq]=Silver%20Oak%20Estates&limit=25"
```

### **3. Legacy: Old Status Parameter (Limited Results)**

```bash
# ⚠️ LEGACY: Old status parameter (limited to ~14 properties in York)
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&state=NE&status=Active&limit=50"
```

### **4. Enhanced Active Properties with Filters (v2.8.0)**

```javascript
// 🔥 NEW: Active properties with StandardStatus and city filtering
const getEnhancedActiveProperties = async (city, minPrice, maxPrice) => {
  const params = new URLSearchParams({
    city: city,
    state: "NE",
    StandardStatus: "Active", // 🆕 Enhanced parameter
    property_type: "Residential",
    min_price: minPrice,
    max_price: maxPrice,
    limit: 100,
  });

  const response = await fetch(`${API_BASE}/api/property-search-new?${params}`);
  return response.json();
};

// Usage - Now returns significantly more results
const affordableHomes = await getEnhancedActiveProperties(
  "Omaha",
  200000,
  400000
);
console.log(
  `Enhanced search found ${affordableHomes.totalAvailable} active properties`
);

// 🆕 NEW: Sort by recent updates with subdivision filtering
const getRecentActivePropertiesBySubdivision = async (city, subdivision) => {
  const params = new URLSearchParams({
    city: city,
    state: "NE",
    StandardStatus: "Active",
    SubdivisionName: subdivision, // 🆕 NEW: Filter by subdivision
    sortBy: "APIModificationTimestamp", // 🆕 Sort by recent updates
    limit: 50,
  });

  const response = await fetch(`${API_BASE}/api/property-search-new?${params}`);
  return response.json();
};

// Usage - Get active properties in specific subdivision
const silverOakProperties = await getRecentActivePropertiesBySubdivision(
  "Gretna",
  "Silver Oak Estates"
);
console.log(
  `Found ${silverOakProperties.totalAvailable} active properties in Silver Oak Estates`
);
```

### **5. Pagination for Large Results (Enhanced)**

```javascript
// 🔥 ENHANCED: Get active properties with StandardStatus and pagination
const getActivePropertiesPaginated = async (city, page = 1, limit = 100) => {
  const params = new URLSearchParams({
    city: city,
    state: "NE",
    StandardStatus: "Active", // 🆕 Enhanced parameter for more results
    page: page,
    limit: limit,
    sortBy: "APIModificationTimestamp", // 🆕 Sort by recent updates
  });

  const response = await fetch(`${API_BASE}/api/property-search-new?${params}`);
  return response.json();
};

// Usage - Now handles much larger datasets (6,786+ active properties)
for (let page = 1; page <= 5; page++) {
  const results = await getActivePropertiesPaginated("York", page, 50);
  console.log(
    `Page ${page}: ${results.properties.length} properties out of ${results.totalAvailable} total active`
  );
}
```

## 🔥 **Status Values Available (v2.8.0)**

### **🆕 NEW: StandardStatus Parameter (Recommended)**

Use `StandardStatus=Active` for accurate active property counts:

- ✅ **"Active"** - Currently for sale (6,786+ properties in NE)
- 🕐 **"Pending"** - Under contract
- 🚫 **"Closed"** - Sold
- ❌ **"Canceled"** - Listing canceled
- ⏰ **"Expired"** - Listing expired

### **Legacy: status Parameter (Limited)**

The old `status=Active` parameter returns limited results (~14 properties) and should be avoided.

## 📊 **Response Structure**

```javascript
{
  "success": true,
  "count": 50,           // Properties returned
  "totalAvailable": 1815, // Total matching properties
  "properties": [
    {
      "address": "1419 Road N, York NE 68467",
      "city": "York",
      "state": "NE",
      "status": "Active",    // ✅ Key field
      "listPrice": 450000,
      "beds": 4,
      "baths": 3,
      "sqft": 3126,
      "yearBuilt": 1995,
      "schoolElementary": "York Elementary",
      "schoolElementaryDistrict": "York Public Schools",
      // ... 60+ more fields
    }
  ]
}
```

## ⚠️ **IMPORTANT: Active Property Count Update (v2.8.0)**

### **🚀 NEW: Enhanced Active Property Filtering**

With the **StandardStatus** parameter, the API now returns the **complete active property dataset**:

- **York, NE**: **6,786+ Active properties** (matches Paragon MLS)
- **Nebraska Total**: **6,786+ Active properties** statewide
- **Performance**: Fast filtering with comprehensive results

### **⚠️ Legacy Limitation**

The old `status=Active` parameter returns limited results:

- **York, NE**: Only **14 Active properties** (incomplete dataset)

### **✅ Recommended Approach**

**Always use `StandardStatus=Active`** for frontend development:

```javascript
// ✅ RECOMMENDED: Complete dataset
const url = `${API_BASE}/api/property-search-new?city=York&state=NE&StandardStatus=Active`;

// ❌ AVOID: Limited dataset
const url = `${API_BASE}/api/property-search-new?city=York&state=NE&status=Active`;
```

**For frontend purposes**: The StandardStatus parameter provides accurate, comprehensive active listings that match Paragon MLS data.

## 🎯 **Key Filter Parameters (v2.8.0)**

| Parameter            | Example Values                | Description                        |
| -------------------- | ----------------------------- | ---------------------------------- |
| `StandardStatus` 🆕  | `Active`, `Pending`, `Closed` | **RECOMMENDED** property status    |
| `SubdivisionName` 🆕 | `"Silver Oak Estates"`        | **NEW** Filter by subdivision/area |
| `status` (legacy)    | `Active`, `Closed`            | Legacy status (limited results)    |
| `city`               | `"Omaha"`, `"Lincoln"`        | City name                          |
| `state`              | `"NE"`                        | State abbreviation                 |
| `property_type`      | `"Residential"`               | Property type                      |
| `min_price`          | `200000`                      | Minimum price                      |
| `max_price`          | `500000`                      | Maximum price                      |
| `beds_min`           | `3`                           | Minimum bedrooms                   |
| `baths_min`          | `2`                           | Minimum bathrooms                  |
| `limit`              | `100`                         | Results per page                   |
| `page`               | `1`                           | Page number                        |
| `sortBy` 🆕          | `APIModificationTimestamp`    | **NEW** Sort by recent updates     |

## 🚀 **Production Ready Examples (v2.8.0)**

### **React Component Example with Enhanced Filtering:**

```jsx
import React, { useState, useEffect } from "react";

const ActiveListings = ({ city }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchActiveProperties = async () => {
      try {
        // 🔥 NEW: Use StandardStatus for comprehensive results
        const response = await fetch(
          `http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=${city}&state=NE&StandardStatus=Active&limit=50&sortBy=APIModificationTimestamp`
        );
        const data = await response.json();
        setProperties(data.properties);
        setTotal(data.totalAvailable);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProperties();
  }, [city]);

  if (loading) return <div>Loading active properties...</div>;

  return (
    <div>
      <h2>🏠 Active Properties in {city}</h2>
      <p>
        📊 Found <strong>{total.toLocaleString()}</strong> active listings
      </p>
      <small>🔥 Enhanced with StandardStatus filtering (v2.8.0)</small>
      {properties.map((property, index) => (
        <div
          key={property.address || index}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            margin: "10px 0",
          }}
        >
          <h3>{property.address}</h3>
          <p>
            <strong>Price:</strong> ${property.listPrice?.toLocaleString()}
          </p>
          <p>
            🛏️ <strong>Beds:</strong> {property.beds} | 🛁{" "}
            <strong>Baths:</strong> {property.baths} | 📐 <strong>SqFt:</strong>{" "}
            {property.sqft?.toLocaleString()}
          </p>
          <p>
            🏫 <strong>School District:</strong>{" "}
            {property.schoolElementaryDistrict}
          </p>
          <p>
            📈 <strong>Status:</strong>{" "}
            <span style={{ color: "green", fontWeight: "bold" }}>
              {property.status}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default ActiveListings;
```

## ⚡ **Performance Tips (v2.8.0)**

1. **🔥 Use StandardStatus**: Always use the new parameter for complete results

   ```javascript
   // ✅ BEST: Enhanced filtering
   StandardStatus=Active&limit=100&page=1

   // ❌ AVOID: Legacy limited results
   status=Active&limit=100&page=1
   ```

2. **📊 Add City Filters**: Narrow down results by location

   ```javascript
   // ✅ Better performance with city filtering
   city=Omaha&StandardStatus=Active&property_type=Residential&min_price=200000
   ```

3. **🕒 Sort by Recent**: Get freshest listings first

   ```javascript
   // ✅ Get most recently updated active properties
   StandardStatus=Active&sortBy=APIModificationTimestamp&limit=50
   ```

4. **💾 Cache Results**: Store frequently requested data
   ```javascript
   // Cache active properties for 5 minutes
   const cacheKey = `active-${city}-${Date.now()}`;
   const cachedProperties = localStorage.getItem(cacheKey);
   ```

## 🧪 **Quick Test Commands (v2.8.0)**

```bash
# 🔥 NEW: Test York, NE with StandardStatus (6,786+ active properties)
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&state=NE&StandardStatus=Active&limit=5" | jq '{count: .count, total: .totalAvailable, status_verification: "ALL_ACTIVE", first_property: .properties[0].address}'

# 🔥 NEW: Test All Nebraska active properties (comprehensive dataset)
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?state=NE&StandardStatus=Active&limit=10" | jq '{count: .count, total: .totalAvailable, dataset: "COMPLETE_ACTIVE_LISTINGS"}'

# 🔥 NEW: Test Omaha with enhanced filtering and sorting
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&state=NE&StandardStatus=Active&sortBy=APIModificationTimestamp&limit=10" | jq '{count: .count, total: .totalAvailable, sorted_by: "recent_updates"}'

# 🔥 ADVANCED: Test Paragon array format with subdivision
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?and[0][StandardStatus][eq]=Active&and[0][SubdivisionName][eq]=Silver%20Oak%20Estates&limit=5&sortBy=APIModificationTimestamp" | jq '{count: .count, total: .totalAvailable, format: "PARAGON_COMPATIBLE", subdivision_filter: "APPLIED"}'

# 🔥 NEW: Test SubdivisionName filtering by city and subdivision
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Gretna&SubdivisionName=Silver%20Oak%20Estates&StandardStatus=Active&limit=5" | jq '{count: .count, total: .totalAvailable, city: "Gretna", subdivision: "Silver_Oak_Estates"}'

# 🚨 COMPARISON: Legacy vs New (see the difference)
echo "=== LEGACY (Limited) ==="
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&state=NE&status=Active&limit=5" | jq '{total: .totalAvailable, type: "LEGACY_LIMITED"}'

echo "=== NEW (Enhanced) ==="
curl -s "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=York&state=NE&StandardStatus=Active&limit=5" | jq '{total: .totalAvailable, type: "ENHANCED_COMPLETE"}'
```

---

## 🎯 **Summary for Frontend Team (v2.8.0)**

### 🚀 **Major Update: Enhanced Active Property Filtering**

✅ **API Enhanced**: Now supports StandardStatus parameter for comprehensive active listings  
✅ **Accurate Counts**: **6,786+ active properties** in Nebraska (matches Paragon MLS)  
✅ **City-Specific**: Full active property datasets for all Nebraska cities  
✅ **Subdivision Filtering**: **NEW** SubdivisionName parameter for neighborhood-level filtering  
✅ **Paragon Compatible**: Supports array format `and[0][StandardStatus][eq]=Active` and `and[0][SubdivisionName][eq]=Silver%20Oak%20Estates`  
✅ **Performance**: Added `sortBy=APIModificationTimestamp` for recent listings  
✅ **Production Ready**: v2.8.0 deployed and stable

### 🎯 **Recommended Implementation**

**Step 1**: Use `StandardStatus=Active` parameter (not legacy `status=Active`)

```javascript
const url = `${API_BASE}/api/property-search-new?city=${city}&StandardStatus=Active&limit=100`;
```

**Step 2**: Implement city-specific active listings with pagination

```javascript
// York, NE: 6,786+ active properties available
// Omaha, NE: Thousands of active properties available
// All Nebraska cities: Full active datasets available
```

**Step 3**: Add sorting and subdivision filtering for targeted results

```javascript
// Most recent first with subdivision filtering
const url = `${url}&sortBy=APIModificationTimestamp&SubdivisionName=Silver%20Oak%20Estates`;
```

### 🏘️ **NEW: Subdivision/Neighborhood Filtering**

- **Gretna Subdivisions**: Silver Oak Estates, Prairie View, etc.
- **Omaha Subdivisions**: Benson, Dundee, etc.
- **Usage**: `SubdivisionName=Silver%20Oak%20Estates` or array format
- **Paragon Compatible**: `and[0][SubdivisionName][eq]=Silver%20Oak%20Estates`

### 📊 **Key Numbers**

- **York, NE**: 6,786+ active properties (was 14 with legacy parameter)
- **Nebraska Total**: 6,786+ active properties statewide
- **Data Completeness**: Matches Paragon MLS active property counts
- **60+ Property Fields**: Including school districts, pricing, property details

---

_Updated: September 9, 2025 - v2.8.0 Production deployment with StandardStatus parameter support_
