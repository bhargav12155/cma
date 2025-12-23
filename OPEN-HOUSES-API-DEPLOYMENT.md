# 🏠 Open Houses API - Deployment Guide v2.11.0

**Release Date:** December 22, 2025
**Package:** `cma-open-houses-v2.11.0.zip`
**Status:** ✅ Ready for Production Deployment

---

## 🎯 What's New in v2.11.0

### ✨ New Feature: Open Houses API

A complete **Open Houses Search API** with comprehensive filtering capabilities:

- **Endpoint:** `GET /api/open-houses`
- **Purpose:** Search and filter upcoming open house events with full property details
- **Status:** Production-ready, fully tested

---

## 📦 Deployment Package Contents

### Core Files (Updated)

- ✅ `server.js` - **UPDATED** with new `/api/open-houses` endpoint
- ✅ `package.json` - Dependencies (no changes)
- ✅ `Procfile` - Heroku config
- ✅ `index.html` - Frontend (unchanged)

### Support Files

- ✅ All documentation files (`.md`)
- ✅ Helper modules (`advancedSearchParamParser.js`, `community-aliases.js`, etc.)

---

## 🚀 Quick Deployment Steps

### Option 1: AWS Elastic Beanstalk (Current Production)

```bash
# 1. Extract the package
unzip cma-open-houses-v2.11.0.zip -d cma-deploy

# 2. Navigate to folder
cd cma-deploy

# 3. Install dependencies (if deploying fresh)
npm install

# 4. Deploy to Elastic Beanstalk
eb deploy

# 5. Test the new endpoint
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?city=Omaha&limit=3"
```

### Option 2: Heroku

```bash
# 1. Extract and navigate
unzip cma-open-houses-v2.11.0.zip -d cma-deploy
cd cma-deploy

# 2. Initialize git (if new)
git init
heroku create your-app-name

# 3. Commit and deploy
git add .
git commit -m "Deploy Open Houses API v2.11.0"
git push heroku main

# 4. Test
curl "http://your-app-name.herokuapp.com/api/open-houses?city=Omaha&limit=3"
```

---

## 🔧 API Endpoint Documentation

### **Endpoint:** `GET /api/open-houses`

### **Search Parameters:**

#### Location Filters

| Parameter                       | Type   | Example          | Description                        |
| ------------------------------- | ------ | ---------------- | ---------------------------------- |
| `city`                          | string | `Omaha`          | Filter by city name                |
| `zip_code` or `zipcode`         | string | `68028`          | Filter by ZIP code                 |
| `neighborhood` or `subdivision` | string | `Founders Ridge` | Filter by neighborhood/subdivision |
| `county`                        | string | `Sarpy`          | Filter by county                   |
| `state`                         | string | `NE`             | Filter by state (default: NE)      |

#### Date Filters

| Parameter       | Type   | Example      | Description                                  |
| --------------- | ------ | ------------ | -------------------------------------------- |
| `upcoming_only` | string | `true`       | Only show future open houses (default: true) |
| `start_date`    | string | `2025-12-22` | Start date (YYYY-MM-DD)                      |
| `end_date`      | string | `2025-12-31` | End date (YYYY-MM-DD)                        |

#### Property Filters

| Parameter       | Type   | Example       | Description                          |
| --------------- | ------ | ------------- | ------------------------------------ |
| `property_type` | string | `Residential` | Property type (default: Residential) |
| `min_price`     | number | `400000`      | Minimum list price                   |
| `max_price`     | number | `700000`      | Maximum list price                   |
| `min_beds`      | number | `3`           | Minimum bedrooms                     |
| `max_beds`      | number | `5`           | Maximum bedrooms                     |
| `min_baths`     | number | `2`           | Minimum bathrooms                    |
| `max_baths`     | number | `4`           | Maximum bathrooms                    |
| `min_sqft`      | number | `2000`        | Minimum square footage               |
| `max_sqft`      | number | `4000`        | Maximum square footage               |

#### Geographic Search

| Parameter      | Type   | Example    | Description                          |
| -------------- | ------ | ---------- | ------------------------------------ |
| `latitude`     | number | `41.2565`  | Center latitude for radius search    |
| `longitude`    | number | `-95.9345` | Center longitude for radius search   |
| `radius_miles` | number | `10`       | Search radius in miles (default: 10) |

#### Sorting & Pagination

| Parameter    | Type   | Example | Description                                      |
| ------------ | ------ | ------- | ------------------------------------------------ |
| `sort_by`    | string | `date`  | Sort by: `date`, `price`, `sqft` (default: date) |
| `sort_order` | string | `asc`   | Sort order: `asc`, `desc` (default: asc)         |
| `limit`      | number | `50`    | Results per page (default: 50)                   |
| `offset`     | number | `0`     | Offset for pagination (default: 0)               |

---

## 📝 Example API Calls

### 1. Get Upcoming Open Houses in Omaha

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?city=Omaha&upcoming_only=true&limit=10"
```

### 2. Search by ZIP Code

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?zipcode=68028&limit=10"
```

### 3. Filter by Neighborhood

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?subdivision=Founders%20Ridge&city=Omaha"
```

### 4. Filter by Price Range

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?min_price=500000&max_price=700000&city=Omaha"
```

### 5. Filter by Property Characteristics

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?min_beds=4&min_baths=3&min_sqft=2500&city=Omaha"
```

### 6. Geographic Radius Search

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?latitude=41.2565&longitude=-95.9345&radius_miles=5"
```

### 7. Date Range Search

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/open-houses?start_date=2025-12-22&end_date=2025-12-31&city=Omaha"
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "count": 2,
  "total": 48,
  "openHouses": [
    {
      "openHouseKey": "d7773efa4e7a171e8b8d8f4f0de49d5d",
      "listingKey": "71e5a4db222e285b65e4a4cb38efe938",
      "date": "2025-12-22",
      "startTime": "2025-12-22T16:00:00.000Z",
      "endTime": "2025-12-23T01:00:00.000Z",
      "remarks": "Open 7 days a week. Call for tour.",
      "address": "12667 Cooper Street, Omaha NE 68138",
      "city": "Omaha",
      "state": "NE",
      "zipCode": "68138",
      "subdivision": "Founders Ridge",
      "county": "Sarpy",
      "listPrice": 624900,
      "propertyType": "Residential",
      "beds": 4,
      "baths": 3,
      "sqft": 2964,
      "imageUrl": "http://cdnparap70.paragonrels.com/...",
      "listAgent": {
        "name": "John Doe",
        "phone": "402-123-4567",
        "email": "john@realestate.com"
      },
      "coordinates": [-96.111642, 41.141454]
    }
  ],
  "filters": {
    "city": "Omaha",
    "zipCode": null,
    "neighborhood": null,
    "county": null,
    "state": "NE",
    "startDate": null,
    "endDate": null,
    "upcomingOnly": true,
    "propertyType": "Residential"
  }
}
```

---

## ✅ Testing Checklist

After deployment, test these scenarios:

- [ ] **Basic search**: `?city=Omaha&limit=5`
- [ ] **ZIP code**: `?zipcode=68028`
- [ ] **Subdivision**: `?subdivision=Founders Ridge`
- [ ] **Price range**: `?min_price=400000&max_price=700000`
- [ ] **Bedrooms**: `?min_beds=4`
- [ ] **Date range**: `?start_date=2025-12-22&end_date=2025-12-31`
- [ ] **Upcoming only**: `?upcoming_only=true`
- [ ] **Pagination**: `?limit=10&offset=10`
- [ ] **Multiple filters**: `?city=Omaha&min_beds=3&min_price=400000`

### Test Commands

```bash
# Set your production URL
PROD_URL="http://gbcma.us-east-2.elasticbeanstalk.com"

# Run all tests
curl "$PROD_URL/api/health"
curl "$PROD_URL/api/open-houses?city=Omaha&limit=3" | jq .
curl "$PROD_URL/api/open-houses?zipcode=68028&limit=3" | jq .
curl "$PROD_URL/api/open-houses?min_price=500000&max_price=700000&limit=3" | jq .
```

---

## 🔍 Technical Details

### How It Works

1. **Fetches OpenHouses** from Paragon MLS API (`/OpenHouses` resource)
2. **Gets Property Details** for each open house (expands property data)
3. **Applies Filters** (location, price, size, etc.)
4. **Sorts Results** based on date/price/sqft
5. **Paginates** and returns formatted response

### Performance

- Fetches up to 200 open houses initially
- Applies filtering and pagination locally
- Typical response time: 1-3 seconds
- Includes property images and agent contact info

### Data Source

- **Source:** Paragon MLS `OpenHouses` and `Properties` resources
- **Update Frequency:** Real-time (MLS refresh ~10 minutes)
- **Coverage:** All Nebraska markets (expandable to other states)

---

## 🐛 Troubleshooting

### Issue: No open houses returned

**Solution:**

- Check if `upcoming_only=false` to include past events
- Verify date filters aren't excluding results
- Try broader location filters (state-only search)

### Issue: Property details missing

**Solution:**

- Some open houses may not have complete property data
- This is expected for new/draft listings
- Filter will skip incomplete records

### Issue: Slow response

**Solution:**

- Use more specific filters to reduce result set
- Lower the `limit` parameter
- Use pagination for large result sets

---

## 📞 Support

For issues or questions:

- Check server logs: `eb logs` or Heroku logs
- Test locally: `node server.js` and test on `http://localhost:3002`
- Review console output for API errors

---

## 🔄 Rollback Plan

If issues occur:

```bash
# Revert to previous version
eb deploy --version <previous-version-label>

# Or redeploy old package
unzip cma-school-districts-fixed-v2.10.2.zip -d rollback
cd rollback
eb deploy
```

---

## 🆕 Property Search API - Advanced Filters (v2.11.1)

**Added:** December 22, 2025
**Endpoint:** `GET /api/property-search-new`

### New "More Filters" Parameters

These advanced filters have been added to support the UI's "More Filters" modal:

| Parameter     | Type   | Example         | Description                           |
| ------------- | ------ | --------------- | ------------------------------------- |
| `house_style` | string | `Ranch,2 story` | Architectural style (comma-separated) |
| `lot_style`   | string | `Flat,Walk out` | Lot features (comma-separated)        |
| `lot_size`    | number | `21780`         | Minimum lot size in square feet       |
| `max_hoa`     | number | `200`           | Maximum monthly HOA fee               |
| `keywords`    | string | `pool`          | Search in listing remarks             |
| `photo_only`  | string | `true`          | Only properties with photos           |
| `min_garage`  | number | `2`             | Minimum garage spaces                 |

### Example API Calls

#### 1. Filter by House Style (Ranch homes)

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&StandardStatus=Active&house_style=Ranch&limit=2"
```

#### 2. Filter by Minimum Lot Size (1 acre = 43,560 sqft)

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&StandardStatus=Active&lot_size=43560&limit=2"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "properties": [
    {
      "address": "6600 Underwood Avenue, Omaha NE 68132",
      "listPrice": 5350000,
      "lotSizeSqft": 58326.84,
      "style": ["Traditional"]
    },
    {
      "address": "20740 Rawhide Road, Omaha NE 68022",
      "listPrice": 4249999,
      "lotSizeSqft": 120225.6,
      "style": ["Other"]
    }
  ]
}
```

#### 3. Search Keywords (properties with "pool")

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&StandardStatus=Active&keywords=pool&limit=2"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "properties": [
    {
      "address": "6600 Underwood Avenue, Omaha NE 68132",
      "listPrice": 5350000,
      "description": "...heated pool with fountains, hot tub..."
    }
  ]
}
```

#### 4. Filter by Minimum Garage Spaces (3+ car)

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&StandardStatus=Active&min_garage=3&min_price=300000&max_price=600000&limit=2"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "properties": [
    {
      "address": "2107 S 181 Circle, Omaha NE 68130",
      "listPrice": 599000,
      "garage": 3,
      "beds": 4,
      "baths": 4
    },
    {
      "address": "1425 S 158th Circle, Omaha NE 68130",
      "listPrice": 598995,
      "garage": 3,
      "beds": 4,
      "baths": 4
    }
  ]
}
```

#### 5. Combined Advanced Filters

```bash
curl "http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?city=Omaha&StandardStatus=Active&house_style=Ranch&lot_size=10890&min_garage=2&keywords=updated&limit=5"
```

### Lot Size Reference

| Lot Size | Square Feet |
| -------- | ----------- |
| 1/4 acre | 10,890      |
| 1/2 acre | 21,780      |
| 1 acre   | 43,560      |
| 2 acres  | 87,120      |
| 5 acres  | 217,800     |

### House Style Values

Common values for `house_style` parameter:

- `Ranch`
- `2 story` or `Two Story`
- `1.5 story`
- `Multi level`
- `Split Entry`
- `Traditional`

### Lot Style Values

Common values for `lot_style` parameter:

- `Flat`
- `Daylight`
- `Walk out`
- `Sloped`
- `Wooded`

---

**✅ Ready to Deploy!**

The Open Houses API and Property Search Advanced Filters have been fully tested and are ready for production deployment. All search filters are working correctly, and the response format is consistent with existing endpoints.
