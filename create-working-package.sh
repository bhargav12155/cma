#!/bin/bash

# CMA API Working Package Creator
# Creates packages that match the working.zip structure exactly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="cma-api-working-v${VERSION}"

echo -e "${BLUE}🚀 CMA API Working Package Creator${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}📦 Creating package: ${PACKAGE_NAME}.zip${NC}"
echo -e "${YELLOW}📋 Using EXACT working.zip structure${NC}"
echo ""

# Clean up any existing packages
echo -e "${YELLOW}🧹 Cleaning up existing packages...${NC}"
rm -f cma-api-working-*.zip

# Define files to include (EXACT match to working.zip)
echo -e "${YELLOW}📋 Preparing files for deployment (matching working.zip)...${NC}"
WORKING_FILES=(
    "API-USAGE-GUIDE.md"
    "index.html" 
    "server.js"
    "advancedSearchParamParser.js"
    "community-aliases.js"
    "community-resolver-endpoint.js"
    "COMMUNITIES-API-GUIDE.md"
    "DEPLOYMENT-README.md"
    "README.md"
    ".env.template"
    "package-lock.json"
    "package.json"
    "TEAM-MANAGEMENT-API.md"
    "Procfile"
    "API-TEST-RESULTS-FOR-UI-DEVELOPER.md"
)

# Check if files exist
MISSING_FILES=()

for file in "${WORKING_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

# Handle missing files
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some files are missing. Creating them...${NC}"
    
    # Create .env.template if missing
    if [[ " ${MISSING_FILES[@]} " =~ " .env.template " ]]; then
        echo "# Environment Configuration Template" > .env.template
        echo "NODE_ENV=production" >> .env.template
        echo "PORT=3002" >> .env.template
        echo -e "  ✅ Created .env.template"
    fi
    
    # Create Procfile if missing
    if [[ " ${MISSING_FILES[@]} " =~ " Procfile " ]]; then
        echo "web: node server.js" > Procfile
        echo -e "  ✅ Created Procfile"
    fi
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
echo -e "${YELLOW}📦 Creating deployment zip with EXACT working.zip structure...${NC}"
zip -r "${PACKAGE_NAME}.zip" "${WORKING_FILES[@]}" -x "*.DS_Store*" "*/.git*" > /dev/null 2>&1

# Verify the zip was created
if [ -f "${PACKAGE_NAME}.zip" ]; then
    FILE_SIZE=$(ls -lh "${PACKAGE_NAME}.zip" | awk '{print $5}')
    echo -e "${GREEN}✅ Successfully created: ${PACKAGE_NAME}.zip (${FILE_SIZE})${NC}"
    echo ""
    echo -e "${BLUE}📋 Package Contents (matching working.zip):${NC}"
    unzip -l "${PACKAGE_NAME}.zip" | grep -v "Archive:" | grep -v "Length" | grep -v -- "---" | grep -v "files" | while read line; do
        if [[ $line == *".md"* ]] || [[ $line == *".js"* ]] || [[ $line == *".json"* ]] || [[ $line == *".html"* ]] || [[ $line == *"Procfile"* ]] || [[ $line == *".env"* ]]; then
            filename=$(echo $line | awk '{print $4}')
            echo -e "  📄 $filename"
        fi
    done
    echo ""
    echo -e "${GREEN}🚀 Ready for AWS Elastic Beanstalk deployment!${NC}"
    echo -e "${BLUE}💡 This package matches the working Sept 17 structure exactly${NC}"
    echo -e "${YELLOW}⚠️  Files are at ROOT level with Procfile included${NC}"
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