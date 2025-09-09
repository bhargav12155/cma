# 🚀 CMA API - New Features Curl Guide v2.3.0

## 📋 Overview

This guide demonstrates the new filtering features added to the CMA Comparables API in version 2.3.0. These features help you get cleaner, more relevant property data by filtering out auction properties and controlling which property statuses to include.

## 🎯 New Parameters

### `status` Parameter

Controls which property types to include:

- `"active"` - Only active listings
- `"closed"` - Only closed/sold properties
- `"both"` - Both active and closed properties (default)

### `exclude_zero_price` Parameter

Filters out properties with incomplete pricing:

- `"true"` - Exclude properties with $0 prices (auction/incomplete data)
- `"false"` - Include all properties (default)

---

## 📚 Curl Examples

### 🔥 Active Listings Only (Clean Data)

Get only active listings without auction properties:

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.counts'
```

**Expected Response:**

```json
{
  "active": 150,
  "closed": 0,
  "total": 150
}
```

### 📊 Recent Sales Only

Get only closed/sold properties for historical analysis:

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=closed&exclude_zero_price=true" | jq '.counts'
```

**Expected Response:**

```json
{
  "active": 0,
  "closed": 150,
  "total": 150
}
```

### 📈 Traditional CMA Analysis (Both Active + Sold)

Get both active and closed properties for comprehensive market analysis:

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=both&exclude_zero_price=true" | jq '.counts'
```

**Expected Response:**

```json
{
  "active": 150,
  "closed": 150,
  "total": 300
}
```

---

## 🎯 Advanced Filtering Examples

### Specific Property Size Range

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&sqft=2500&sqft_delta=800&status=active&exclude_zero_price=true" | jq '.counts'
```

### Geographic Radius Control

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&latitude=41.2565&longitude=-95.9345&radius_miles=2&status=active&exclude_zero_price=true" | jq '.counts'
```

### Price Range Filtering

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&min_price=200000&max_price=500000&status=active&exclude_zero_price=true" | jq '.counts'
```

### Custom Time Period for Sales

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&months_back=6&status=closed&exclude_zero_price=true" | jq '.counts'
```

---

## 🔍 Data Inspection Examples

### View Property Details

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true&limit=3" | jq '.properties[0] | {address: .address, listPrice: .listPrice, sqft: .sqft, status: .status}'
```

### Check Query Parameters

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.query'
```

**Expected Response:**

```json
{
  "address": null,
  "city": "Omaha",
  "zip_code": null,
  "sqft": null,
  "latitude": null,
  "longitude": null,
  "radius_miles": 5,
  "sqft_delta": 1200,
  "months_back": 12,
  "status": "active",
  "exclude_zero_price": "true"
}
```

### Get Search Metadata

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.meta'
```

---

## 🆚 Before vs After Comparison

### ❌ OLD WAY (Includes auction properties)

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha" | jq '.counts'
```

**Result:** May include properties with $0 prices, auction listings, incomplete data

### ✅ NEW WAY (Clean data only)

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.counts'
```

**Result:** Only active listings with valid pricing data

---

## 🚨 Error Handling

### Invalid Status Parameter

```bash
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=invalid"
```

**Response:** Will default to "both" status

### Network Issues

```bash
curl -s --connect-timeout 10 "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true"
```

---

## 📊 Performance Tips

### Use Specific Filters for Better Performance

```bash
# ✅ Good - Specific city and filters
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&zip_code=68104&status=active&exclude_zero_price=true"

# ❌ Slow - Broad search
curl -s "http://your-api-url/api/cma-comparables?status=both"
```

### Limit Results for Testing

```bash
# Add limit parameter for testing
curl -s "http://your-api-url/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true&limit=5"
```

---

## 🔧 Testing Your API

### Local Development Testing

```bash
# Start your local server
node server.js

# Test the new features
curl -s "http://localhost:3002/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.counts'
```

### Production Testing

```bash
# Replace with your production URL
curl -s "https://your-production-api.com/api/cma-comparables?city=Omaha&status=active&exclude_zero_price=true" | jq '.counts'
```

---

## 📝 Notes

- The `exclude_zero_price=true` parameter is especially useful for filtering out auction properties and listings with incomplete data
- The `status` parameter helps you get exactly the type of properties you need for your analysis
- All parameters are optional and have sensible defaults
- The API returns both individual arrays (`active`, `closed`) and a combined array (`combined`, `properties`) for flexibility
- Use `jq` for better JSON formatting and filtering in terminal
- Always test with `limit=5` first to avoid large responses during development

---

_Last updated: September 8, 2025_
_Version: 2.3.0_</content>
<parameter name="filePath">/Users/ananya/Documents/bhargav/golden brick/cma/CMA-API-CURL-GUIDE.md
