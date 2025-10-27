/**
 * District Level Mapping for Nebraska School Districts
 * Maps districts to their service levels (elementary, middle, high) with associated cities and communities
 *
 * Data structure:
 * - Each district has levels it serves
 * - Each level has cities and communities it covers
 * - Property counts are computed dynamically from the MLS data
 */

const NEBRASKA_DISTRICT_MAPPING = {
  // Omaha Public Schools - Serves all levels across multiple areas
  "Omaha Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Omaha"],
    communities: [
      "Benson",
      "Dundee",
      "Hanscom Park",
      "Happy Hollow",
      "Howe",
      "Logan Fontenelle",
      "Montclair",
      "Near North Side",
      "River Front",
    ],
    totalCities: ["Omaha"],
  },

  // Millard Public Schools - K-12 district
  "Millard Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Omaha", "Millard"],
    communities: [
      "Millard",
      "Shadow Ridge",
      "Sterling Ridge",
      "Stoney Brook",
      "Sunset Hills",
      "Tiburon",
      "Village Groves",
      "West Dodge",
    ],
    totalCities: ["Omaha", "Millard"],
  },

  // Westside Community Schools - K-12 district
  "Westside Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Omaha"],
    communities: [
      "Benson",
      "Regency",
      "Rockbrook",
      "Shadow Ridge",
      "West Omaha",
      "Westgate",
    ],
    totalCities: ["Omaha"],
  },

  // Elkhorn Public Schools - K-12 district
  "Elkhorn Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Elkhorn", "Omaha"],
    communities: [
      "Elkhorn",
      "Elk Ridge",
      "Hunters Ridge",
      "Stone Creek",
      "The Ponds",
      "Windsor Creek",
    ],
    totalCities: ["Elkhorn", "Omaha"],
  },

  // Gretna Public Schools - K-12 district
  "Gretna Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Gretna"],
    communities: [
      "Gretna",
      "Gretna Heights",
      "Heartland Crossing",
      "Prairie Vista",
      "Silver Creek",
    ],
    totalCities: ["Gretna"],
  },

  // Bellevue Public Schools - K-12 district
  "Bellevue Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Bellevue"],
    communities: [
      "Bellevue",
      "Bellevue Heights",
      "Hazelwood",
      "Offutt Base",
      "Richfield",
      "Twin Creek",
    ],
    totalCities: ["Bellevue"],
  },

  // Papillion La Vista Community Schools - K-12 district
  "Papillion La Vista Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Papillion", "La Vista"],
    communities: [
      "Papillion",
      "La Vista",
      "Countryside",
      "Highland Oaks",
      "Shadow Lake",
      "Walnut Creek",
    ],
    totalCities: ["Papillion", "La Vista"],
  },

  // Ralston Public Schools - K-12 district
  "Ralston Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Ralston", "Omaha"],
    communities: ["Ralston", "Benson"],
    totalCities: ["Ralston", "Omaha"],
  },

  // Douglas County West Community Schools - K-12 district
  "Douglas County West Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Valley", "Omaha"],
    communities: ["Valley", "Bennington", "Elk City"],
    totalCities: ["Valley", "Omaha"],
  },

  // Bennington Public Schools - K-12 district
  "Bennington Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Bennington"],
    communities: ["Bennington", "Douglas", "Washington County West"],
    totalCities: ["Bennington"],
  },

  // Blair Community Schools - K-12 district
  "Blair Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Blair"],
    communities: ["Blair", "Fontanelle Forest", "River Oaks"],
    totalCities: ["Blair"],
  },

  // Arlington Public Schools - K-12 district
  "Arlington Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Arlington"],
    communities: ["Arlington", "Boyer Bluff"],
    totalCities: ["Arlington"],
  },

  // Fort Calhoun Community Schools - K-12 district
  "Fort Calhoun Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Fort Calhoun"],
    communities: ["Fort Calhoun", "Washington County East"],
    totalCities: ["Fort Calhoun"],
  },

  // Tekamah-Herman Community Schools - K-12 district
  "Tekamah-Herman Community Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Tekamah", "Herman"],
    communities: ["Tekamah", "Herman", "Burt County West"],
    totalCities: ["Tekamah", "Herman"],
  },

  // Fremont Public Schools - K-12 district
  "Fremont Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Fremont"],
    communities: ["Fremont", "Midland University Area", "Bell Creek"],
    totalCities: ["Fremont"],
  },

  // Wahoo Public Schools - K-12 district
  "Wahoo Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Wahoo"],
    communities: ["Wahoo", "Saunders County Central"],
    totalCities: ["Wahoo"],
  },

  // Yutan Public Schools - K-12 district
  "Yutan Public Schools": {
    levels: ["elementary", "middle", "high"],
    cities: ["Yutan"],
    communities: ["Yutan", "Saunders County East"],
    totalCities: ["Yutan"],
  },

  // Example of elementary-only district (specialized)
  "Omaha Elementary District 1": {
    levels: ["elementary"],
    cities: ["Omaha"],
    communities: ["Benson", "Near North Side"],
    totalCities: ["Omaha"],
  },

  // Example of high school only district (specialized)
  "Metro Community College Area": {
    levels: ["high"],
    cities: ["Omaha", "Elkhorn", "Gretna"],
    communities: ["Multiple Communities"],
    totalCities: ["Omaha", "Elkhorn", "Gretna"],
  },
};

/**
 * Get districts that serve a specific level
 * @param {string} level - "elementary", "middle", or "high"
 * @returns {Array} Array of district names
 */
function getDistrictsByLevel(level) {
  return Object.keys(NEBRASKA_DISTRICT_MAPPING).filter((districtName) =>
    NEBRASKA_DISTRICT_MAPPING[districtName].levels.includes(level)
  );
}

/**
 * Get all cities served by a district at a specific level
 * @param {string} districtName - Name of the district
 * @param {string} level - Service level
 * @returns {Array} Array of city names
 */
function getCitiesForDistrictLevel(districtName, level) {
  const district = NEBRASKA_DISTRICT_MAPPING[districtName];
  if (!district || !district.levels.includes(level)) {
    return [];
  }
  return district.cities;
}

/**
 * Get all communities served by a district at a specific level
 * @param {string} districtName - Name of the district
 * @param {string} level - Service level
 * @returns {Array} Array of community names
 */
function getCommunitiesForDistrictLevel(districtName, level) {
  const district = NEBRASKA_DISTRICT_MAPPING[districtName];
  if (!district || !district.levels.includes(level)) {
    return [];
  }
  return district.communities;
}

/**
 * Find district(s) that serve a city at a specific level
 * @param {string} city - City name
 * @param {string} level - Service level
 * @returns {Array} Array of district names
 */
function getDistrictsForCityLevel(city, level) {
  return Object.keys(NEBRASKA_DISTRICT_MAPPING).filter((districtName) => {
    const district = NEBRASKA_DISTRICT_MAPPING[districtName];
    return (
      district.levels.includes(level) &&
      district.cities.some((c) => c.toLowerCase() === city.toLowerCase())
    );
  });
}

/**
 * Get complete district information for API response
 * @param {string} districtName - Name of the district
 * @param {string} level - Service level
 * @returns {Object} District information object
 */
function getDistrictInfo(districtName, level) {
  const district = NEBRASKA_DISTRICT_MAPPING[districtName];
  if (!district || !district.levels.includes(level)) {
    return null;
  }

  return {
    name: districtName,
    level: level,
    state: "NE",
    cities: district.cities,
    communities: district.communities.map((name) => ({
      name: name,
      city: district.cities[0], // Default to first city, will be refined with real data
      propertyCount: 0, // Will be populated from MLS data
    })),
    totalCommunities: district.communities.length,
    totalActiveProperties: 0, // Will be populated from MLS data
    propertyCount: 0, // Alias for totalActiveProperties
  };
}

module.exports = {
  NEBRASKA_DISTRICT_MAPPING,
  getDistrictsByLevel,
  getCitiesForDistrictLevel,
  getCommunitiesForDistrictLevel,
  getDistrictsForCityLevel,
  getDistrictInfo,
};
