// Advanced Property Search Param Parser (Phase 1)
// Normalizes and validates query parameters without throwing for optional issues.

const BOOL_TRUE = new Set(["true", "1", "yes", "y"]);

function parseBool(val) {
  if (val === undefined) return undefined;
  return BOOL_TRUE.has(String(val).toLowerCase());
}

function parseNumber(val) {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function clamp(num, min, max) {
  if (num === undefined) return undefined;
  return Math.min(Math.max(num, min), max);
}

function parseMultiStatus(input) {
  if (!input) return [];
  // Accept: status=Active,Pending or repeated ?status=Active&status=Pending
  if (Array.isArray(input)) {
    return input.flatMap((v) => String(v).split(","));
  }
  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const STATUS_MAP = {
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  sold: "Closed",
  canceled: "Canceled",
  cancelled: "Canceled",
  expired: "Expired",
};

function normalizeStatusList(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const key = String(raw).toLowerCase();
    const norm = STATUS_MAP[key] || raw;
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

const SORT_FIELDS = new Set([
  "ListPrice",
  "ClosePrice",
  "DaysOnMarket",
  "LivingArea",
  "YearBuilt",
  "ModificationTimestamp",
]);

function parseParams(q) {
  const ignored = [];
  const applied = {};

  // Ranges
  const min_sqft = parseNumber(q.min_sqft);
  const max_sqft = parseNumber(q.max_sqft);
  const min_year_built = clamp(
    parseNumber(q.min_year_built),
    1800,
    new Date().getFullYear()
  );
  const max_year_built = clamp(
    parseNumber(q.max_year_built),
    1800,
    new Date().getFullYear()
  );

  if (min_sqft !== undefined) applied.min_sqft = min_sqft;
  if (
    max_sqft !== undefined &&
    (min_sqft === undefined || max_sqft >= min_sqft)
  )
    applied.max_sqft = max_sqft;
  else if (max_sqft !== undefined) ignored.push("max_sqft");

  if (min_year_built !== undefined) applied.min_year_built = min_year_built;
  if (
    max_year_built !== undefined &&
    (min_year_built === undefined || max_year_built >= min_year_built)
  )
    applied.max_year_built = max_year_built;
  else if (max_year_built !== undefined) ignored.push("max_year_built");

  // Multi-status
  const statusRaw = parseMultiStatus(q.status);
  const statuses = normalizeStatusList(statusRaw);
  if (statuses.length) applied.statuses = statuses;

  // Booleans
  const waterfront = parseBool(q.waterfront);
  if (waterfront !== undefined) applied.waterfront = waterfront;
  const new_construction = parseBool(q.new_construction);
  if (new_construction !== undefined)
    applied.new_construction = new_construction;
  const photo_only = parseBool(q.photo_only);
  if (photo_only !== undefined) applied.photo_only = photo_only;

  // Numerics
  const min_garage = parseNumber(q.min_garage);
  if (min_garage !== undefined && min_garage >= 0)
    applied.min_garage = min_garage;
  else if (min_garage !== undefined) ignored.push("min_garage");

  // Sorting
  let sort_by =
    q.sort_by && SORT_FIELDS.has(q.sort_by)
      ? q.sort_by
      : "ModificationTimestamp";
  if (q.sort_by && !SORT_FIELDS.has(q.sort_by)) ignored.push("sort_by");
  let sort_order = String(q.sort_order || "desc").toLowerCase();
  if (!["asc", "desc"].includes(sort_order)) {
    ignored.push("sort_order");
    sort_order = "desc";
  }
  applied.sort_by = sort_by;
  applied.sort_order = sort_order;

  // Limit
  let limit = parseNumber(q.limit);
  if (limit === undefined) limit = 100;
  if (limit > 500) limit = 500;
  applied.limit = limit;

  // Residual simple filters
  if (q.city) applied.city = String(q.city);
  if (q.subdivision) applied.subdivision = String(q.subdivision);
  if (q.property_type) applied.property_type = String(q.property_type);

  return { applied, ignored };
}

module.exports = { parseParams };
