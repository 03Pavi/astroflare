import { NextRequest, NextResponse } from 'next/server';
import { Origin, Horoscope } from 'circular-natal-horoscope-js';
import { find } from 'geo-tz';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const PLANET_HINDI_MAP: Record<string, string> = {
  "Sun": "सूर्य", "Moon": "चंद्र", "Mars": "मंगल", "Mercury": "बुध",
  "Jupiter": "गुरु", "Venus": "शुक्र", "Saturn": "शनि",
  "North Node": "राहु", "South Node": "केतु",
  "Rahu": "राहु", "Ketu": "केतु"
};

const SIGN_NAMES_MAP: Record<string, number> = {
  "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6,
  "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12
};

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

function getNakshatra(longitude: number) {
  const nakSize = 360 / 27;
  const index = Math.floor(longitude / nakSize);
  return NAKSHATRAS[index % 27];
}

function generateNorthIndianSVG(houses: any[]) {
  const width = 600;
  const height = 600;

  // Define house centers and text areas
  // 1st house is central top diamond, then CCW (standard North Indian)
  const paths = [
    "M0,0 L600,0 L600,600 L0,600 Z", // Border
    "M0,0 L600,600", "M600,0 L0,600", // Diagonals
    "M300,0 L0,300 L300,600 L600,300 Z" // Inner Diamond
  ];

  // House positioning for text (approximate centers of diamonds/triangles)
  const houseConfig = [
    { nr: 1, c: [300, 200] }, { nr: 2, c: [200, 100] }, { nr: 3, c: [100, 200] },
    { nr: 4, c: [200, 300] }, { nr: 5, c: [100, 400] }, { nr: 6, c: [200, 500] },
    { nr: 7, c: [300, 400] }, { nr: 8, c: [400, 500] }, { nr: 9, c: [500, 400] },
    { nr: 10, c: [400, 300] }, { nr: 11, c: [500, 200] }, { nr: 12, c: [400, 100] }
  ];

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer;">`;

  // Background and styles
  svg += `
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
      </linearGradient>
      <style>
        .house-cell:hover { fill: rgba(124, 58, 237, 0.1); }
        .planet-text { transition: all 0.2s ease; }
        .planet-text:hover { filter: brightness(1.5) drop-shadow(0 0 5px currentColor); font-size: 26px; }
      </style>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad)" rx="32" />
  `;

  // Draw lines with glow
  paths.forEach(p => {
    svg += `<path d="${p}" stroke="rgba(124, 58, 237, 0.4)" stroke-width="2" fill="none" />`;
    svg += `<path d="${p}" stroke="rgba(124, 58, 237, 0.8)" stroke-width="1" fill="none" filter="url(#glow)" />`;
  });

  // Central glow core
  svg += `<circle cx="300" cy="300" r="20" fill="#7c3aed" opacity="0.3" filter="url(#glow)" />`;
  svg += `<circle cx="300" cy="300" r="5" fill="#fff" filter="url(#glow)" />`;

  // Add House Data
  houses.forEach((h, idx) => {
    const config = houseConfig[idx];
    const signNr = SIGN_NAMES_MAP[h.sign] || (idx + 1);

    svg += `<g class="house-group">`;
    svg += `<title>House ${idx + 1}: ${h.sign}
Planets: ${h.planets.map((p: any) => p.name).join(", ") || "No planets"}</title>`;

    // Sign Number (Yellow as in image)
    svg += `<text x="${config.c[0]}" y="${config.c[1] + 35}" font-family="Arial" font-size="22" font-weight="bold" fill="#facc15" text-anchor="middle" opacity="0.8">${signNr}</text>`;

    // Planets
    const count = h.planets.length;
    h.planets.forEach((p: { name: string, isRetrograde: boolean, degree: string, sign: string }, pIdx: number) => {
      const pName = p.name;
      const hindi = PLANET_HINDI_MAP[pName] || pName;
      const label = p.isRetrograde ? `${hindi}ᴿ` : hindi;

      // Better vertical/horizontal distribution to avoid overlaps
      let x = config.c[0];
      let y = config.c[1];

      if (count === 1) {
        y -= 10;
      } else if (count === 2) {
        y += (pIdx === 0 ? -25 : 5);
      } else if (count === 3) {
        y += (pIdx === 0 ? -35 : (pIdx === 1 ? -5 : 25));
      } else {
        // Many planets case
        const col = pIdx % 2;
        const row = Math.floor(pIdx / 2);
        x += (col === 0 ? -30 : 30);
        y += (row * 25) - 40;
      }

      let color = "#fff";
      if (pName === "Sun") color = "#facc15";
      if (pName === "Moon") color = "#e2e8f0";
      if (pName === "Mars") color = "#f87171";
      if (pName === "Mercury") color = "#4ade80";
      if (pName === "Jupiter") color = "#fbbf24";
      if (pName === "Venus") color = "#f472b6";
      if (pName === "Saturn") color = "#818cf8";
      if (pName === "Rahu" || pName === "Ketu" || pName === "North Node" || pName === "South Node") color = "#94a3b8";

      svg += `<text x="${x}" y="${y}" class="planet-text" font-family="'Noto Sans Devanagari', sans-serif" font-size="22" fill="${color}" text-anchor="middle" filter="url(#glow)">${label}
        <title>${pName}: ${p.degree}° in ${p.sign}${p.isRetrograde ? ' (Retrograde)' : ''}</title>
      </text>`;
    });
    svg += `</g>`;
  });

  svg += `</svg>`;
  return svg;
}

const DASHA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

const DASHA_YEARS: Record<string, number> = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

const PLANET_KEYS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "lilith", "northnode", "southnode"
];

function getVimshottariDasha(moonLon: number, birthDate: Date) {
  const nakSize = 360 / 27;
  const nakIdx = Math.floor(moonLon / nakSize);
  const startPlanetIdx = nakIdx % 9;

  const dashaList = [];
  let currentDate = dayjs(birthDate);

  const posInNak = moonLon % nakSize;
  const fractionRemaining = (nakSize - posInNak) / nakSize;
  const firstPlanet = DASHA_LORDS[startPlanetIdx];
  const firstPlanetYears = DASHA_YEARS[firstPlanet];

  let remainingYears = firstPlanetYears * fractionRemaining;

  for (let i = 0; i < 9; i++) {
    const planetIdx = (startPlanetIdx + i) % 9;
    const planet = DASHA_LORDS[planetIdx];
    const years = i === 0 ? remainingYears : DASHA_YEARS[planet];

    const endDate = currentDate.add(years, 'year');
    dashaList.push({
      planet: planet,
      start: currentDate.toISOString(),
      end: endDate.toISOString()
    });
    currentDate = endDate;
  }

  return dashaList;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dob, time, place, lat, lon } = body;

    if (!dob || (!place && !lat)) {
      return NextResponse.json(
        { error: 'Date of birth and location are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Precise coordinates (lat/lon) are required' }, { status: 400 });
    }

    const tzs = find(latitude, longitude);
    const tz = tzs.length > 0 ? tzs[0] : 'UTC';

    const birthDate = dayjs.tz(`${dob} ${time}`, tz).toDate();

    // 1. Create Origin for Western/Universal Calculation
    const origin = new Origin({
      year: birthDate.getFullYear(),
      month: birthDate.getMonth(),
      date: birthDate.getDate(),
      hour: birthDate.getHours(),
      minute: birthDate.getMinutes(),
      latitude: latitude,
      longitude: longitude
    });

    // 2. Compute Tropical (Western) Chart
    const westernHoro = new Horoscope({
      origin,
      houseSystem: 'placidus',
      zodiac: 'tropical',
      aspectPoints: ['bodies', 'points', 'angles'],
      aspectTypes: ['major']
    });

    // 3. Compute Sidereal (Vedic) Chart
    const vedicHoro = new Horoscope({
      origin,
      houseSystem: 'whole-sign',
      zodiac: 'sidereal',
      aspectPoints: ['bodies', 'points', 'angles'],
      aspectTypes: ['major']
    });

    // 4. Group Planets by House Manually (to ensure accuracy)
    const housePlanets: Record<number, any[]> = {};
    const planets = PLANET_KEYS.map(key => {
      const p = (vedicHoro.CelestialBodies as any)[key] || (vedicHoro.CelestialPoints as any)[key];
      if (!p) return null;

      const absLon = p.ChartPosition?.Ecliptic?.DecimalDegrees || 0;
      const planetData = {
        name: p.label,
        sign: p.Sign?.label || 'Unknown',
        degree: (absLon % 30).toFixed(2),
        nakshatra: getNakshatra(absLon),
        house: p.House?.id || 'N/A',
        isRetrograde: !!p.ChartPosition?.Ecliptic?.isRetrograde
      };

      if (typeof planetData.house === 'number') {
        if (!housePlanets[planetData.house]) housePlanets[planetData.house] = [];
        housePlanets[planetData.house].push(planetData);
      }

      return planetData;
    }).filter(Boolean);

    // 5. AstroChart data (Tropical by default as per user request example)
    const astroData = {
      sun: westernHoro.CelestialBodies.sun?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      moon: westernHoro.CelestialBodies.moon?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      mercury: westernHoro.CelestialBodies.mercury?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      venus: westernHoro.CelestialBodies.venus?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      mars: westernHoro.CelestialBodies.mars?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      jupiter: westernHoro.CelestialBodies.jupiter?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      saturn: westernHoro.CelestialBodies.saturn?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      uranus: westernHoro.CelestialBodies.uranus?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      neptune: westernHoro.CelestialBodies.neptune?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      pluto: westernHoro.CelestialBodies.pluto?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      chiron: westernHoro.CelestialBodies.chiron?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      lilith: westernHoro.CelestialBodies.lilith?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      nnode: westernHoro.CelestialPoints.northnode?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      houses: westernHoro.Houses.map((h: any) => h.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees || 0),
      ascendant: westernHoro.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees || 0,
      mc: westernHoro.Midheaven?.ChartPosition?.Ecliptic?.DecimalDegrees || 0
    };

    // 6. Format Aspects
    const aspects = westernHoro.Aspects.all.map((a: any) => ({
      body1: a.point1Label || 'Unknown',
      body2: a.point2Label || 'Unknown',
      type: a.label || 'Aspect',
      orb: (a.orb || 0).toFixed(2)
    }));

    // 7. Vedic Extras (Dasha + SVG)
    const siderealMoonLon = vedicHoro.CelestialBodies.moon?.ChartPosition?.Ecliptic?.DecimalDegrees || 0;
    const dasha = getVimshottariDasha(siderealMoonLon, birthDate);

    const vedicHouses = (vedicHoro.Houses as any[]).map((h: any, i: number) => ({
      number: i + 1,
      sign: h.Sign?.label || 'Unknown',
      planets: housePlanets[i + 1] || []
    }));

    const chart_svg = generateNorthIndianSVG(vedicHouses);

    const responseData = {
      sun_sign: vedicHoro.CelestialBodies.sun?.Sign?.label || 'Unknown',
      moon_sign: vedicHoro.CelestialBodies.moon?.Sign?.label || 'Unknown',
      ascendant: vedicHoro.Ascendant?.Sign?.label || 'Unknown', // This is the Vedic Lagna
      ascendant_degree: (vedicHoro.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees % 30 || 0).toFixed(2),
      day_of_week: dayjs(birthDate).format('dddd'),
      western_sun: westernHoro.CelestialBodies.sun?.Sign?.label || 'Unknown',
      western_moon: westernHoro.CelestialBodies.moon?.Sign?.label || 'Unknown',
      western_asc: westernHoro.Ascendant?.Sign?.label || 'Unknown',
      planets: planets,
      aspects: aspects,
      dasha: dasha,
      chart_svg: chart_svg,
      western_data: astroData,
      houses: vedicHouses,
      summary: `Detailed birth chart analysis for ${place}. Calculations harmonized for spiritual clarity.`
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Birthchart API Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate chart: ' + error.message },
      { status: 500 }
    );
  }
}
