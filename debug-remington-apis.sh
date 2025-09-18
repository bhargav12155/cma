#!/usr/bin/env bash
set -euo pipefail

# Test script to debug Remington Ridge vs Remington discrepancy
BASE="${BASE:-http://localhost:3002}"
echo "Testing against: $BASE"
echo

echo "=== 1) Communities API search for 'remington' ==="
curl -s "$BASE/api/communities?q=remington" | jq -r '.communities[] | "\(.name): \(.activeProperties)/\(.totalProperties) active"'

echo
echo "=== 2) Property search with 'Remington Ridge' ==="
SEARCH1=$(curl -s "$BASE/api/property-search-new?subdivision=Remington%20Ridge&state=NE&StandardStatus=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "subdivision=Remington Ridge + StandardStatus=Active: $SEARCH1"

echo
echo "=== 3) Property search with 'Remington' ==="
SEARCH2=$(curl -s "$BASE/api/property-search-new?subdivision=Remington&state=NE&StandardStatus=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "subdivision=Remington + StandardStatus=Active: $SEARCH2"

echo
echo "=== 4) Property search with SubdivisionName exact match ==="
SEARCH3=$(curl -s "$BASE/api/property-search-new?SubdivisionName=Remington&StandardStatus=Active&state=NE&limit=1" | jq -r '.totalAvailable // 0')
echo "SubdivisionName=Remington + StandardStatus=Active: $SEARCH3"

echo
echo "=== 5) Property search legacy status param ==="
SEARCH4=$(curl -s "$BASE/api/property-search-new?subdivision=Remington&state=NE&status=Active&limit=1" | jq -r '.totalAvailable // 0')
echo "subdivision=Remington + status=Active: $SEARCH4"

echo
echo "=== Summary ==="
echo "Communities API shows active count for 'Remington': (see above)"
echo "Property searches:"
echo "  Remington Ridge: $SEARCH1"
echo "  Remington: $SEARCH2" 
echo "  SubdivisionName=Remington: $SEARCH3"
echo "  Legacy status: $SEARCH4"

if [ "$SEARCH2" -gt 0 ] || [ "$SEARCH3" -gt 0 ] || [ "$SEARCH4" -gt 0 ]; then
  echo "✅ Property search works with 'Remington'"
  if [ "$SEARCH1" -eq 0 ]; then
    echo "❌ Issue: 'Remington Ridge' doesn't match - use 'Remington' instead"
  fi
else
  echo "❌ None of the property search variants work"
fi