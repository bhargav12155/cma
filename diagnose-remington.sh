#!/usr/bin/env bash
set -e

BASE="http://gbcma.us-east-2.elasticbeanstalk.com"
NAME="Remington Ridge"
ENC_NAME="Remington%20Ridge"

echo "== 1) Communities containing 'remington' =="
curl -s "$BASE/api/communities?q=remington" | jq -r '.communities[].name'

echo
echo "== 2) No status filter totalAvailable (should be >0 if name is valid) =="
NO_STATUS=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_NAME&state=NE&limit=1" | jq -r '.totalAvailable // 0')
echo "No-status totalAvailable: $NO_STATUS"

echo
echo "== 3) StandardStatus=Active variant =="
ACTIVE_STD=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_NAME&state=NE&StandardStatus=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "StandardStatus=Active totalAvailable: $ACTIVE_STD"

echo
echo "== 4) SubdivisionName param (Active) =="
ACTIVE_EXACT=$(curl -s "$BASE/api/property-search-new?SubdivisionName=$ENC_NAME&StandardStatus=Active&state=NE&limit=1" | jq -r '.totalAvailable // 0')
echo "SubdivisionName + Active totalAvailable: $ACTIVE_EXACT"

echo
echo "== 5) Array style eq filters (Active) =="
ACTIVE_ARRAY=$(curl -s "$BASE/api/property-search-new?and[0][SubdivisionName][eq]=$ENC_NAME&and[1][StandardStatus][eq]=Active&state=NE&limit=1" | jq -r '.totalAvailable // 0')
echo "Array style totalAvailable: $ACTIVE_ARRAY"

echo
echo "== 6) Legacy status=Active param =="
ACTIVE_LEG=$(curl -s "$BASE/api/property-search-new?subdivision=$ENC_NAME&state=NE&status=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "status=Active totalAvailable: $ACTIVE_LEG"

echo
echo "== 7) Status distribution sample (no status filter) =="
curl -s "$BASE/api/property-search-new?subdivision=$ENC_NAME&state=NE&limit=25" \
 | jq '[.properties[].StandardStatus] | group_by(.) | map({status:.[0], count:length})'

echo
echo "== INTERPRETATION =="
if [ "$NO_STATUS" -eq 0 ]; then
  echo "No properties at all with that exact subdivision name. Re-check the canonical name from step 1."
else
  if [ "$ACTIVE_STD" -eq 0 ] && [ "$ACTIVE_EXACT" -eq 0 ] && [ "$ACTIVE_ARRAY" -eq 0 ] && [ "$ACTIVE_LEG" -eq 0 ]; then
    echo "Name is valid (because no-status >0) but all active filters returned 0."
    echo "=> Production likely missing the active filter implementation OR no listings currently flagged Active."
  else
    echo "At least one Active-filter variant >0: use the variant that produced a non-zero value."
  fi
fi
