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

// --- 4. Securely Store Credentials (UPDATED to use environment variables) ---
const paragonApiConfig = {
    clientId: process.env.PARAGON_CLIENT_ID || '8fbF4ONttMVXbsp2WKCK',
    clientSecret: process.env.PARAGON_CLIENT_SECRET || 'dH8o7fxwLISCrMmZ14Sj2knt6EM6ewAOcvM2oZvd',
    tokenUrl: process.env.PARAGON_TOKEN_URL || 'https://paragonapi.com/token',
    apiUrl: process.env.PARAGON_API_URL || 'https://api.paragonapi.com/api/v2/OData/bk9'
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyACKfnIE47Ig4PZyzjygfV9VZxUKK0NPI0';
const PARAGON_SERVER_TOKEN = process.env.PARAGON_SERVER_TOKEN || '429b18690390adfa776f0b727dfc78cc';
const PARAGON_ACCESS_TOKEN = process.env.PARAGON_ACCESS_TOKEN || '';
const PARAGON_APP_ID = process.env.PARAGON_APP_ID || 'ebd3728e-b55f-4973-8652-b72bd548ab3d';

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

// Utility: central error logger (respect DEBUG env)
function logDebug(...args) { if (process.env.DEBUG === 'true') console.log('[DEBUG]', ...args); }
function logError(stage, err, extra) { console.error(`[PARAGON ERROR][${stage}]`, err?.message || err, extra || ''); }

// Simplified token helper
function getParagonToken() {
    const token = PARAGON_ACCESS_TOKEN || (PARAGON_SERVER_TOKEN && PARAGON_SERVER_TOKEN !== 'YOUR_SERVER_TOKEN' ? PARAGON_SERVER_TOKEN : null);
    return token;
}

// Endpoint for fetching comparable properties from the Paragon Web API
app.get('/api/comps', async (req, res) => {
    const { city, sqft_min, sqft_max } = req.query;
    if (!city) return res.status(400).json({ message: 'Missing required parameter: city' });
    const sqftMin = Number.isFinite(Number(sqft_min)) ? Number(sqft_min) : 0;
    const sqftMax = Number.isFinite(Number(sqft_max)) ? Number(sqft_max) : (sqftMin + 1000);
    const safeCity = String(city).replace(/'/g, "''");

    const token = getParagonToken();
    if (!token) {
        return res.status(500).json({ message: 'No Paragon access token configured. Set PARAGON_ACCESS_TOKEN or PARAGON_SERVER_TOKEN.' });
    }

    try {
        const filterParts = [
            "StandardStatus eq 'Sold'",
            `City eq '${safeCity}'`,
            `LivingArea ge ${sqftMin}`,
            `LivingArea le ${sqftMax}`
        ];
        const odataFilter = `$filter=${filterParts.join(' and ')}`;
        const searchUrl = `${paragonApiConfig.apiUrl}/Property?${odataFilter}&$top=50`;
        logDebug('Comps search URL', searchUrl);

        let propertyResponse;
        try {
            propertyResponse = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (e) {
            logError('property_network', e);
            return res.status(502).json({ message: 'Cannot reach property endpoint' });
        }

        if (!propertyResponse.ok) {
            const body = await propertyResponse.text();
            logError('property_http', new Error('Property request failed'), { status: propertyResponse.status, body });
            return res.status(propertyResponse.status).json({ message: 'Property fetch failed', body });
        }

        let propertyData;
        try { propertyData = await propertyResponse.json(); } catch (e) {
            logError('property_parse', e);
            return res.status(502).json({ message: 'Bad JSON from property endpoint' });
        }

        const listings = Array.isArray(propertyData.value) ? propertyData.value : [];
        logDebug('Comps listings count', listings.length);
        if (!listings.length) {
            return res.json({ items: [], meta: { city: safeCity, sqftMin, sqftMax, note: 'No listings returned. Verify dataset, token, or use platform listings endpoint instead of OData.' } });
        }

        const formattedComps = listings.map(record => ({
            id: record.ListingKey || record.Id,
            address: record.UnparsedAddress || record.FullStreetAddress || 'Unknown',
            city: record.City || safeCity,
            status: record.StandardStatus || 'Sold',
            soldDate: record.CloseDate || record.ClosingDate || null,
            soldPrice: record.ClosePrice || record.SoldPrice || 0,
            sqft: record.LivingArea || 0,
            beds: record.BedroomsTotal || 0,
            baths: record.BathroomsTotal || 0,
            garage: record.GarageSpaces || 0,
            yearBuilt: record.YearBuilt || null,
            basementSqft: record.BasementFinishedArea || 0,
            condition: 'Average',
            imageUrl: (record.Photos && record.Photos.length > 0 && (record.Photos[0].url || record.Photos[0].Url)) ? (record.Photos[0].url || record.Photos[0].Url) : 'https://placehold.co/600x400/d1d5db/374151?text=No+Image',
            dom: record.DaysOnMarket || 0,
        }));
        return res.json({ items: formattedComps, count: formattedComps.length });
    } catch (err) {
        logError('comps_unhandled', err);
        return res.status(500).json({ message: 'Unhandled error', error: err.message });
    }
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

// OAuth callback placeholder route
app.get('/oauth/callback', (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) {
        console.error('[OAUTH CALLBACK ERROR]', error, error_description || '');
        return res.status(400).send(`<h1>OAuth Error</h1><p>${error}: ${error_description || ''}</p>`);
    }
    console.log('[OAUTH CALLBACK] Received code:', code, 'state:', state);
    // TODO: Exchange code for access token if using authorization_code flow
    res.send(`<h1>OAuth Callback Received</h1><p>Code: ${code || 'N/A'}</p><p>State: ${state || 'N/A'}</p>`);
});

// Endpoint to fetch any data (Agents) to verify connectivity
app.get('/api/agents', async (req, res) => {
    try {
        const token = PARAGON_ACCESS_TOKEN || (PARAGON_SERVER_TOKEN && PARAGON_SERVER_TOKEN !== 'YOUR_SERVER_TOKEN' ? PARAGON_SERVER_TOKEN : null);
        if (!token) {
            return res.status(500).json({ message: 'No Paragon access token configured. Set PARAGON_ACCESS_TOKEN or PARAGON_SERVER_TOKEN.' });
        }
        const limit = Number(req.query.limit) || 10;
        const offset = Number(req.query.offset) || 0;
        const url = `https://paragonapi.com/platform/mls/bk9/agents?limit=${limit}&offset=${offset}&appID=${encodeURIComponent(PARAGON_APP_ID)}&sortBy=APIModificationTimestamp`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ message: 'Agents fetch failed', body: text });
        }
        const data = await response.json();
        // Return raw or mapped subset
        const agents = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : data.results || data.value || data);
        const simplified = (agents || []).slice(0, limit).map(a => ({
            id: a.Id || a.id || a.AgentID || a.MemberKey || null,
            name: a.FullName || a.Name || `${a.FirstName || ''} ${a.LastName || ''}`.trim(),
            office: a.OfficeName || a.Office || null,
            email: a.Email || a.email || null,
            phone: a.Phone || a.PrimaryPhone || null
        }));
        res.json({ count: simplified.length, items: simplified });
    } catch (err) {
        logError('agents_unhandled', err);
        res.status(500).json({ message: 'Unhandled error fetching agents', error: err.message });
    }
});

// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
