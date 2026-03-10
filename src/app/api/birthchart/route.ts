import { NextRequest, NextResponse } from 'next/server';

const ASTRO_API_URL = 'https://astro.pavitar-1127.workers.dev/create-chart';
const ASTRO_API_KEY = process.env.NEXT_PUBLIC_ASTRO_API_KEY || 'hellothisissecret';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dob, time, place } = body;

    if (!dob || !place) {
      return NextResponse.json(
        { error: 'Date of birth and place are required' },
        { status: 400 }
      );
    }

    // Call the external celestial API
    const response = await fetch(ASTRO_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ASTRO_API_KEY,
      },
      body: JSON.stringify({
        dob: dob.split('-').reverse().join('-'), // Convert YYYY-MM-DD to DD-MM-YYYY
        time,
        place,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch celestial details from provider' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // The worker might return a nested JSON string in the 'response' field
    if (data.response && typeof data.response === 'string') {
      try {
        const parsedResponse = JSON.parse(data.response);

        // Flatten the response and normalize keys for the frontend
        return NextResponse.json({
          ...data,
          ...parsedResponse,
          // Map signs to what the frontend expects if they differ
          sun_sign: parsedResponse.sunSign || data.sun_sign,
          moon_sign: parsedResponse.moonSign || data.moon_sign,
          ascendant: parsedResponse.lagna || data.ascendant || data.rising_sign,
        });
      } catch (e) {
        console.error('Failed to parse nested worker response:', e);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Birthchart API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
