# CMA API Property Fields Guide

## Overview

This document details all the property fields available in the CMA API endpoints, organized by category and importance level.

## School Information ⭐ **NEW & CRITICAL**

Perfect for family-oriented searches and property comparisons.

| Field                      | Type   | Example           | Description                    |
| -------------------------- | ------ | ----------------- | ------------------------------ |
| `schoolElementary`         | String | "Whitetail Creek" | Elementary school name         |
| `schoolElementaryDistrict` | String | "Gretna"          | Elementary school district     |
| `schoolMiddle`             | String | "Aspen Creek"     | Middle/Junior high school name |
| `schoolMiddleDistrict`     | String | "Gretna"          | Middle school district         |
| `schoolHigh`               | String | "Gretna"          | High school name               |
| `schoolHighDistrict`       | String | "Gretna"          | High school district           |

**Example Usage:**

```bash
curl "http://localhost:3002/api/property-search-new?city=Gretna&limit=10" \
  | jq '.properties[] | {address, schoolElementary, schoolElementaryDistrict}'
```

## Core Property Details

Essential property characteristics for CMA analysis.

| Field             | Type   | Example                                    | Description                   |
| ----------------- | ------ | ------------------------------------------ | ----------------------------- |
| `address`         | String | "19863 Cottonwood Street, Gretna NE 68028" | Full property address         |
| `city`            | String | "Gretna"                                   | City name                     |
| `zipCode`         | String | "68028"                                    | ZIP code                      |
| `state`           | String | "NE"                                       | State abbreviation            |
| `listPrice`       | Number | 579900                                     | Current/original list price   |
| `soldPrice`       | Number | 569900                                     | Final sale price (if sold)    |
| `sqft`            | Number | 1890                                       | Above-grade finished area     |
| `basementSqft`    | Number | 1686                                       | Below-grade finished area     |
| `totalSqft`       | Number | 3576                                       | Total finished square footage |
| `beds`            | Number | 5                                          | Total bedrooms                |
| `baths`           | Number | 3                                          | Total bathrooms               |
| `yearBuilt`       | Number | 2023                                       | Construction year             |
| `propertyType`    | String | "Residential"                              | Property category             |
| `propertySubType` | String | "Single Family Residence"                  | Specific property type        |
| `status`          | String | "Closed"                                   | Current listing status        |

## Financial Information ⭐ **HIGH VALUE**

Important for affordability analysis and investment calculations.

| Field                     | Type   | Example      | Description           |
| ------------------------- | ------ | ------------ | --------------------- |
| `associationFee`          | Number | 250          | HOA fee amount        |
| `associationFeeFrequency` | String | "Annually"   | HOA fee frequency     |
| `taxAnnualAmount`         | Number | 1235.7       | Annual property taxes |
| `taxYear`                 | Number | 2022         | Tax assessment year   |
| `pricePerSqft`            | Number | 159          | Price per square foot |
| `closeDate`               | String | "2023-05-11" | Sale closing date     |
| `daysOnMarket`            | Number | 45           | Days listed           |

## Structure & Features

Physical property characteristics.

### Building Details

| Field                   | Type    | Example                           | Description           |
| ----------------------- | ------- | --------------------------------- | --------------------- |
| `architecturalStyle`    | Array   | ["Ranch", "Traditional"]          | Architectural styles  |
| `basement`              | String  | "Walk-Out Access, Full, Finished" | Basement description  |
| `basementYN`            | Boolean | true                              | Has basement          |
| `newConstructionYN`     | Boolean | true                              | New construction flag |
| `builderName`           | String  | "Hildy Homes"                     | Builder name          |
| `constructionMaterials` | Array   | ["Stone", "Cement Siding"]        | Exterior materials    |
| `roof`                  | String  | "Composition"                     | Roofing material      |

### Garage & Parking

| Field          | Type    | Example | Description             |
| -------------- | ------- | ------- | ----------------------- |
| `garageSpaces` | Number  | 3       | Number of garage spaces |
| `garageYN`     | Boolean | true    | Has garage              |
| `parkingTotal` | Number  | 3       | Total parking spaces    |

### Fireplace

| Field               | Type    | Example                | Description          |
| ------------------- | ------- | ---------------------- | -------------------- |
| `fireplacesTotal`   | Number  | 2                      | Number of fireplaces |
| `fireplaceYN`       | Boolean | true                   | Has fireplace        |
| `fireplaceFeatures` | String  | "Electric, Great Room" | Fireplace details    |

## Systems & Utilities

HVAC, electrical, and other systems.

| Field        | Type    | Example                                      | Description         |
| ------------ | ------- | -------------------------------------------- | ------------------- |
| `heating`    | String  | "Natural Gas, Forced Air"                    | Heating system      |
| `heatingYN`  | Boolean | true                                         | Has heating         |
| `cooling`    | String  | "Central Air"                                | Cooling system      |
| `coolingYN`  | Boolean | true                                         | Has cooling         |
| `gas`        | String  | "Natural Gas"                                | Gas type            |
| `appliances` | Array   | ["Humidifier", "Oven", "Dishwasher"]         | Included appliances |
| `utilities`  | Array   | ["Cable Available", "Electricity Available"] | Available utilities |

## Interior Features

Room details and interior amenities.

| Field                      | Type   | Example                                  | Description             |
| -------------------------- | ------ | ---------------------------------------- | ----------------------- |
| `interiorFeatures`         | String | "Wet Bar, High Ceilings, Ceiling Fan(s)" | Interior features text  |
| `interiorFeaturesDetailed` | Array  | ["Wet Bar", "High Ceilings", "Pantry"]   | Interior features array |
| `flooring`                 | Array  | ["Wood", "Carpet", "Ceramic Tile"]       | Flooring types          |
| `laundryFeatures`          | Array  | ["Ceramic Tile Floor", "9'+ Ceiling"]    | Laundry room features   |

## Lot & Exterior

Property boundaries and outdoor features.

| Field               | Type   | Example                             | Description             |
| ------------------- | ------ | ----------------------------------- | ----------------------- |
| `lotSizeAcres`      | Number | 0.211                               | Lot size in acres       |
| `lotSizeSquareFeet` | Number | 9191.16                             | Lot size in square feet |
| `lotSizeDimensions` | String | "70.0' x 131.31' x 70.0' x 131.41'" | Lot dimensions          |
| `lotFeatures`       | Array  | ["Up to 1/4 Acre", "City Lot"]      | Lot characteristics     |
| `fencing`           | String | "None"                              | Fencing type            |
| `foundationDetails` | String | "Concrete Perimeter"                | Foundation description  |
| `exteriorFeatures`  | String | "Sprinkler System, Drain Tile"      | Exterior features       |

## Location Data

Geographic and neighborhood information.

| Field         | Type   | Example          | Description          |
| ------------- | ------ | ---------------- | -------------------- |
| `latitude`    | Number | 41.180872        | Latitude coordinate  |
| `longitude`   | Number | -96.228298       | Longitude coordinate |
| `subdivision` | String | "REMINGTON WEST" | Subdivision name     |
| `county`      | String | "Sarpy"          | County name          |

## Listing Information

MLS and marketing details.

| Field               | Type   | Example                          | Description           |
| ------------------- | ------ | -------------------------------- | --------------------- |
| `mlsNumber`         | String | "22302671"                       | MLS listing number    |
| `publicRemarks`     | String | "Meet Tyler from Hildy Homes..." | Public description    |
| `onMarketDate`      | String | "2023-02-09"                     | Date listed           |
| `originalListPrice` | Number | 579900                           | Original asking price |

## Additional Flags & Features

Specialized property characteristics.

| Field                           | Type    | Example | Description                  |
| ------------------------------- | ------- | ------- | ---------------------------- |
| `homeWarrantyYN`                | Boolean | null    | Has home warranty            |
| `waterfront`                    | Boolean | false   | Waterfront property          |
| `pool`                          | Boolean | false   | Has pool                     |
| `habitableResidenceYN`          | Boolean | null    | Habitable residence flag     |
| `horseYN`                       | Boolean | null    | Horse property               |
| `landLeaseYN`                   | Boolean | null    | Land lease property          |
| `greenBuildingVerificationType` | String  | ""      | Green building certification |

## MLS Display Settings

Internal MLS configuration flags.

| Field                            | Type    | Example | Description              |
| -------------------------------- | ------- | ------- | ------------------------ |
| `idxParticipationYN`             | Boolean | true    | IDX participation        |
| `internetAddressDisplayYN`       | Boolean | true    | Show address online      |
| `internetEntireListingDisplayYN` | Boolean | true    | Show full listing online |

## Usage Examples

### Get School District Information

```bash
curl -s "http://localhost:3002/api/property-search-new?address=19863%20cottonwood%20st" \
  | jq '.properties[0] | {
    address,
    schoolElementary,
    schoolElementaryDistrict,
    schoolHigh,
    schoolHighDistrict
  }'
```

### Financial Analysis Fields

```bash
curl -s "http://localhost:3002/api/property-search-new?city=Gretna&limit=10" \
  | jq '.properties[] | {
    address,
    listPrice,
    associationFee,
    taxAnnualAmount,
    pricePerSqft
  }'
```

### Property Features Summary

```bash
curl -s "http://localhost:3002/api/property-search-new?zip_code=68028&limit=5" \
  | jq '.properties[] | {
    address,
    sqft,
    beds,
    baths,
    yearBuilt,
    architecturalStyle,
    basement,
    garageSpaces,
    builderName
  }'
```

### New Construction Properties

```bash
curl -s "http://localhost:3002/api/property-search-new?city=Gretna&newConstructionYN=true" \
  | jq '.properties[] | {
    address,
    builderName,
    yearBuilt,
    listPrice,
    newConstructionYN
  }'
```

## API Endpoints That Include These Fields

### 1. **`/api/property-search-new`** - Enhanced property search with all fields

Enhanced search endpoint with filtering, sorting, and comprehensive property data.

### 2. **`/api/cma-comparables`** - CMA analysis with extended property data

Specialized endpoint for comparative market analysis with filtering options.

### 3. **`/api/property-details-from-address`** - Single property lookup ⭐ **NEW**

Get detailed property information for a specific address.

**Request Format:**

```bash
curl -X POST "http://localhost:3002/api/property-details-from-address" \
  -H "Content-Type: application/json" \
  -d '{"address": "19863 cottonwood st"}'
```

**Example Response:**

```json
{
  "address": "19863 Cottonwood Street, Gretna NE 68028",
  "city": "Gretna",
  "zipCode": "68028",
  "state": "NE",
  "beds": 5,
  "baths": 3,
  "sqft": 1890,
  "basementSqft": 1686,
  "totalSqft": 3576,
  "yearBuilt": 2023,
  "garage": 3,
  "listPrice": 579900,
  "propertyType": "Residential",
  "subdivision": "REMINGTON WEST",
  "schoolElementary": "Whitetail Creek",
  "schoolElementaryDistrict": "Gretna",
  "schoolHigh": "Gretna",
  "schoolHighDistrict": "Gretna",
  "condition": "New Construction",
  "style": ["Ranch", "Traditional"],
  "BuilderName": "Hildy Homes"
}
```

**Key Features:**

- ✅ **School District Information**: Returns properly mapped school fields
- ✅ **Address Flexibility**: Accepts partial addresses (e.g., "19863 cottonwood st")
- ✅ **Comprehensive Data**: All major property details in single response
- ✅ **Frontend Ready**: Field names match expected frontend format

## Field Priority Levels

### ⭐ Tier 1 - Critical

- Address, price, size, bedrooms/baths
- School information (NEW!)
- Property type and status

### 🔥 Tier 2 - High Value

- Financial details (taxes, HOA)
- Systems (heating, cooling)
- Structure (garage, basement, fireplace)

### 📋 Tier 3 - Nice to Have

- Interior features arrays
- Lot details
- MLS flags

## Notes

- All fields are optional and may return `null`, `""`, or `[]` if not available in MLS data
- Array fields contain multiple values (e.g., `["Wood", "Carpet"]`)
- Boolean fields use `true`/`false`/`null`
- Number fields are automatically converted from strings
- School district information is now reliably populated for most properties
- Financial fields help with affordability analysis and investment calculations

---

_Last Updated: September 2025 - Added comprehensive school district information and high-priority property details_

## 🚨 **BACKEND STATUS UPDATE**

### ✅ **RESOLVED: School District Fields Now Working!**

The `/api/property-details-from-address` endpoint has been **FIXED** and now correctly returns school district information:

**✅ Working Example:**

```bash
curl -X POST "http://localhost:3002/api/property-details-from-address" \
  -H "Content-Type: application/json" \
  -d '{"address": "19863 cottonwood st"}'
```

**✅ Confirmed Response Fields:**

```json
{
  "schoolElementary": "Whitetail Creek",
  "schoolElementaryDistrict": "Gretna", ✅ WORKING
  "schoolHigh": "Gretna",
  "schoolHighDistrict": "Gretna" ✅ WORKING
}
```

### ✅ **All Critical Fields Confirmed Working:**

| Field Category       | Status     | Example Values                             |
| -------------------- | ---------- | ------------------------------------------ |
| **School Districts** | ✅ Working | `schoolElementaryDistrict: "Gretna"`       |
| **Basic Property**   | ✅ Working | `beds: 5, baths: 3, sqft: 1890`            |
| **Financial**        | ✅ Working | `listPrice: 579900`                        |
| **Location**         | ✅ Working | `city: "Gretna", zipCode: "68028"`         |
| **Features**         | ✅ Working | `garage: 3, condition: "New Construction"` |

### **Usage Tips:**

1. **Address Format**: Use simple formats like `"19863 cottonwood st"` for best results
2. **School Data**: Elementary and High school districts are reliably populated
3. **Response Time**: Typically responds in 1-2 seconds
4. **Error Handling**: Returns `404` if property not found

### **Production Ready**: All field mappings are correct for frontend integration! 🎯

---
