// server.js

// --- 1. Import Necessary Libraries ---
const express = require('express');
const cors = require('cors');
const path = require('path');
// In a real Node.js environment, you'd use a library like 'node-fetch' to make API calls.
// For a real project, run: npm install node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- 2. Initialize the Express App ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. Configure Middleware ---
app.use(cors());
app.use(express.json());
// Serve static files (index.html, etc.) from root directory
app.use(express.static(__dirname));

// --- 4. Securely Store Credentials (IMPORTANT) ---
// These should be stored in environment variables (e.g., in a .env file) for security.
const paragonApiConfig = {
    clientId: '8fbF4ONttMVXbsp2WKCK',
    clientSecret: 'dH8o7fxwLISCrMmZ14Sj2knt6EM6ewAOcvM2oZvd',
    tokenUrl: 'https://paragonapi.com/token', // This is a standard URL, developer should confirm.
    apiUrl: 'https://api.paragonapi.com/api/v2/OData/bk9', // UPDATED API URL
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyACKfnIE47Ig4PZyzjygfV9VZxUKK0NPI0';

// --- 5. Define API Endpoints ---

// Health check/status endpoint (root now serves UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            gemini_ai: GEMINI_API_KEY ? 'configured' : 'not_configured',
            mls_api: paragonApiConfig.clientId ? 'configured' : 'not_configured'
        }
    });
});

// Server status information
app.get('/api/status', (req, res) => {
    res.json({
        server: 'Simple CMA Backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        endpoints: [
            'GET /',
            'GET /api/health',
            'GET /api/status',
            'GET /api/comps',
            'POST /api/generate-text'
        ],
        services: {
            gemini_ai: {
                status: GEMINI_API_KEY ? 'configured' : 'not_configured',
                model: 'gemini-2.5-flash-preview-05-20'
            },
            mls_api: {
                status: paragonApiConfig.clientId ? 'configured' : 'not_configured',
                provider: 'Paragon API'
            }
        }
    });
});

// Endpoint for fetching comparable properties from the Paragon Web API
app.get('/api/comps', async (req, res) => {
    console.log('Received request for comps with query:', req.query);
    
    // --- START: REAL WEB API CONNECTION LOGIC ---
    try {
        // 1. Get an Access Token from the Paragon API
        const tokenResponse = await fetch(paragonApiConfig.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'grant_type': 'client_credentials',
                'client_id': paragonApiConfig.clientId,
                'client_secret': paragonApiConfig.clientSecret,
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to authenticate with MLS API.');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log('Successfully obtained API access token.');

        // 2. Use the Access Token to search for properties
        const { city, sqft_min, sqft_max } = req.query;
        // The API query will use OData filter syntax, which is standard for modern real estate APIs.
        const odataFilter = `$filter=StandardStatus eq 'Sold' and City eq '${city}' and LivingArea ge ${sqft_min} and LivingArea le ${sqft_max}`;
        const searchUrl = `${paragonApiConfig.apiUrl}/Property?${odataFilter}&$top=50`; // Appended resource, e.g., /Property

        const propertyResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });

        if (!propertyResponse.ok) {
            throw new Error('Failed to fetch property data from MLS API.');
        }
        
        const propertyData = await propertyResponse.json();
        const listings = propertyData.value; // Results are often in a 'value' array
        console.log(`Found ${listings.length} comps from Paragon API feed.`);

        // 3. Format the results into a clean JSON array that the frontend expects
        const formattedComps = listings.map(record => ({
            id: record.ListingKey,
            address: record.UnparsedAddress,
            city: record.City,
            status: 'Sold',
            soldDate: record.CloseDate,
            soldPrice: record.ClosePrice,
            sqft: record.LivingArea,
            beds: record.BedroomsTotal,
            baths: record.BathroomsTotal,
            garage: record.GarageSpaces,
            yearBuilt: record.YearBuilt,
            condition: 'Average', 
            imageUrl: record.Photos && record.Photos.length > 0 ? record.Photos[0].url : `https://placehold.co/600x400/d1d5db/374151?text=No+Image`,
            dom: record.DaysOnMarket,
        }));

        // 4. Send the formatted data back to the React app
        res.json(formattedComps);

    } catch (error) {
        console.error('Paragon API Error:', error);
        res.status(500).json({ message: 'Failed to fetch data from MLS.' });
    }
    // --- END: REAL WEB API CONNECTION LOGIC ---
});


// Endpoint for Gemini API Calls
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required.' });
    }
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
         return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API Error:', errorBody);
            return res.status(response.status).json({ message: 'Error from Gemini API.', details: errorBody });
        }
        const result = await response.json();
        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Server Error calling Gemini API:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
