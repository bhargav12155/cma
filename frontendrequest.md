# Unified Property Search Backend Expansion Request

This document specifies the additional query parameters, response fields, behaviors, and rollout plan needed to power the next set of frontend search features. It is structured for backend implementation clarity and prioritized for phased delivery.

---

## 1. Current Supported Parameters (Baseline)

Already in use (via `propertySearchSchema` or CMA tooling):

- `query` : string (address / free text / city / MLS fallback)
- `min_price`, `max_price` (frontend uses `minPrice` / `maxPrice` internally)
- `beds`, `baths`
- `property_type`
- `city`
- `subdivision`
- `neighborhood`
- `school_district`
- `style` (legacy generic style)
- `architectural_style` (prototype AI field)
- `status` ("Active" | "Closed" | "Canceled" | "Expired") – single value currently
- `days` (recent closed window filter, numeric)
- `limit`
- (CMA-only patterns) `min_sqft`, `max_sqft`, `min_year_built`, `max_year_built` (already used in `index copy.html` path but not fully exposed in main search UI)

---

## 2. New / Expanded Feature Parameters

Each item includes: param name(s), type, purpose, acceptance rules, difficulty (backend), and phase.

### 2.1 Core Data Filters

| Feature                       | Param(s)                                   | Type   | Purpose                                          | Validation                                            | Difficulty                       | Phase  |
| ----------------------------- | ------------------------------------------ | ------ | ------------------------------------------------ | ----------------------------------------------------- | -------------------------------- | ------ | --- |
| Price per SqFt min/max        | `min_price_per_sqft`, `max_price_per_sqft` | number | Filter on computed `ListPrice / LivingArea`      | Compute after data fetch; skip if missing sqft        | Medium                           | 2      |
| SqFt range                    | `min_sqft`, `max_sqft`                     | number | Surface already used CMA logic in general search | Ensure `min <= max`; clamp >=0                        | Low                              | 1      |
| Year Built range              | `min_year_built`, `max_year_built`         | number | Narrow by construction era                       | Clamp 1800..currentYear                               | Low                              | 1      |
| Lot size range (if available) | `min_lot_sqft`, `max_lot_sqft`             | number | Filter by lot size                               | Only if feed has numeric lot field                    | Medium                           | 3      |
| Days on Market range          | `min_dom`, `max_dom`                       | number | Filter current actives by exposure age           | Use `DaysOnMarket` or derive from ListingContractDate | Medium                           | 2      |
| Status multi-select           | `status[]` OR `status=Active,Pending`      | list   | string                                           | Allow multiple statuses at once                       | Split comma string; map synonyms | Medium | 1   |
| Area / County / State         | `county`, `state`, `area`                  | string | Regional refinement                              | Accept plain string; case-insensitive                 | Low                              | 2      |

### 2.2 Lifestyle / Attribute Filters

| Feature                      | Param                    | Type    | Purpose                                      | Detection Logic                               | Difficulty | Phase |
| ---------------------------- | ------------------------ | ------- | -------------------------------------------- | --------------------------------------------- | ---------- | ----- |
| Waterfront                   | `waterfront=true`        | boolean | Only waterfront properties                   | MLS flag contains waterfront tokens           | Medium     | 1     |
| New Construction             | `new_construction=true`  | boolean | Recently built builds                        | YearBuilt >= (currentYear - 2) OR flag        | Low        | 1     |
| Architectural Style exact    | `architectural_style`    | string  | Exact style match                            | Case-insensitive equality                     | Low        | 1     |
| Subdivision autocomplete     | (same `subdivision`)     | string  | Better UX, same param                        | No backend change (indexing optional)         | N/A        | 1     |
| School district autocomplete | (same `school_district`) | string  | Same param, improved UX                      | No backend change                             | N/A        | 1     |
| Garage minimum               | `min_garage`             | number  | Required garage spaces                       | Use `GarageSpaces`                            | Low        | 1     |
| Basement presence            | `has_basement=true`      | boolean | Filter for any finished or total below grade | `BelowGradeFinishedArea > 0` OR basement flag | Low        | 2     |
| Basement finished sqft min   | `min_basement_sqft`      | number  | More detailed basement filter                | Requires field mapping                        | Medium     | 3     |
| Property subtype             | `property_sub_type`      | string  | Distinguish condo/townhouse/land             | Normalize via mapping                         | Medium     | 2     |

### 2.3 Sorting & Result Controls

| Feature                     | Param(s)                    | Allowed Values                                                                                | Default                                                 | Difficulty                   | Phase                    |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------- | ------------------------ | --- |
| Sort selection              | `sort_by`                   | `ListPrice`, `ClosePrice`, `DaysOnMarket`, `LivingArea`, `YearBuilt`, `ModificationTimestamp` | `ModificationTimestamp` (if available) else `ListPrice` | Low                          | 1                        |
| Sort order                  | `sort_order`                | `asc`, `desc`                                                                                 | `desc`                                                  | Low                          | 1                        |
| Hide listings w/out photos  | `photo_only=true`           | boolean                                                                                       | false                                                   | Post-filter after fetch      | Low                      | 1   |
| Only virtual tour           | `virtual_tour=true`         | boolean                                                                                       | false                                                   | Check virtual tour URL field | Low                      | 2   |
| Exclude stale price changes | `price_change_max_age_days` | number                                                                                        | unset                                                   | Need last price change date  | Medium (depends on feed) | 3   |

### 2.4 Geographic / Radius Search

| Feature               | Param(s)                              | Type                          | Purpose             | Logic                                                   | Difficulty | Phase |
| --------------------- | ------------------------------------- | ----------------------------- | ------------------- | ------------------------------------------------------- | ---------- | ----- |
| Lat/Lng + Radius      | `latitude`,`longitude`,`radius_miles` | number                        | Search by proximity | If provided, apply vendor geo filter or local haversine | Medium     | 2     |
| Bounding box (future) | `bbox`                                | `minLon,minLat,maxLon,maxLat` | Map selection       | Parse 4 floats; filter locally if API lacks             | High       | 4     |

---

## 3. Response Field Requirements

Add/ensure these fields in each returned property (frontend enrichment cost drops if backend supplies directly):
| Field | Type | Description | Source / Derivation |
|-------|------|-------------|---------------------|
| `id` | string | Stable unique key | ListingKey / internal ID |
| `mlsNumber` | string | MLS ID visible | Provided field or mapped alias |
| `address` | string | Display address | Synthesized from parts if needed |
| `city`, `state`, `zipCode` | string | Location parts | Direct fields |
| `county` | string | County name | MLS feed |
| `subdivision` | string | Normalized subdivision | MLS SubdivisionName |
| `schoolDistrict` | string | District value | Provided or blank |
| `propertyType` | string | (Residential, Land, Multi-Family) | MLS PropertyType |
| `propertySubType` | string | More granular (Condo/Townhouse) | MLS PropertySubType |
| `architecturalStyle` | string | Style | MLS ArchitecturalStyle or normalized |
| `listPrice` | number | Current list price | ListPrice |
| `originalListPrice` | number | Original list | From feed |
| `closePrice` | number | Sold price if closed | ClosePrice |
| `pricePerSqft` | number | Computed | listPrice / LivingArea (rounded) |
| `priceChangeDate` | string? | Detect recent change | Last price modification timestamp |
| `beds`, `baths` | number | Bedroom/Bath counts | BedroomsTotal / BathroomsTotalInteger |
| `livingArea` | number | Above grade sqft | LivingArea / AboveGradeFinishedArea |
| `belowGradeFinishedArea` | number | Finished basement sqft | BelowGradeFinishedArea |
| `lotSquareFeet` | number | Lot size | LotArea / LotSizeSquareFeet |
| `garageSpaces` | number | Garage | GarageSpaces |
| `yearBuilt` | number | Year built | YearBuilt |
| `daysOnMarket` | number | DOM | Provided or computed (today - ListingContractDate) |
| `listingContractDate` | string | Start date | ListingContractDate |
| `modificationTimestamp` | string | Last update timestamp | ModificationTimestamp |
| `status` | string | Normalized status | StandardStatus / MlsStatus mapping |
| `media` | array | Raw media list with order | Media[] |
| `images` | string[] | Clean filtered image URLs | Non-placeholder subset |
| `virtualTourUrl` | string? | Virtual tour link | VirtualTourURL(Unbranded) |
| `hasBasement` | boolean | Derived basement presence | belowGradeFinishedArea > 0 |
| `isWaterfront` | boolean | Derived flag | Waterfront tokens |
| `isNewConstruction` | boolean | Derived | yearBuilt >= currentYear-2 or feed flag |
| `latitude`,`longitude` | number | Geo | Feed location |

Optional for later (Phase 3+):

- `lastPriceChangeAmount`
- `priceChangeHistory` array
- `openHouseDates`

---

## 4. Filter Semantics & Parsing Rules

- Numeric range: If only min provided → apply lower bound; only max → upper bound.
- Empty or invalid numeric strings: ignore (no 400 unless clearly malformed like non-numeric with letters when coercion is not desired).
- Multi-select `status`:
  - Accept: `status=Active,Pending` or repeated: `status=Active&status=Pending`.
  - Map vendor-specific (e.g., `PENDING`, `ACT`) to canonical values.
- Boolean toggles: accept `true` (case-insensitive) or `1`; anything else = false.
- Sorting fallback: If invalid `sort_by` → default to `ModificationTimestamp`. If invalid `sort_order` → `desc`.
- Geo radius: ignore unless all three present (`latitude`,`longitude`,`radius_miles`). Recommend max radius clamp (e.g. 100 miles).
- Price per sqft: compute only where `livingArea > 0`; exclude from filter if missing.
- Basement flag: `hasBasement=true` includes any non-zero below grade finished area OR explicit basement presence token.

---

## 5. Error Handling & Responses

- On invalid param (non-fatal): Omit filter, include in response meta `ignoredParams`.
- On totally invalid request (e.g., `radius_miles` negative): return 400 with `{ error: "Invalid radius_miles" }`.
- Response top-level structure (existing + meta):

```json
{
  "properties": [ ... ],
  "count": 123,
  "meta": {
    "appliedFilters": { ...normalizedParams },
    "ignoredParams": ["foo"],
    "sort": { "by": "ListPrice", "order": "desc" },
    "timingMs": 245,
    "source": "external|cache",
    "broadening": { "relaxed": false, "steps": [] }
  }
}
```

- Consider future: `broadening.relaxed=true` when auto-relax logic implemented.

---

## 6. Performance & Caching Guidance

- Normalize param order before keying cache.
- Cache TTL suggestions:
  - Active listings: 60–120s
  - Closed: 10–30 min (historic rarely changes)
- Post-filter locally rather than requesting many tiny remote calls (batch once, then refine).
- Hard cap `limit` at 500 to prevent pathological requests.

---

## 7. Phased Rollout Plan

| Phase | Scope                  | Params                                                                                                                                                            | Notes                         |
| ----- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1     | Core expansion         | `min_sqft`, `max_sqft`, `min_year_built`, `max_year_built`, `waterfront`, `new_construction`, `min_garage`, `status` multi, `sort_by`, `sort_order`, `photo_only` | Immediate frontend wins       |
| 2     | Depth + Geo            | `min_dom`, `max_dom`, `latitude`,`longitude`,`radius_miles`, `virtual_tour`, `min_price_per_sqft`, `county`, `state`, `has_basement`                              | Requires some computed fields |
| 3     | Rich pricing & lot     | `min_lot_sqft`, `max_lot_sqft`, `price_change_max_age_days`, `property_sub_type`, `max_price_per_sqft`                                                            | Add change tracking           |
| 4     | Advanced geo & history | `bbox`, price change histories, open house data                                                                                                                   | Optional / stretch            |

---

## 8. Frontend Expectations Per Phase

Frontend will:

- Phase 1: Add advanced filter drawer & parameter builder; chips for active filters.
- Phase 2: Introduce map radius and DOM filters; toggle virtual tour; geocode address to lat/lng.
- Phase 3: Add lot size + price change stale filter UI.
- Phase 4: Map bounding-box draw tool + historical overlays.

---

## 9. Minimal Backend Acceptance Checklist (Phase 1)

- [ ] Accept & parse listed params (Phase 1 set)
- [ ] Provide normalized `status` values
- [ ] Compute `pricePerSqft`
- [ ] Provide `modificationTimestamp`, `daysOnMarket`
- [ ] Filter pipeline ordering: base remote fetch -> normalization -> range filters -> boolean toggles -> media-based filters -> sort -> pagination slice
- [ ] Return `meta.appliedFilters`

---

## 10. Example Requests & Responses

### Example 1 (Phase 1 Active Search)

`/api/property-search-new?status=Active,Pending&min_sqft=1800&max_sqft=3400&min_year_built=1995&waterfront=true&sort_by=ListPrice&sort_order=desc&photo_only=true&limit=100`

### Example 2 (Phase 2 Geo + DOM)

`/api/property-search-new?latitude=41.257&longitude=-96.012&radius_miles=12&new_construction=true&min_dom=0&max_dom=30&virtual_tour=true&sort_by=ModificationTimestamp`

### Example 3 (Phase 3 Pricing Dynamics)

`/api/property-search-new?status=Active&price_change_max_age_days=7&min_price_per_sqft=120&min_lot_sqft=8000`

---

## 11. Field Normalization Suggestions

| Raw                           | Normalized           | Notes                                    |
| ----------------------------- | -------------------- | ---------------------------------------- |
| `MlsStatus`, `StandardStatus` | `status`             | Map variants (ACTIVE → Active)           |
| `SubdivisionName`             | `subdivision`        | Trim, Title Case                         |
| `ArchitecturalStyle`          | `architecturalStyle` | Use first if array                       |
| `Media[]`                     | `images`             | Filter placeholders, keep ordered subset |

---

## 12. Risks & Mitigations

| Risk                                      | Mitigation                                              |
| ----------------------------------------- | ------------------------------------------------------- |
| Remote API lacks filter for all fields    | Overfetch broader set, local post-filter                |
| Performance hit on large post-filter sets | Impose early rough server-side narrowing (price/status) |
| Missing fields (lot size, price change)   | Phase gating (only expose UI once backend returns)      |
| Param explosion & inconsistent caching    | Canonical param normalization & meta return             |

---

## 13. Success Criteria (Phase 1)

- Support at least: sqft range, year range, multi-status, waterfront, new construction, min garage, photo-only, sorting.
- No 500s on malformed optional params; they get ignored with `meta.ignoredParams`.
- Response time P95 < 1.5s for typical queries (limit ≤ 100) after warm cache.

---

## 14. Frontend Mapping (For Reference)

Internal TypeScript interface (after backend implements):

```ts
interface ExtendedPropertySearch {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  propertySubType?: string;
  city?: string;
  subdivision?: string;
  neighborhood?: string;
  schoolDistrict?: string;
  county?: string;
  state?: string;
  style?: string;
  architecturalStyle?: string;
  status?: string | string[];
  days?: number;
  minSqft?: number;
  maxSqft?: number;
  minYear?: number;
  maxYear?: number;
  minLotSqft?: number;
  maxLotSqft?: number;
  minDom?: number;
  maxDom?: number;
  minGarage?: number;
  hasBasement?: boolean;
  minBasementSqft?: number;
  minPricePerSqft?: number;
  maxPricePerSqft?: number;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  waterfront?: boolean;
  newConstruction?: boolean;
  photoOnly?: boolean;
  virtualTour?: boolean;
  priceChangeMaxAgeDays?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
}
```

---

## 15. Next Steps

1. Approve Phase 1 spec.
2. Backend implements + returns new fields / meta.
3. Frontend adds param builder + advanced filters UI.
4. Measure adoption & performance; iterate for Phase 2.

---

_Prepared for backend integration. Let me know if you want a pared-down “Phase 1 only” version or a Swagger/OpenAPI draft._
