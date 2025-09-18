#!/usr/bin/env bash
set -euo pipefail

COMMUNITY="${1:-Remington Ridge}"
STATE="${STATE:-NE}"
BASE="${BASE:-http://localhost:3002}"
ENC_COMMUNITY=$(python - <<PY
import urllib.parse,sys
print(urllib.parse.quote(sys.argv[1]))
PY
"$COMMUNITY")

hr() { printf '\n---- %s ----\n' "$1"; }

hr "Params"
echo "BASE=$BASE"; echo "STATE=$STATE"; echo "COMMUNITY=$COMMUNITY"; echo "ENC_COMMUNITY=$ENC_COMMUNITY";

hr "1) Communities lookup (q fragment)"
FRAG=$(echo "$COMMUNITY" | awk '{print $1}')
curl -s "$BASE/api/communities?q=${FRAG}" | jq -r '.communities[].name' | grep -i "${FRAG}" || echo "(none)"

hr "2) No-status totalAvailable"
NO_STATUS=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_COMMUNITY&state=$STATE&limit=1" | jq -r '.totalAvailable // 0')
echo "No-status totalAvailable: $NO_STATUS"

hr "3) StandardStatus=Active"
ACTIVE_STD=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_COMMUNITY&state=$STATE&StandardStatus=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "StandardStatus=Active totalAvailable: $ACTIVE_STD"

hr "4) SubdivisionName + StandardStatus"
ACTIVE_EXACT=$(curl -s "$BASE/api/property-search-new?SubdivisionName=$ENC_COMMUNITY&StandardStatus=Active&state=$STATE&limit=1" | jq -r '.totalAvailable // 0')
echo "SubdivisionName param totalAvailable: $ACTIVE_EXACT"

hr "5) Array style filters"
ACTIVE_ARRAY=$(curl -s "$BASE/api/property-search-new?and[0][SubdivisionName][eq]=$ENC_COMMUNITY&and[1][StandardStatus][eq]=Active&state=$STATE&limit=1" | jq -r '.totalAvailable // 0')
echo "Array style totalAvailable: $ACTIVE_ARRAY"

hr "6) Legacy status=Active"
ACTIVE_LEG=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_COMMUNITY&state=$STATE&status=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "status=Active totalAvailable: $ACTIVE_LEG"

hr "7) Status distribution sample (first 25 no filter)"
curl -s "$BASE/api/property-search-new?subdivision=$ENC_COMMUNITY&state=$STATE&limit=25" | jq '[.properties[].StandardStatus] | group_by(.) | map({status:.[0], count:length})'

hr "Interpretation"
if [ "$NO_STATUS" -eq 0 ]; then
  echo "No properties found without status filter. Name likely mismatched or not in dataset subset.";
else
  if [ "$ACTIVE_STD" -eq 0 ] && [ "$ACTIVE_EXACT" -eq 0 ] && [ "$ACTIVE_ARRAY" -eq 0 ] && [ "$ACTIVE_LEG" -eq 0 ]; then
    echo "Active filters yield 0 but unfiltered >0 => Upstream active filter / deployment mismatch or none currently Active.";
  else
    echo "At least one active variant returned >0; use that variant for production calls.";
  fi
fi

hr "Done"
