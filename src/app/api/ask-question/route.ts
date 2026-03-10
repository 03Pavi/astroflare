import { NextRequest, NextResponse } from 'next/server';

const ASTRO_API_URL = 'https://astro.pavitar-1127.workers.dev/ask-question';
const ASTRO_API_KEY = process.env.NEXT_PUBLIC_ASTRO_API_KEY || 'hellothisissecret';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chartData } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const response = await fetch(ASTRO_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ASTRO_API_KEY,
      },
      body: JSON.stringify({ question, chartData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'API Error' }, { status: response.status });
    }

    const data = await response.json();

    // Parse nested JSON if present
    if (data.response && typeof data.response === 'string') {
      try {
        const parsed = JSON.parse(data.response);
        return NextResponse.json({ ...data, ...parsed });
      } catch (e) {
        // Fallback to raw data
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
