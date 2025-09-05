// This is a Node.js environment, so we use 'require'
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Get the search query from the URL (?query=...)
    const query = event.queryStringParameters.query || 'dental clinic';
    
    // Get the secure API key from Netlify Environment Variables
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API Key is not configured.' })
        };
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // We only need a few fields, so let's simplify the response
        const places = data.results.map(place => ({
            name: place.name,
            address: place.formatted_address,
            placeId: place.place_id
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(places)
        };
    } catch (error) {
        console.error('Error fetching from Google Places API:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from Google Places API.' })
        };
    }
};