import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Use a free geolocation service
    const geoRes = await fetch(`https://ipapi.co/${ip}/json`);
    
    if (!geoRes.ok) {
      throw new Error('Failed to fetch geolocation data');
    }
    
    const geo = await geoRes.json();

    const allowed = geo && geo.country_code === 'US';

    return new Response(
      JSON.stringify({
        allowed,
        country: geo?.country_name || 'Unknown',
        ip,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: allowed ? 200 : 403,
      }
    );
  } catch (error) {
    console.error('Geolocation error:', error);
    
    return new Response(
      JSON.stringify({
        allowed: false,
        country: 'Unknown',
        ip: 'unknown',
        error: 'Failed to determine location',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 500,
      }
    );
  }
}); 