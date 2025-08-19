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

// Comps endpoint
app.get("/api/comps", async (req, res) => {
  console.log("Received request for comps with query:", req.query);

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
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?${odataFilter}&$top=50`;

    console.log("Making request to:", searchUrl);
    console.log(
      "Using token:",
      paragonApiConfig.serverToken.substring(0, 10) + "..."
    );

    // Fetch properties using Server Token authentication
    const propertyResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Property response status:", propertyResponse.status);

    if (!propertyResponse.ok) {
      console.error(
        "Property fetch error response:",
        await propertyResponse.text()
      );
      throw new Error(`Data fetch failed (${propertyResponse.status})`);
    }

    const propertyData = await propertyResponse.json();
    const listings = propertyData.value || [];
    console.log(`Found ${listings.length} comps from Paragon API.`);

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

// Property search endpoint - search for a specific property by address
app.get("/api/property-search", async (req, res) => {
  console.log("Received request for property search with query:", req.query);

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

    if (!address) {
      return res.status(400).json({
        message: "Address parameter is required",
      });
    }

    // Use tolower to work around API case-sensitivity as per Paragon docs
    const odataFilter = `$filter=tolower(UnparsedAddress) eq '${address.toLowerCase()}'`;
    const searchUrl = `${paragonApiConfig.apiUrl}/${paragonApiConfig.datasetId}/Property?${odataFilter}&$top=10`;

    console.log("Making property search request to:", searchUrl);

    // Fetch property using Server Token authentication
    const propertyResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${paragonApiConfig.serverToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Property search response status:", propertyResponse.status);

    if (!propertyResponse.ok) {
      console.error(
        "Property search error response:",
        await propertyResponse.text()
      );
      throw new Error(`Property search failed (${propertyResponse.status})`);
    }

    const propertyData = await propertyResponse.json();
    const properties = propertyData.value || [];
    console.log(`Found ${properties.length} properties matching address.`);

    if (properties.length === 0) {
      return res.json({
        found: false,
        message: "No property found with that address",
        suggestions:
          "Try searching with a partial address or check the spelling",
      });
    }

    // Format the first matching property with comprehensive details
    const property = properties[0];
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
