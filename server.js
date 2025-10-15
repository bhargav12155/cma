// server.js

// --- 1. Import Libraries ---
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// --- 2. Init App ---
const app = express();
const PORT = process.env.PORT || 3002;

// --- 3. Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple API request logger to help trace UI calls
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    const q = Object.keys(req.query || {}).length
      ? ` query=${JSON.stringify(req.query)}`
      : "";
    const b =
      req.body && Object.keys(req.body).length
        ? ` body=${JSON.stringify(req.body)}`
        : "";
    // console.log(`[API REQ] ${req.method} ${req.originalUrl}${q}${b}`);
  }
  next();
});

// --- 4. Config ---
// --- 4. Paragon API Configuration ---
// Based on Paragon API documentation
const paragonApiConfig = {
  // Old OData API (for historical/closed data)
  serverToken: "429b18690390adfa776f0b727dfc78cc",
  datasetId: "bk9",
  apiUrl: "https://api.paragonapi.com/api/v2/OData",

  // New Platform API (for active listings)
  platformApiUrl: "https://paragonapi.com/platform/mls/bk9",
  clientId: "8fbF4ONttMVXbsp2WKCK",
  clientSecret: "dH8o7fxwLISCrMmZ14Sj2knt6EM6ewAOcvM2oZvd",
  appId: "ebd3728e-b55f-4973-8652-b72bd548ab3d",

  // Bearer token (will be refreshed automatically)
  bearerToken: null,
  tokenExpiry: null,
};

// Function to get/refresh Bearer token
async function getBearerToken() {
  try {
    // Check if current token is still valid (with 5 min buffer)
    if (
      paragonApiConfig.bearerToken &&
      paragonApiConfig.tokenExpiry &&
      new Date().getTime() < paragonApiConfig.tokenExpiry - 5 * 60 * 1000
    ) {
      return paragonApiConfig.bearerToken;
    }

    console.log("Getting new Bearer token...");

    // For now, we'll use a placeholder token that needs to be refreshed manually
    // In production, you'd implement the OAuth flow or get tokens from Paragon dashboard
    const tempToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTY2MDAzNTUsImV4cCI6MTc1NjYwMTI1NSwic3ViIjoiNDg2ZGRhYTItNjliYy00ZjMxLTg4MTktNGUzYmE3ZGM1NGY3In0.L8YejihiRndAf-2aOxZyhtl6-eohmCks00WFxYPkGbw";

    paragonApiConfig.bearerToken = tempToken;
    paragonApiConfig.tokenExpiry = new Date().getTime() + 15 * 60 * 1000; // 15 minutes

    return tempToken;
  } catch (error) {
    console.error("Error getting Bearer token:", error);
    return null;
  }
}

const GEMINI_API_KEY = "AIzaSyACKfnIE47Ig4PZyzjygfV9VZxUKK0NPI0";

// --- In-Memory Team Storage ---
let teams = new Map(); // teamId -> team object
let teamIdCounter = 1;

// Team data structure:
// {
//   id: 1,
//   name: "Golden Brick Team",
//   description: "Premium agents",
//   members: [
//     {
//       id: 1,
//       agent_name: "Mike Bjork",
//       agent_mls_id: "969503",
//       agent_phone: "402-522-6131",
//       added_at: "2025-09-05T..."
//     }
//   ],
//   created_at: "2025-09-05T..."
// }

// --- 5. Endpoints ---

// Root - serve HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * GET /api/communities-full
 * Accurate communities/subdivisions aggregation with optional city filtering.
 */
app.get("/api/communities-full", async (req, res) => {
  // Implementation goes here
});
// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      gemini_ai: GEMINI_API_KEY ? "configured" : "not_configured",
      paragon_api:
        paragonApiConfig.serverToken !== "YOUR_SERVER_TOKEN_HERE"
          ? "configured"
          : "not_configured",
    },
  });
});

// Server status
app.get("/api/status", (req, res) => {
  res.json({
    server: "Simple CMA Backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  });
});

// Test endpoint to check Paragon API configuration
app.get("/api/test-config", (req, res) => {
  res.json({
    message: "Paragon API Configuration Check",
    tokenConfigured: paragonApiConfig.serverToken !== "YOUR_SERVER_TOKEN_HERE",
    datasetId: paragonApiConfig.datasetId,
    apiUrl: paragonApiConfig.apiUrl,
    tokenPrefix: paragonApiConfig.serverToken.substring(0, 10) + "...",
  });
});

// NOTE: You need to replace 'YOUR_SERVER_TOKEN_HERE' in the paragonApiConfig
// with your actual Server Token from your Paragon dashboard

// Comprehensive Property Search API - covers all filter options
app.get("/api/property-search", async (req, res) => {
  const {
    // Property ID filters
    mls_number,
    listing_id,
    id,

    // Location filters
    city,
    zip_code,
    latitude,
    longitude,
    radius_miles = 5,

    // Price filters
    min_price,
    max_price,
    price_range, // e.g., "500k+" which means 500000+

    // Property type filters (default 'All' so we don't unintentionally filter MLS lookups)
    property_type = "All", // House, Condo, Townhouse, etc.  ('All' means no filter)

    // Size filters
    min_sqft,
    max_sqft,
    min_beds,
    max_beds,
    beds, // e.g., "5+" which means 5 or more
    min_baths,
    max_baths,

    // Status filters
    status, // "For Sale", "Sold", "All" - NO DEFAULT VALUE

    // Additional filters
    min_year_built,
    max_year_built,
    garage_spaces,
    waterfront,
    new_construction,

    // Sorting and pagination
    sort_by = "price", // price, sqft, beds, date, newest
    sort_order = "asc", // asc, desc
    limit = 50,
    offset = 0,
  } = req.query;

  try {
    console.log("Property search request:", req.query);

    // Build base filters array
    let filters = [];

    // Property ID filters - search in ALL properties (not just active)
    if (mls_number) filters.push(`ListingId eq '${mls_number}'`);
    if (listing_id) filters.push(`ListingId eq '${listing_id}'`);
    if (id) filters.push(`ListingKey eq '${id}'`);

    // Location filters
    if (city) {
      filters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }
    if (zip_code) {
      filters.push(`PostalCode eq '${zip_code}'`);
    }

    // Price filters
    let priceFilters = [];

    // Handle price_range shorthand (e.g., "500k+", "300k-500k")
    if (price_range) {
      if (price_range.includes("+")) {
        const minPrice = parseFloat(price_range.replace(/[k+]/gi, "")) * 1000;
        priceFilters.push(`ListPrice ge ${minPrice}`);
        priceFilters.push(`ClosePrice ge ${minPrice}`);
      } else if (price_range.includes("-")) {
        const [min, max] = price_range
          .split("-")
          .map((p) => parseFloat(p.replace(/k/gi, "")) * 1000);
        priceFilters.push(`ListPrice ge ${min} and ListPrice le ${max}`);
        priceFilters.push(`ClosePrice ge ${min} and ClosePrice le ${max}`);
      }
    }

    // Handle explicit min/max price
    if (min_price) {
      priceFilters.push(`ListPrice ge ${min_price}`);
      priceFilters.push(`ClosePrice ge ${min_price}`);
    }
    if (max_price) {
      priceFilters.push(`ListPrice le ${max_price}`);
      priceFilters.push(`ClosePrice le ${max_price}`);
    }

    // Combine price filters with OR logic
    if (priceFilters.length > 0) {
      const priceQuery = priceFilters.join(" or ");
      filters.push(`(${priceQuery})`);
    }

    // Determine if this is a direct MLS / Listing lookup
    const isMlsLookup = !!(mls_number || listing_id || id);

    // Property type filter
    // For direct MLS lookups we ONLY apply a property type filter if the caller explicitly passed property_type
    const propertyTypeExplicitlyProvided = Object.prototype.hasOwnProperty.call(
      req.query,
      "property_type"
    );
    if (
      property_type &&
      property_type !== "All" &&
      (!isMlsLookup || propertyTypeExplicitlyProvided)
    ) {
      filters.push(`PropertyType eq '${property_type}'`);
    }

    // Size filters
    if (min_sqft) {
      filters.push(`AboveGradeFinishedArea ge ${min_sqft}`);
    }
    if (max_sqft) {
      filters.push(`AboveGradeFinishedArea le ${max_sqft}`);
    }

    // Bedroom filters
    if (beds) {
      if (beds.includes("+")) {
        const minBeds = parseInt(beds.replace("+", ""));
        filters.push(`BedroomsTotal ge ${minBeds}`);
      } else {
        filters.push(`BedroomsTotal eq ${parseInt(beds)}`);
      }
    }
    if (min_beds) {
      filters.push(`BedroomsTotal ge ${min_beds}`);
    }
    if (max_beds) {
      filters.push(`BedroomsTotal le ${max_beds}`);
    }

    // Bathroom filters
    if (min_baths) {
      filters.push(`BathroomsTotalInteger ge ${min_baths}`);
    }
    if (max_baths) {
      filters.push(`BathroomsTotalInteger le ${max_baths}`);
    }

    // Status filter - ONLY apply if explicitly requested
    if (status === "For Sale") {
      filters.push(`StandardStatus eq 'Active'`);
    } else if (status === "Sold") {
      filters.push(`StandardStatus eq 'Closed'`);
      // Add recent sales filter (last 12 months by default)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
      const dateFilter = cutoffDate.toISOString().split("T")[0];
      filters.push(`CloseDate ge ${dateFilter}`);
    }
    // If no status is specified, return ALL properties (Active, Closed, Expired, etc.)

    // Year built filters
    if (min_year_built) {
      filters.push(`YearBuilt ge ${min_year_built}`);
    }
    if (max_year_built) {
      filters.push(`YearBuilt le ${max_year_built}`);
    }

    // Additional filters
    if (garage_spaces) {
      filters.push(`GarageSpaces ge ${garage_spaces}`);
    }
    if (waterfront === "true") {
      filters.push(`WaterfrontYN eq true`);
    }
    if (new_construction === "true") {
      filters.push(`NewConstructionYN eq true`);
    }

    // Build the complete filter string
    const filterString = filters.join(" and ");

    // Build sorting
    let orderBy = "ListPrice asc"; // default
    if (sort_by === "price") {
      orderBy = `ListPrice ${sort_order}`;
    } else if (sort_by === "sqft") {
      orderBy = `AboveGradeFinishedArea ${sort_order}`;
    } else if (sort_by === "beds") {
      orderBy = `BedroomsTotal ${sort_order}`;
    } else if (sort_by === "date" || sort_by === "newest") {
      orderBy =
        status === "Sold"
          ? `CloseDate ${sort_order}`
          : `OnMarketDate ${sort_order}`;
    }

    // Build Paragon API URL
    const baseUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties`;
    const accessToken = `access_token=${paragonApiConfig.serverToken}`;

    const selectFields = [
      "UnparsedAddress",
      "City",
      "StateOrProvince",
      "PostalCode",
      "ListPrice",
      "ClosePrice",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "GarageSpaces",
      "YearBuilt",
      "StandardStatus",
      "CloseDate",
      "OnMarketDate",
      "Media",
      "ListingKey",
      "PropertyType",
      "PropertyCondition",
      "ArchitecturalStyle",
      "SubdivisionName",
      "Coordinates",
      "Latitude",
      "Longitude",
      "LotSizeAcres",
      "LotSizeSquareFeet",
      "WaterfrontYN",
      "NewConstructionYN",
    ].join(",");

    let apiUrl = `${baseUrl}?${accessToken}`;

    if (filterString) {
      apiUrl += `&$filter=${encodeURIComponent(filterString)}`;
    }

    apiUrl += `&$select=${encodeURIComponent(selectFields)}`;
    apiUrl += `&$orderby=${encodeURIComponent(orderBy)}`;
    apiUrl += `&$top=${limit}`;

    if (offset > 0) {
      apiUrl += `&$skip=${offset}`;
    }

    console.log("Paragon API URL:", apiUrl);

    // Make API request
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Paragon API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Transform the data to a consistent format
    const properties =
      data.value?.map((property) => ({
        id: property.ListingKey || Math.random().toString(36).substr(2, 9),
        address: property.UnparsedAddress || "",
        city: property.City || "",
        state: property.StateOrProvince || "",
        zipCode: property.PostalCode || "",
        listPrice: property.ListPrice || 0,
        soldPrice: property.ClosePrice || 0,
        sqft: property.AboveGradeFinishedArea || 0, // Above-grade only
        basementSqft: property.BelowGradeFinishedArea || 0,
        beds: property.BedroomsTotal || 0,
        baths: property.BathroomsTotalInteger || 0,
        garage: property.GarageSpaces || 0,
        yearBuilt: property.YearBuilt || 0,
        status: property.StandardStatus || "",
        closeDate: property.CloseDate || null,
        onMarketDate: property.OnMarketDate || null,
        pricePerSqft:
          property.AboveGradeFinishedArea > 0
            ? Math.round(
                (property.ListPrice || property.ClosePrice || 0) /
                  property.AboveGradeFinishedArea
              )
            : 0,
        propertyType: property.PropertyType || "",
        condition: property.PropertyCondition || "",
        style: property.ArchitecturalStyle || "",
        subdivision: property.SubdivisionName || "",
        latitude: property.Latitude || 0,
        longitude: property.Longitude || 0,
        lotSizeAcres: property.LotSizeAcres || 0,
        lotSizeSqft: property.LotSizeSquareFeet || 0,
        waterfront: property.WaterfrontYN || false,
        newConstruction: property.NewConstructionYN || false,
        isActive: property.StandardStatus === "Active",
        imageUrl:
          property.Media && property.Media.length > 0
            ? property.Media[0].MediaURL ||
              property.Media[0].PreferredPhotoURL ||
              ""
            : "",
      })) || [];

    // Response
    res.json({
      success: true,
      count: properties.length,
      totalAvailable: data["@odata.count"] || properties.length,
      properties,
      searchCriteria: req.query,
      apiUrl: apiUrl.replace(paragonApiConfig.serverToken, "***"),
    });
  } catch (error) {
    console.error("Property search error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      searchCriteria: req.query,
    });
  }
});

// Enhanced CMA endpoint - fetches both Active and Closed comparables
app.get("/api/cma-comparables", async (req, res) => {
  const {
    address,
    city,
    zip_code,
    sqft,
    latitude,
    longitude,
    radius_miles = 5,
    sqft_delta = 1200,
    months_back = 12,
    year_built_range,
    residential_area,
    price_range,
    lot_size,
    waterfront,
    new_construction,
    same_subdivision,
    min_price,
    max_price,
    property_type,
    // New filtering options
    status = "both", // "active", "closed", "both"
    exclude_zero_price = "false", // "true" to exclude properties with $0 price
  } = req.query;

  //console.log("Received CMA comparables request:", req.query);

  try {
    // Calculate date filter for closed sales (months back from today)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months_back));
    const dateFilter = cutoffDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Build base filters
    let baseFilters = [];

    // Location filters
    if (city) {
      baseFilters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }

    // Size filters if sqft provided
    if (sqft && sqft_delta) {
      const minSqft = parseInt(sqft) - parseInt(sqft_delta);
      const maxSqft = parseInt(sqft) + parseInt(sqft_delta);
      baseFilters.push(
        `AboveGradeFinishedArea ge ${minSqft} and AboveGradeFinishedArea le ${maxSqft}`
      );
    }

    // Advanced filters

    // Year built range filter
    if (year_built_range && sqft) {
      // Assuming we have a year built value to compare against
      const yearBuilt = parseInt(year_built_range);
      if (yearBuilt > 0) {
        const minYear =
          new Date().getFullYear() - yearBuilt - parseInt(year_built_range);
        const maxYear =
          new Date().getFullYear() - yearBuilt + parseInt(year_built_range);
        baseFilters.push(`YearBuilt ge ${minYear} and YearBuilt le ${maxYear}`);
      }
    }

    // Residential area / neighborhood filter - now supports multiple areas
    if (residential_area) {
      const areas = residential_area
        .split(",")
        .map((area) => area.trim())
        .filter((area) => area);
      if (areas.length > 0) {
        const areaFilters = areas.map(
          (area) =>
            `(contains(tolower(SubdivisionName),'${area.toLowerCase()}') or contains(tolower(UnparsedAddress),'${area.toLowerCase()}'))`
        );
        // Use OR logic to match any of the specified areas
        baseFilters.push(`(${areaFilters.join(" or ")})`);
      }
    }

    // Price range filter
    if (price_range && price_range !== "any") {
      let priceFilter = "";
      switch (price_range) {
        case "under_200k":
          priceFilter = "(ListPrice lt 200000 or ClosePrice lt 200000)";
          break;
        case "200k_300k":
          priceFilter =
            "((ListPrice ge 200000 and ListPrice lt 300000) or (ClosePrice ge 200000 and ClosePrice lt 300000))";
          break;
        case "300k_400k":
          priceFilter =
            "((ListPrice ge 300000 and ListPrice lt 400000) or (ClosePrice ge 300000 and ClosePrice lt 400000))";
          break;
        case "400k_500k":
          priceFilter =
            "((ListPrice ge 400000 and ListPrice lt 500000) or (ClosePrice ge 400000 and ClosePrice lt 500000))";
          break;
        case "500k_750k":
          priceFilter =
            "((ListPrice ge 500000 and ListPrice lt 750000) or (ClosePrice ge 500000 and ClosePrice lt 750000))";
          break;
        case "750k_1m":
          priceFilter =
            "((ListPrice ge 750000 and ListPrice lt 1000000) or (ClosePrice ge 750000 and ClosePrice lt 1000000))";
          break;
        case "over_1m":
          priceFilter = "(ListPrice ge 1000000 or ClosePrice ge 1000000)";
          break;
      }
      if (priceFilter) {
        baseFilters.push(priceFilter);
      }
    }

    // Min/Max price filters (more flexible than price_range)
    if (min_price || max_price) {
      let customPriceFilter = "";

      if (min_price && max_price) {
        // Both min and max specified
        customPriceFilter = `((ListPrice ge ${parseInt(
          min_price
        )} and ListPrice le ${parseInt(
          max_price
        )}) or (ClosePrice ge ${parseInt(
          min_price
        )} and ClosePrice le ${parseInt(max_price)}))`;
      } else if (min_price) {
        // Only minimum price specified
        customPriceFilter = `(ListPrice ge ${parseInt(
          min_price
        )} or ClosePrice ge ${parseInt(min_price)})`;
      } else if (max_price) {
        // Only maximum price specified
        customPriceFilter = `(ListPrice le ${parseInt(
          max_price
        )} or ClosePrice le ${parseInt(max_price)})`;
      }

      if (customPriceFilter) {
        baseFilters.push(customPriceFilter);
      }
    }

    // Lot size filter
    if (lot_size && lot_size !== "any") {
      let lotFilter = "";
      switch (lot_size) {
        case "under_quarter":
          lotFilter = "LotSizeAcres lt 0.25";
          break;
        case "quarter_half":
          lotFilter = "LotSizeAcres ge 0.25 and LotSizeAcres lt 0.5";
          break;
        case "half_one":
          lotFilter = "LotSizeAcres ge 0.5 and LotSizeAcres lt 1.0";
          break;
        case "over_one":
          lotFilter = "LotSizeAcres ge 1.0";
          break;
      }
      if (lotFilter) {
        baseFilters.push(lotFilter);
      }
    }

    // Waterfront filter
    if (waterfront === "true") {
      baseFilters.push("WaterfrontYN eq true");
    }

    // New construction filter
    if (new_construction === "true") {
      baseFilters.push("NewConstructionYN eq true");
    }

    // Same subdivision filter
    if (same_subdivision === "true" && residential_area) {
      baseFilters.push(
        `tolower(SubdivisionName) eq '${residential_area.toLowerCase()}'`
      );
    }

    // Property type filter
    if (property_type && property_type !== "All") {
      baseFilters.push(`PropertyType eq '${property_type}'`);
    }

    // Zip code filter
    if (zip_code) {
      console.log("Adding zip_code filter for CMA:", zip_code);
      baseFilters.push(`PostalCode eq '${zip_code}'`);
    }

    // Define the core fields we need for CMA
    const selectFields = [
      "UnparsedAddress",
      "City",
      "ListPrice",
      "ClosePrice",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "GarageSpaces",
      "YearBuilt",
      "StandardStatus",
      "CloseDate",
      "OnMarketDate",
      "Media",
      "ListingKey",
      "PropertyType",
      "PropertyCondition",
      "ArchitecturalStyle",
      "SubdivisionName",
      "Coordinates",
      "Latitude",
      "Longitude",
      "LotSizeAcres",
      "LotSizeSquareFeet",
      "WaterfrontYN",
      "NewConstructionYN",
      "PostalCode",
      "StateOrProvince",
    ].join(",");

    // Build Active Properties query
    const activeFilters = [...baseFilters, "StandardStatus eq 'Active'"];
    const activeFilterString = activeFilters.join(" and ");
    console.log("Active filters:", activeFilterString);
    const activeUrl =
      `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
      `access_token=${paragonApiConfig.serverToken}&` +
      `$filter=${encodeURIComponent(activeFilterString)}&` +
      `$select=${encodeURIComponent(selectFields)}&` +
      `$orderby=ListPrice asc&` +
      `$top=150`;

    // Build Closed Properties query
    const closedFilters = [
      ...baseFilters,
      `StandardStatus eq 'Closed'`,
      `CloseDate ge ${dateFilter}`,
    ];
    const closedFilterString = closedFilters.join(" and ");
    const closedUrl =
      `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
      `access_token=${paragonApiConfig.serverToken}&` +
      `$filter=${encodeURIComponent(closedFilterString)}&` +
      `$select=${encodeURIComponent(selectFields)}&` +
      `$orderby=CloseDate desc&` +
      `$top=150`;

    //console.log("Active Properties Query:", activeUrl);
    //console.log("Closed Properties Query:", closedUrl);

    // Execute queries based on status filter
    let activeResponse = null;
    let closedResponse = null;

    if (status === "active" || status === "both") {
      activeResponse = await fetch(activeUrl);
      if (!activeResponse.ok) {
        console.error(
          "Active properties query failed:",
          activeResponse.status,
          await activeResponse.text()
        );
        throw new Error(
          `Active properties query failed: ${activeResponse.status}`
        );
      }
    }

    if (status === "closed" || status === "both") {
      closedResponse = await fetch(closedUrl);
      if (!closedResponse.ok) {
        console.error(
          "Closed properties query failed:",
          closedResponse.status,
          await closedResponse.text()
        );
        throw new Error(
          `Closed properties query failed: ${closedResponse.status}`
        );
      }
    }

    const activeData = activeResponse
      ? await activeResponse.json()
      : { value: [] };
    const closedData = closedResponse
      ? await closedResponse.json()
      : { value: [] };

    let activeProperties = activeData.value || [];
    let closedProperties = closedData.value || [];

    // Filter out properties with zero/null prices if requested
    if (exclude_zero_price === "true") {
      activeProperties = activeProperties.filter(
        (prop) => prop.ListPrice && prop.ListPrice > 0
      );
      closedProperties = closedProperties.filter(
        (prop) => prop.ClosePrice && prop.ClosePrice > 0
      );
    }

    // //console.log(
    //   `Found ${activeProperties.length} active and ${closedProperties.length} closed properties`
    // );

    // Process and enhance the data
    const processProperty = (prop, isActive = false) => {
      const sqftValue = prop.LivingArea || prop.AboveGradeFinishedArea || 0;
      const price = isActive ? prop.ListPrice : prop.ClosePrice;
      const totalSqft = sqftValue + (prop.BelowGradeFinishedArea || 0);
      const pricePerSqft =
        price && totalSqft ? Math.round(price / totalSqft) : 0;

      // Calculate distance if coordinates are available
      let distance_miles = null;
      if (prop.Latitude && prop.Longitude && latitude && longitude) {
        distance_miles = haversineMiles(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(prop.Latitude),
          parseFloat(prop.Longitude)
        );
      }

      return {
        id: prop.ListingKey,
        address: prop.UnparsedAddress,
        city: prop.City,
        listPrice: prop.ListPrice,
        soldPrice: prop.ClosePrice,
        sqft: sqftValue,
        basementSqft: prop.BelowGradeFinishedArea,
        totalSqft,
        totalSqft: sqftValue + (prop.BelowGradeFinishedArea || 0),
        beds: prop.BedroomsTotal,
        baths: prop.BathroomsTotalInteger || prop.BathroomsTotal,
        garage: prop.GarageSpaces,
        yearBuilt: prop.YearBuilt,
        status: prop.StandardStatus,
        closeDate: prop.CloseDate,
        onMarketDate: prop.OnMarketDate,
        pricePerSqft,
        propertyType: prop.PropertyType,
        condition:
          Array.isArray(prop.PropertyCondition) &&
          prop.PropertyCondition.length > 0
            ? prop.PropertyCondition[0]
            : "Average",
        style:
          Array.isArray(prop.ArchitecturalStyle) &&
          prop.ArchitecturalStyle.length > 0
            ? prop.ArchitecturalStyle[0]
            : "",
        subdivision: prop.SubdivisionName || "",
        latitude: prop.Latitude,
        longitude: prop.Longitude,
        distance_miles,
        isActive,
        imageUrl:
          prop.Media && prop.Media.length > 0
            ? prop.Media[0].MediaURL
            : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==",
      };
    };

    const processedActive = activeProperties.map((prop) =>
      processProperty(prop, true)
    );
    const processedClosed = closedProperties.map((prop) =>
      processProperty(prop, false)
    );

    // Filter by radius if coordinates are provided
    let filteredActive = processedActive;
    let filteredClosed = processedClosed;

    if (latitude && longitude) {
      const radiusFloat = parseFloat(radius_miles);
      filteredActive = processedActive.filter(
        (prop) =>
          prop.distance_miles === null || prop.distance_miles <= radiusFloat
      );
      filteredClosed = processedClosed.filter(
        (prop) =>
          prop.distance_miles === null || prop.distance_miles <= radiusFloat
      );
    }

    res.json({
      success: true,
      query: req.query,
      dateFilter,
      counts: {
        active: filteredActive.length,
        closed: filteredClosed.length,
        total: filteredActive.length + filteredClosed.length,
      },
      active: filteredActive,
      closed: filteredClosed,
      combined: [...filteredActive, ...filteredClosed], // For convenience
      properties: [...filteredActive, ...filteredClosed], // For client compatibility
      meta: {
        activeQuery: activeResponse ? activeUrl : null,
        closedQuery: closedResponse ? closedUrl : null,
        searchCriteria: {
          city,
          sqft,
          radius_miles,
          sqft_delta,
          months_back,
          dateFilter,
          status,
          exclude_zero_price,
        },
      },
    });
  } catch (error) {
    console.error("CMA comparables error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: req.query,
    });
  }
});

// Comps endpoint
app.get("/api/comps", async (req, res) => {
  //console.log("Received request for comps with query:", req.query);

  // Check if server token is configured
  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    console.error("Server token not configured!");
    return res.status(500).json({
      message: "Server configuration error",
      details:
        "Paragon Server Token not configured. Please update paragonApiConfig.serverToken with your actual token from the Paragon dashboard.",
    });
  }

  try {
    // Build property query using Paragon API format
    const { city, sqft_min, sqft_max } = req.query;

    // OData filter syntax as per Paragon docs
    const odataFilter = `$filter=StandardStatus eq 'Closed' and City eq '${city}' and LivingArea ge ${sqft_min} and LivingArea le ${sqft_max}`;
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?${odataFilter}&$top=50`;

    //console.log("Making request to:", searchUrl);
    // //console.log(
    //   "Using token:",
    //   paragonApiConfig.serverToken.substring(0, 10) + "..."
    // );

    // Fetch properties using Server Token authentication
    const propertyResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    //console.log("Property response status:", propertyResponse.status);

    if (!propertyResponse.ok) {
      console.error(
        "Property fetch error response:",
        await propertyResponse.text()
      );
      throw new Error(`Data fetch failed (${propertyResponse.status})`);
    }

    const propertyData = await propertyResponse.json();
    const listings = propertyData.value || [];
    //console.log(`Found ${listings.length} comps from Paragon API.`);

    // Format the results for the frontend with comprehensive field mapping
    const formattedComps = listings.map((record) => ({
      id: record.ListingKey || record.PropertyId || record.id,
      address:
        record.UnparsedAddress ||
        record.Address ||
        `${record.StreetNumber} ${record.StreetName}`,
      city: record.City,
      status:
        record.StandardStatus === "Closed" ? "Sold" : record.StandardStatus,
      soldDate: record.CloseDate || record.ContractStatusChangeDate,
      soldPrice: Number(record.ClosePrice || record.ListPrice || 0),
      listPrice: Number(record.ListPrice || 0),
      sqft: Number(record.LivingArea || record.AboveGradeFinishedArea || 0),
      aboveGradeSqft: Number(record.AboveGradeFinishedArea || 0),
      belowGradeSqft: Number(record.BelowGradeFinishedArea || 0),
      beds: Number(record.BedroomsTotal || 0),
      baths: Number(record.BathroomsTotalDecimal || record.BathroomsTotal || 0),
      bathsFull: Number(record.BathroomsFull || 0),
      bathsHalf: Number(record.BathroomsHalf || 0),
      garage: Number(
        record.GarageSpaces || record.ParkingTotal || record.CoveredSpaces || 0
      ),
      yearBuilt: Number(record.YearBuilt || 0),
      condition:
        record.PropertyCondition && record.PropertyCondition.length > 0
          ? record.PropertyCondition[0]
          : "Average",
      propertyType: record.PropertyType || "",
      propertySubType: record.PropertySubType || "",
      lotSizeAcres: Number(record.LotSizeAcres || 0),
      lotSizeSquareFeet: Number(record.LotSizeSquareFeet || 0),
      stories: Number(record.StoriesTotal || 0),
      heating: record.Heating || "",
      cooling: record.Cooling || "",
      appliances: record.Appliances || "",
      flooring: record.Flooring || "",
      basement: record.Basement || "",
      fireplace: Number(record.FireplacesTotal || 0),
      pool: record.PoolPrivateYN || false,
      waterfront: record.WaterfrontYN || false,

      // Schools
      schoolElementary: record.ElementarySchool || "",
      schoolElementaryDistrict: record.ElementarySchoolDistrict || "",
      schoolMiddle: record.MiddleOrJuniorSchool || "",
      schoolMiddleDistrict:
        record.MiddleSchoolDistrict ||
        record.MiddleOrJuniorSchoolDistrict ||
        "",
      schoolHigh: record.HighSchool || "",
      schoolHighDistrict: record.HighSchoolDistrict || "",

      // Extended Property Details
      fencing: record.Fencing || "",
      flooring: record.Flooring || [],
      foundationDetails: record.FoundationDetails || "",
      heating: record.Heating || "",
      gas: record.Gas || "",
      garageSpaces: Number(record.GarageSpaces || 0),
      garageYN: record.GarageYN || false,
      fireplaceFeatures: record.FireplaceFeatures || "",
      fireplacesTotal: Number(record.FireplacesTotal || 0),
      fireplaceYN: record.FireplaceYN || false,
      interiorFeaturesDetailed: record.InteriorFeatures || [],
      laundryFeatures: record.LaundryFeatures || [],

      // Tier 1 - Critical Property Details
      propertySubType: record.PropertySubType || "",
      lotSizeAcres: Number(record.LotSizeAcres || 0),
      lotSizeSquareFeet: record.LotSizeSquareFeet || null,
      newConstructionYN: record.NewConstructionYN || false,

      // Tier 2 - High Value Details
      architecturalStyle: record.ArchitecturalStyle || [],
      basement: record.Basement || "",
      basementYN: record.BasementYN || false,
      cooling: record.Cooling || "",
      coolingYN: record.CoolingYN || false,
      appliances: record.Appliances || [],
      utilities: record.Utilities || [],

      // Financial Details
      associationFee: Number(record.AssociationFee || 0),
      associationFeeFrequency: record.AssociationFeeFrequency || "",
      taxAnnualAmount: Number(record.TaxAnnualAmount || 0),
      taxYear: record.TaxYear || null,

      // Builder & Construction
      builderName: record.BuilderName || "",
      constructionMaterials: record.ConstructionMaterials || [],
      roof: record.Roof || "",

      // Lot Details
      lotFeatures: record.LotFeatures || [],
      lotSizeDimensions: record.LotSizeDimensions || "",
      publicRemarks: record.PublicRemarks || "",
      privateRemarks: record.PrivateRemarks || "",
      mlsNumber: record.ListingId || "",
      daysOnMarket: Number(
        record.DaysOnMarket || record.CumulativeDaysOnMarket || 30
      ),
      dom: Number(record.DaysOnMarket || record.CumulativeDaysOnMarket || 30),
      originalListPrice: Number(record.OriginalListPrice || 0),
      pricePerSqft:
        record.ClosePrice && record.LivingArea && record.LivingArea > 0
          ? Math.round(record.ClosePrice / record.LivingArea)
          : 0,
      taxAssessedValue: Number(record.TaxAssessedValue || 0),
      taxAnnualAmount: Number(record.TaxAnnualAmount || 0),
      associationFee: Number(record.AssociationFee || 0),
      coordinates: record.Coordinates || "",
      latitude: Number(record.Latitude || 0),
      longitude: Number(record.Longitude || 0),
      imageUrl:
        record.Media && record.Media.length > 0
          ? record.Media[0].MediaURL
          : record.Photos && record.Photos.length > 0
          ? record.Photos[0].url
          : `https://placehold.co/600x400/d1d5db/374151?text=No+Image`,
      images: record.Media ? record.Media.map((m) => m.MediaURL) : [],
      virtualTour:
        record.VirtualTourURLBranded || record.VirtualTourURLUnbranded || "",
      buildingFeatures: record.BuildingFeatures || "",
      exteriorFeatures: record.ExteriorFeatures || "",
      interiorFeatures: record.InteriorFeatures || "",
      constructionMaterials: record.ConstructionMaterials || "",
      architecturalStyle: record.ArchitecturalStyle || "",
      newConstruction: record.NewConstructionYN || false,
      seniorCommunity: record.SeniorCommunityYN || false,
      gatedCommunity: record.GatedCommunityYN || false,
      utilities: record.Utilities || "",
      sewer: record.Sewer || "",
      water: record.WaterSource || "",
      electric: record.Electric || "",
      gas: record.Gas || "",
      inclusionsExclusions: {
        inclusions: record.Inclusions || "",
        exclusions: record.Exclusions || "",
      },
      financing: record.BuyerFinancing || "",
      possession: record.Possession || "",
      disclosures: record.Disclosures || "",
      restrictions: record.Restrictions || "",
      zoning: record.Zoning || "",
      listAgent: {
        name: record.ListAgentFullName || "",
        phone: record.ListAgentPreferredPhone || "",
        email: record.ListAgentEmail || "",
        mlsId: record.ListAgentMlsId || "",
      },
      listOffice: {
        name: record.ListOfficeName || "",
        phone: record.ListOfficePhone || "",
        mlsId: record.ListOfficeMlsId || "",
      },
      modificationTimestamp: record.ModificationTimestamp || "",
      onMarketDate: record.OnMarketDate || "",
      contractDate: record.PurchaseContractDate || "",
      closeDate: record.CloseDate || "",
      originalEntryTimestamp: record.OriginalEntryTimestamp || "",
    }));

    res.json(formattedComps);
  } catch (error) {
    console.error("Paragon API Error:", error);
    res.status(500).json({
      message: "Failed to fetch data from MLS.",
      details: error.message,
    });
  }
});

// New Property Search API for testing with wildcard support
app.get("/api/property-search-new", async (req, res) => {
  const {
    // Property IDs
    mls_number,
    listing_id,

    // Agent searches
    buyer_agent_mls_id,
    buyer_agent_name,
    listing_agent_mls_id,
    listing_agent_name,

    // Location filters
    address,
    city,
    zip_code,
    subdivision,
    radius_miles = 5,

    // Property specifications
    min_sqft,
    max_sqft,
    above_grade_sqft,
    basement_sqft,
    total_sqft,

    // Price filters
    min_price,
    max_price,

    // Property details
    min_year_built,
    max_year_built,
    bedrooms,
    min_bedrooms,
    max_bedrooms,
    bathrooms,
    min_bathrooms,
    max_bathrooms,
    garage_spaces,

    // Property features
    waterfront,
    new_construction,
    property_type,
    property_condition,

    // Status filters
    status, // Active, Sold, Closed, etc.

    // Sorting and pagination
    sort_by = "ListPrice",
    sort_order = "desc",
    limit = 200,
    offset = 0,
  } = req.query;

  try {
    console.log("New Property Search Request:", req.query);

    // Build filters
    let filters = [];

    // Property ID filters
    if (mls_number) filters.push(`ListingId eq '${mls_number}'`);
    if (listing_id) filters.push(`ListingId eq '${listing_id}'`);

    // Agent filters with wildcard support
    if (buyer_agent_mls_id)
      filters.push(`BuyerAgentMlsId eq '${buyer_agent_mls_id}'`);
    if (buyer_agent_name)
      filters.push(
        `contains(tolower(BuyerAgentFullName),'${buyer_agent_name.toLowerCase()}')`
      );
    if (listing_agent_mls_id)
      filters.push(`ListAgentMlsId eq '${listing_agent_mls_id}'`);
    if (listing_agent_name)
      filters.push(
        `contains(tolower(ListAgentFullName),'${listing_agent_name.toLowerCase()}')`
      );

    // Location filters
    // For CMA searches, we don't want to filter by subject property address - we want comparable properties
    // Only filter by address if it's not a CMA/comparable property search
    if (address && !city) {
      // If city is provided, assume it's a CMA search for comparables
      filters.push(
        `contains(tolower(UnparsedAddress),'${address.toLowerCase()}')`
      );
    }
    if (city) filters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    if (zip_code) filters.push(`PostalCode eq '${zip_code}'`);
    if (subdivision)
      filters.push(
        `contains(tolower(SubdivisionName),'${subdivision.toLowerCase()}')`
      );

    // Square footage filters
    if (min_sqft) filters.push(`LivingArea ge ${min_sqft}`);
    if (max_sqft) filters.push(`LivingArea le ${max_sqft}`);
    if (above_grade_sqft)
      filters.push(`AboveGradeFinishedArea eq ${above_grade_sqft}`);
    if (basement_sqft)
      filters.push(`BelowGradeFinishedArea eq ${basement_sqft}`);
    if (total_sqft) filters.push(`BuildingAreaTotal eq ${total_sqft}`);

    // Price filters
    if (min_price) filters.push(`ListPrice ge ${min_price}`);
    if (max_price) filters.push(`ListPrice le ${max_price}`);

    // Year built filters
    if (min_year_built) filters.push(`YearBuilt ge ${min_year_built}`);
    if (max_year_built) filters.push(`YearBuilt le ${max_year_built}`);

    // Bedroom filters
    if (bedrooms) filters.push(`BedroomsTotal eq ${bedrooms}`);
    if (min_bedrooms) filters.push(`BedroomsTotal ge ${min_bedrooms}`);
    if (max_bedrooms) filters.push(`BedroomsTotal le ${max_bedrooms}`);

    // Bathroom filters
    if (bathrooms) filters.push(`BathroomsTotalInteger eq ${bathrooms}`);
    if (min_bathrooms)
      filters.push(`BathroomsTotalInteger ge ${min_bathrooms}`);
    if (max_bathrooms)
      filters.push(`BathroomsTotalInteger le ${max_bathrooms}`);

    // Other property filters
    if (garage_spaces) filters.push(`GarageSpaces eq ${garage_spaces}`);
    if (waterfront)
      filters.push(`WaterfrontYN eq ${waterfront.toLowerCase() === "true"}`);
    if (new_construction)
      filters.push(
        `NewConstructionYN eq ${new_construction.toLowerCase() === "true"}`
      );
    if (property_type) filters.push(`PropertyType eq '${property_type}'`);
    if (property_condition)
      filters.push(
        `contains(tolower(PropertyCondition),'${property_condition.toLowerCase()}')`
      );

    // Status filters restored - Support for active property filtering
    if (status && status !== "Any Status") {
      filters.push(`tolower(StandardStatus) eq '${status.toLowerCase()}'`);
    }

    // Support for Paragon-style StandardStatus parameter
    if (req.query.StandardStatus) {
      filters.push(
        `tolower(StandardStatus) eq '${req.query.StandardStatus.toLowerCase()}'`
      );
    }

    // Support for Paragon-style array filtering: and[0][StandardStatus][eq]
    const standardStatusEq = req.query["and[0][StandardStatus][eq]"];
    if (standardStatusEq) {
      filters.push(
        `tolower(StandardStatus) eq '${standardStatusEq.toLowerCase()}'`
      );
    }

    // Support for Paragon-style SubdivisionName parameter
    if (req.query.SubdivisionName) {
      filters.push(`SubdivisionName eq '${req.query.SubdivisionName}'`);
    }

    // Support for Paragon-style array filtering: and[0][SubdivisionName][eq]
    const subdivisionNameEq = req.query["and[0][SubdivisionName][eq]"];
    if (subdivisionNameEq) {
      filters.push(`SubdivisionName eq '${subdivisionNameEq}'`);
    }

    const filterQuery = filters.length
      ? `$filter=${encodeURIComponent(filters.join(" and "))}`
      : "";
    const url = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?access_token=${paragonApiConfig.serverToken}&$top=${limit}&$skip=${offset}&$orderby=${sort_by} ${sort_order}&${filterQuery}`;

    console.log("API URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    // Helper function to extract ZIP code and state from address
    const extractLocationFromAddress = (address) => {
      if (!address) return { zipCode: null, state: null };

      // Extract ZIP code (5 digits, optionally followed by -4 digits)
      const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
      const zipCode = zipMatch ? zipMatch[1] : null;

      // Extract state (2-letter state code, typically before ZIP)
      const stateMatch = address.match(/\b([A-Z]{2})\s+\d{5}/);
      const state = stateMatch ? stateMatch[1] : null;

      return { zipCode, state };
    };

    // 🔧 PRICE VALIDATION & CORRECTION FUNCTION
    const validateAndCorrectPrice = (rawPrice, propertyType, sqft, address) => {
      if (!rawPrice || rawPrice <= 0) return null;

      // Convert to number if string
      const price =
        typeof rawPrice === "string" ? parseFloat(rawPrice) : rawPrice;

      // Define reasonable price ranges by property type (for Nebraska market)
      const priceRanges = {
        Residential: { min: 50000, max: 5000000 },
        "Commercial Sale": { min: 100000, max: 50000000 },
        "Commercial Lease": { min: 100000, max: 50000000 },
        Land: { min: 10000, max: 100000000 }, // Land can vary widely
        "Residential Income": { min: 75000, max: 10000000 },
      };

      const range = priceRanges[propertyType] || priceRanges["Residential"];

      // Check for obvious data corruption patterns
      const priceStr = price.toString();

      // Pattern 1: Specific fix for 448950556 -> 448950 (remove last 3 digits)
      if (price === 448950556) {
        console.warn(
          `🔧 PRICE CORRECTION: ${address} - Fixed known corrupted price ${price} to 448950`
        );
        return 448950;
      }

      // Pattern 2: Price ends with repeated or suspicious digit patterns
      if (price > range.max && priceStr.length >= 8) {
        // Try removing the last 2-3 digits if they look like corruption
        for (let divisor of [100, 1000, 10000]) {
          const correctedPrice = Math.floor(price / divisor);
          if (correctedPrice >= range.min && correctedPrice <= range.max) {
            // Check if this looks like a reasonable price for the area
            if (sqft > 0) {
              const pricePerSqft = correctedPrice / sqft;
              if (pricePerSqft >= 100 && pricePerSqft <= 1000) {
                // Reasonable price per sqft
                console.warn(
                  `🔧 PRICE CORRECTION: ${address} - Changed ${price} to ${correctedPrice} (removed ${
                    price / correctedPrice
                  }x factor)`
                );
                return correctedPrice;
              }
            } else {
              console.warn(
                `🔧 PRICE CORRECTION: ${address} - Changed ${price} to ${correctedPrice} (removed ${
                  price / correctedPrice
                }x factor)`
              );
              return correctedPrice;
            }
          }
        }
      }

      // Pattern 3: Unrealistic price per square foot (>$2000/sqft is suspicious for residential)
      if (sqft > 0 && propertyType === "Residential") {
        const pricePerSqft = price / sqft;
        if (pricePerSqft > 2000) {
          // Try to find a reasonable price by dividing
          for (let divisor of [10, 100, 1000]) {
            const correctedPrice = Math.floor(price / divisor);
            const newPricePerSqft = correctedPrice / sqft;
            if (
              correctedPrice >= range.min &&
              correctedPrice <= range.max &&
              newPricePerSqft >= 100 &&
              newPricePerSqft <= 1000
            ) {
              console.warn(
                `🔧 PRICE CORRECTION: ${address} - Changed ${price} to ${correctedPrice} (unrealistic price per sqft: $${Math.round(
                  pricePerSqft
                )} -> $${Math.round(newPricePerSqft)})`
              );
              return correctedPrice;
            }
          }
        }
      }

      // Pattern 4: Price way outside reasonable range
      if (price > range.max) {
        console.warn(
          `⚠️ SUSPICIOUS PRICE: ${address} - ${propertyType} priced at $${price.toLocaleString()} (above max $${range.max.toLocaleString()})`
        );
        // Don't auto-correct if we can't identify pattern, but flag it
        return price; // Return original but logged as suspicious
      }

      if (price < range.min) {
        console.warn(
          `⚠️ SUSPICIOUS PRICE: ${address} - ${propertyType} priced at $${price.toLocaleString()} (below min $${range.min.toLocaleString()})`
        );
        return price; // Return original but logged as suspicious
      }

      return price; // Price seems reasonable
    }; // Process properties to add computed fields like imageUrl, distance_miles, etc.
    const processedProperties = (data.value || []).map((prop, index) => {
      // Calculate distance if coordinates are provided
      let distance_miles = null;
      if (
        prop.Latitude &&
        prop.Longitude &&
        req.query.latitude &&
        req.query.longitude
      ) {
        distance_miles = haversineMiles(
          parseFloat(req.query.latitude),
          parseFloat(req.query.longitude),
          parseFloat(prop.Latitude),
          parseFloat(prop.Longitude)
        );
      }

      // Extract ZIP code and state from address if not available as separate fields
      const { zipCode: extractedZip, state: extractedState } =
        extractLocationFromAddress(prop.UnparsedAddress);

      // Determine if property is active
      const isActive = prop.StandardStatus === "Active";

      // Extract square footage - use AboveGradeFinishedArea as primary
      const sqftValue = prop.AboveGradeFinishedArea || prop.LivingArea || 0;

      // 🔧 VALIDATE AND CORRECT PRICES BEFORE PROCESSING
      const validatedListPrice = validateAndCorrectPrice(
        prop.ListPrice,
        prop.PropertyType,
        sqftValue,
        prop.UnparsedAddress
      );

      const validatedClosePrice = validateAndCorrectPrice(
        prop.ClosePrice,
        prop.PropertyType,
        sqftValue,
        prop.UnparsedAddress
      );

      // Calculate price and price per sqft using validated prices
      const price = isActive ? validatedListPrice : validatedClosePrice;
      const totalSqft = sqftValue + (prop.BelowGradeFinishedArea || 0);
      const pricePerSqft =
        price && totalSqft ? Math.round(price / totalSqft) : 0;

      return {
        id: prop.ListingKey,
        address: prop.UnparsedAddress,
        city: prop.City,

        // ✅ CRITICAL MISSING FIELDS ADDED:
        zipCode: prop.PostalCode || extractedZip, // First try PostalCode field, then extract from address
        state: prop.StateOrProvince || extractedState, // First try StateOrProvince field, then extract from address
        description: prop.PublicRemarks || prop.PrivateRemarks || "", // Property description

        // 🔧 VALIDATED PRICES (corrected for data corruption)
        listPrice: validatedListPrice,
        soldPrice: validatedClosePrice,
        sqft: sqftValue,
        basementSqft: prop.BelowGradeFinishedArea || 0, // Ensure it's not null
        totalSqft: totalSqft > 0 ? totalSqft : sqftValue, // Ensure it's not 0 if we have sqft

        // ✅ BATHROOM FIELD (already existed but clarified):
        baths: prop.BathroomsTotalInteger || prop.BathroomsTotal || 0, // HIGH PRIORITY - bathroom count

        beds: prop.BedroomsTotal,
        garage: prop.GarageSpaces,
        yearBuilt: prop.YearBuilt,

        // ✅ NICE-TO-HAVE FIELDS ADDED:
        lotSizeSqft:
          prop.LotSizeSquareFeet || prop.LotSizeAcres
            ? prop.LotSizeAcres * 43560
            : null, // Convert acres to sqft if needed

        status: prop.StandardStatus,
        closeDate: prop.CloseDate,
        onMarketDate: prop.OnMarketDate,
        pricePerSqft,
        propertyType: prop.PropertyType,

        // ✅ IMPROVED CONDITION MAPPING:
        condition:
          Array.isArray(prop.PropertyCondition) &&
          prop.PropertyCondition.length > 0
            ? prop.PropertyCondition.join(", ") // Join multiple conditions
            : prop.PropertyCondition || "Average",

        // ✅ IMPROVED STYLE MAPPING:
        style:
          Array.isArray(prop.ArchitecturalStyle) &&
          prop.ArchitecturalStyle.length > 0
            ? prop.ArchitecturalStyle // Return array of styles instead of just first one
            : prop.ArchitecturalStyle
            ? [prop.ArchitecturalStyle]
            : [],

        subdivision: prop.SubdivisionName || "",

        // ✅ SCHOOL DISTRICT FIELDS RESTORED:
        schoolElementary: prop.ElementarySchool || "",
        schoolElementaryDistrict: prop.ElementarySchoolDistrict || "",
        schoolMiddle: prop.MiddleOrJuniorSchool || "",
        schoolMiddleDistrict:
          prop.MiddleOrJuniorSchoolDistrict || prop.MiddleSchoolDistrict || "",
        schoolHigh: prop.HighSchool || "",
        schoolHighDistrict: prop.HighSchoolDistrict || "",

        latitude: prop.Latitude,
        longitude: prop.Longitude,
        distance_miles,
        isActive,
        imageUrl:
          prop.Media && prop.Media.length > 0
            ? prop.Media[0].MediaURL
            : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==",
      };
    });

    res.json({
      success: true,
      count: processedProperties.length,
      totalAvailable: data["@odata.count"] || "unknown",
      properties: processedProperties,
      searchFilters: req.query,
      apiUrl: url.replace(paragonApiConfig.serverToken, "***"), // Hide token in response
    });
  } catch (error) {
    console.error("Error in /api/property-search-new:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic PropertyReference proxy - accepts OData-style params and forwards to Paragon
app.get("/api/property-reference", async (req, res) => {
  console.log("Received property-reference request:", req.query);

  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    // Allow client to override dataset; default to configured datasetId
    let dataset = req.query.dataset || paragonApiConfig.datasetId;
    // Basic validation: dataset should be alphanumeric-ish (keep simple)
    if (!/^[\w-]+$/.test(dataset)) dataset = paragonApiConfig.datasetId;

    // Build query string from allowed OData params. Ignore access_token if provided.
    const allowed = new Set([
      "$skip",
      "$select",
      "$unselect",
      "$top",
      "$orderby",
      "$filter",
      "$expand",
      "skip",
      "select",
      "unselect",
      "top",
      "orderby",
      "filter",
      "expand",
    ]);

    const parts = [];
    for (const [key, value] of Object.entries(req.query || {})) {
      if (!value) continue;
      if (key === "access_token" || key === "dataset") continue; // handled separately or ignored
      if (!allowed.has(key)) continue;
      // Normalize param name to include $ prefix
      const paramName = key.startsWith("$") ? key : `$${key}`;
      parts.push(
        `${encodeURIComponent(paramName)}=${encodeURIComponent(String(value))}`
      );
    }

    const qs = parts.join("&");
    const url = `${paragonApiConfig.apiUrl}/${dataset}/Properties${
      qs ? "?" + qs : ""
    }`;

    console.log("Forwarding to Paragon URL:", url);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Paragon property-reference error:", resp.status, txt);
      return res.status(resp.status).send(txt);
    }

    const data = await resp.json();
    // Return raw Paragon response so clients can inspect full schema
    res.json(data);
  } catch (err) {
    console.error("property-reference error:", err);
    res.status(500).json({
      message: "Failed to proxy property reference.",
      details: err.message,
    });
  }
});

// --------------------------------------------------------------
// NEW ADVANCED PROPERTY SEARCH (Phase 1) - /api/property-search-advanced
// --------------------------------------------------------------
const {
  parseParams: parseAdvancedParams,
} = require("./advancedSearchParamParser");

app.get("/api/property-search-advanced", async (req, res) => {
  const started = Date.now();
  try {
    const { applied, ignored } = parseAdvancedParams(req.query);

    // Build upstream coarse filter using only status + simple narrowing to avoid huge payloads.
    const upstreamFilters = [];
    if (applied.city)
      upstreamFilters.push(`tolower(City) eq '${applied.city.toLowerCase()}'`);
    if (applied.subdivision)
      upstreamFilters.push(
        `contains(tolower(SubdivisionName),'${applied.subdivision.toLowerCase()}')`
      );
    if (applied.property_type)
      upstreamFilters.push(`PropertyType eq '${applied.property_type}'`);
    if (applied.statuses && applied.statuses.length === 1) {
      upstreamFilters.push(
        `tolower(StandardStatus) eq '${applied.statuses[0].toLowerCase()}'`
      );
    }
    // For multi-status >1 we'll post-filter locally.

    const filterString = upstreamFilters.length
      ? `$filter=${encodeURIComponent(upstreamFilters.join(" and "))}`
      : "";
    const selectFields = [
      "ListingKey",
      "ListingId",
      "UnparsedAddress",
      "City",
      "StateOrProvince",
      "PostalCode",
      "StandardStatus",
      "MlsStatus",
      "SubdivisionName",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "LotSizeSquareFeet",
      "LotSizeAcres",
      "YearBuilt",
      "GarageSpaces",
      "ListPrice",
      "ClosePrice",
      "Latitude",
      "Longitude",
      "ModificationTimestamp",
      "OnMarketDate",
      "CloseDate",
      "PublicRemarks",
      "PropertyType",
      "PropertySubType",
      "ArchitecturalStyle",
      "Media",
      "WaterfrontYN",
      "NewConstructionYN",
    ].join(",");

    const odata = `${filterString}&$select=${selectFields}&$top=${applied.limit}`;
    const apiUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?access_token=${paragonApiConfig.serverToken}&${odata}`;

    const upstreamResp = await fetch(apiUrl);
    if (!upstreamResp.ok) {
      const txt = await upstreamResp.text();
      throw new Error(`Upstream error ${upstreamResp.status}: ${txt}`);
    }
    const upstreamJson = await upstreamResp.json();
    const rows = upstreamJson.value || [];

    // Enrichment + Derived fields
    const now = new Date();
    const currentYear = now.getFullYear();

    const enriched = rows.map((r) => {
      const living = r.AboveGradeFinishedArea || r.LivingArea || 0;
      const totalSqft = living + (r.BelowGradeFinishedArea || 0);
      const listPrice = r.ListPrice || 0;
      const pricePerSqft =
        totalSqft > 0 && listPrice > 0
          ? Math.round(listPrice / totalSqft)
          : null;
      const listingDate = r.OnMarketDate; // limited to selected fields
      let daysOnMarket = null;
      if (listingDate) {
        const d = new Date(listingDate);
        if (!isNaN(d.getTime())) {
          daysOnMarket = Math.floor((now - d) / 86400000);
        }
      }
      const status = (r.StandardStatus || r.MlsStatus || "").trim();
      const images = Array.isArray(r.Media)
        ? r.Media.map((m) => m.MediaURL).filter(Boolean)
        : [];
      const hasBasement = (r.BelowGradeFinishedArea || 0) > 0;
      const isWaterfront = !!r.WaterfrontYN; // Phase 1 simple flag; token logic later if needed
      const isNewConstruction =
        !!r.NewConstructionYN ||
        (r.YearBuilt && r.YearBuilt >= currentYear - 2);
      return {
        id: r.ListingKey || r.ListingId,
        mlsNumber: r.ListingId || "",
        address: r.UnparsedAddress || "",
        city: r.City || "",
        state: r.StateOrProvince || "",
        zipCode: r.PostalCode || "",
        subdivision: r.SubdivisionName || "",
        propertyType: r.PropertyType || "",
        propertySubType: r.PropertySubType || "",
        architecturalStyle: Array.isArray(r.ArchitecturalStyle)
          ? r.ArchitecturalStyle[0]
          : r.ArchitecturalStyle || "",
        listPrice,
        closePrice: r.ClosePrice || null,
        pricePerSqft,
        beds: r.BedroomsTotal || 0,
        baths: r.BathroomsTotalInteger || 0,
        livingArea: living,
        belowGradeFinishedArea: r.BelowGradeFinishedArea || 0,
        lotSquareFeet:
          r.LotSizeSquareFeet ||
          (r.LotSizeAcres ? Math.round(r.LotSizeAcres * 43560) : null),
        garageSpaces: r.GarageSpaces || 0,
        yearBuilt: r.YearBuilt || null,
        daysOnMarket: daysOnMarket || 0,
        listingContractDate: listingDate || null,
        modificationTimestamp: r.ModificationTimestamp || null,
        status,
        images,
        image: images[0] || null,
        hasBasement,
        isWaterfront,
        isNewConstruction,
        latitude: r.Latitude || null,
        longitude: r.Longitude || null,
      };
    });

    // Post-filters (local)
    let filtered = enriched;
    if (applied.statuses && applied.statuses.length > 1) {
      const set = new Set(applied.statuses);
      filtered = filtered.filter((p) => set.has(p.status));
    }
    if (applied.min_sqft !== undefined)
      filtered = filtered.filter((p) => p.livingArea >= applied.min_sqft);
    if (applied.max_sqft !== undefined)
      filtered = filtered.filter((p) => p.livingArea <= applied.max_sqft);
    if (applied.min_year_built !== undefined)
      filtered = filtered.filter(
        (p) => p.yearBuilt && p.yearBuilt >= applied.min_year_built
      );
    if (applied.max_year_built !== undefined)
      filtered = filtered.filter(
        (p) => p.yearBuilt && p.yearBuilt <= applied.max_year_built
      );
    if (applied.min_garage !== undefined)
      filtered = filtered.filter((p) => p.garageSpaces >= applied.min_garage);
    if (applied.waterfront === true)
      filtered = filtered.filter((p) => p.isWaterfront);
    if (applied.new_construction === true)
      filtered = filtered.filter((p) => p.isNewConstruction);
    if (applied.photo_only === true)
      filtered = filtered.filter((p) => p.images && p.images.length > 0);

    // Sorting
    filtered.sort((a, b) => {
      const field = applied.sort_by;
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return 0;
      return applied.sort_order === "asc"
        ? av > bv
          ? 1
          : -1
        : av < bv
        ? 1
        : -1;
    });

    // Limit (already upstream-limited, but after post-filter must slice)
    filtered = filtered.slice(0, applied.limit);

    const timingMs = Date.now() - started;
    res.json({
      success: true,
      count: filtered.length,
      properties: filtered,
      meta: {
        appliedFilters: applied,
        ignoredParams: ignored,
        sort: { by: applied.sort_by, order: applied.sort_order },
        timingMs,
        source: "live",
      },
    });
  } catch (err) {
    console.error("[ADVANCED-SEARCH] error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Property details from address endpoint
app.post("/api/property-details-from-address", async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Missing address" });

  try {
    // Clean up the address for better matching
    const cleanAddress = address.trim().toLowerCase().replace(/[,]/g, "");
    console.log(
      `Searching for property: "${address}" (cleaned: "${cleanAddress}")`
    );

    // 1. Search for property by address with more comprehensive filters
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?access_token=${paragonApiConfig.serverToken}&$filter=contains(tolower(UnparsedAddress),'${cleanAddress}')&$select=ListingKey,UnparsedAddress,City,StandardStatus,Media,PropertyType&$top=10`;

    console.log("Search URL:", searchUrl);
    const searchResp = await fetch(searchUrl);

    if (!searchResp.ok) {
      console.error(
        "Paragon search error:",
        searchResp.status,
        await searchResp.text()
      );
      return res
        .status(searchResp.status)
        .json({ error: "Failed to search properties" });
    }

    const searchData = await searchResp.json();
    const results = searchData.value;
    console.log(`Found ${results?.length || 0} potential matches`);

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No property found for address" });
    }

    // 2. Find the best match - prefer exact matches first
    let bestMatch = results[0]; // default to first result

    for (const result of results) {
      if (result.UnparsedAddress) {
        const resultAddress = result.UnparsedAddress.toLowerCase();
        console.log(`Checking match: ${result.UnparsedAddress}`);

        // Prefer exact matches without unit numbers
        if (
          resultAddress === `${cleanAddress}, gretna ne 68028` ||
          resultAddress === `${cleanAddress} gretna ne 68028` ||
          resultAddress === cleanAddress
        ) {
          bestMatch = result;
          console.log(`Found exact match: ${result.UnparsedAddress}`);
          break;
        }

        // Fallback to addresses that contain the search term but prefer without unit numbers
        if (
          resultAddress.includes(cleanAddress) &&
          !resultAddress.includes("#")
        ) {
          bestMatch = result;
          console.log(
            `Found good match without unit: ${result.UnparsedAddress}`
          );
        }
      }
    }

    console.log(
      `Best match: ${bestMatch.UnparsedAddress} (${bestMatch.ListingKey})`
    );

    // 3. Fetch full property details using all available fields
    const detailsUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property('${bestMatch.ListingKey}')?access_token=${paragonApiConfig.serverToken}`;
    console.log("Details URL:", detailsUrl);

    const detailsResp = await fetch(detailsUrl);

    if (!detailsResp.ok) {
      console.error(
        "Paragon details error:",
        detailsResp.status,
        await detailsResp.text()
      );
      return res
        .status(detailsResp.status)
        .json({ error: "Failed to fetch property details" });
    }

    const details = await detailsResp.json();
    console.log("Retrieved property details for:", details.UnparsedAddress);
    console.log("Living Area (LivingArea):", details.LivingArea);
    console.log(
      "Living Area (AboveGradeFinishedArea):",
      details.AboveGradeFinishedArea
    );
    console.log("Subdivision:", details.SubdivisionName);
    console.log("Style:", details.ArchitecturalStyle);
    console.log("School Fields:");
    console.log("- ElementarySchool:", details.ElementarySchool);
    console.log(
      "- ElementarySchoolDistrict:",
      details.ElementarySchoolDistrict
    );
    console.log("- HighSchool:", details.HighSchool);
    console.log("- HighSchoolDistrict:", details.HighSchoolDistrict);

    // Map the square footage fields correctly
    const mappedDetails = {
      ...details,
      // Override the square footage fields with correct mapping
      sqft: details.AboveGradeFinishedArea || 0, // Above-grade only
      basementSqft: details.BelowGradeFinishedArea || 0,
      totalSqft:
        details.BuildingAreaTotal ||
        (details.AboveGradeFinishedArea || 0) +
          (details.BelowGradeFinishedArea || 0),

      // Map school fields to expected frontend names
      schoolElementary: details.ElementarySchool || "",
      schoolElementaryDistrict: details.ElementarySchoolDistrict || "",
      schoolMiddle: details.MiddleOrJuniorSchool || "",
      schoolMiddleDistrict:
        details.MiddleOrJuniorSchoolDistrict ||
        details.MiddleSchoolDistrict ||
        "",
      schoolHigh: details.HighSchool || "",
      schoolHighDistrict: details.HighSchoolDistrict || "",

      // Additional property mappings for frontend compatibility
      city: details.City || "",
      zipCode: details.PostalCode || "",
      state: details.StateOrProvince || "",
      beds: details.BedroomsTotal || 0,
      baths: details.BathroomsTotalInteger || 0,
      yearBuilt: details.YearBuilt || 0,
      garage: details.GarageSpaces || 0,
      listPrice: details.ListPrice || 0,
      propertyType: details.PropertyType || "",
      subdivision: details.SubdivisionName || "",
      condition: Array.isArray(details.PropertyCondition)
        ? details.PropertyCondition[0]
        : "",
      style: details.ArchitecturalStyle || [],
    };

    console.log("Mapped square footage:");
    console.log("- Above-grade (sqft):", mappedDetails.sqft);
    console.log("- Basement (basementSqft):", mappedDetails.basementSqft);
    console.log("- Total (totalSqft):", mappedDetails.totalSqft);

    return res.json(mappedDetails);
  } catch (err) {
    console.error("Error fetching property details:", err.message);
    return res.status(500).json({ error: "Failed to fetch property details" });
  }
});

// Get total property count to understand data availability
app.get("/api/property-count", async (req, res) => {
  console.log("Getting property count...");

  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    const { status = "Active" } = req.query;

    // Get count for different property statuses
    const statuses = ["Active", "Closed", "Pending", "Expired", "Withdrawn"];
    const counts = {};

    for (const currentStatus of statuses) {
      try {
        const countUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?$filter=StandardStatus eq '${currentStatus}'&$count=true&$top=0`;

        const response = await fetch(countUrl, {
          headers: {
            Authorization: `Bearer ${paragonApiConfig.serverToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          counts[currentStatus] = data["@odata.count"] || 0;
        } else {
          counts[currentStatus] = "unknown";
        }
      } catch (error) {
        counts[currentStatus] = "error";
      }
    }

    // Also get total without status filter
    try {
      const totalUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?$count=true&$top=0`;
      const totalResponse = await fetch(totalUrl, {
        headers: {
          Authorization: `Bearer ${paragonApiConfig.serverToken}`,
          "Content-Type": "application/json",
        },
      });

      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        counts.total = totalData["@odata.count"] || 0;
      } else {
        counts.total = "unknown";
      }
    } catch (error) {
      counts.total = "error";
    }

    res.json({
      message: "Property counts by status",
      counts,
      note: "These are the actual counts available in your Paragon dataset",
      recommendation:
        counts.total > 150
          ? "Use pagination (limit/offset) to access all properties"
          : "You have access to all available properties",
    });
  } catch (error) {
    console.error("Property count error:", error);
    res.status(500).json({
      message: "Failed to get property counts",
      details: error.message,
    });
  }
});

// MLS Fields Discovery - Check available fields in actual data
app.get("/api/mls-fields", async (req, res) => {
  console.log("Checking available MLS fields...");

  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    // Get a small sample to analyze available fields
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?$top=5`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fields discovery failed (${response.status})`);
    }

    const data = await response.json();
    const properties = data.value || [];

    if (properties.length === 0) {
      return res.json({
        message: "No properties available to analyze fields",
        availableFields: [],
      });
    }

    // Analyze first property to get all available fields
    const sampleProperty = properties[0];
    const allFields = Object.keys(sampleProperty).sort();

    // Categorize fields for easier understanding
    const fieldCategories = {
      identification: allFields.filter((field) =>
        /^(ListingKey|PropertyId|ListingId|MlsStatus|StandardStatus)/i.test(
          field
        )
      ),
      location: allFields.filter((field) =>
        /^(Address|City|State|Province|Postal|County|Latitude|Longitude|Coordinates)/i.test(
          field
        )
      ),
      physical: allFields.filter((field) =>
        /^(LivingArea|Bedrooms|Bathrooms|Stories|YearBuilt|LotSize|PropertyType|PropertySubType)/i.test(
          field
        )
      ),
      pricing: allFields.filter((field) =>
        /^(ListPrice|ClosePrice|Original|Tax|Assessment|Association)/i.test(
          field
        )
      ),
      features: allFields.filter((field) =>
        /^(Pool|Fireplace|Garage|Parking|Basement|Heating|Cooling|Appliances)/i.test(
          field
        )
      ),
      listing: allFields.filter((field) =>
        /^(DaysOnMarket|OnMarket|Close|Contract|Agent|Office|Remarks)/i.test(
          field
        )
      ),
      media: allFields.filter((field) =>
        /^(Media|Photo|Virtual|Image)/i.test(field)
      ),
      other: allFields.filter(
        (field) =>
          !/(ListingKey|PropertyId|ListingId|MlsStatus|StandardStatus|Address|City|State|Province|Postal|County|Latitude|Longitude|Coordinates|LivingArea|Bedrooms|Bathrooms|Stories|YearBuilt|LotSize|PropertyType|PropertySubType|ListPrice|ClosePrice|Original|Tax|Assessment|Association|Pool|Fireplace|Garage|Parking|Basement|Heating|Cooling|Appliances|DaysOnMarket|OnMarket|Close|Contract|Agent|Office|Remarks|Media|Photo|Virtual|Image)/i.test(
            field
          )
      ),
    };

    // Sample values for key fields
    const fieldSamples = {};
    const importantFields = [
      "PropertyType",
      "PropertySubType",
      "StandardStatus",
      "Heating",
      "Cooling",
      "Basement",
      "PoolPrivateYN",
      "FireplacesTotal",
      "GarageSpaces",
      "Appliances",
      "Flooring",
      "BuildingFeatures",
      "InteriorFeatures",
      "ExteriorFeatures",
      "ArchitecturalStyle",
    ];

    importantFields.forEach((field) => {
      if (sampleProperty[field] !== undefined) {
        fieldSamples[field] = sampleProperty[field];
      }
    });

    res.json({
      message: `Analyzed ${properties.length} properties`,
      totalFields: allFields.length,
      fieldCategories,
      allFields,
      fieldSamples,
      sampleProperty: properties[0], // Full sample for reference
    });
  } catch (error) {
    console.error("MLS Fields Discovery Error:", error);
    res.status(500).json({
      message: "Failed to discover MLS fields",
      details: error.message,
    });
  }
});

// Advanced Property Search with comprehensive filtering
app.get("/api/advanced-search", async (req, res) => {
  console.log("Advanced search request:", req.query);

  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    const {
      // Location filters
      city,
      state,
      zipCode,

      // Property type filters
      propertyType, // Any Type, Residential, Condo, Townhouse, etc.

      // Price range
      minPrice,
      maxPrice,

      // Size filters
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minSqft,
      maxSqft,

      // Lot size
      minLotSize,
      maxLotSize,

      // Age filters
      minYearBuilt,
      maxYearBuilt,

      // Features (boolean filters)
      hasPool,
      hasFireplace,
      hasGarage,
      hasUpdatedKitchen,
      hasHardwoodFloors,
      hasBasement,
      hasDeckPatio,
      hasWalkInCloset,
      hasMasterSuite,
      isNewConstruction,

      // Sorting
      sortBy, // newest, price_low, price_high, sqft_low, sqft_high, dom_low, dom_high

      // Status filter
      status, // Active, Closed, Pending, etc.

      // Pagination
      limit = 50,
      offset = 0,
    } = req.query;

    // Build OData filter array
    const filters = [];

    // Location filters
    if (city) filters.push(`City eq '${city}'`);
    if (state) filters.push(`StateOrProvince eq '${state}'`);
    if (zipCode) filters.push(`PostalCode eq '${zipCode}'`);

    // Property type
    if (propertyType && propertyType !== "Any Type") {
      filters.push(`PropertyType eq '${propertyType}'`);
    }

    // Price range
    if (minPrice) filters.push(`ListPrice ge ${minPrice}`);
    if (maxPrice) filters.push(`ListPrice le ${maxPrice}`);

    // Size filters
    if (minBedrooms) filters.push(`BedroomsTotal ge ${minBedrooms}`);
    if (maxBedrooms) filters.push(`BedroomsTotal le ${maxBedrooms}`);
    if (minBathrooms) filters.push(`BathroomsTotal ge ${minBathrooms}`);
    if (maxBathrooms) filters.push(`BathroomsTotal le ${maxBathrooms}`);
    if (minSqft) filters.push(`LivingArea ge ${minSqft}`);
    if (maxSqft) filters.push(`LivingArea le ${maxSqft}`);

    // Lot size filters
    if (minLotSize) filters.push(`LotSizeSquareFeet ge ${minLotSize}`);
    if (maxLotSize) filters.push(`LotSizeSquareFeet le ${maxLotSize}`);

    // Year built filters
    if (minYearBuilt) filters.push(`YearBuilt ge ${minYearBuilt}`);
    if (maxYearBuilt) filters.push(`YearBuilt le ${maxYearBuilt}`);

    // Feature filters
    if (hasPool === "true") filters.push(`PoolPrivateYN eq true`);
    if (hasFireplace === "true") filters.push(`FireplacesTotal gt 0`);
    if (hasGarage === "true") filters.push(`GarageSpaces gt 0`);
    if (hasBasement === "true")
      filters.push(`(Basement ne null and Basement ne '')`);
    if (isNewConstruction === "true") filters.push(`NewConstructionYN eq true`);

    // Feature filters using contains (for text fields)
    if (hasUpdatedKitchen === "true") {
      filters.push(
        `(contains(tolower(InteriorFeatures),'updated kitchen') or contains(tolower(InteriorFeatures),'remodeled kitchen') or contains(tolower(InteriorFeatures),'renovated kitchen'))`
      );
    }
    if (hasHardwoodFloors === "true") {
      filters.push(
        `(contains(tolower(Flooring),'hardwood') or contains(tolower(Flooring),'wood floor'))`
      );
    }
    if (hasDeckPatio === "true") {
      filters.push(
        `(contains(tolower(ExteriorFeatures),'deck') or contains(tolower(ExteriorFeatures),'patio'))`
      );
    }
    if (hasWalkInCloset === "true") {
      filters.push(`contains(tolower(InteriorFeatures),'walk-in closet')`);
    }
    if (hasMasterSuite === "true") {
      filters.push(
        `(contains(tolower(InteriorFeatures),'master suite') or contains(tolower(InteriorFeatures),'primary suite'))`
      );
    }

    // Status filter
    if (status && status !== "Any Status") {
      filters.push(`StandardStatus eq '${status}'`);
    } else {
      // Default to active listings if no status specified
      filters.push(`StandardStatus eq 'Active'`);
    }

    // Build sorting
    let orderBy = "";
    switch (sortBy) {
      case "price_low":
        orderBy = "$orderby=ListPrice asc";
        break;
      case "price_high":
        orderBy = "$orderby=ListPrice desc";
        break;
      case "sqft_low":
        orderBy = "$orderby=LivingArea asc";
        break;
      case "sqft_high":
        orderBy = "$orderby=LivingArea desc";
        break;
      case "dom_low":
        orderBy = "$orderby=DaysOnMarket asc";
        break;
      case "dom_high":
        orderBy = "$orderby=DaysOnMarket desc";
        break;
      case "newest":
      default:
        orderBy = "$orderby=OnMarketDate desc";
        break;
    }

    // Construct final URL
    const filterString =
      filters.length > 0 ? `$filter=${filters.join(" and ")}` : "";
    const topSkip = `$top=${limit}&$skip=${offset}`;

    const queryParts = [filterString, orderBy, topSkip].filter((part) => part);
    const searchUrl = `${paragonApiConfig.apiUrl}/${
      paragonApiConfig.datasetId
    }/Property?${queryParts.join("&")}`;

    console.log("Advanced search URL:", searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Advanced search error:", errorText);
      throw new Error(`Advanced search failed (${response.status})`);
    }

    const data = await response.json();
    const properties = data.value || [];

    console.log(`Advanced search found ${properties.length} properties`);

    // Format results using the same comprehensive mapping
    const formattedProperties = properties.map((record) => ({
      id: record.ListingKey || record.PropertyId || record.id,
      address:
        record.UnparsedAddress ||
        record.Address ||
        `${record.StreetNumber} ${record.StreetName}`,
      city: record.City,
      state: record.StateOrProvince,
      zipCode: record.PostalCode,
      status: record.StandardStatus,

      // Pricing
      listPrice: Number(record.ListPrice || 0),
      originalListPrice: Number(record.OriginalListPrice || 0),
      soldPrice: Number(record.ClosePrice || 0),
      pricePerSqft:
        record.ListPrice && record.LivingArea && record.LivingArea > 0
          ? Math.round(record.ListPrice / record.LivingArea)
          : 0,

      // Physical characteristics
      sqft: Number(record.LivingArea || record.AboveGradeFinishedArea || 0),
      beds: Number(record.BedroomsTotal || 0),
      baths: Number(record.BathroomsTotalDecimal || record.BathroomsTotal || 0),
      bathsFull: Number(record.BathroomsFull || 0),
      bathsHalf: Number(record.BathroomsHalf || 0),
      garage: Number(
        record.GarageSpaces || record.ParkingTotal || record.CoveredSpaces || 0
      ),
      yearBuilt: Number(record.YearBuilt || 0),
      stories: Number(record.StoriesTotal || 0),

      // Property details
      propertyType: record.PropertyType || "",
      propertySubType: record.PropertySubType || "",
      lotSizeAcres: Number(record.LotSizeAcres || 0),
      lotSizeSquareFeet: Number(record.LotSizeSquareFeet || 0),

      // Features
      fireplace: Number(record.FireplacesTotal || 0),
      pool: record.PoolPrivateYN || false,
      basement: record.Basement || "",
      heating: record.Heating || "",
      cooling: record.Cooling || "",
      appliances: record.Appliances || "",
      flooring: record.Flooring || "",
      newConstruction: record.NewConstructionYN || false,

      // Feature flags for UI
      features: {
        hasPool: record.PoolPrivateYN || false,
        hasFireplace: (record.FireplacesTotal || 0) > 0,
        hasGarage:
          (record.GarageSpaces ||
            record.ParkingTotal ||
            record.CoveredSpaces ||
            0) > 0,
        hasBasement: !!(
          record.Basement &&
          typeof record.Basement === "string" &&
          record.Basement.trim()
        ),
        hasUpdatedKitchen: record.InteriorFeatures
          ? /updated kitchen|remodeled kitchen|renovated kitchen/i.test(
              record.InteriorFeatures
            )
          : false,
        hasHardwoodFloors: record.Flooring
          ? /hardwood|wood floor/i.test(record.Flooring)
          : false,
        hasDeckPatio: record.ExteriorFeatures
          ? /deck|patio/i.test(record.ExteriorFeatures)
          : false,
        hasWalkInCloset: record.InteriorFeatures
          ? /walk-in closet/i.test(record.InteriorFeatures)
          : false,
        hasMasterSuite: record.InteriorFeatures
          ? /master suite|primary suite/i.test(record.InteriorFeatures)
          : false,
        isNewConstruction: record.NewConstructionYN || false,
      },

      // Listing info
      daysOnMarket: Number(
        record.DaysOnMarket || record.CumulativeDaysOnMarket || 0
      ),
      onMarketDate: record.OnMarketDate || "",
      mlsNumber: record.ListingId || "",

      // Media
      imageUrl:
        record.Media && record.Media.length > 0
          ? record.Media[0].MediaURL
          : record.Photos && record.Photos.length > 0
          ? record.Photos[0].url
          : `https://placehold.co/600x400/d1d5db/374151?text=No+Image`,
      images: record.Media ? record.Media.map((m) => m.MediaURL) : [],

      // Location
      latitude: Number(record.Latitude || 0),
      longitude: Number(record.Longitude || 0),

      // Additional info
      publicRemarks: record.PublicRemarks || "",
      buildingFeatures: record.BuildingFeatures || "",
      exteriorFeatures: record.ExteriorFeatures || "",
      interiorFeatures: record.InteriorFeatures || "",

      // Schools
      schoolElementary: record.ElementarySchool || "",
      schoolElementaryDistrict: record.ElementarySchoolDistrict || "",
      schoolMiddle: record.MiddleOrJuniorSchool || "",
      schoolMiddleDistrict:
        record.MiddleSchoolDistrict ||
        record.MiddleOrJuniorSchoolDistrict ||
        "",
      schoolHigh: record.HighSchool || "",
      schoolHighDistrict: record.HighSchoolDistrict || "",

      // Property Details Extended
      fencing: record.Fencing || "",
      flooring: record.Flooring || [],
      foundationDetails: record.FoundationDetails || "",
      frontageType: record.FrontageType || "",

      // Fireplace
      fireplaceFeatures: record.FireplaceFeatures || "",
      fireplacesTotal: Number(record.FireplacesTotal || 0),
      fireplaceYN: record.FireplaceYN || false,

      // Utilities & Systems
      heating: record.Heating || "",
      heatingYN: record.HeatingYN || false,
      gas: record.Gas || "",

      // Garage & Parking
      garageSpaces: Number(record.GarageSpaces || 0),
      garageYN: record.GarageYN || false,

      // Interior Features Extended
      interiorFeaturesDetailed: record.InteriorFeatures || [],
      laundryFeatures: record.LaundryFeatures || [],

      // Green Building & Warranties
      greenBuildingVerificationType: record.GreenBuildingVerificationType || "",
      homeWarrantyYN: record.HomeWarrantyYN || null,

      // Property Flags
      habitableResidenceYN: record.HabitableResidenceYN || null,
      horseYN: record.HorseYN || null,
      landLeaseYN: record.LandLeaseYN || null,

      // MLS Display Settings
      idxParticipationYN: record.IDXParticipationYN || false,
      internetAddressDisplayYN: record.InternetAddressDisplayYN || false,
      internetAutomatedValuationDisplayYN:
        record.InternetAutomatedValuationDisplayYN || false,
      internetConsumerCommentYN: record.InternetConsumerCommentYN || false,
      internetEntireListingDisplayYN:
        record.InternetEntireListingDisplayYN || false,

      // Expenses
      insuranceExpense: record.InsuranceExpense || null,
      electricExpense: record.ElectricExpense || null,

      // Tier 1 - Critical Property Details
      propertySubType: record.PropertySubType || "",
      lotSizeAcres: Number(record.LotSizeAcres || 0),
      lotSizeSquareFeet: record.LotSizeSquareFeet || null,
      newConstructionYN: record.NewConstructionYN || false,

      // Tier 2 - High Value Details
      architecturalStyle: record.ArchitecturalStyle || [],
      basement: record.Basement || "",
      basementYN: record.BasementYN || false,
      cooling: record.Cooling || "",
      coolingYN: record.CoolingYN || false,
      appliances: record.Appliances || [],
      utilities: record.Utilities || [],

      // Financial Details
      associationFee: Number(record.AssociationFee || 0),
      associationFeeFrequency: record.AssociationFeeFrequency || "",
      taxAnnualAmount: Number(record.TaxAnnualAmount || 0),
      taxYear: record.TaxYear || null,

      // Builder & Construction
      builderName: record.BuilderName || "",
      constructionMaterials: record.ConstructionMaterials || [],
      roof: record.Roof || "",

      // Lot Details
      lotFeatures: record.LotFeatures || [],
      lotSizeDimensions: record.LotSizeDimensions || "",
    }));

    res.json({
      properties: formattedProperties,
      totalResults: formattedProperties.length,
      searchCriteria: {
        filters: filters,
        sorting: sortBy || "newest",
        limit: Number(limit),
        offset: Number(offset),
      },
      query: req.query,
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({
      message: "Advanced search failed",
      details: error.message,
    });
  }
});

// Gemini endpoint
app.post("/api/generate-text", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt is required." });
  if (!GEMINI_API_KEY)
    return res.status(500).json({ message: "Gemini API key not configured." });

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      return res
        .status(response.status)
        .json({ message: "Error from Gemini API.", details: err });
    }
    const result = await response.json();
    const generatedText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No content generated.";
    res.json({ text: generatedText });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// --- NEW ENDPOINT: Future Properties ---
app.get("/api/future-properties", async (req, res) => {
  try {
    const {
      city = "omaha",
      min_price = "700000", // Higher minimum price for future properties
      max_price,
      property_type = "Residential",
      min_sqft,
      max_sqft,
      beds,
      baths,
      limit = "50",
      sort_by = "price",
    } = req.query;

    console.log(`[FUTURE PROPERTIES] Query parameters:`, req.query);

    // Build filters for future properties
    const baseFilters = [];

    // City filter
    if (city) {
      baseFilters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }

    // Price filters - focusing on higher-end properties
    if (min_price) {
      baseFilters.push(`ListPrice ge ${min_price}`);
    }
    if (max_price) {
      baseFilters.push(`ListPrice le ${max_price}`);
    }

    // Property type filter
    if (property_type && property_type !== "All") {
      baseFilters.push(`PropertyType eq '${property_type}'`);
    }

    // Square footage filters
    if (min_sqft) {
      baseFilters.push(`LivingArea ge ${min_sqft}`);
    }
    if (max_sqft) {
      baseFilters.push(`LivingArea le ${max_sqft}`);
    }

    // Bedroom filter
    if (beds) {
      baseFilters.push(`BedroomsTotal ge ${beds}`);
    }

    // Bathroom filter
    if (baths) {
      baseFilters.push(`BathroomsTotalInteger ge ${baths}`);
    }

    // Zip code filter
    if (req.query.zip_code) {
      baseFilters.push(`PostalCode eq '${req.query.zip_code}'`);
    }

    // Future property conditions - targeting new construction, under construction, or pre-construction
    const futureConditions = [
      `PropertyCondition eq 'Under Construction'`,
      `PropertyCondition eq 'New Construction'`,
      `PropertyCondition eq 'Pre-Construction'`,
      `NewConstructionYN eq true`,
      `PropertyCondition eq 'To Be Built'`,
    ];

    // Add future property filter (at least one condition must match)
    baseFilters.push(`(${futureConditions.join(" or ")})`);

    // Only active listings for future properties
    baseFilters.push(`StandardStatus eq 'Active'`);

    // Build the query
    const filterString = baseFilters.join(" and ");

    // Set up sorting
    let orderBy = "ListPrice asc";
    if (sort_by === "price_desc") {
      orderBy = "ListPrice desc";
    } else if (sort_by === "sqft") {
      orderBy = "LivingArea desc";
    } else if (sort_by === "beds") {
      orderBy = "BedroomsTotal desc";
    } else if (sort_by === "newest") {
      orderBy = "OnMarketDate desc";
    }

    // Select fields
    const selectFields = [
      "UnparsedAddress",
      "City",
      "ListPrice",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "GarageSpaces",
      "YearBuilt",
      "StandardStatus",
      "OnMarketDate",
      "Media",
      "ListingKey",
      "PropertyType",
      "PropertyCondition",
      "ArchitecturalStyle",
      "SubdivisionName",
      "Coordinates",
      "Latitude",
      "Longitude",
      "NewConstructionYN",
      "PostalCode",
      "StateOrProvince",
    ].join(",");

    // Build API URL
    const apiUrl = `${paragonApiConfig.apiUrl}/${
      paragonApiConfig.datasetId
    }/Properties?access_token=${
      paragonApiConfig.serverToken
    }&$filter=${encodeURIComponent(
      filterString
    )}&$select=${selectFields}&$orderby=${orderBy}&$top=${limit}`;

    console.log(`[FUTURE PROPERTIES] API URL: ${apiUrl}`);

    // Make API request
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(
        `[FUTURE PROPERTIES] API Error: ${response.status} ${response.statusText}`
      );
      return res.status(response.status).json({
        success: false,
        message: `Paragon API error: ${response.status} ${response.statusText}`,
        query: req.query,
      });
    }

    const data = await response.json();
    const properties = data.value || [];

    console.log(
      `[FUTURE PROPERTIES] Found ${properties.length} future properties`
    );

    // Transform properties
    const transformedProperties = properties.map((property) => {
      const media =
        Array.isArray(property.Media) && property.Media.length > 0
          ? property.Media[0]
          : null;

      const imageUrl =
        media && media.MediaURL
          ? media.MediaURL
          : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==";

      return {
        id: property.ListingKey,
        address: property.UnparsedAddress || "",
        city: property.City || "",
        listPrice: property.ListPrice || 0,
        sqft: property.LivingArea || 0,
        basementSqft: property.BelowGradeFinishedArea || 0,
        totalSqft:
          (property.LivingArea || 0) + (property.BelowGradeFinishedArea || 0),
        beds: property.BedroomsTotal || 0,
        baths: property.BathroomsTotalInteger || 0,
        garage: property.GarageSpaces || 0,
        yearBuilt: property.YearBuilt || null,
        status: property.StandardStatus || "",
        onMarketDate: property.OnMarketDate || null,
        pricePerSqft:
          property.LivingArea > 0
            ? Math.round(property.ListPrice / property.LivingArea)
            : 0,
        propertyType: property.PropertyType || "",
        condition: property.PropertyCondition || "",
        style: property.ArchitecturalStyle || "",
        subdivision: property.SubdivisionName || "",
        latitude: property.Latitude || null,
        longitude: property.Longitude || null,
        newConstruction: property.NewConstructionYN || false,
        imageUrl: imageUrl,
        isFuture: true,
        futureIndicators: {
          isUnderConstruction: (property.PropertyCondition || "").includes(
            "Under Construction"
          ),
          isNewConstruction: property.NewConstructionYN === true,
          isPreConstruction: (property.PropertyCondition || "").includes(
            "Pre-Construction"
          ),
          isToBeBulit: (property.PropertyCondition || "").includes(
            "To Be Built"
          ),
        },
      };
    });

    // Calculate price statistics
    const prices = transformedProperties
      .map((p) => p.listPrice)
      .filter((p) => p > 0);
    const priceStats =
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
          }
        : { min: 0, max: 0, avg: 0, median: 0 };

    // Group by condition for analysis
    const byCondition = transformedProperties.reduce((acc, prop) => {
      const condition = prop.condition || "Unknown";
      if (!acc[condition]) acc[condition] = [];
      acc[condition].push(prop);
      return acc;
    }, {});

    res.json({
      success: true,
      query: req.query,
      count: transformedProperties.length,
      priceStats,
      byCondition: Object.keys(byCondition).map((condition) => ({
        condition,
        count: byCondition[condition].length,
        avgPrice: Math.round(
          byCondition[condition].reduce((sum, p) => sum + p.listPrice, 0) /
            byCondition[condition].length
        ),
      })),
      properties: transformedProperties,
      meta: {
        apiUrl: apiUrl.substring(0, 200) + "...", // Truncated for readability
        searchCriteria: {
          city,
          min_price,
          max_price,
          property_type,
          min_sqft,
          max_sqft,
          beds,
          baths,
          limit,
          sort_by,
          focus: "Future/Upcoming Properties with Higher Prices",
        },
      },
    });
  } catch (error) {
    console.error("[FUTURE PROPERTIES] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Haversine formula to calculate distance between two coordinates in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Agent suggestions endpoint for autocomplete
app.get("/api/agents/suggestions", async (req, res) => {
  const { q, type = "listing", limit = 20 } = req.query;

  try {
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
        message: "Query must be at least 2 characters",
      });
    }

    // Determine which agent field to search
    const agentField =
      type === "buyer" ? "BuyerAgentFullName" : "ListAgentFullName";
    const agentMlsField =
      type === "buyer" ? "BuyerAgentMlsId" : "ListAgentMlsId";
    const agentPhoneField =
      type === "buyer" ? "BuyerAgentPreferredPhone" : "ListAgentPreferredPhone";

    // Build query to get distinct agents matching the search term
    const baseUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties`;
    const accessToken = `access_token=${paragonApiConfig.serverToken}`;

    const filter = `contains(tolower(${agentField}),'${q.toLowerCase()}')`;
    const select = `${agentField},${agentMlsField},${agentPhoneField}`;

    const apiUrl = `${baseUrl}?${accessToken}&$filter=${encodeURIComponent(
      filter
    )}&$select=${encodeURIComponent(select)}&$top=${limit * 3}`;

    console.log(
      `Agent suggestions query for "${q}":`,
      apiUrl.replace(paragonApiConfig.serverToken, "***")
    );

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Paragon API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const properties = data.value || [];

    // Extract unique agents
    const agentMap = new Map();

    properties.forEach((property) => {
      const name = property[agentField];
      const mlsId = property[agentMlsField];
      const phone = property[agentPhoneField];

      if (name && name.trim()) {
        const key = `${name.trim().toLowerCase()}_${mlsId || ""}`;
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            name: name.trim(),
            mlsId: mlsId || "",
            phone: phone || "",
            type: type,
          });
        }
      }
    });

    // Convert to array and limit results
    const suggestions = Array.from(agentMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);

    res.json({
      success: true,
      count: suggestions.length,
      suggestions,
      query: q,
      type,
    });
  } catch (error) {
    console.error("Error fetching agent suggestions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      query: q,
      type,
    });
  }
});

// Team properties endpoint - get properties for multiple team members
app.get("/api/team-properties", async (req, res) => {
  const {
    agent_ids, // Comma-separated list of agent MLS IDs: "969503,480248,960735"
    agent_names, // Alternative: comma-separated agent names
    city,
    status = "Active", // Default to active listings
    limit = 50,
    sort_by = "agent_priority", // agent_priority, price, date, sqft
  } = req.query;

  try {
    if (!agent_ids && !agent_names) {
      return res.status(400).json({
        success: false,
        error: "Either agent_ids or agent_names parameter is required",
        example:
          "?agent_ids=969503,480248 or ?agent_names=Mike Bjork,John Smith",
      });
    }

    console.log("[TEAM PROPERTIES] Request:", req.query);

    // Build base filters
    const baseFilters = [];

    // Agent filters - support both MLS IDs and names
    const agentFilters = [];

    if (agent_ids) {
      const idList = agent_ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const idFilter = idList
        .map((id) => `ListAgentMlsId eq '${id}'`)
        .join(" or ");
      if (idFilter) {
        agentFilters.push(`(${idFilter})`);
      }
    }

    if (agent_names) {
      const nameList = agent_names
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const nameFilter = nameList
        .map(
          (name) =>
            `contains(tolower(ListAgentFullName),'${name.toLowerCase()}')`
        )
        .join(" or ");
      if (nameFilter) {
        agentFilters.push(`(${nameFilter})`);
      }
    }

    // Combine agent filters with OR
    if (agentFilters.length > 0) {
      baseFilters.push(`(${agentFilters.join(" or ")})`);
    }

    // Location filter
    if (city) {
      baseFilters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }

    // Status filter
    if (status === "Active") {
      baseFilters.push(`StandardStatus eq 'Active'`);
    } else if (status === "Sold") {
      baseFilters.push(`StandardStatus eq 'Closed'`);
      // Add recent sales filter (last 12 months)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
      const dateFilter = cutoffDate.toISOString().split("T")[0];
      baseFilters.push(`CloseDate ge ${dateFilter}`);
    }

    const filterString = baseFilters.join(" and ");

    // Set up sorting
    let orderBy = "ListPrice desc"; // Default sorting
    if (sort_by === "price") {
      orderBy = "ListPrice desc";
    } else if (sort_by === "date") {
      orderBy = status === "Sold" ? "CloseDate desc" : "OnMarketDate desc";
    } else if (sort_by === "sqft") {
      orderBy = "LivingArea desc";
    }
    // For agent_priority, we'll sort in JavaScript after getting results

    // Select comprehensive fields
    const selectFields = [
      "UnparsedAddress",
      "City",
      "StateOrProvince",
      "PostalCode",
      "ListPrice",
      "ClosePrice",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "GarageSpaces",
      "YearBuilt",
      "StandardStatus",
      "CloseDate",
      "OnMarketDate",
      "Media",
      "ListingKey",
      "ListingId",
      "PropertyType",
      "PropertyCondition",
      "ArchitecturalStyle",
      "SubdivisionName",
      "Latitude",
      "Longitude",
      "LotSizeAcres",
      "ListAgentFullName",
      "ListAgentMlsId",
      "ListAgentPreferredPhone",
      "PublicRemarks",
    ].join(",");

    // Build API URL
    const apiUrl =
      `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
      `access_token=${paragonApiConfig.serverToken}&` +
      `$filter=${encodeURIComponent(filterString)}&` +
      `$select=${selectFields}&` +
      `$orderby=${orderBy}&` +
      `$top=${limit}`;

    console.log(
      "[TEAM PROPERTIES] API URL:",
      apiUrl.replace(paragonApiConfig.serverToken, "***")
    );

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Paragon API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const properties = data.value || [];

    console.log(`[TEAM PROPERTIES] Found ${properties.length} team properties`);

    // Transform properties and add team info
    const teamProperties = properties.map((property) => {
      const sqftValue =
        property.LivingArea || property.AboveGradeFinishedArea || 0;
      const totalSqft = sqftValue + (property.BelowGradeFinishedArea || 0);
      const price =
        status === "Sold" ? property.ClosePrice : property.ListPrice;
      const pricePerSqft =
        price && sqftValue > 0 ? Math.round(price / sqftValue) : 0;

      // Get primary image
      const primaryImage =
        property.Media && property.Media.length > 0
          ? property.Media[0].MediaURL || property.Media[0].PreferredPhotoURL
          : null;

      // Determine if this agent was specifically requested (for priority sorting)
      const requestedAgentIds = agent_ids
        ? agent_ids.split(",").map((id) => id.trim())
        : [];
      const requestedAgentNames = agent_names
        ? agent_names.split(",").map((name) => name.trim().toLowerCase())
        : [];

      const isRequestedAgent =
        requestedAgentIds.includes(property.ListAgentMlsId) ||
        requestedAgentNames.some((name) =>
          (property.ListAgentFullName || "").toLowerCase().includes(name)
        );

      return {
        id: property.ListingKey,
        mlsNumber: property.ListingId,
        address: property.UnparsedAddress || "",
        city: property.City || "",
        state: property.StateOrProvince || "",
        zipCode: property.PostalCode || "",
        listPrice: property.ListPrice || 0,
        soldPrice: property.ClosePrice || 0,
        sqft: sqftValue,
        basementSqft: property.BelowGradeFinishedArea || 0,
        totalSqft,
        beds: property.BedroomsTotal || 0,
        baths: property.BathroomsTotalInteger || 0,
        garage: property.GarageSpaces || 0,
        yearBuilt: property.YearBuilt || null,
        status: property.StandardStatus || "",
        closeDate: property.CloseDate || null,
        onMarketDate: property.OnMarketDate || null,
        pricePerSqft,
        propertyType: property.PropertyType || "",
        condition: property.PropertyCondition || "",
        style: property.ArchitecturalStyle || "",
        subdivision: property.SubdivisionName || "",
        latitude: property.Latitude || null,
        longitude: property.Longitude || null,
        lotSizeAcres: property.LotSizeAcres || 0,
        description: property.PublicRemarks || "",
        imageUrl: primaryImage,
        images: property.Media
          ? property.Media.map((m) => m.MediaURL || m.PreferredPhotoURL).filter(
              Boolean
            )
          : [],

        // Team/Agent info
        listAgent: {
          name: property.ListAgentFullName || "",
          mlsId: property.ListAgentMlsId || "",
          phone: property.ListAgentPreferredPhone || "",
        },

        // Team priority for sorting
        isTeamMember: isRequestedAgent,
        teamPriority: isRequestedAgent ? 1 : 2,
      };
    });

    // Apply custom sorting
    if (sort_by === "agent_priority") {
      // Sort by team priority first, then by price within each group
      teamProperties.sort((a, b) => {
        if (a.teamPriority !== b.teamPriority) {
          return a.teamPriority - b.teamPriority; // Team members first
        }
        return (b.listPrice || b.soldPrice) - (a.listPrice || a.soldPrice); // Then by price desc
      });
    }

    // Group properties by agent for summary
    const agentSummary = {};
    teamProperties.forEach((prop) => {
      const agentName = prop.listAgent.name;
      if (!agentSummary[agentName]) {
        agentSummary[agentName] = {
          name: agentName,
          mlsId: prop.listAgent.mlsId,
          phone: prop.listAgent.phone,
          listingCount: 0,
          isTeamMember: prop.isTeamMember,
        };
      }
      agentSummary[agentName].listingCount++;
    });

    res.json({
      success: true,
      count: teamProperties.length,
      totalAvailable: data["@odata.count"] || teamProperties.length,
      properties: teamProperties,
      agentSummary: Object.values(agentSummary),
      searchCriteria: {
        agent_ids,
        agent_names,
        city,
        status,
        sort_by,
      },
      meta: {
        teamMembersFirst: sort_by === "agent_priority",
        requestedAgents: {
          ids: agent_ids ? agent_ids.split(",") : [],
          names: agent_names ? agent_names.split(",") : [],
        },
      },
    });
  } catch (error) {
    console.error("[TEAM PROPERTIES] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      searchCriteria: req.query,
    });
  }
});

// --- TEAM MANAGEMENT APIs ---

// Get all teams
app.get("/api/teams", (req, res) => {
  try {
    const allTeams = Array.from(teams.values()).map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length,
      created_at: team.created_at,
      members: team.members, // Include members for easier frontend use
    }));

    res.json({
      success: true,
      count: allTeams.length,
      teams: allTeams,
    });
  } catch (error) {
    console.error("[TEAMS] Error getting teams:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new team
app.post("/api/teams", (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Team name is required",
      });
    }

    const newTeam = {
      id: teamIdCounter++,
      name: name.trim(),
      description: description.trim(),
      members: [],
      created_at: new Date().toISOString(),
    };

    teams.set(newTeam.id, newTeam);

    console.log(`[TEAMS] Created team: ${newTeam.name} (ID: ${newTeam.id})`);

    res.status(201).json({
      success: true,
      team: newTeam,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("[TEAMS] Error creating team:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific team
app.get("/api/teams/:teamId", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    res.json({
      success: true,
      team: team,
    });
  } catch (error) {
    console.error("[TEAMS] Error getting team:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update team
app.put("/api/teams/:teamId", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    const { name, description } = req.body;

    if (name && name.trim()) {
      team.name = name.trim();
    }
    if (description !== undefined) {
      team.description = description.trim();
    }

    team.updated_at = new Date().toISOString();
    teams.set(teamId, team);

    console.log(`[TEAMS] Updated team: ${team.name} (ID: ${teamId})`);

    res.json({
      success: true,
      team: team,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("[TEAMS] Error updating team:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete team
app.delete("/api/teams/:teamId", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    teams.delete(teamId);

    console.log(`[TEAMS] Deleted team: ${team.name} (ID: ${teamId})`);

    res.json({
      success: true,
      message: "Team deleted successfully",
      deletedTeam: { id: teamId, name: team.name },
    });
  } catch (error) {
    console.error("[TEAMS] Error deleting team:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// --- TEAM MEMBERS APIs ---

// Get team members
app.get("/api/teams/:teamId/members", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    res.json({
      success: true,
      teamId: teamId,
      teamName: team.name,
      count: team.members.length,
      members: team.members,
    });
  } catch (error) {
    console.error("[TEAM MEMBERS] Error getting members:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add member to team
app.post("/api/teams/:teamId/members", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    const { agent_name, agent_mls_id, agent_phone = "" } = req.body;

    if (!agent_name || !agent_mls_id) {
      return res.status(400).json({
        success: false,
        error: "agent_name and agent_mls_id are required",
      });
    }

    // Check if agent already in team
    const existingMember = team.members.find(
      (m) => m.agent_mls_id === agent_mls_id
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: "Agent already in team",
        existingMember: existingMember,
      });
    }

    const newMember = {
      id: team.members.length + 1,
      agent_name: agent_name.trim(),
      agent_mls_id: agent_mls_id.trim(),
      agent_phone: agent_phone.trim(),
      added_at: new Date().toISOString(),
    };

    team.members.push(newMember);
    teams.set(teamId, team);

    console.log(`[TEAM MEMBERS] Added ${agent_name} to team ${team.name}`);

    res.status(201).json({
      success: true,
      member: newMember,
      team: {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
      },
      message: "Member added to team successfully",
    });
  } catch (error) {
    console.error("[TEAM MEMBERS] Error adding member:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove member from team
app.delete("/api/teams/:teamId/members/:memberId", (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const memberId = parseInt(req.params.memberId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    const memberIndex = team.members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Member not found in team",
      });
    }

    const removedMember = team.members.splice(memberIndex, 1)[0];
    teams.set(teamId, team);

    console.log(
      `[TEAM MEMBERS] Removed ${removedMember.agent_name} from team ${team.name}`
    );

    res.json({
      success: true,
      message: "Member removed from team successfully",
      removedMember: removedMember,
      team: {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
      },
    });
  } catch (error) {
    console.error("[TEAM MEMBERS] Error removing member:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// --- FEATURED LISTINGS API ---

// Get featured listings for a team (team properties first, then others)
app.get("/api/teams/:teamId/featured-listings", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = teams.get(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    if (team.members.length === 0) {
      return res.json({
        success: true,
        teamId: teamId,
        teamName: team.name,
        count: 0,
        teamProperties: [],
        otherProperties: [],
        message: "No team members found",
      });
    }

    const {
      city,
      status = "Active",
      limit = 50,
      include_others = "true",
    } = req.query;

    // Get team member IDs
    const teamAgentIds = team.members.map((m) => m.agent_mls_id).join(",");

    console.log(
      `[FEATURED LISTINGS] Getting listings for team ${team.name}, agents: ${teamAgentIds}`
    );

    // Build API call for team properties (reusing existing team-properties logic)
    const baseFilters = [];

    // Agent filter for team members
    const idList = teamAgentIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const agentFilter = idList
      .map((id) => `ListAgentMlsId eq '${id}'`)
      .join(" or ");
    baseFilters.push(`(${agentFilter})`);

    // Location filter
    if (city) {
      baseFilters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }

    // Status filter
    if (status === "Active") {
      baseFilters.push(`StandardStatus eq 'Active'`);
    } else if (status === "Sold") {
      baseFilters.push(`StandardStatus eq 'Closed'`);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
      const dateFilter = cutoffDate.toISOString().split("T")[0];
      baseFilters.push(`CloseDate ge ${dateFilter}`);
    }

    const filterString = baseFilters.join(" and ");

    // Select fields
    const selectFields = [
      "UnparsedAddress",
      "City",
      "StateOrProvince",
      "PostalCode",
      "ListPrice",
      "ClosePrice",
      "LivingArea",
      "AboveGradeFinishedArea",
      "BelowGradeFinishedArea",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "GarageSpaces",
      "YearBuilt",
      "StandardStatus",
      "CloseDate",
      "OnMarketDate",
      "Media",
      "ListingKey",
      "ListingId",
      "PropertyType",
      "PropertyCondition",
      "ArchitecturalStyle",
      "SubdivisionName",
      "Latitude",
      "Longitude",
      "LotSizeAcres",
      "ListAgentFullName",
      "ListAgentMlsId",
      "ListAgentPreferredPhone",
      "PublicRemarks",
    ].join(",");

    // Build API URL
    const apiUrl =
      `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
      `access_token=${paragonApiConfig.serverToken}&` +
      `$filter=${encodeURIComponent(filterString)}&` +
      `$select=${selectFields}&` +
      `$orderby=ListPrice desc&` +
      `$top=${limit}`;

    // Make API request
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Paragon API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const teamProperties = (data.value || []).map((property) => {
      const sqftValue =
        property.LivingArea || property.AboveGradeFinishedArea || 0;
      const totalSqft = sqftValue + (property.BelowGradeFinishedArea || 0);
      const price =
        status === "Sold" ? property.ClosePrice : property.ListPrice;
      const pricePerSqft =
        price && sqftValue > 0 ? Math.round(price / sqftValue) : 0;

      const primaryImage =
        property.Media && property.Media.length > 0
          ? property.Media[0].MediaURL || property.Media[0].PreferredPhotoURL
          : null;

      return {
        id: property.ListingKey,
        mlsNumber: property.ListingId,
        address: property.UnparsedAddress || "",
        city: property.City || "",
        state: property.StateOrProvince || "",
        zipCode: property.PostalCode || "",
        listPrice: property.ListPrice || 0,
        soldPrice: property.ClosePrice || 0,
        sqft: sqftValue,
        totalSqft,
        beds: property.BedroomsTotal || 0,
        baths: property.BathroomsTotalInteger || 0,
        garage: property.GarageSpaces || 0,
        yearBuilt: property.YearBuilt || null,
        status: property.StandardStatus || "",
        closeDate: property.CloseDate || null,
        onMarketDate: property.OnMarketDate || null,
        pricePerSqft,
        propertyType: property.PropertyType || "",
        condition: property.PropertyCondition || "",
        style: property.ArchitecturalStyle || "",
        subdivision: property.SubdivisionName || "",
        latitude: property.Latitude || null,
        longitude: property.Longitude || null,
        description: property.PublicRemarks || "",
        imageUrl: primaryImage,
        images: property.Media
          ? property.Media.map((m) => m.MediaURL || m.PreferredPhotoURL).filter(
              Boolean
            )
          : [],
        listAgent: {
          name: property.ListAgentFullName || "",
          mlsId: property.ListAgentMlsId || "",
          phone: property.ListAgentPreferredPhone || "",
        },
        isFeatured: true,
        isTeamProperty: true,
      };
    });

    // TODO: Add "other properties" logic here if include_others=true
    // For now, just return team properties
    const otherProperties = [];

    res.json({
      success: true,
      teamId: teamId,
      teamName: team.name,
      teamMembers: team.members.length,
      count: teamProperties.length + otherProperties.length,
      teamPropertiesCount: teamProperties.length,
      otherPropertiesCount: otherProperties.length,
      teamProperties: teamProperties,
      otherProperties: otherProperties,
      searchCriteria: {
        city,
        status,
        limit,
        include_others,
      },
      meta: {
        teamAgentIds: teamAgentIds,
        priorityOrder: "Team properties first, then others",
      },
    });
  } catch (error) {
    console.error("[FEATURED LISTINGS] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all available communities/subdivisions with property counts
// In-memory cache for communities aggregation
// Structure: key -> { expires: msEpoch, data: {...responsePayloadWithoutSuccess} }
const communitiesCache = new Map();
const COMMUNITIES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildCommunitiesCacheKey(params) {
  // Exclude q + sort_by + min_properties since those can be post-filtered cheaply on cached base set.
  const { state, property_type, status, max_records } = params;
  return [state, property_type, status, max_records].join("|:");
}

async function aggregateCommunitiesBase({
  state,
  property_type,
  status,
  max_records,
  debugStatuses = false,
}) {
  const pageSize = 200;
  let fetched = 0;
  let skip = 0;
  let apiCalls = 0;
  const subdivisionCounts = {}; // key: normalized subdivision

  const filters = [];
  if (state) filters.push(`StateOrProvince eq '${state}'`);
  if (property_type && property_type !== "All" && property_type !== "all")
    filters.push(`PropertyType eq '${property_type}'`);
  if (status === "active") filters.push(`tolower(StandardStatus) eq 'active'`);
  filters.push("SubdivisionName ne null");
  const filterString = filters.join(" and ");

  while (fetched < max_records) {
    const apiUrl =
      `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
      `access_token=${
        paragonApiConfig.serverToken
      }&$filter=${encodeURIComponent(filterString)}` +
      // Only select supported fields (removed Status,ListingStatus,MlsStatus which cause 400 errors)
      `&$select=SubdivisionName,City,StandardStatus,PropertyType&$top=${pageSize}&$skip=${skip}`;
    apiCalls++;
    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Paragon API error ${resp.status}: ${txt}`);
    }
    const json = await resp.json();
    const batch = json.value || [];
    if (batch.length === 0) break;
    const wantDebugStatuses = debugStatuses;
    batch.forEach((prop) => {
      const rawSubdivision = prop.SubdivisionName?.trim();
      const city = prop.City?.trim();
      if (
        !rawSubdivision ||
        rawSubdivision === "-" ||
        rawSubdivision === "null"
      )
        return;
      const normKey = rawSubdivision.toLowerCase();
      if (!subdivisionCounts[normKey]) {
        subdivisionCounts[normKey] = {
          nameCanonical: rawSubdivision, // keep first-seen capitalization
          nameVariants: new Set([rawSubdivision]),
          totalProperties: 0,
          activeProperties: 0,
          cities: new Set(),
          statusCounts: wantDebugStatuses ? {} : undefined,
        };
      } else {
        subdivisionCounts[normKey].nameVariants.add(rawSubdivision);
      }
      const entry = subdivisionCounts[normKey];
      entry.totalProperties++;
      // Simplified active detection logic using only StandardStatus (supported field)
      const statusCandidates = [prop.StandardStatus].filter(Boolean);
      const statusLower = statusCandidates.map((s) => String(s).toLowerCase());
      const isActive = statusLower.some((s) =>
        [
          "active",
          "act", // sometimes truncated codes
          "a" /* rare single letter codes */,
        ].includes(s)
      );
      if (isActive) entry.activeProperties++;
      if (wantDebugStatuses) {
        const key = statusCandidates[0] || "(null)";
        entry.statusCounts[key] = (entry.statusCounts[key] || 0) + 1;
      }
      if (city) entry.cities.add(city);
    });
    fetched += batch.length;
    if (batch.length < pageSize) break;
    skip += pageSize;
    if (apiCalls > 100) break; // hard safety
  }

  const communitiesRaw = Object.values(subdivisionCounts).map((c) => {
    const base = {
      name: c.nameCanonical,
      totalProperties: c.totalProperties,
      activeProperties: c.activeProperties,
      inactiveProperties: Math.max(0, c.totalProperties - c.activeProperties),
      cities: Array.from(c.cities).sort(),
      primaryCity: Array.from(c.cities)[0] || "",
    };
    if (c.statusCounts) base.statusCounts = c.statusCounts;
    return base;
  });

  return { fetched, apiCalls, communitiesRaw };
}

app.get("/api/communities", async (req, res) => {
  const {
    state = "NE",
    property_type = "Residential",
    status = "all",
    min_properties = 1,
    sort_by = "count",
    max_records = 4000,
    q, // substring filter (case-insensitive)
    debugStatuses, // when '1' include statusCounts for each community
  } = req.query;

  try {
    const cacheKey = buildCommunitiesCacheKey({
      state,
      property_type,
      status,
      max_records,
    });
    let baseData = communitiesCache.get(cacheKey);
    if (baseData && baseData.expires < Date.now()) {
      communitiesCache.delete(cacheKey);
      baseData = undefined;
    }
    if (!baseData) {
      const aggregated = await aggregateCommunitiesBase({
        state,
        property_type,
        status,
        max_records: parseInt(max_records),
        debugStatuses: debugStatuses === "1",
      });
      baseData = {
        expires: Date.now() + COMMUNITIES_CACHE_TTL_MS,
        data: aggregated,
      };
      communitiesCache.set(cacheKey, baseData);
    }

    const { fetched, apiCalls, communitiesRaw } = baseData.data;
    const minProps = parseInt(min_properties);
    const qLower = q ? String(q).toLowerCase() : null;
    let communities = communitiesRaw.filter(
      (c) => c.totalProperties >= minProps
    );
    if (qLower)
      communities = communities.filter((c) =>
        c.name.toLowerCase().includes(qLower)
      );

    if (sort_by === "count")
      communities.sort((a, b) => b.totalProperties - a.totalProperties);
    else communities.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      count: communities.length,
      total_properties_analyzed: fetched,
      cache: {
        hit:
          !!baseData && baseData.expires > Date.now() && apiCalls === 0
            ? true
            : undefined,
        expires_in_ms: baseData.expires - Date.now(),
        ttl_ms: COMMUNITIES_CACHE_TTL_MS,
      },
      filters: {
        state,
        property_type,
        status,
        min_properties: minProps,
        q: q || null,
        debugStatuses: debugStatuses === "1" ? true : undefined,
      },
      communities,
    });
  } catch (err) {
    console.error("[COMMUNITIES] Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: "Failed to fetch communities data",
    });
  }
});

// ==============================================================
// Communities (Full Aggregation) & Cities Aggregation Endpoints
// ==============================================================
// NOTE: These endpoints provide more accurate counts than the
// sample-based /api/communities endpoint by paging through the
// Paragon API in 200-record increments (API page size limit).
// Use cautiously: can be slower & increase API usage.
// --------------------------------------------------------------

/**
 * GET /api/communities-full
 * Accurate communities/subdivisions aggregation with optional city filtering.
 * Query Params:
 *  state=NE
 *  property_type=Residential|Commercial|All
 *  status=active|all
 *  min_properties=1
 *  sort_by=count|name
 *  max_records=4000 (safety cap)
 *  primary_city=Omaha (optional filter to only include communities whose primary city matches)
 */
// Alias (deprecated) - reuse /api/communities logic but expose legacy fields for backward awareness.
app.get("/api/communities-full", async (req, res) => {
  // Internally call /api/communities by reusing handler logic through fetch to self could be overkill; instead replicate param extraction and delegate.
  // We simply append a deprecation notice in response.
  // We'll call aggregateCommunitiesBase via cache (same as /api/communities) then shape slightly extended payload.
  const {
    state = "NE",
    property_type = "Residential",
    status = "all",
    min_properties = 1,
    sort_by = "count",
    max_records = 4000,
    q,
    debugStatuses,
  } = req.query;
  try {
    const cacheKey = buildCommunitiesCacheKey({
      state,
      property_type,
      status,
      max_records,
    });
    let baseData = communitiesCache.get(cacheKey);
    if (baseData && baseData.expires < Date.now()) {
      communitiesCache.delete(cacheKey);
      baseData = undefined;
    }
    if (!baseData) {
      const aggregated = await aggregateCommunitiesBase({
        state,
        property_type,
        status,
        max_records: parseInt(max_records),
        debugStatuses: debugStatuses === "1",
      });
      baseData = {
        expires: Date.now() + COMMUNITIES_CACHE_TTL_MS,
        data: aggregated,
      };
      communitiesCache.set(cacheKey, baseData);
    }
    const { fetched, communitiesRaw } = baseData.data;
    const minProps = parseInt(min_properties);
    const qLower = q ? String(q).toLowerCase() : null;
    let communities = communitiesRaw.filter(
      (c) => c.totalProperties >= minProps
    );
    if (qLower)
      communities = communities.filter((c) =>
        c.name.toLowerCase().includes(qLower)
      );
    if (sort_by === "count")
      communities.sort((a, b) => b.totalProperties - a.totalProperties);
    else communities.sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      success: true,
      deprecated: true,
      deprecation_message:
        "Use /api/communities. This alias will be removed in a future version.",
      count: communities.length,
      total_properties_analyzed: fetched,
      filters: {
        state,
        property_type,
        status,
        min_properties: minProps,
        q: q || null,
      },
      communities,
    });
  } catch (err) {
    console.error("[COMMUNITIES-FULL-ALIAS] Error:", err);
    res
      .status(500)
      .json({ success: false, error: err.message, deprecated: true });
  }
});

/**
 * GET /api/cities
 * Provides property & community counts grouped by City (primary city perspective).
 * Query Params mirror /api/communities-full (state, property_type, status, max_records, min_properties, sort_by)
 */
app.get("/api/cities", async (req, res) => {
  const {
    state = "NE",
    property_type = "Residential",
    status = "all",
    max_records = 4000,
    sort_by = "count",
  } = req.query;

  const pageSize = 200;
  let fetched = 0;
  let skip = 0;
  const cityStats = {};
  let apiCalls = 0;
  const startedAt = Date.now();

  try {
    const filters = [];
    if (state) filters.push(`StateOrProvince eq '${state}'`);
    if (property_type && property_type !== "All" && property_type !== "all")
      filters.push(`PropertyType eq '${property_type}'`);
    if (status === "active")
      filters.push(`tolower(StandardStatus) eq 'active'`);
    const filterString = filters.join(" and ");

    while (fetched < max_records) {
      const apiUrl =
        `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?` +
        `access_token=${
          paragonApiConfig.serverToken
        }&$filter=${encodeURIComponent(filterString)}` +
        `&$select=SubdivisionName,City,StandardStatus&$top=${pageSize}&$skip=${skip}`;
      apiCalls++;
      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Paragon API error ${resp.status}: ${txt}`);
      }
      const json = await resp.json();
      const batch = json.value || [];
      if (batch.length === 0) break;

      batch.forEach((prop) => {
        const city = prop.City?.trim();
        if (!city) return;
        if (!cityStats[city]) {
          cityStats[city] = {
            city,
            totalProperties: 0,
            activeProperties: 0,
            communities: new Set(),
          };
        }
        const entry = cityStats[city];
        entry.totalProperties++;
        if (prop.StandardStatus === "Active") entry.activeProperties++;
        const subdivision = prop.SubdivisionName?.trim();
        if (subdivision) entry.communities.add(subdivision);
      });

      fetched += batch.length;
      if (batch.length < pageSize) break;
      skip += pageSize;
      if (apiCalls > 100) break;
    }

    let cities = Object.values(cityStats).map((c) => ({
      city: c.city,
      totalProperties: c.totalProperties,
      activeProperties: c.activeProperties,
      distinctCommunities: c.communities.size,
      communities: Array.from(c.communities).sort().slice(0, 50), // limit list size
    }));

    if (sort_by === "count")
      cities.sort((a, b) => b.totalProperties - a.totalProperties);
    else cities.sort((a, b) => a.city.localeCompare(b.city));

    res.json({
      success: true,
      mode: "full",
      count: cities.length,
      total_properties_aggregated: fetched,
      api_calls: apiCalls,
      duration_ms: Date.now() - startedAt,
      filters: { state, property_type, status },
      cities,
    });
  } catch (err) {
    console.error("[CITIES] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================================
// OPTIMIZED APIs - For Frontend Performance Optimization
// =============================================================================
// These endpoints reduce frontend API calls from 1762+ to ~50 per session
// by implementing batching, caching, and progressive loading strategies.

// Initialize caches for optimized endpoints
const searchCache = new Map();
const imageCache = new Map();
const optimizedImageCache = new Map();

// Cache cleanup every 30 minutes
setInterval(() => {
  const now = Date.now();

  // Clean search cache (5 min TTL)
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > 300000) {
      searchCache.delete(key);
    }
  }

  // Clean image cache (30 min TTL)
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > 1800000) {
      imageCache.delete(key);
    }
  }

  console.log(
    `Cache cleanup: ${searchCache.size} search, ${imageCache.size} image, ${optimizedImageCache.size} optimized`
  );
}, 1800000); // Every 30 minutes

/**
 * GET /api/property-search-optim
 * Optimized property search with batching, caching, and progressive loading
 * Reduces upstream API calls by batching requests and serving from cache
 */
app.get("/api/property-search-optim", async (req, res) => {
  try {
    const {
      page = 0,
      limit = 20,
      includeImages = "false",
      imageLimit = 1,
      dataLevel = "list",
      loadType = "progressive",
      ...searchParams
    } = req.query;

    console.log(
      `[PROPERTY-SEARCH-OPTIM] Request: page=${page}, limit=${limit}, dataLevel=${dataLevel}`
    );

    // Create cache key from search parameters
    const searchKey = Object.keys(searchParams)
      .sort()
      .map((k) => `${k}=${searchParams[k]}`)
      .join("&");
    const cacheKey = `property-search-optim:${searchKey}:${dataLevel}:${includeImages}`;

    // Check cache first (5 minute TTL)
    let cachedData = searchCache.get(cacheKey);
    let cacheHit = false;

    if (!cachedData) {
      console.log(
        `[PROPERTY-SEARCH-OPTIM] Cache miss, fetching from upstream API`
      );

      // Call existing property-search-new for larger batch (200 properties)
      const upstreamParams = {
        ...searchParams,
        limit: 200, // Get larger batch to reduce upstream calls
      };

      // Build URL for existing endpoint
      const paramStr = Object.keys(upstreamParams)
        .map((k) => `${k}=${encodeURIComponent(upstreamParams[k])}`)
        .join("&");

      const upstreamUrl = `http://localhost:${PORT}/api/property-search-new?${paramStr}`;

      try {
        const response = await fetch(upstreamUrl);
        const upstreamData = await response.json();

        // Cache the full result set
        cachedData = {
          properties: upstreamData.properties || [],
          totalCount: upstreamData.count || upstreamData.totalAvailable || 0,
          timestamp: Date.now(),
        };

        searchCache.set(cacheKey, cachedData);
        console.log(
          `[PROPERTY-SEARCH-OPTIM] Cached ${cachedData.properties.length} properties`
        );
      } catch (fetchError) {
        console.error(
          "[PROPERTY-SEARCH-OPTIM] Upstream fetch failed:",
          fetchError
        );
        return res.status(500).json({
          success: false,
          error: "Failed to fetch properties from upstream API",
        });
      }
    } else {
      cacheHit = true;
      console.log(
        `[PROPERTY-SEARCH-OPTIM] Cache hit, ${cachedData.properties.length} properties available`
      );
    }

    // Paginate from cached data
    const startIndex = parseInt(page) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    let paginatedProperties = cachedData.properties.slice(startIndex, endIndex);

    // Apply data level filtering
    if (dataLevel === "minimal") {
      paginatedProperties = paginatedProperties.map((p) => ({
        id: p.id,
        price: p.listPrice || p.price,
        address: p.address,
        status: p.status,
        coordinates: { lat: p.latitude, lng: p.longitude },
      }));
    } else if (dataLevel === "list") {
      paginatedProperties = paginatedProperties.map((p) => {
        const listData = {
          id: p.id,
          price: p.listPrice || p.price,
          address: p.address,
          city: p.city,
          state: p.state,
          beds: p.beds,
          baths: p.baths,
          sqft: p.sqft || p.totalSqft,
          status: p.status,
          coordinates: { lat: p.latitude, lng: p.longitude },
          yearBuilt: p.yearBuilt,
          subdivision: p.subdivision,
        };

        // Handle images based on parameters
        if (includeImages === "true" && p.imageUrl) {
          const maxImages = parseInt(imageLimit);
          // For now, we only have imageUrl, but structure for future expansion
          listData.images = [
            {
              url: p.imageUrl,
              thumbnail: p.imageUrl,
              alt: "Property image",
            },
          ].slice(0, maxImages);
          listData.imageCount = 1; // We only have one image per property currently
          listData.hasMoreImages = false;
        } else {
          listData.imageCount = p.imageUrl ? 1 : 0;
          listData.hasMoreImages = false;
        }

        return listData;
      });
    }
    // 'detail' and 'full' would return complete data (same as original)

    const totalPages = Math.ceil(cachedData.totalCount / parseInt(limit));

    res.json({
      success: true,
      properties: paginatedProperties,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProperties: cachedData.totalCount,
        hasNextPage: parseInt(page) < totalPages - 1,
        hasPreviousPage: parseInt(page) > 0,
        cacheHit,
        loadType,
      },
      dataLevel,
      imageSettings: {
        included: includeImages === "true",
        limit: parseInt(imageLimit),
      },
      cache: {
        key: cacheKey.substring(0, 50) + "...", // Truncate for response
        age: Date.now() - cachedData.timestamp,
        ttl: 300000, // 5 minutes
      },
    });
  } catch (error) {
    console.error("[PROPERTY-SEARCH-OPTIM] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/properties/:propertyId/images-optim
 * Paginated property image loading to reduce bandwidth
 */
app.get("/api/properties/:propertyId/images-optim", async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      page = 0,
      limit = 5,
      width = 300,
      height = 200,
      quality = 80,
    } = req.query;

    console.log(
      `[IMAGES-OPTIM] Request for property ${propertyId}, page ${page}`
    );

    // Check cache for property data
    const cacheKey = `property-images:${propertyId}`;
    let propertyData = imageCache.get(cacheKey);

    if (!propertyData) {
      console.log(`[IMAGES-OPTIM] Cache miss, fetching property ${propertyId}`);

      // Fetch property from existing endpoint
      try {
        const upstreamUrl = `http://localhost:${PORT}/api/property-search-new?id=${propertyId}`;
        const response = await fetch(upstreamUrl);
        const data = await response.json();

        // Extract images - currently we have imageUrl, but structure for expansion
        const property = data.properties?.[0];
        const images = [];

        if (property?.imageUrl) {
          images.push({
            url: property.imageUrl,
            thumbnail: property.imageUrl,
            width: 800, // Default dimensions
            height: 600,
          });
        }

        propertyData = {
          images,
          timestamp: Date.now(),
        };

        imageCache.set(cacheKey, propertyData);
        console.log(
          `[IMAGES-OPTIM] Cached ${images.length} images for property ${propertyId}`
        );
      } catch (fetchError) {
        console.error("[IMAGES-OPTIM] Property fetch failed:", fetchError);
        return res.status(404).json({
          success: false,
          error: "Property not found or upstream API error",
        });
      }
    } else {
      console.log(`[IMAGES-OPTIM] Cache hit for property ${propertyId}`);
    }

    // Paginate images
    const startIndex = parseInt(page) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedImages = propertyData.images.slice(startIndex, endIndex);

    // Format images with optimization options
    const formattedImages = paginatedImages.map((img, index) => ({
      url: img.url,
      thumbnail: img.thumbnail || img.url,
      optimized: `/api/images/optimize-optim?url=${encodeURIComponent(
        img.url
      )}&width=${width}&height=${height}&quality=${quality}`,
      width: parseInt(width),
      height: parseInt(height),
      alt: `Property image ${startIndex + index + 1}`,
    }));

    const totalImages = propertyData.images.length;
    const totalPages = Math.ceil(totalImages / parseInt(limit));

    res.json({
      success: true,
      propertyId,
      images: formattedImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        hasMore: endIndex < totalImages,
        total: totalImages,
        showing: `${startIndex + 1}-${Math.min(
          endIndex,
          totalImages
        )} of ${totalImages}`,
      },
      optimizationSettings: {
        width: parseInt(width),
        height: parseInt(height),
        quality: parseInt(quality),
      },
    });
  } catch (error) {
    console.error("[IMAGES-OPTIM] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/images/optimize-optim
 * Image optimization service for bandwidth reduction
 */
app.get("/api/images/optimize-optim", async (req, res) => {
  try {
    const {
      url,
      width = 300,
      height = 200,
      quality = 80,
      format = "webp",
    } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(
      `[IMAGE-OPTIMIZE] Request: ${width}x${height} q${quality} ${format}`
    );

    // Create cache key for optimized image
    const optimizationKey = `${url}:${width}x${height}:q${quality}:${format}`;
    const cacheKey = `optimized-image:${Buffer.from(optimizationKey)
      .toString("base64")
      .substring(0, 50)}`;

    // Check if already optimized and cached
    let cachedOptimized = optimizedImageCache.get(cacheKey);

    if (cachedOptimized) {
      console.log(`[IMAGE-OPTIMIZE] Cache hit for optimized image`);
      return res.json({
        success: true,
        optimizedUrl: cachedOptimized.url,
        originalUrl: url,
        cached: true,
        ...cachedOptimized.metadata,
      });
    }

    // For now, return a placeholder response with size estimates
    // In production, you'd implement actual image processing with Sharp:
    // const sharp = require('sharp');
    // const processedBuffer = await sharp(originalImageBuffer)
    //   .resize(parseInt(width), parseInt(height))
    //   .webp({ quality: parseInt(quality) })
    //   .toBuffer();

    const estimatedOriginalSize = 2048000; // 2MB estimate
    const compressionFactor = (parseInt(quality) / 100) * 0.3; // WebP compression estimate
    const estimatedOptimizedSize = Math.floor(
      estimatedOriginalSize * compressionFactor
    );

    const response = {
      success: true,
      optimizedUrl: url, // In production, this would be your CDN URL
      originalUrl: url,
      originalSize: estimatedOriginalSize,
      optimizedSize: estimatedOptimizedSize,
      compressionRatio: compressionFactor,
      format,
      dimensions: {
        width: parseInt(width),
        height: parseInt(height),
      },
      cached: false,
      note: "Placeholder response - actual image processing requires Sharp package",
    };

    // Cache the result
    optimizedImageCache.set(cacheKey, {
      url: response.optimizedUrl,
      metadata: response,
    });

    console.log(
      `[IMAGE-OPTIMIZE] Generated optimization metadata: ${estimatedOptimizedSize} bytes`
    );
    res.json(response);
  } catch (error) {
    console.error("[IMAGE-OPTIMIZE] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// --- 6. Start ---
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
