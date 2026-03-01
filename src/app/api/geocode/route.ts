
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CivicPulse/1.0', 
      },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Nominatim API error:', errorText);
        return NextResponse.json({ error: 'Failed to fetch address from Nominatim', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      address: data.display_name,
      pincode: data.address?.postcode || "" 
    });

  } catch (error) {
    console.error('Error proxying to Nominatim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
