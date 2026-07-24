import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json();

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return NextResponse.json({ success: false, message: 'Valid latitude and longitude are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      console.error("GEOAPIFY_API_KEY is missing from environment variables.");
      return NextResponse.json({ success: false, message: 'Server configuration error: Missing API key.' }, { status: 500 });
    }

    // Geoapify Places API for healthcare facilities within 5000m (5km)
    const categories = 'healthcare.hospital,healthcare.clinic';
    const radius = 5000;
    const limit = 20;
    
    // Geoapify expects longitude first, then latitude in filter and bias
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${parsedLon},${parsedLat},${radius}&bias=proximity:${parsedLon},${parsedLat}&limit=${limit}&apiKey=${apiKey}`;

    const maskedUrl = url.replace(/apiKey=[^&]+/, 'apiKey=MASKED');
    console.log(`[DEBUG] Geoapify Request URL: ${maskedUrl}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[DEBUG] Geoapify Response Body (Status ${response.status}):`, errorBody);
      throw new Error(`Geoapify API responded with status: ${response.status}. Details: ${errorBody}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Process and normalize Geoapify data
    let finalResults = data.features.map((feature: any) => {
      const props = feature.properties;
      const hLat = props.lat;
      const hLon = props.lon;
      
      // Distance is provided by Geoapify in meters if bias=proximity is used, converting to km
      let dist = props.distance !== undefined ? props.distance / 1000 : 999; 
      
      if (dist === 999 && hLat && hLon) {
        dist = getDistance(lat, lon, hLat, hLon);
      }

      return {
        id: props.place_id || `geo_${Math.random()}`,
        name: props.name || 'Unknown Medical Facility',
        lat: hLat,
        lon: hLon,
        distance: dist,
        address: props.formatted || `${props.street || ''} ${props.city || ''}`.trim()
      };
    });

    // Filter out unknown names and items without coordinates
    finalResults = finalResults.filter((h: any) => h.lat && h.lon && h.name !== 'Unknown Medical Facility');
    
    // Sort by distance
    finalResults.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
    
    // Deduplicate by name
    finalResults = finalResults.filter((h: any, index: number, self: any[]) => 
      index === self.findIndex((t) => t.name === h.name)
    );

    return NextResponse.json({ success: true, data: finalResults });

  } catch (error: any) {
    console.error("Error in /api/hospitals:", error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Helper to calculate distance in km if Geoapify doesn't provide it
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
