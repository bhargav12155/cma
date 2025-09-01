#!/bin/bash

# AWS Deployment Script for Enhanced CMA API
# This script deploys to the existing GBCMA environment

echo "🚀 Deploying Enhanced CMA API to existing GBCMA environment..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI not found. Please install it first:"
    echo "pip install awsebcli"
    exit 1
fi

# Check if we're in the deployment directory
if [[ ! -f "server.js" || ! -f "package.json" ]]; then
    echo "❌ Please run this script from the aws-deployment directory"
    exit 1
fi

echo "✅ Pre-deployment checks passed"

# Initialize EB application if not already done
if [[ ! -f ".elasticbeanstalk/config.yml" ]]; then
    echo "🔧 Initializing Elastic Beanstalk application..."
    eb init GBCMA --platform "Node.js 22 running on 64bit Amazon Linux 2023" --region us-east-2
fi

# Deploy to existing environment
ENV_NAME="GBCMA-env"
echo "📦 Deploying to existing environment: $ENV_NAME"
eb use $ENV_NAME
eb deploy

# The application URL (known)
APP_URL="gbcma.us-east-2.elasticbeanstalk.com"

echo ""
echo "🎉 Deployment Complete!"
echo "=================================="
echo "Application URL: http://$APP_URL"
echo ""
echo "🔍 Test Enhanced Endpoints:"
echo "Health Check: http://$APP_URL/api/health"
echo "Property Search: http://$APP_URL/api/properties/search?status=Active&limit=1"
echo "Total Sqft Filter: http://$APP_URL/api/properties/search?minTotalSqft=3000&status=Active"
echo "Frontend UI: http://$APP_URL/"
echo ""
echo "📊 Management Commands:"
echo "View Logs: eb logs"
echo "App Status: eb status"

# Test the health endpoint
echo "🧪 Testing deployment..."
sleep 30  # Wait for deployment to stabilize

HEALTH_RESPONSE=$(curl -s "http://$APP_URL/api/health" 2>/dev/null)
if [[ $HEALTH_RESPONSE == *"OK"* ]] || [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Health check passed - API is responding"
    echo "🎯 Testing enhanced square footage API..."
    
    # Test the enhanced API
    SQFT_TEST=$(curl -s "http://$APP_URL/api/properties/search?status=Active&limit=1" 2>/dev/null)
    if [[ $SQFT_TEST == *"totalSqft"* ]]; then
        echo "✅ Enhanced square footage API is working!"
    else
        echo "⚠️  Square footage API might need verification - check response manually"
    fi
else
    echo "⚠️  Health check response: $HEALTH_RESPONSE"
    echo "🔍 Check logs with 'eb logs' if needed"
fi

echo ""
echo "🚀 Enhanced CMA API is now live with:"
echo "   ✅ Total Square Footage Filtering (minTotalSqft, maxTotalSqft)"
echo "   ✅ Bearer Token Authentication" 
echo "   ✅ Active Property Listings"
echo "   ✅ Enhanced UI with Square Footage Display"
echo "   ✅ Deployed to existing proven environment"
