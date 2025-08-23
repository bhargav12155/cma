// server.js

// --- 1. Import Libraries ---
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// --- 2. Init App ---
const app = express();
const PORT = process.env.PORT || 3001;

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
  serverToken: "429b18690390adfa776f0b727dfc78cc", // Your actual Server Token
  datasetId: "bk9", // Your dataset ID
  apiUrl: "https://api.paragonapi.com/api/v2/OData",
};

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
      const pricePerSqft =
        price && sqftValue ? Math.round(price / sqftValue) : 0;

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

// Helper: Haversine distance in miles between two lat/lon pairs
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

// Helper: attempt to find a subject property using multiple normalization strategies
async function findSubjectProperty(address, city) {
  if (!address) return null;
  // Basic sanitation
  const sanitize = (s) => s.replace(/'/g, "");
  const base = sanitize(address.trim());
  const addrLower = base.toLowerCase();
  const variants = new Set();
  variants.add(addrLower);
  // Expand common suffix abbreviations
  const suffixMap = {
    " st": " street",
    " rd": " road",
    " ave": " avenue",
    " blvd": " boulevard",
    " dr": " drive",
    " ln": " lane",
    " ct": " court",
    " cir": " circle",
    " ter": " terrace",
    " pl": " place",
  };
  for (const [abbr, full] of Object.entries(suffixMap)) {
    if (addrLower.endsWith(abbr)) variants.add(addrLower.replace(abbr, full));
    if (addrLower.endsWith(full)) variants.add(addrLower.replace(full, abbr));
  }
  // Directional normalization (s -> s, south)
  if (/\b s \b/.test(` ${addrLower} `))
    variants.add(addrLower.replace(/\b s \b/, " south "));
  if (/\b south \b/.test(` ${addrLower} `))
    variants.add(addrLower.replace(/\b south \b/, " s "));

  // Try exact UnparsedAddress matches first
  for (const v of variants) {
    // Attempt direct case-sensitive match first
    const directFilter = `$filter=UnparsedAddress eq '${base}'`;
    const lowerFilter = `$filter=tolower(UnparsedAddress) eq '${v}'`;
    const attempts = [directFilter, lowerFilter];
    for (const filter of attempts) {
      const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?${filter}&$top=3`;
      try {
        const resp = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${paragonApiConfig.serverToken}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.value && data.value.length) {
            const p = data.value[0];

            return {
              address: p.UnparsedAddress || p.Address || base,
              city: p.City || city,
              sqft: Number(p.LivingArea || p.AboveGradeFinishedArea || 0),
              latitude: Number(p.Latitude || 0),
              longitude: Number(p.Longitude || 0),
              yearBuilt: Number(p.YearBuilt || 0),
              beds: Number(p.BedroomsTotal || 0),
              baths: Number(p.BathroomsTotalDecimal || p.BathroomsTotal || 0),
              raw: p,
            };
          }
        }
      } catch (e) {
        //console.log("[SUBJECT] Variant search error", e.message);
      }
    }
  }

  // Partial strategies: number + remainder
  const numberMatch = base.match(/^(\d+)/);
  if (numberMatch) {
    const num = numberMatch[1];
    const remainder = sanitize(base.slice(num.length).trim().toLowerCase());
    if (remainder.length > 3) {
      // Use substringof (OData v2) or contains - try substringof first
      const partials = [
        `$filter=StreetNumber eq '${num}' and substringof('${remainder}', tolower(UnparsedAddress)) eq true`,
        `$filter=substringof('${remainder}', tolower(UnparsedAddress)) eq true`,
      ];
      for (const f of partials) {
        const url = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?${f}&$top=5`;
        try {
          const resp = await fetch(url, {
            headers: {
              Authorization: `Bearer ${paragonApiConfig.serverToken}`,
            },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.value && data.value.length) {
              const p = data.value[0];

              return {
                address: p.UnparsedAddress || p.Address || base,
                city: p.City || city,
                sqft: Number(p.LivingArea || p.AboveGradeFinishedArea || 0),
                latitude: Number(p.Latitude || 0),
                longitude: Number(p.Longitude || 0),
                yearBuilt: Number(p.YearBuilt || 0),
                beds: Number(p.BedroomsTotal || 0),
                baths: Number(p.BathroomsTotalDecimal || p.BathroomsTotal || 0),
                raw: p,
              };
            }
          }
        } catch (e) {
          console.log("[SUBJECT] Partial search error", e.message);
        }
      }
    }
  }
  return null;
}

// Comps-from-address endpoint: find subject by address, then search comps nearby and within sqft delta
app.get("/api/comps-from-address", async (req, res) => {
  //console.log("Received comps-from-address request:", req.query);

  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    const address = req.query.address || "";
    const city = req.query.city || "";
    // New: optional comma-separated postal codes list to broaden comps search
    const postalCodesRaw =
      req.query.postalCodes || req.query.postal_codes || req.query.zips || "";
    const postalCodes = String(postalCodesRaw)
      .split(/[,;\s]+/)
      .map((z) => z.trim())
      .filter((z) => z.length >= 4);
    let radiusMiles = parseFloat(
      req.query.radius_miles || req.query.radiusMiles || 2
    );
    let sqftDelta = parseInt(
      req.query.sqft_delta || req.query.sqftDelta || 700,
      10
    );
    const minResults = parseInt(req.query.min_results || 5, 10) || 5;

    if (!address && !city) {
      return res
        .status(400)
        .json({ message: "address or city parameter required" });
    }

    // Step 1: try to find the subject property by address (reuse property-search logic)
    let subject = await findSubjectProperty(address, city);
    // if (subject) {
    //   console.log(
    //     `[COMPS] Subject property found. Address='${subject.address}' sqft=${subject.sqft} lat=${subject.latitude} lon=${subject.longitude}`
    //   );
    // } else {
    //   console.log(
    //     `[COMPS] Subject not found for '${address}'. Provide ?sqft=#### to improve range.`
    //   );
    // }

    // If subject not found, fall back to using provided city and sqft if available
    const subjectSqft = subject
      ? subject.sqft
      : req.query.sqft
      ? Number(req.query.sqft)
      : 0;

    // Build OData query using city and sqft window
    let sqft_min = Math.max(0, (subjectSqft || 0) - sqftDelta);
    let sqft_max = (subjectSqft || 0) + sqftDelta || sqftDelta || 2000;
    // If we still have no subject sqft (0) and user didn't pass sqft, broaden range to avoid overly narrow query
    if (!subjectSqft) {
      sqft_min = 0;
      sqft_max = Math.max(2500, sqftDelta * 5); // broaden search so we can later infer typical size
      // console.log(
      //   `[COMPS] Broadening sqft window due to missing subject size -> [${sqft_min}, ${sqft_max}]`
      // );
    }
    // console.log(
    //   `[COMPS] Computed sqft window subjectSqft=${subjectSqft} delta=${sqftDelta} -> range [${sqft_min}, ${sqft_max}] radius=${radiusMiles}mi minResults=${minResults}`
    // );
    let areaClause = `LivingArea ge ${sqft_min} and LivingArea le ${sqft_max}`;
    let locationClause = city ? `City eq '${city}'` : "";
    if (postalCodes.length) {
      const orZip = postalCodes
        .slice(0, 10) // cap to avoid overly long filters
        .map((z) => `PostalCode eq '${z.replace(/'/g, "").trim()}'`)
        .join(" or ");
      const zipGroup = `(${orZip})`;
      locationClause = locationClause
        ? `${locationClause} and ${zipGroup}`
        : zipGroup;
      // //console.log(
      //   `[COMPS] Applying postalCodes filter: ${postalCodes.join(",")}`
      // );
    }
    const conditions = [
      "StandardStatus eq 'Closed'",
      locationClause,
      areaClause,
    ]
      .filter(Boolean)
      .join(" and ");
    const odataFilterComps = `$filter=${conditions}`;
    const compsUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?${odataFilterComps}&$top=200`;

    const compsResp = await fetch(compsUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!compsResp.ok) {
      console.error("Comps fetch failed:", await compsResp.text());
      throw new Error("Comps fetch failed");
    }
    const compsData = await compsResp.json();
    const listings = compsData.value || [];

    // Map and filter by distance if we have subject coordinates
    const mapped = listings.map((record) => ({
      id: record.ListingKey || record.PropertyId || record.id,
      address:
        record.UnparsedAddress ||
        record.Address ||
        `${record.StreetNumber} ${record.StreetName}`,
      city: record.City,
      soldPrice: Number(record.ClosePrice || record.ListPrice || 0),
      listPrice: Number(record.ListPrice || 0),
      sqft: Number(record.LivingArea || record.AboveGradeFinishedArea || 0),
      beds: Number(record.BedroomsTotal || 0),
      baths: Number(record.BathroomsTotalDecimal || record.BathroomsTotal || 0),
      garage: Number(
        record.GarageSpaces || record.ParkingTotal || record.CoveredSpaces || 0
      ),
      yearBuilt: Number(record.YearBuilt || 0),
      latitude: Number(record.Latitude || 0),
      longitude: Number(record.Longitude || 0),
      imageUrl:
        record.Media && record.Media.length > 0
          ? record.Media[0].MediaURL
          : record.Photos && record.Photos.length > 0
          ? record.Photos[0].url
          : "",
      raw: record,
    }));

    let filtered = mapped;
    if (subject && subject.latitude && subject.longitude) {
      filtered = mapped
        .filter((m) => m.latitude && m.longitude)
        .map((m) => ({
          ...m,
          distance_miles: haversineMiles(
            subject.latitude,
            subject.longitude,
            m.latitude,
            m.longitude
          ),
        }))
        .filter((m) => m.distance_miles <= radiusMiles)
        .sort((a, b) => a.distance_miles - b.distance_miles);

      // If not enough results, expand the radius until we have minResults or hit 20 miles
      let currentRadius = radiusMiles;
      while (filtered.length < minResults && currentRadius < 20) {
        currentRadius = currentRadius * 2;
        filtered = mapped
          .filter((m) => m.latitude && m.longitude)
          .map((m) => ({
            ...m,
            distance_miles: haversineMiles(
              subject.latitude,
              subject.longitude,
              m.latitude,
              m.longitude
            ),
          }))
          .filter((m) => m.distance_miles <= currentRadius)
          .sort((a, b) => a.distance_miles - b.distance_miles);
      }
    }

    // If still no coords or filtered is empty, fall back to city-based results
    if (
      (!subject || !subject.latitude || !subject.longitude) &&
      (!filtered || filtered.length === 0)
    ) {
      // take top N by recency/price
      filtered = mapped.slice(0, Math.min(20, mapped.length));
    }

    if (filtered.length) {
      const sample = filtered
        .slice(0, 3)
        .map((c) => ({ id: c.id, sqft: c.sqft, dist: c.distance_miles }));
      // console.log("[COMPS] Sample comps:", sample);
    }

    res.json({
      subject: subject || null,
      params: { radiusMiles, sqftDelta, sqft_min, sqft_max },
      comps: filtered,
    });
  } catch (err) {
    console.error("comps-from-address error:", err);
    res.status(500).json({
      message: "Failed to fetch comps from address.",
      details: err.message,
    });
  }
});

// Property search endpoint - search for a specific property by address
app.get("/api/property-search", async (req, res) => {
  // console.log("Received request for property search with query:", req.query);

  // Check if server token is configured
  if (paragonApiConfig.serverToken === "YOUR_SERVER_TOKEN_HERE") {
    console.error("Server token not configured!");
    return res.status(500).json({
      message: "Server configuration error",
      details: "Paragon Server Token not configured.",
    });
  }

  try {
    const { address } = req.query;
    const debug = req.query.debug === "1" || req.query.debug === "true";

    if (!address) {
      return res.status(400).json({
        message: "Address parameter is required",
      });
    }

    // Use tolower to work around API case-sensitivity as per Paragon docs
    const odataFilter = `$filter=tolower(UnparsedAddress) eq '${address.toLowerCase()}'`;
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Properties?${odataFilter}&$top=5`;

    // console.log("Making property search request to:", searchUrl);

    // Fetch property using Server Token authentication
    const propertyResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    //console.log("Property search response status:", propertyResponse.status);

    if (!propertyResponse.ok) {
      console.error(
        "Property search error response:",
        await propertyResponse.text()
      );
      throw new Error(`Property search failed (${propertyResponse.status})`);
    }

    const propertyData = await propertyResponse.json();
    const properties = propertyData.value || [];
    // console.log(`Found ${properties.length} properties matching address.`);

    let property = properties[0];

    if (!property) {
      try {
        const variant = await findSubjectProperty(address, "");
        if (variant && variant.raw) {
          property = variant.raw;
        }
      } catch (e) {
        console.log("[PROPERTY-SEARCH] Variant strategy error:", e.message);
      }
    }

    if (!property) {
      return res.json({
        found: false,
        message: "No property found with that address",
        suggestions:
          "Try adding direction (e.g., 'South') or a full suffix (Street) or supply ?sqft=#### manually.",
        attempted: debug ? { directFilter: odataFilter } : undefined,
      });
    }

    // Format the first matching or fallback-found property with comprehensive details
    const formattedProperty = {
      found: true,
      id: property.ListingKey || property.PropertyId,
      address: property.UnparsedAddress || property.Address,
      city: property.City,
      state: property.StateOrProvince,
      postalCode: property.PostalCode,
      status: property.StandardStatus,

      // Property details
      sqft: Number(property.LivingArea || property.AboveGradeFinishedArea || 0),
      aboveGradeSqft: Number(property.AboveGradeFinishedArea || 0),
      belowGradeSqft: Number(property.BelowGradeFinishedArea || 0),
      beds: Number(property.BedroomsTotal || 0),
      baths: Number(
        property.BathroomsTotalDecimal || property.BathroomsTotal || 0
      ),
      bathsFull: Number(property.BathroomsFull || 0),
      bathsHalf: Number(property.BathroomsHalf || 0),
      garage: Number(
        property.GarageSpaces ||
          property.ParkingTotal ||
          property.CoveredSpaces ||
          0
      ),
      yearBuilt: Number(property.YearBuilt || 0),

      // Financial data
      listPrice: Number(property.ListPrice || 0),
      originalListPrice: Number(property.OriginalListPrice || 0),
      soldPrice: Number(property.ClosePrice || 0),
      pricePerSqft:
        property.ListPrice && property.LivingArea && property.LivingArea > 0
          ? Math.round(property.ListPrice / property.LivingArea)
          : 0,
      taxAssessedValue: Number(property.TaxAssessedValue || 0),
      taxAnnualAmount: Number(property.TaxAnnualAmount || 0),

      // Property characteristics
      propertyType: property.PropertyType || "",
      propertySubType: property.PropertySubType || "",
      lotSizeAcres: Number(property.LotSizeAcres || 0),
      lotSizeSquareFeet: Number(property.LotSizeSquareFeet || 0),
      stories: Number(property.StoriesTotal || 0),
      condition:
        property.PropertyCondition && property.PropertyCondition.length > 0
          ? property.PropertyCondition[0]
          : "",

      // Systems and features
      heating: property.Heating || "",
      cooling: property.Cooling || "",
      appliances: property.Appliances || "",
      flooring: property.Flooring || "",
      basement: property.Basement || "",
      fireplace: Number(property.FireplacesTotal || 0),
      pool: property.PoolPrivateYN || false,
      waterfront: property.WaterfrontYN || false,

      // School information
      schoolElementary: property.ElementarySchool || "",
      schoolMiddle: property.MiddleOrJuniorSchool || "",
      schoolHigh: property.HighSchool || "",

      // Listing details
      mlsNumber: property.ListingId || "",
      daysOnMarket: Number(
        property.DaysOnMarket || property.CumulativeDaysOnMarket || 0
      ),
      onMarketDate: property.OnMarketDate || "",
      listAgent: {
        name: property.ListAgentFullName || "",
        phone: property.ListAgentPreferredPhone || "",
        email: property.ListAgentEmail || "",
        mlsId: property.ListAgentMlsId || "",
      },

      // Media
      imageUrl:
        property.Media && property.Media.length > 0
          ? property.Media[0].MediaURL
          : property.Photos && property.Photos.length > 0
          ? property.Photos[0].url
          : "",
      images: property.Media ? property.Media.map((m) => m.MediaURL) : [],
      virtualTour:
        property.VirtualTourURLBranded ||
        property.VirtualTourURLUnbranded ||
        "",

      // Location
      coordinates: property.Coordinates || "",
      latitude: Number(property.Latitude || 0),
      longitude: Number(property.Longitude || 0),

      // Additional details
      publicRemarks: property.PublicRemarks || "",
      buildingFeatures: property.BuildingFeatures || "",
      exteriorFeatures: property.ExteriorFeatures || "",
      interiorFeatures: property.InteriorFeatures || "",
      architecturalStyle: property.ArchitecturalStyle || "",
      utilities: property.Utilities || "",

      // Raw data for debugging
      rawData: property,
    };

    res.json(formattedProperty);
  } catch (error) {
    console.error("Property search error:", error);
    res.status(500).json({
      message: "Failed to search for property.",
      details: error.message,
    });
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

    return res.json(details);
  } catch (err) {
    console.error("Error fetching property details:", err.message);
    return res.status(500).json({ error: "Failed to fetch property details" });
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

// --- 6. Start ---
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
