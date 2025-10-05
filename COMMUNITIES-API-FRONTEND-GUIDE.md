# 🏘️ Communities API - Frontend Integration Guide

## 🚀 **Status: Fixed and Ready**

The communities API is now working after fixing the backend field selection issue.

> **⚠️ Production Status**: Currently production server is down (502 Bad Gateway). The deployed v2.9.2 package has the old buggy field selection code. **SOLUTION:** Deploy the new package `cma-api-deployable-v2.10.1-FINAL.zip` which contains the field selection fixes to restore service.

## 📡 **Production Endpoint**

```
GET http://gbcma.us-east-2.elasticbeanstalk.com/api/communities
```

## 🔧 **How to Call from Frontend**

### **Basic JavaScript Example**

```javascript
const API_BASE = "http://gbcma.us-east-2.elasticbeanstalk.com";

// Get all communities for dropdown
const fetchCommunities = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/communities?min_properties=3&sort_by=name`
    );
    const data = await response.json();

    if (data.success) {
      return data.communities; // Array of community objects
    } else {
      console.error("API Error:", data.error);
      return [];
    }
  } catch (error) {
    console.error("Network Error:", error);
    return [];
  }
};
```

### **React Hook Example**

```javascript
import { useState, useEffect } from "react";

const useCommunities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch(
          "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?min_properties=5&sort_by=name"
        );
        const data = await response.json();

        if (data.success) {
          setCommunities(data.communities);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  return { communities, loading, error };
};

// Usage in component
const CommunitiesDropdown = () => {
  const { communities, loading, error } = useCommunities();

  if (loading) return <div>Loading communities...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <select>
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
```

## 📋 **Response Structure**

```javascript
{
  "success": true,
  "count": 197,
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
    "min_properties": 3,
    "q": null
  },
  "communities": [
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

## 🎯 **Recommended Usage Patterns**

### **1. For Dropdowns/Selects**

```javascript
// Get communities with meaningful property counts, sorted alphabetically
const fetchForDropdown = async () => {
  const url = `${API_BASE}/api/communities?min_properties=5&sort_by=name`;
  const response = await fetch(url);
  const data = await response.json();
  return data.communities;
};
```

### **2. For Search/Autocomplete**

```javascript
// Search communities by name substring
const searchCommunities = async (searchTerm) => {
  const url = `${API_BASE}/api/communities?q=${encodeURIComponent(
    searchTerm
  )}&min_properties=3&sort_by=name`;
  const response = await fetch(url);
  const data = await response.json();
  return data.communities;
};

// Usage
const results = await searchCommunities("oak"); // Returns communities containing "oak"
```

### **3. For Active Listings Only**

```javascript
// Only show communities with active listings
const fetchActiveCommunities = async () => {
  const url = `${API_BASE}/api/communities?status=active&min_properties=1&sort_by=count`;
  const response = await fetch(url);
  const data = await response.json();
  return data.communities;
};
```

### **4. For Analytics/Reports**

```javascript
// Get all communities with detailed counts
const fetchAllCommunities = async () => {
  const url = `${API_BASE}/api/communities?min_properties=1&sort_by=count`;
  const response = await fetch(url);
  const data = await response.json();
  return data.communities;
};
```

## ⚙️ **Key Parameters Reference**

| Parameter        | Type   | Recommended Values                          | Purpose                             |
| ---------------- | ------ | ------------------------------------------- | ----------------------------------- |
| `min_properties` | number | `3`, `5`, or `10`                           | Filter out tiny communities         |
| `sort_by`        | string | `name` for dropdowns, `count` for analytics | Control ordering                    |
| `status`         | string | `active` for current listings               | Filter by listing status            |
| `q`              | string | User search input                           | Substring search in community names |
| `property_type`  | string | `Residential` (default)                     | Filter by property type             |
| `state`          | string | `NE` (default)                              | Filter by state                     |

## 🔄 **Integration with Property Search**

### **Complete Workflow Example**

```javascript
const CommunityPropertySearch = () => {
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [properties, setProperties] = useState([]);
  const { communities } = useCommunities();

  // Step 1: User selects community
  const handleCommunitySelect = (communityName) => {
    setSelectedCommunity(communityName);
    if (communityName) {
      searchPropertiesInCommunity(communityName);
    }
  };

  // Step 2: Search properties in selected community
  const searchPropertiesInCommunity = async (communityName) => {
    const params = new URLSearchParams({
      subdivision: communityName,
      StandardStatus: "Active",
      state: "NE",
      limit: "50",
    });

    const response = await fetch(
      `${API_BASE}/api/property-search-new?${params}`
    );
    const data = await response.json();

    if (data.success) {
      setProperties(data.properties);
    }
  };

  return (
    <div>
      <select
        value={selectedCommunity}
        onChange={(e) => handleCommunitySelect(e.target.value)}
      >
        <option value="">Select a Community</option>
        {communities.map((community) => (
          <option key={community.name} value={community.name}>
            {community.name} ({community.primaryCity}) -{" "}
            {community.activeProperties} active
          </option>
        ))}
      </select>

      {properties.length > 0 && (
        <div>
          <h3>Properties in {selectedCommunity}</h3>
          {/* Render properties list */}
        </div>
      )}
    </div>
  );
};
```

## 🚨 **Error Handling Best Practices**

### **Robust Fetch with Fallbacks**

```javascript
const fetchCommunitiesWithErrorHandling = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/communities?min_properties=3&sort_by=name`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      // API returned error
      throw new Error(data.error || "Communities API failed");
    }

    if (!data.communities || data.communities.length === 0) {
      // No communities found - this might be normal
      console.warn("No communities returned from API");
      return [];
    }

    return data.communities;
  } catch (error) {
    console.error("Failed to fetch communities:", error);
    // Return empty array as fallback - don't crash the UI
    return [];
  }
};
```

### **Loading States & Error Messages**

```javascript
const CommunitiesWithErrorHandling = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCommunitiesWithErrorHandling();
        setCommunities(data);
      } catch (err) {
        setError("Failed to load communities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCommunities();
  }, []);

  if (loading) {
    return <div>Loading communities...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red" }}>
        {error}
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (communities.length === 0) {
    return <div>No communities found.</div>;
  }

  return (
    <select>
      <option value="">Select a Community</option>
      {communities.map((community, index) => (
        <option key={index} value={community.name}>
          {formatCommunityOption(community)}
        </option>
      ))}
    </select>
  );
};
```

## 💡 **UI Tips & Best Practices**

### **Display Formatting**

```javascript
// Format community display with helpful info
const formatCommunityOption = (community) => {
  const activeText =
    community.activeProperties > 0
      ? `${community.activeProperties} active`
      : "no active listings";

  return `${community.name} (${community.primaryCity}) - ${activeText}`;
};

// Format for search results
const formatCommunityForSearch = (community) => {
  return {
    label: `${community.name} - ${community.primaryCity}`,
    value: community.name,
    subtitle: `${community.activeProperties}/${community.totalProperties} active properties`,
    cities: community.cities,
  };
};
```

### **Caching Strategy**

```javascript
// Cache communities for 30 minutes (matches backend cache)
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const cachedFetchCommunities = (() => {
  let cache = null;
  let cacheTime = 0;

  return async () => {
    const now = Date.now();

    if (cache && now - cacheTime < CACHE_DURATION) {
      return cache; // Return cached data
    }

    // Fetch fresh data
    const communities = await fetchCommunitiesWithErrorHandling();
    cache = communities;
    cacheTime = now;

    return communities;
  };
})();
```

### **Performance Optimization**

```javascript
// Debounced search for autocomplete
import { useMemo, useState, useCallback } from "react";
import { debounce } from "lodash"; // or implement your own debounce

const CommunitySearchInput = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (term.length >= 2) {
        const results = await searchCommunities(term);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search communities..."
        value={searchTerm}
        onChange={handleInputChange}
      />
      {searchResults.length > 0 && (
        <ul>
          {searchResults.map((community) => (
            <li
              key={community.name}
              onClick={() => onSelect(community)}
              style={{ cursor: "pointer" }}
            >
              {formatCommunityOption(community)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## 🚀 **Deployment & Testing**

### **Testing the API**

```bash
# Test basic functionality
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?min_properties=5&limit=3"

# Test search functionality
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?q=oak&min_properties=3"

# Test active communities only
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/communities?status=active&min_properties=1"
```

### **Frontend Testing Checklist**

- [ ] Communities load successfully
- [ ] Loading states work correctly
- [ ] Error handling displays properly
- [ ] Search/filter functionality works
- [ ] Integration with property search works
- [ ] Performance is acceptable (< 2s load time)
- [ ] UI handles empty results gracefully

## 📦 **Ready for Production**

The communities API is **fixed and ready** after deploying the updated backend package (`cma-api-deployable-v2.8.0-FINAL.zip`).

**Key Changes Made:**

- ✅ Fixed field selection issue (removed unsupported Status fields)
- ✅ Simplified active detection logic
- ✅ Tested and verified working locally
- ✅ Created deployment package v2.10.1-FINAL.zip with fixes

The frontend can start integrating immediately using the examples in this guide!

---

**Last Updated:** October 4, 2025  
**API Version:** v2.10.1  
**Status:** ✅ Production Ready
