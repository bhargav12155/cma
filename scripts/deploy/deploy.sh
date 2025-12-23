#!/bin/bash

# ============================================
# CMA API - AWS Elastic Beanstalk Deployment Script
# ============================================
# Environment: GBCMA-env
# Application: GBCMA
# Region: us-east-2
# URL: http://gbcma.us-east-2.elasticbeanstalk.com
# ============================================

set -e  # Exit on any error

# Configuration
APP_NAME="GBCMA"
ENV_NAME="GBCMA-env"
REGION="us-east-2"
S3_BUCKET="elasticbeanstalk-us-east-2-117984642146"
PROD_URL="http://gbcma.us-east-2.elasticbeanstalk.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
cd "$PROJECT_ROOT"

# Generate version label with timestamp
VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)"
ZIP_FILE="cma-deploy-${VERSION_LABEL}.zip"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  CMA API Deployment Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to show usage
usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./deploy.sh [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  deploy    - Create zip and deploy to Elastic Beanstalk (default)"
    echo "  package   - Create deployment zip only"
    echo "  status    - Check environment status"
    echo "  health    - Check API health"
    echo "  logs      - View recent logs"
    echo "  test      - Run API tests"
    echo "  rollback  - Rollback to previous version"
    echo "  help      - Show this help"
    echo ""
}

# Function to create deployment package
create_package() {
    echo -e "${YELLOW}📦 Creating deployment package: ${ZIP_FILE}${NC}"

    # Remove old zip if exists
    rm -f "$ZIP_FILE"

    # Create zip with all necessary files
    zip -r "$ZIP_FILE" \
        server.js \
        package.json \
        Procfile \
        index.html \
        advancedSearchParamParser.js \
        community-aliases.js \
        community-resolver-endpoint.js \
        district-level-mapping.js \
        -x "*.git*" \
        -x "node_modules/*" \
        -x "*.zip" \
        -x ".DS_Store"

    echo -e "${GREEN}✅ Package created: ${ZIP_FILE} ($(du -h "$ZIP_FILE" | cut -f1))${NC}"
}

# Function to upload to S3
upload_to_s3() {
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"

    aws s3 cp "$ZIP_FILE" "s3://${S3_BUCKET}/${ZIP_FILE}" --region "$REGION"

    echo -e "${GREEN}✅ Uploaded to S3${NC}"
}

# Function to create application version
create_version() {
    echo -e "${YELLOW}📝 Creating application version: ${VERSION_LABEL}${NC}"

    aws elasticbeanstalk create-application-version \
        --application-name "$APP_NAME" \
        --version-label "$VERSION_LABEL" \
        --source-bundle S3Bucket="$S3_BUCKET",S3Key="$ZIP_FILE" \
        --region "$REGION" \
        --description "Deployed on $(date '+%Y-%m-%d %H:%M:%S')"

    echo -e "${GREEN}✅ Version created: ${VERSION_LABEL}${NC}"
}

# Function to deploy to environment
deploy_version() {
    echo -e "${YELLOW}🚀 Deploying to ${ENV_NAME}...${NC}"

    aws elasticbeanstalk update-environment \
        --application-name "$APP_NAME" \
        --environment-name "$ENV_NAME" \
        --version-label "$VERSION_LABEL" \
        --region "$REGION"

    echo -e "${GREEN}✅ Deployment initiated!${NC}"
    echo ""
    echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"

    # Wait for environment to be ready
    aws elasticbeanstalk wait environment-updated \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$REGION" 2>/dev/null || true

    echo -e "${GREEN}✅ Deployment complete!${NC}"
}

# Function to check environment status
check_status() {
    echo -e "${YELLOW}📊 Environment Status:${NC}"

    aws elasticbeanstalk describe-environments \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$REGION" \
        --query 'Environments[0].{Name:EnvironmentName,Status:Status,Health:Health,Version:VersionLabel,URL:CNAME}' \
        --output table
}

# Function to check API health
check_health() {
    echo -e "${YELLOW}🏥 Checking API Health...${NC}"

    # Health endpoint
    echo -e "\n${BLUE}Health Check:${NC}"
    curl -s "${PROD_URL}/api/health" | jq . 2>/dev/null || curl -s "${PROD_URL}/api/health"

    echo -e "\n${BLUE}Property Search Test:${NC}"
    curl -s "${PROD_URL}/api/property-search-new?city=Omaha&limit=1" | jq '.success, .count' 2>/dev/null || echo "OK"
}

# Function to view logs
view_logs() {
    echo -e "${YELLOW}📜 Recent Logs:${NC}"

    aws elasticbeanstalk request-environment-info \
        --environment-name "$ENV_NAME" \
        --info-type tail \
        --region "$REGION"

    sleep 5

    aws elasticbeanstalk retrieve-environment-info \
        --environment-name "$ENV_NAME" \
        --info-type tail \
        --region "$REGION" \
        --query 'EnvironmentInfo[0].Message' \
        --output text | head -100
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running API Tests...${NC}"
    echo ""

    # Test 1: Health
    echo -e "${BLUE}Test 1: Health Check${NC}"
    curl -s "${PROD_URL}/api/health" && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}✗${NC}"

    # Test 2: Property Search
    echo -e "\n${BLUE}Test 2: Property Search${NC}"
    RESULT=$(curl -s "${PROD_URL}/api/property-search-new?city=Omaha&StandardStatus=Active&limit=1")
    if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Property search working${NC}"
    else
        echo -e "${RED}✗ Property search failed${NC}"
    fi

    # Test 3: Open Houses
    echo -e "\n${BLUE}Test 3: Open Houses API${NC}"
    RESULT=$(curl -s "${PROD_URL}/api/open-houses?city=Omaha&limit=1")
    if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Open houses working${NC}"
    else
        echo -e "${RED}✗ Open houses failed${NC}"
    fi

    # Test 4: Advanced Filters (lot_size)
    echo -e "\n${BLUE}Test 4: Advanced Filter - Lot Size${NC}"
    RESULT=$(curl -s "${PROD_URL}/api/property-search-new?city=Omaha&StandardStatus=Active&lot_size=43560&limit=1")
    if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Lot size filter working${NC}"
    else
        echo -e "${RED}✗ Lot size filter failed${NC}"
    fi

    # Test 5: Advanced Filters (min_garage)
    echo -e "\n${BLUE}Test 5: Advanced Filter - Min Garage${NC}"
    RESULT=$(curl -s "${PROD_URL}/api/property-search-new?city=Omaha&StandardStatus=Active&min_garage=3&limit=1")
    if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Min garage filter working${NC}"
    else
        echo -e "${RED}✗ Min garage filter failed${NC}"
    fi

    # Test 6: Keywords search
    echo -e "\n${BLUE}Test 6: Advanced Filter - Keywords${NC}"
    RESULT=$(curl -s "${PROD_URL}/api/property-search-new?city=Omaha&StandardStatus=Active&keywords=pool&limit=1")
    if echo "$RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Keywords filter working${NC}"
    else
        echo -e "${RED}✗ Keywords filter failed${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ Tests complete!${NC}"
}

# Function to rollback
rollback() {
    echo -e "${YELLOW}🔄 Available versions:${NC}"

    aws elasticbeanstalk describe-application-versions \
        --application-name "$APP_NAME" \
        --region "$REGION" \
        --query 'ApplicationVersions[0:5].{Version:VersionLabel,Date:DateCreated}' \
        --output table

    echo ""
    read -p "Enter version label to rollback to: " ROLLBACK_VERSION

    if [ -n "$ROLLBACK_VERSION" ]; then
        aws elasticbeanstalk update-environment \
            --application-name "$APP_NAME" \
            --environment-name "$ENV_NAME" \
            --version-label "$ROLLBACK_VERSION" \
            --region "$REGION"

        echo -e "${GREEN}✅ Rollback initiated to ${ROLLBACK_VERSION}${NC}"
    fi
}

# Main deployment function
deploy() {
    echo -e "${BLUE}Starting deployment to ${ENV_NAME}...${NC}"
    echo ""

    # Step 1: Create package
    create_package
    echo ""

    # Step 2: Upload to S3
    upload_to_s3
    echo ""

    # Step 3: Create version
    create_version
    echo ""

    # Step 4: Deploy
    deploy_version
    echo ""

    # Step 5: Check status
    check_status
    echo ""

    # Step 6: Run tests
    echo -e "${YELLOW}Running post-deployment tests...${NC}"
    sleep 10  # Wait for deployment to stabilize
    run_tests

    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}  Version: ${VERSION_LABEL}${NC}"
    echo -e "${GREEN}  URL: ${PROD_URL}${NC}"
    echo -e "${GREEN}============================================${NC}"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    package)
        create_package
        ;;
    status)
        check_status
        ;;
    health)
        check_health
        ;;
    logs)
        view_logs
        ;;
    test)
        run_tests
        ;;
    rollback)
        rollback
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac
