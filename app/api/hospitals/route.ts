import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      return NextResponse.json({ success: false, message: 'Latitude and longitude are required.' }, { status: 400 });
    }

    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](around:5000, ${lat}, ${lon});
        way["amenity"="hospital"](around:5000, ${lat}, ${lon});
        relation["amenity"="hospital"](around:5000, ${lat}, ${lon});
        node["amenity"="clinic"](around:5000, ${lat}, ${lon});
        way["amenity"="clinic"](around:5000, ${lat}, ${lon});
        relation["amenity"="clinic"](around:5000, ${lat}, ${lon});
        node["amenity"="doctors"](around:5000, ${lat}, ${lon});
        way["amenity"="doctors"](around:5000, ${lat}, ${lon});
        relation["amenity"="doctors"](around:5000, ${lat}, ${lon});
        node["amenity"="pharmacy"](around:5000, ${lat}, ${lon});
        way["amenity"="pharmacy"](around:5000, ${lat}, ${lon});
        relation["amenity"="pharmacy"](around:5000, ${lat}, ${lon});
        node["emergency"="yes"](around:5000, ${lat}, ${lon});
        way["emergency"="yes"](around:5000, ${lat}, ${lon});
        relation["emergency"="yes"](around:5000, ${lat}, ${lon});
      );
      out center;
    `;

    const overpassEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter'
    ];

    let data = null;

    // Try Overpass mirrors
    for (const endpoint of overpassEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          // Keep a reasonably short timeout for the fetch itself so we can failover quickly
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          data = await response.json();
          break; // Success, exit retry loop
        }
      } catch (err) {
        console.warn(`Overpass API failed on ${endpoint}:`, err);
      }
    }

    // Helper to calculate distance
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let normalizedResults: any[] = [];

    if (data && data.elements && data.elements.length > 0) {
      // Process Overpass data
      normalizedResults = data.elements.map((el: any) => {
        const hLat = el.lat || el.center?.lat;
        const hLon = el.lon || el.center?.lon;
        const dist = hLat && hLon ? getDistance(lat, lon, hLat, hLon) : 999;
        
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || 'Unknown Medical Facility';
        
        let address = '';
        if (tags['addr:street']) {
          address = `${tags['addr:housenumber'] ? tags['addr:housenumber'] + ' ' : ''}${tags['addr:street']}`;
          if (tags['addr:city']) address += `, ${tags['addr:city']}`;
        } else if (tags['addr:full']) {
          address = tags['addr:full'];
        }

        return {
          id: `overpass_${el.id}`,
          name: name,
          lat: hLat,
          lon: hLon,
          distance: dist,
          address: address
        };
      });
    } else {
      // Nominatim Fallback
      console.warn("All Overpass endpoints failed or returned empty. Falling back to Nominatim.");
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=hospital|clinic&lat=${lat}&lon=${lon}&limit=20`;
        const nomResponse = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'EmergencyCopilotAI/1.0' },
          signal: AbortSignal.timeout(10000)
        });
        
        if (nomResponse.ok) {
          const nomData = await nomResponse.json();
          normalizedResults = nomData.map((el: any) => {
            const hLat = parseFloat(el.lat);
            const hLon = parseFloat(el.lon);
            const dist = getDistance(lat, lon, hLat, hLon);
            return {
              id: `nom_${el.place_id}`,
              name: el.name || 'Unknown Medical Facility',
              lat: hLat,
              lon: hLon,
              distance: dist,
              address: el.display_name || ''
            };
          });
        } else {
           throw new Error("Nominatim returned non-OK status");
        }
      } catch (nomErr) {
        console.error("Nominatim fallback also failed:", nomErr);
        return NextResponse.json({ success: false, message: 'All map servers are currently unavailable.' }, { status: 503 });
      }
    }

    // Filter, sort, deduplicate
    let finalResults = normalizedResults.filter((h: any) => h.lat && h.lon && h.name !== 'Unknown Medical Facility');
    
    finalResults.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
    
    finalResults = finalResults.filter((h: any, index: number, self: any[]) => 
      index === self.findIndex((t) => t.name === h.name)
    );

    return NextResponse.json({ success: true, data: finalResults });

  } catch (error: any) {
    console.error("Error in /api/hospitals:", error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
