#!/bin/bash

# CMA API Deployment Package Creator
# This script creates a deployment-ready zip file based on the successful v2.6.0-FINAL structure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from user or use default
VERSION="${1:-v2.8.0}"
PACKAGE_NAME="cma-api-deployable-${VERSION}-FINAL"

echo -e "${BLUE}🚀 CMA API Deployment Package Creator${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}📦 Creating package: ${PACKAGE_NAME}.zip${NC}"
echo -e "${YELLOW}⚠️  Files will be at ROOT level (AWS EB requirement)${NC}"
echo ""

# Clean up any existing packages
echo -e "${YELLOW}🧹 Cleaning up existing packages...${NC}"
rm -f cma-api-deployable-*.zip

# Define files to include (matching successful v2.6.0-FINAL structure)
echo -e "${YELLOW}📋 Preparing files for deployment...${NC}"
CORE_FILES=(
    "server.js"
    "package.json" 
    "package-lock.json"
    "index.html"
    "test-endpoints.js"
)

DOC_FILES=(
    "API-USAGE-GUIDE.md"
    "API-TEST-RESULTS-FOR-UI-DEVELOPER.md" 
    "DEPLOYMENT-README.md"
    "PROPERTY-FIELDS-GUIDE.md"
    "TEAM-MANAGEMENT-API.md"
    "CMA-API-CURL-GUIDE.md"
)

# Check if files exist
ALL_FILES=("${CORE_FILES[@]}" "${DOC_FILES[@]}")
MISSING_FILES=()

for file in "${ALL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Cannot create deployment package. Missing files.${NC}"
    exit 1
fi

# Verify package.json has correct structure
echo -e "${YELLOW}🔍 Verifying package.json structure...${NC}"
if grep -q '"main": "server.js"' "package.json" && \
   grep -q '"start": "node server.js"' "package.json"; then
    echo -e "  ✅ package.json has correct entry points"
else
    echo -e "  ${RED}❌ package.json missing required fields${NC}"
    exit 1
fi

# Create the zip file with files at ROOT level (AWS EB requirement)
echo -e "${YELLOW}📦 Creating deployment zip with files at root level...${NC}"
zip -r "${PACKAGE_NAME}.zip" "${ALL_FILES[@]}" -x "*.DS_Store*" "*/.git*" > /dev/null 2>&1

# Verify the zip was created
if [ -f "${PACKAGE_NAME}.zip" ]; then
    FILE_SIZE=$(ls -lh "${PACKAGE_NAME}.zip" | awk '{print $5}')
    echo -e "${GREEN}✅ Successfully created: ${PACKAGE_NAME}.zip (${FILE_SIZE})${NC}"
    echo ""
    echo -e "${BLUE}📋 Package Contents (Root Level):${NC}"
    unzip -l "${PACKAGE_NAME}.zip" | grep -E '\.(js|json|html|md)$' | awk '{print "  📄 " $4}'
    echo ""
    echo -e "${GREEN}🚀 Ready for AWS Elastic Beanstalk deployment!${NC}"
    echo -e "${BLUE}💡 Upload ${PACKAGE_NAME}.zip to your AWS EB environment${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Files are at ROOT level (not in subdirectory)${NC}"
else
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔗 Test locally first:${NC}"
echo -e "  curl http://localhost:3002/api/property-search-new?StandardStatus=Active&limit=5"
echo ""
echo -e "${BLUE}🌐 After deployment, test production:${NC}"  
echo -e "  curl http://gbcma.us-east-2.elasticbeanstalk.com/api/property-search-new?StandardStatus=Active&limit=5"
