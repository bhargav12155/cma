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

// --- 5. Endpoints ---

// Root health
app.get("/", (req, res) => {
  res.json({
    message: "Simple CMA API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
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
    // Location filters
    city,
    state = "NE",
    zip_code,
    latitude,
    longitude,
    radius_miles = 5,

    // Price filters
    min_price,
    max_price,
    price_range, // e.g., "500k+" which means 500000+

    // Property type filters
    property_type = "House", // House, Condo, Townhouse, etc.

    // Size filters
    min_sqft,
    max_sqft,
    min_beds,
    max_beds,
    beds, // e.g., "5+" which means 5 or more
    min_baths,
    max_baths,

    // Status filters
    status = "For Sale", // "For Sale", "Sold", "All"

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

    // Location filters
    if (city) {
      filters.push(`tolower(City) eq '${city.toLowerCase()}'`);
    }
    if (state) {
      filters.push(`tolower(StateOrProvince) eq '${state.toLowerCase()}'`);
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

    // Property type filter
    if (property_type && property_type !== "All") {
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

    // Status filter
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

    // Execute both queries in parallel
    const [activeResponse, closedResponse] = await Promise.all([
      fetch(activeUrl),
      fetch(closedUrl),
    ]);

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

    const activeData = await activeResponse.json();
    const closedData = await closedResponse.json();

    const activeProperties = activeData.value || [];
    const closedProperties = closedData.value || [];

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
        activeQuery: activeUrl,
        closedQuery: closedUrl,
        searchCriteria: {
          city,
          sqft,
          radius_miles,
          sqft_delta,
          months_back,
          dateFilter,
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
      schoolElementary: record.ElementarySchool || "",
      schoolMiddle: record.MiddleOrJuniorSchool || "",
      schoolHigh: record.HighSchool || "",
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
    state = "NE",
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
    if (state)
      filters.push(`tolower(StateOrProvince) eq '${state.toLowerCase()}'`);
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

    // Status filters - REMOVED: Now returns ALL properties regardless of status
    // This allows the frontend to get active, sold, expired, cancelled, etc. all together
    // if (status) { ... } - Status filtering disabled for comprehensive results

    const filterQuery = filters.length
      ? `$filter=${encodeURIComponent(filters.join(" and "))}`
      : "";
    const url = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?access_token=${paragonApiConfig.serverToken}&$top=${limit}&$skip=${offset}&$orderby=${sort_by} ${sort_order}&${filterQuery}`;

    console.log("API URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    // Process properties to add computed fields like imageUrl, distance_miles, etc.
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

      // Determine if property is active
      const isActive = prop.StandardStatus === "Active";

      // Extract square footage - use AboveGradeFinishedArea as primary
      const sqftValue = prop.AboveGradeFinishedArea || prop.LivingArea || 0;

      // Calculate price and price per sqft
      const price = isActive ? prop.ListPrice : prop.ClosePrice;
      const totalSqft = sqftValue + (prop.BelowGradeFinishedArea || 0);
      const pricePerSqft =
        price && totalSqft ? Math.round(price / totalSqft) : 0;

      return {
        id: prop.ListingKey,
        address: prop.UnparsedAddress,
        city: prop.City,
        listPrice: prop.ListPrice,
        soldPrice: prop.ClosePrice,
        sqft: sqftValue,
        basementSqft: prop.BelowGradeFinishedArea,
        totalSqft,
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
    const { status = 'Active' } = req.query;

    // Get count for different property statuses
    const statuses = ['Active', 'Closed', 'Pending', 'Expired', 'Withdrawn'];
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
          counts[currentStatus] = data['@odata.count'] || 0;
        } else {
          counts[currentStatus] = 'unknown';
        }
      } catch (error) {
        counts[currentStatus] = 'error';
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
        counts.total = totalData['@odata.count'] || 0;
      } else {
        counts.total = 'unknown';
      }
    } catch (error) {
      counts.total = 'error';
    }

    res.json({
      message: "Property counts by status",
      counts,
      note: "These are the actual counts available in your Paragon dataset",
      recommendation: counts.total > 150 ? 
        "Use pagination (limit/offset) to access all properties" : 
        "You have access to all available properties"
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
      identification: allFields.filter(field => 
        /^(ListingKey|PropertyId|ListingId|MlsStatus|StandardStatus)/i.test(field)
      ),
      location: allFields.filter(field => 
        /^(Address|City|State|Province|Postal|County|Latitude|Longitude|Coordinates)/i.test(field)
      ),
      physical: allFields.filter(field => 
        /^(LivingArea|Bedrooms|Bathrooms|Stories|YearBuilt|LotSize|PropertyType|PropertySubType)/i.test(field)
      ),
      pricing: allFields.filter(field => 
        /^(ListPrice|ClosePrice|Original|Tax|Assessment|Association)/i.test(field)
      ),
      features: allFields.filter(field => 
        /^(Pool|Fireplace|Garage|Parking|Basement|Heating|Cooling|Appliances)/i.test(field)
      ),
      listing: allFields.filter(field => 
        /^(DaysOnMarket|OnMarket|Close|Contract|Agent|Office|Remarks)/i.test(field)
      ),
      media: allFields.filter(field => 
        /^(Media|Photo|Virtual|Image)/i.test(field)
      ),
      other: allFields.filter(field => 
        !/(ListingKey|PropertyId|ListingId|MlsStatus|StandardStatus|Address|City|State|Province|Postal|County|Latitude|Longitude|Coordinates|LivingArea|Bedrooms|Bathrooms|Stories|YearBuilt|LotSize|PropertyType|PropertySubType|ListPrice|ClosePrice|Original|Tax|Assessment|Association|Pool|Fireplace|Garage|Parking|Basement|Heating|Cooling|Appliances|DaysOnMarket|OnMarket|Close|Contract|Agent|Office|Remarks|Media|Photo|Virtual|Image)/i.test(field)
      ),
    };

    // Sample values for key fields
    const fieldSamples = {};
    const importantFields = [
      'PropertyType', 'PropertySubType', 'StandardStatus', 'Heating', 'Cooling',
      'Basement', 'PoolPrivateYN', 'FireplacesTotal', 'GarageSpaces',
      'Appliances', 'Flooring', 'BuildingFeatures', 'InteriorFeatures',
      'ExteriorFeatures', 'ArchitecturalStyle'
    ];

    importantFields.forEach(field => {
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
    if (propertyType && propertyType !== 'Any Type') {
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
    if (hasPool === 'true') filters.push(`PoolPrivateYN eq true`);
    if (hasFireplace === 'true') filters.push(`FireplacesTotal gt 0`);
    if (hasGarage === 'true') filters.push(`GarageSpaces gt 0`);
    if (hasBasement === 'true') filters.push(`(Basement ne null and Basement ne '')`);
    if (isNewConstruction === 'true') filters.push(`NewConstructionYN eq true`);

    // Feature filters using contains (for text fields)
    if (hasUpdatedKitchen === 'true') {
      filters.push(`(contains(tolower(InteriorFeatures),'updated kitchen') or contains(tolower(InteriorFeatures),'remodeled kitchen') or contains(tolower(InteriorFeatures),'renovated kitchen'))`);
    }
    if (hasHardwoodFloors === 'true') {
      filters.push(`(contains(tolower(Flooring),'hardwood') or contains(tolower(Flooring),'wood floor'))`);
    }
    if (hasDeckPatio === 'true') {
      filters.push(`(contains(tolower(ExteriorFeatures),'deck') or contains(tolower(ExteriorFeatures),'patio'))`);
    }
    if (hasWalkInCloset === 'true') {
      filters.push(`contains(tolower(InteriorFeatures),'walk-in closet')`);
    }
    if (hasMasterSuite === 'true') {
      filters.push(`(contains(tolower(InteriorFeatures),'master suite') or contains(tolower(InteriorFeatures),'primary suite'))`);
    }

    // Status filter
    if (status && status !== 'Any Status') {
      filters.push(`StandardStatus eq '${status}'`);
    } else {
      // Default to active listings if no status specified
      filters.push(`StandardStatus eq 'Active'`);
    }

    // Build sorting
    let orderBy = '';
    switch (sortBy) {
      case 'price_low':
        orderBy = '$orderby=ListPrice asc';
        break;
      case 'price_high':
        orderBy = '$orderby=ListPrice desc';
        break;
      case 'sqft_low':
        orderBy = '$orderby=LivingArea asc';
        break;
      case 'sqft_high':
        orderBy = '$orderby=LivingArea desc';
        break;
      case 'dom_low':
        orderBy = '$orderby=DaysOnMarket asc';
        break;
      case 'dom_high':
        orderBy = '$orderby=DaysOnMarket desc';
        break;
      case 'newest':
      default:
        orderBy = '$orderby=OnMarketDate desc';
        break;
    }

    // Construct final URL
    const filterString = filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
    const topSkip = `$top=${limit}&$skip=${offset}`;
    
    const queryParts = [filterString, orderBy, topSkip].filter(part => part);
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?${queryParts.join('&')}`;

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
    const formattedProperties = properties.map(record => ({
      id: record.ListingKey || record.PropertyId || record.id,
      address: record.UnparsedAddress || record.Address || `${record.StreetNumber} ${record.StreetName}`,
      city: record.City,
      state: record.StateOrProvince,
      zipCode: record.PostalCode,
      status: record.StandardStatus,
      
      // Pricing
      listPrice: Number(record.ListPrice || 0),
      originalListPrice: Number(record.OriginalListPrice || 0),
      soldPrice: Number(record.ClosePrice || 0),
      pricePerSqft: record.ListPrice && record.LivingArea && record.LivingArea > 0
        ? Math.round(record.ListPrice / record.LivingArea) : 0,
      
      // Physical characteristics
      sqft: Number(record.LivingArea || record.AboveGradeFinishedArea || 0),
      beds: Number(record.BedroomsTotal || 0),
      baths: Number(record.BathroomsTotalDecimal || record.BathroomsTotal || 0),
      bathsFull: Number(record.BathroomsFull || 0),
      bathsHalf: Number(record.BathroomsHalf || 0),
      garage: Number(record.GarageSpaces || record.ParkingTotal || record.CoveredSpaces || 0),
      yearBuilt: Number(record.YearBuilt || 0),
      stories: Number(record.StoriesTotal || 0),
      
      // Property details
      propertyType: record.PropertyType || '',
      propertySubType: record.PropertySubType || '',
      lotSizeAcres: Number(record.LotSizeAcres || 0),
      lotSizeSquareFeet: Number(record.LotSizeSquareFeet || 0),
      
      // Features
      fireplace: Number(record.FireplacesTotal || 0),
      pool: record.PoolPrivateYN || false,
      basement: record.Basement || '',
      heating: record.Heating || '',
      cooling: record.Cooling || '',
      appliances: record.Appliances || '',
      flooring: record.Flooring || '',
      newConstruction: record.NewConstructionYN || false,
      
      // Feature flags for UI
      features: {
        hasPool: record.PoolPrivateYN || false,
        hasFireplace: (record.FireplacesTotal || 0) > 0,
        hasGarage: (record.GarageSpaces || record.ParkingTotal || record.CoveredSpaces || 0) > 0,
        hasBasement: !!(record.Basement && typeof record.Basement === 'string' && record.Basement.trim()),
        hasUpdatedKitchen: record.InteriorFeatures ? 
          /updated kitchen|remodeled kitchen|renovated kitchen/i.test(record.InteriorFeatures) : false,
        hasHardwoodFloors: record.Flooring ? /hardwood|wood floor/i.test(record.Flooring) : false,
        hasDeckPatio: record.ExteriorFeatures ? /deck|patio/i.test(record.ExteriorFeatures) : false,
        hasWalkInCloset: record.InteriorFeatures ? /walk-in closet/i.test(record.InteriorFeatures) : false,
        hasMasterSuite: record.InteriorFeatures ? /master suite|primary suite/i.test(record.InteriorFeatures) : false,
        isNewConstruction: record.NewConstructionYN || false,
      },
      
      // Listing info
      daysOnMarket: Number(record.DaysOnMarket || record.CumulativeDaysOnMarket || 0),
      onMarketDate: record.OnMarketDate || '',
      mlsNumber: record.ListingId || '',
      
      // Media
      imageUrl: record.Media && record.Media.length > 0 ? record.Media[0].MediaURL :
                record.Photos && record.Photos.length > 0 ? record.Photos[0].url :
                `https://placehold.co/600x400/d1d5db/374151?text=No+Image`,
      images: record.Media ? record.Media.map(m => m.MediaURL) : [],
      
      // Location
      latitude: Number(record.Latitude || 0),
      longitude: Number(record.Longitude || 0),
      
      // Additional info
      publicRemarks: record.PublicRemarks || '',
      buildingFeatures: record.BuildingFeatures || '',
      exteriorFeatures: record.ExteriorFeatures || '',
      interiorFeatures: record.InteriorFeatures || '',
      
      // Schools
      schoolElementary: record.ElementarySchool || '',
      schoolMiddle: record.MiddleOrJuniorSchool || '',
      schoolHigh: record.HighSchool || '',
    }));

    res.json({
      properties: formattedProperties,
      totalResults: formattedProperties.length,
      searchCriteria: {
        filters: filters,
        sorting: sortBy || 'newest',
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

// --- 6. Start ---
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
