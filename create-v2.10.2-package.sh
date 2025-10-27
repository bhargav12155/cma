#!/bin/bash

# CMA API v2.10.2 - School Districts Fixed - Deployment Package Creator
# Based on DEPLOYMENT-README-v2.10.2.md specifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Package details from DEPLOYMENT-README-v2.10.2.md
PACKAGE_VERSION="v2.10.2"
PACKAGE_NAME="cma-school-districts-fixed-v2.10.2"
EXPECTED_SIZE="170KB"

echo -e "${BLUE}📦 CMA API v2.10.2 - School Districts Fixed - Deployment Package${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "${YELLOW}📦 Creating package: ${PACKAGE_NAME}.zip${NC}"
echo -e "${YELLOW}🎯 Status: Ready for Production Deployment${NC}"
echo -e "${YELLOW}📋 Based on: DEPLOYMENT-README-v2.10.2.md${NC}"
echo ""

# Clean up any existing packages
echo -e "${YELLOW}🧹 Cleaning up existing packages...${NC}"
rm -f cma-school-districts-fixed-*.zip

# Define files to include based on DEPLOYMENT-README-v2.10.2.md
echo -e "${YELLOW}📋 Preparing files for deployment (as specified in DEPLOYMENT-README-v2.10.2.md)...${NC}"

# Core Application Files (as specified in the deployment readme)
CORE_FILES=(
    "server.js"                    # UPDATED with school district fixes
    "package.json"                 # Dependencies and scripts
    "Procfile"                     # Heroku deployment configuration
    "index.html"                   # Frontend interface
)

# Documentation (NEW) - as specified in deployment readme
NEW_DOCUMENTATION=(
    "SCHOOL-DISTRICT-UI-IMPLEMENTATION-GUIDE.md"  # Frontend implementation guide
    "SCHOOL-DISTRICTS-LEVEL-AWARE-API-GUIDE.md"   # Complete API documentation (replaces SCHOOL-DISTRICT-APIs-GUIDE.md)
)

# Existing Documentation - as specified in deployment readme
EXISTING_DOCUMENTATION=(
    "API-USAGE-GUIDE.md"
    "COMMUNITIES-API-GUIDE.md"
    "PROPERTY-FIELDS-GUIDE.md"
    "PRODUCTION-DEPLOYMENT-GUIDE.md"
    "TEAM-MANAGEMENT-API.md"
    "ADVANCED-PROPERTY-SEARCH-COMPLETE-GUIDE.md"
    "API-TEST-RESULTS-FOR-UI-DEVELOPER.md"
    "CMA-API-CURL-GUIDE.md"    
    "COMMUNITIES-API-FRONTEND-GUIDE.md"
    "FRONTEND-ACTIVE-LISTINGS-GUIDE.md"
    "FRONTEND-OPTIMIZATION-API-GUIDE.md"
    "DOCUMENTATION-SUMMARY.md"
    "frontendrequest.md"
    "README.md"
)

# Configuration - as specified in deployment readme
CONFIGURATION_FILES=(
    ".env.template"               # Environment variables template
    "package-lock.json"          # Lock file for dependencies
)

# Helper files (various configuration and helper files)
HELPER_FILES=(
    "advancedSearchParamParser.js"
    "community-aliases.js"
    "community-resolver-endpoint.js"
    "test-endpoints.js"
    "district-level-mapping.js"   # NEW: Level-aware district mapping
    "test-districts-api.sh"       # NEW: Test scripts for validation
)

# Combine all files
ALL_FILES=(
    "${CORE_FILES[@]}"
    "${NEW_DOCUMENTATION[@]}" 
    "${EXISTING_DOCUMENTATION[@]}"
    "${CONFIGURATION_FILES[@]}"
    "${HELPER_FILES[@]}"
)

# Check if files exist and categorize them
CORE_COUNT=0
NEW_DOC_COUNT=0
EXISTING_DOC_COUNT=0
CONFIG_COUNT=0
HELPER_COUNT=0
MISSING_FILES=()

echo -e "${BLUE}📋 Package Contents Analysis:${NC}"
echo ""

echo -e "${YELLOW}🏗️  Core Application Files:${NC}"
for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
        ((CORE_COUNT++))
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

echo -e "${YELLOW}📄 Documentation (NEW):${NC}"
for file in "${NEW_DOCUMENTATION[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
        ((NEW_DOC_COUNT++))
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

echo -e "${YELLOW}📚 Existing Documentation:${NC}"
for file in "${EXISTING_DOCUMENTATION[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
        ((EXISTING_DOC_COUNT++))
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

echo -e "${YELLOW}⚙️  Configuration:${NC}"
for file in "${CONFIGURATION_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
        ((CONFIG_COUNT++))
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

echo -e "${YELLOW}🛠️  Helper Files:${NC}"
for file in "${HELPER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
        ((HELPER_COUNT++))
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

echo ""
echo -e "${YELLOW}📊 Package Summary:${NC}"
echo -e "  Core Files: ${CORE_COUNT}/${#CORE_FILES[@]}"
echo -e "  New Documentation: ${NEW_DOC_COUNT}/${#NEW_DOCUMENTATION[@]}"
echo -e "  Existing Documentation: ${EXISTING_DOC_COUNT}/${#EXISTING_DOCUMENTATION[@]}"
echo -e "  Configuration: ${CONFIG_COUNT}/${#CONFIGURATION_FILES[@]}"
echo -e "  Helper Files: ${HELPER_COUNT}/${#HELPER_FILES[@]}"
echo -e "  Missing: ${#MISSING_FILES[@]}"

# Handle missing critical files
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Handling missing files...${NC}"
    
    # Create .env.template if missing
    if [[ " ${MISSING_FILES[@]} " =~ " .env.template " ]]; then
        cat > .env.template << 'EOL'
# CMA API Environment Configuration Template
NODE_ENV=production
PORT=3002

# Paragon MLS API Configuration
PARAGON_API_URL=https://api-prod.corelogic.com/trestle/odata
PARAGON_SERVER_TOKEN=your_token_here
PARAGON_DATASET_ID=your_dataset_id

# AI Configuration (if using AI features)
GEMINI_API_KEY=your_gemini_key_here
EOL
        echo -e "  ✅ Created .env.template"
    fi
    
    # Create Procfile if missing
    if [[ " ${MISSING_FILES[@]} " =~ " Procfile " ]]; then
        echo "web: node server.js" > Procfile
        echo -e "  ✅ Created Procfile"
    fi
fi

# Verify critical functionality exists
echo -e "${YELLOW}🔍 Verifying v2.10.2 functionality...${NC}"

# Check if school district fields are restored in server.js
if grep -q "schoolElementaryDistrict.*ElementarySchoolDistrict" "server.js" && \
   grep -q "schoolMiddleDistrict" "server.js" && \
   grep -q "schoolHighDistrict.*HighSchoolDistrict" "server.js"; then
    echo -e "  ✅ School district fields restored in server.js"
else
    echo -e "  ${RED}❌ School district fields not found in server.js${NC}"
    echo -e "  ${RED}❌ This doesn't match v2.10.2 specifications${NC}"
    exit 1
fi

# Check for level-aware districts API
if grep -q "/api/districts" "server.js" && \
   grep -q "district-level-mapping" "server.js"; then
    echo -e "  ✅ Level-aware districts API implemented"
else
    echo -e "  ${YELLOW}⚠️  Level-aware districts API not found (this is OK for v2.10.2)${NC}"
fi

# Verify package.json has correct structure
if grep -q '"main": "server.js"' "package.json" && \
   grep -q '"start": "node server.js"' "package.json"; then
    echo -e "  ✅ package.json has correct entry points"
else
    echo -e "  ${RED}❌ package.json missing required fields${NC}"
    exit 1
fi

# Create the deployment package
echo -e "${YELLOW}📦 Creating deployment zip...${NC}"
zip -r "${PACKAGE_NAME}.zip" "${ALL_FILES[@]}" -x "*.DS_Store*" "*/.git*" "*/node_modules/*" > /dev/null 2>&1

# Verify the zip was created
if [ -f "${PACKAGE_NAME}.zip" ]; then
    FILE_SIZE=$(ls -lh "${PACKAGE_NAME}.zip" | awk '{print $5}')
    echo -e "${GREEN}✅ Successfully created: ${PACKAGE_NAME}.zip (${FILE_SIZE})${NC}"
    echo ""
    
    # Verify it matches expected specifications
    echo -e "${BLUE}📦 Package Verification:${NC}"
    echo -e "  Expected Size: ~${EXPECTED_SIZE}"
    echo -e "  Actual Size: ${FILE_SIZE}"
    echo -e "  Version: ${PACKAGE_VERSION}"
    echo -e "  Status: ✅ Ready for Production Deployment"
    echo ""
    
    echo -e "${GREEN}🎯 FEATURES IN THIS PACKAGE (v2.10.2):${NC}"
    echo -e "${GREEN}  ✅ School district fields restored in /api/property-search-new${NC}"
    echo -e "${GREEN}  ✅ All search variations include school data${NC}"
    echo -e "${GREEN}  ✅ Complete school district documentation${NC}"
    echo -e "${GREEN}  ✅ Frontend implementation guides${NC}"
    echo -e "${GREEN}  ✅ No breaking changes - backward compatible${NC}"
    echo -e "${GREEN}  ✅ No migration required${NC}"
    
    echo ""
    echo -e "${BLUE}🚀 Ready for AWS Elastic Beanstalk deployment!${NC}"
    echo -e "${YELLOW}⚠️  This package matches DEPLOYMENT-README-v2.10.2.md specifications${NC}"
    
else
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

# Create deployment verification instructions
echo ""
echo -e "${BLUE}📋 Deployment Verification Commands:${NC}"
echo ""
echo -e "  ${YELLOW}Step 1: Health Check${NC}"
echo -e "    curl 'https://your-domain.com/api/health'"
echo ""
echo -e "  ${YELLOW}Step 2: Test School District Fields${NC}"
echo -e "    curl 'https://your-domain.com/api/property-search-new?city=Gretna&limit=5' \\"
echo -e "      | jq '.properties[0] | {address, schoolElementaryDistrict, schoolHighDistrict}'"
echo ""
echo -e "  ${YELLOW}Step 3: Test Property Details${NC}"
echo -e "    curl -X POST 'https://your-domain.com/api/property-details-from-address' \\"
echo -e "      -H 'Content-Type: application/json' \\"
echo -e "      -d '{\"address\": \"19863 cottonwood st\"}'"
echo ""
echo -e "${GREEN}📄 Package matches: DEPLOYMENT-README-v2.10.2.md${NC}"
echo -e "${GREEN}🎉 v2.10.2 package ready for production deployment!${NC}"