# 🚀 CMA Real Estate API - Deployment Package v2.5.0

## 📦 What's Included

This deployment package contains the complete CMA Real Estate API with the latest enhancements:

### ✅ **New Features in v2.5.0:**

- **🏫 School District Information**: Complete school data with district names (`schoolElementaryDistrict`, `schoolHighDistrict`, etc.)
- **🏠 Enhanced Property Details**: 25+ new fields including `builderName`, `architecturalStyle`, `basement`, `cooling`, `appliances`
- **� Financial Data**: `associationFee`, `taxAnnualAmount`, `lotSizeAcres` for better investment analysis
- **🏗️ Construction Details**: `newConstructionYN`, `constructionMaterials`, `roof`, `utilities`
- **📍 Comprehensive Property Fields**: Total of 60+ property attributes now available
- **📚 Complete Documentation**: New PROPERTY-FIELDS-GUIDE.md with usage examples
- **🔧 UI Served at Root**: index.html now served at root URL for complete user experience

### 📁 **Package Contents:**

#### Core Application Files:

- `server.js` - Main API server with all latest features and enhanced property fields
- `index.html` - Complete CMA UI application
- `package.json` - Node.js dependencies
- `package-lock.json` - Locked dependency versions
- `aws-deployment/index.html` - Web interface for CMA tool
- `aws-deployment/Procfile` - AWS Elastic Beanstalk configuration

#### Deployment & Configuration:

- `aws-deployment/deploy.sh` - Automated deployment script
- `aws-deployment/.elasticbeanstalk/config.yml` - EB configuration
- `aws-deployment/DEPLOYMENT-GUIDE.md` - Step-by-step deployment instructions
- `.env.template` - Environment variables template

#### Documentation:

- `API-USAGE-GUIDE.md` - Complete API documentation with examples
- `API-TEST-RESULTS-FOR-UI-DEVELOPER.md` - Test results and examples
- `aws-deployment/README.md` - Project overview
- `aws-deployment/TEAM-MANAGEMENT-API.md` - Team management features

## 🚀 **Quick Deployment Steps:**

### 1. **Prepare Environment**

```bash
# Extract the deployment package
unzip cma-api-deployable-v2.2.0.zip
cd aws-deployment/

# Install dependencies
npm install
```

### 2. **Configure Environment Variables**

```bash
# Copy and edit environment template
cp ../.env.template .env

# Set your Paragon API credentials:
PARAGON_SERVER_TOKEN=your_server_token_here
```

### 3. **Local Testing**

```bash
# Test locally first
node server.js
# Visit: http://localhost:3002

# Test API endpoints
curl "http://localhost:3002/api/property-search-new?zip_code=68007&limit=5"
```

### 4. **Deploy to AWS Elastic Beanstalk**

```bash
# Make deploy script executable and run
chmod +x deploy.sh
./deploy.sh

# Or deploy manually:
eb init
eb create cma-api-environment
eb deploy
```

## 🔧 **Key Features:**

### **Price Validation System**

- Automatically detects corrupted MLS data (like $448,950,556 → $448,950)
- Validates prices against reasonable market ranges
- Logs all corrections for transparency

### **Enhanced Property Data**

- **zipCode**: Extracted from address or PostalCode field
- **state**: Extracted from address or StateOrProvince field
- **description**: Property descriptions from PublicRemarks
- **lotSizeSqft**: Lot size in square feet
- **Enhanced arrays**: style, condition with better handling

### **Comprehensive API Coverage**

- ZIP code searches: `/api/property-search-new?zip_code=68007`
- MLS lookups: `/api/property-search-new?mls_number=22524913`
- Address searches: `/api/property-search-new?address=Main+Street&city=Omaha`
- Advanced filtering: price, sqft, year built, bedrooms, bathrooms

## 📊 **API Endpoints:**

### **Primary Endpoints:**

- `GET /api/property-search-new` - Enhanced property search with new fields
- `GET /api/properties/search` - Advanced property search with filtering
- `GET /api/property-count` - Property count by status
- `GET /api/health` - API health check
- `GET /` - Web interface

### **Example Usage:**

```bash
# Basic ZIP search with new fields
curl "https://your-domain.com/api/property-search-new?zip_code=68007"

# Property with corrected pricing
curl "https://your-domain.com/api/property-search-new?mls_number=22524913"

# Test new fields
curl "https://your-domain.com/api/property-search-new?city=Gretna&limit=3" | jq '.properties[] | {address, zipCode, state, description, baths, lotSizeSqft}'
```

## 🔍 **Environment Variables:**

### **Required:**

- `PARAGON_SERVER_TOKEN` - Your Paragon MLS API token

### **Optional:**

- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS origins

## 📞 **Support:**

For deployment issues or questions:

1. Check `DEPLOYMENT-GUIDE.md` for detailed instructions
2. Review `API-USAGE-GUIDE.md` for API documentation
3. Test locally first using `node server.js`

## 🎯 **Production URL:**

After deployment, your API will be available at:

```
https://your-app-name.us-east-2.elasticbeanstalk.com
```

---

**Version:** 2.2.0  
**Release Date:** September 7, 2025  
**Major Features:** Price correction, enhanced fields, comprehensive documentation

🚀 **Ready for production deployment!**
