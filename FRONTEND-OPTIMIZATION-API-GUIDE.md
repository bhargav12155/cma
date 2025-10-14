# Frontend Optimization API Guide

## Overview

This guide documents the new optimization APIs designed to reduce frontend API calls from 1762+ to ~50 per session and reduce bandwidth usage from 343MB to significantly lower amounts through server-side batching, caching, and progressive loading.

## Key Benefits

- **Reduced API Calls**: Server-side batching reduces upstream calls by 97%
- **Bandwidth Optimization**: Progressive loading and image pagination
- **Improved Performance**: Client-side caching with server-side optimization
- **Data Level Control**: Minimal, list, detail, full data levels for targeted bandwidth usage

## 1. Property Search Optimization API

### Endpoint: `/api/property-search-optim`

**Purpose**: Replaces multiple property search calls with single batched requests that are cached server-side.

#### Request Parameters

```javascript
{
  // Search parameters (same as existing property-search-new)
  "limit": 50,
  "offset": 0,
  "bedrooms": "3+",
  "bathrooms": "2+",
  "minPrice": 300000,
  "maxPrice": 800000,
  "propertyType": "Single Family",
  "city": "Remington",
  "state": "VA",
  "zipCode": "22734",
  "mlsStatus": "Active",

  // New optimization parameters
  "dataLevel": "list",           // minimal|list|detail|full
  "pageSize": 20,               // Properties per page (default: 20)
  "page": 1,                    // Page number (default: 1)
  "cacheStrategy": "aggressive", // none|normal|aggressive
  "prefetchNext": true          // Prefetch next page (default: false)
}
```

#### Data Levels

| Level     | Description               | Use Case              | Bandwidth            |
| --------- | ------------------------- | --------------------- | -------------------- |
| `minimal` | ID, price, basic location | Search results, maps  | ~5KB per property    |
| `list`    | + bed/bath, sqft, status  | Property listings     | ~15KB per property   |
| `detail`  | + description, features   | Property cards        | ~40KB per property   |
| `full`    | + all fields, images      | Property details page | ~100KB+ per property |

#### Response Format

```javascript
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "property123",
        "price": 650000,
        "address": "123 Main St",
        "city": "Remington",
        "state": "VA",
        "zipCode": "22734",
        "bedrooms": 4,
        "bathrooms": 3,
        "sqft": 2400,
        "mlsStatus": "Active",
        // More fields based on dataLevel
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalProperties": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    },
    "cacheInfo": {
      "cached": true,
      "cacheAge": 120, // seconds
      "expires": 180   // seconds until cache expires
    }
  },
  "metadata": {
    "searchId": "search_abc123",
    "batchId": "batch_456",
    "upstreamCalls": 1,
    "dataLevel": "list",
    "executionTime": 234
  }
}
```

#### Frontend Implementation Example

```javascript
class PropertySearchOptimized {
  constructor() {
    this.searchCache = new Map();
    this.currentSearch = null;
  }

  async searchProperties(searchParams, options = {}) {
    const {
      dataLevel = "list",
      pageSize = 20,
      page = 1,
      cacheStrategy = "normal",
      prefetchNext = false,
    } = options;

    // Create cache key
    const cacheKey = this.createCacheKey(searchParams, dataLevel, page);

    // Check local cache first
    if (this.searchCache.has(cacheKey) && cacheStrategy !== "none") {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        // 5 min local cache
        return cached.data;
      }
    }

    try {
      const response = await fetch("/api/property-search-optim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...searchParams,
          dataLevel,
          pageSize,
          page,
          cacheStrategy,
          prefetchNext,
        }),
      });

      const result = await response.json();

      // Cache successful results
      if (result.success) {
        this.searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        // Prefetch next page if enabled
        if (prefetchNext && result.data.pagination.hasNext) {
          this.prefetchNextPage(searchParams, dataLevel, page + 1);
        }
      }

      return result;
    } catch (error) {
      console.error("Optimized search failed:", error);
      throw error;
    }
  }

  async prefetchNextPage(searchParams, dataLevel, nextPage) {
    // Background prefetch - don't await
    setTimeout(() => {
      this.searchProperties(searchParams, {
        dataLevel,
        page: nextPage,
        prefetchNext: false,
      }).catch(() => {}); // Silent fail for prefetch
    }, 100);
  }

  createCacheKey(searchParams, dataLevel, page) {
    return JSON.stringify({ ...searchParams, dataLevel, page });
  }
}
```

## 2. Property Images Optimization API

### Endpoint: `/api/properties/:propertyId/images-optim`

**Purpose**: Paginated image loading to reduce initial bandwidth and enable progressive loading.

#### Request Parameters

```javascript
// GET /api/properties/property123/images-optim?page=1&pageSize=5&quality=medium&format=webp&thumbnail=true
{
  "page": 1,           // Page number (default: 1)
  "pageSize": 5,       // Images per page (default: 5)
  "quality": "medium", // low|medium|high|original
  "format": "webp",    // webp|jpeg|png|original
  "thumbnail": true,   // Include thumbnails (default: false)
  "dimensions": "800x600" // Max dimensions (optional)
}
```

#### Response Format

```javascript
{
  "success": true,
  "data": {
    "propertyId": "property123",
    "images": [
      {
        "id": "img_001",
        "url": "https://example.com/image1.jpg",
        "thumbnailUrl": "https://example.com/thumb1.jpg",
        "alt": "Living room",
        "order": 1,
        "dimensions": { "width": 1200, "height": 800 },
        "size": 156000, // bytes
        "optimized": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 5,
      "totalImages": 23,
      "totalPages": 5,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "metadata": {
    "loadTime": 156,
    "cached": false,
    "totalSize": 780000 // Total bytes for this page
  }
}
```

#### Frontend Implementation Example

```javascript
class PropertyImagesOptimized {
  constructor() {
    this.imageCache = new Map();
    this.observer = null;
    this.setupLazyLoading();
  }

  async loadPropertyImages(propertyId, options = {}) {
    const {
      page = 1,
      pageSize = 5,
      quality = "medium",
      format = "webp",
      thumbnail = true,
    } = options;

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/images-optim?` +
          `page=${page}&pageSize=${pageSize}&quality=${quality}&format=${format}&thumbnail=${thumbnail}`
      );

      const result = await response.json();

      if (result.success) {
        // Cache images for future use
        const cacheKey = `${propertyId}_${page}`;
        this.imageCache.set(cacheKey, result.data);

        return result.data;
      }

      throw new Error(result.message || "Failed to load images");
    } catch (error) {
      console.error("Image loading failed:", error);
      throw error;
    }
  }

  setupLazyLoading() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const propertyId = img.dataset.propertyId;
          const page = parseInt(img.dataset.page);

          this.loadPropertyImages(propertyId, { page })
            .then((data) => this.renderImages(data.images, img.parentElement))
            .catch(console.error);

          this.observer.unobserve(img);
        }
      });
    });
  }

  renderImages(images, container) {
    images.forEach((image) => {
      const imgElement = document.createElement("img");
      imgElement.src = image.thumbnailUrl || image.url;
      imgElement.alt = image.alt;
      imgElement.loading = "lazy";
      container.appendChild(imgElement);
    });
  }
}
```

## 3. Image Optimization Service API

### Endpoint: `/api/images/optimize-optim`

**Purpose**: Server-side image optimization and compression service.

#### Request Parameters

```javascript
// POST /api/images/optimize-optim
{
  "imageUrl": "https://example.com/original.jpg",
  "quality": "medium",      // low|medium|high|original
  "format": "webp",        // webp|jpeg|png|original
  "dimensions": "800x600", // Max dimensions
  "generateThumbnail": true,
  "thumbnailSize": "150x150"
}
```

#### Response Format

```javascript
{
  "success": true,
  "data": {
    "original": {
      "url": "https://example.com/original.jpg",
      "size": 2400000,
      "dimensions": { "width": 1920, "height": 1080 }
    },
    "optimized": {
      "url": "https://optimized.example.com/image_medium.webp",
      "size": 180000,
      "dimensions": { "width": 800, "height": 600 },
      "quality": "medium",
      "format": "webp"
    },
    "thumbnail": {
      "url": "https://optimized.example.com/thumb_150.webp",
      "size": 12000,
      "dimensions": { "width": 150, "height": 150 }
    },
    "savings": {
      "sizeReduction": "92%",
      "originalSize": 2400000,
      "optimizedSize": 180000,
      "bytesSaved": 2220000
    }
  },
  "metadata": {
    "processingTime": 450,
    "cached": false,
    "cacheExpires": "2024-01-15T10:30:00Z"
  }
}
```

## Frontend Integration Strategy

### 1. Progressive Data Loading

```javascript
class ProgressivePropertyLoader {
  async loadPropertyListing() {
    // Step 1: Load minimal data for fast initial render
    const minimal = await this.searchOptimized({
      dataLevel: "minimal",
      pageSize: 20,
    });
    this.renderMinimal(minimal.data.properties);

    // Step 2: Enhance with list-level data
    const listData = await this.searchOptimized({
      dataLevel: "list",
      pageSize: 20,
      cacheStrategy: "aggressive",
    });
    this.enhanceWithListData(listData.data.properties);

    // Step 3: Load images for visible properties
    this.loadImagesForVisible();
  }

  async loadImagesForVisible() {
    const visibleProperties = this.getVisibleProperties();

    for (const property of visibleProperties) {
      // Load first page of images with thumbnails
      const images = await this.imagesOptimized.loadPropertyImages(
        property.id,
        {
          page: 1,
          pageSize: 3,
          thumbnail: true,
          quality: "medium",
        }
      );

      this.updatePropertyImages(property.id, images);
    }
  }
}
```

### 2. Caching Strategy

```javascript
class OptimizedCacheManager {
  constructor() {
    this.memoryLimit = 50 * 1024 * 1024; // 50MB
    this.caches = {
      search: new Map(),
      images: new Map(),
      properties: new Map(),
    };
  }

  set(type, key, data, ttl = 300000) {
    // 5 min default TTL
    if (this.getMemoryUsage() > this.memoryLimit) {
      this.cleanup();
    }

    this.caches[type].set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(data).length,
    });
  }

  get(type, key) {
    const cached = this.caches[type].get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.caches[type].delete(key);
      return null;
    }

    return cached.data;
  }

  cleanup() {
    // Remove oldest entries when approaching memory limit
    Object.values(this.caches).forEach((cache) => {
      const entries = Array.from(cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      // Remove oldest 25%
      const toRemove = Math.floor(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        cache.delete(entries[i][0]);
      }
    });
  }
}
```

## Performance Monitoring

### Frontend Metrics to Track

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBandwidth: 0,
      averageLoadTime: 0,
    };
  }

  trackApiCall(endpoint, responseSize, loadTime, cached = false) {
    this.metrics.apiCalls++;
    this.metrics.totalBandwidth += responseSize;

    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update average load time
    this.metrics.averageLoadTime =
      (this.metrics.averageLoadTime + loadTime) / 2;
  }

  getOptimizationReport() {
    const cacheHitRate = (
      (this.metrics.cacheHits / this.metrics.apiCalls) *
      100
    ).toFixed(1);

    return {
      totalApiCalls: this.metrics.apiCalls,
      cacheHitRate: `${cacheHitRate}%`,
      totalBandwidth: `${(this.metrics.totalBandwidth / 1024 / 1024).toFixed(
        2
      )}MB`,
      averageLoadTime: `${this.metrics.averageLoadTime}ms`,
      estimatedSavings: this.calculateSavings(),
    };
  }
}
```

## Migration Guide

### Phase 1: Implement Optimization Layer

1. Add optimization API calls alongside existing calls
2. Compare results for accuracy
3. Measure performance improvements

### Phase 2: Progressive Rollout

1. Use optimization APIs for new features first
2. Gradually replace high-traffic endpoints
3. Monitor performance and error rates

### Phase 3: Full Migration

1. Replace all property search calls with optimization APIs
2. Implement progressive image loading
3. Remove old direct API calls

## Error Handling & Fallbacks

```javascript
class ResilientPropertyLoader {
  async loadWithFallback(searchParams, options = {}) {
    try {
      // Try optimized API first
      return await this.searchOptimized(searchParams, options);
    } catch (error) {
      console.warn("Optimized API failed, falling back:", error);

      // Fallback to original API
      return await this.searchOriginal(searchParams);
    }
  }

  async searchOptimized(searchParams, options) {
    const response = await fetch("/api/property-search-optim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...searchParams, ...options }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async searchOriginal(searchParams) {
    // Original property-search-new API call
    const response = await fetch("/api/property-search-new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchParams),
    });

    return await response.json();
  }
}
```

## Testing Guidelines

### 1. Performance Testing

- Measure API calls before/after optimization
- Track bandwidth usage reduction
- Monitor cache hit rates
- Test with various data levels

### 2. Functional Testing

- Verify data accuracy across all data levels
- Test pagination edge cases
- Validate image loading and optimization
- Ensure proper error handling

### 3. Load Testing

- Test with high concurrent users
- Verify cache performance under load
- Monitor server resource usage
- Test cache invalidation scenarios

## Best Practices

1. **Start with Minimal Data**: Always load minimal data first for fast initial rendering
2. **Progressive Enhancement**: Enhance with more detailed data as needed
3. **Lazy Load Images**: Only load images when they come into viewport
4. **Cache Aggressively**: Use both client and server-side caching
5. **Monitor Performance**: Track metrics to measure optimization effectiveness
6. **Graceful Degradation**: Always have fallbacks for optimization failures

This optimization approach should reduce your API calls from 1762+ to approximately 50 per session while maintaining the same user experience with improved performance.
