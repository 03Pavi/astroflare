import { NextRequest, NextResponse } from "next/server";
import { find as findTimezones } from "geo-tz";

type IncomingBody = {
  dob?: string;
  time?: string;
  place?: string;
  lat?: string | number;
  lon?: string | number;
  year?: number;
  month?: number;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  latitude?: number;
  longitude?: number;
  timezone?: number;
  settings?: {
    observation_point?: string;
    ayanamsha?: string;
  };
};

type AstrologyApiPlanet = {
  name?: string;
  planet?: string;
  full_degree?: number;
  norm_degree?: number;
  sign?: string;
  house?: number;
  retrograde?: string | boolean;
  fullDegree?: number;
  normDegree?: number;
  house_number?: number;
  isRetro?: string | boolean;
  zodiac_sign_name?: string;
  localized_name?: string;
  current_sign?: number;
};

const SIGN_NAMES = [
  "",
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function normalizePlanet(
  name: string,
  planet: AstrologyApiPlanet | Record<string, unknown>
) {
  const source = planet as AstrologyApiPlanet;

  return {
    name: source.localized_name || source.planet || source.name || name,
    degree:
      source.normDegree ??
      source.norm_degree ??
      source.fullDegree ??
      source.full_degree ??
      0,
    sign:
      source.zodiac_sign_name ||
      source.sign ||
      SIGN_NAMES[source.current_sign ?? 0] ||
      "",
    house: source.house_number ?? source.house ?? 0,
    retrograde:
      source.isRetro === true ||
      source.isRetro === "true" ||
      source.retrograde === true ||
      source.retrograde === "true",
  };
}

function parseNumber(value: string | number | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function buildAstrologyPayload(body: IncomingBody) {
  let year = body.year;
  let month = body.month;
  let day = body.date;
  let hour = body.hours;
  let minute = body.minutes;
  const second = body.seconds ?? 0;
  const lat = parseNumber(body.latitude ?? body.lat);
  const lon = parseNumber(body.longitude ?? body.lon);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    const { dob, time } = body;
    if (!dob || !time) {
      return null;
    }

    const dobMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

    if (!dobMatch || !timeMatch) {
      return null;
    }

    year = Number.parseInt(dobMatch[1], 10);
    month = Number.parseInt(dobMatch[2], 10);
    day = Number.parseInt(dobMatch[3], 10);
    hour = Number.parseInt(timeMatch[1], 10);
    minute = Number.parseInt(timeMatch[2], 10);
  }

  if (lat === null || lon === null) {
    return null;
  }

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  let tzone = body.timezone;

  if (!Number.isFinite(tzone)) {
    const timezones = findTimezones(lat, lon);
    const timezoneName = timezones[0];

    if (!timezoneName) {
      return null;
    }

    const monthString = String(month).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");
    const hourString = String(hour).padStart(2, "0");
    const minuteString = String(minute).padStart(2, "0");
    const secondString = String(second).padStart(2, "0");
    const utcDate = new Date(
      `${year}-${monthString}-${dayString}T${hourString}:${minuteString}:${secondString}Z`
    );
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezoneName,
      timeZoneName: "longOffset",
    });
    const tzPart = formatter
      .formatToParts(utcDate)
      .find((part) => part.type === "timeZoneName")?.value;

    if (!tzPart) {
      return null;
    }

    const offsetMatch = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(tzPart);
    if (!offsetMatch) {
      return null;
    }

    const offsetHours = Number.parseInt(offsetMatch[1], 10);
    const offsetMinutes = Number.parseInt(offsetMatch[2] ?? "0", 10);
    tzone =
      offsetHours + Math.sign(offsetHours || 1) * offsetMinutes / 60;
  }

  return {
    date: day,
    month,
    year,
    hours: hour,
    minutes: minute,
    seconds: second,
    latitude: lat,
    longitude: lon,
    timezone: tzone,
    settings: body.settings ?? {
      observation_point: "topocentric",
      ayanamsha: "lahiri",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingBody;
    const payload = buildAstrologyPayload(body);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid input parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FREE_ASTROLOGY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://json.freeastrologyapi.com/planets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `External API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const output = rawData.output || rawData.data || rawData.planets || rawData;

    let planets: ReturnType<typeof normalizePlanet>[] = [];

    if (Array.isArray(output)) {
      const detailedEntry =
        output.find((entry) => {
          if (!entry || typeof entry !== "object") {
            return false;
          }

          return Object.values(entry as Record<string, unknown>).some(
            (value) =>
              Boolean(value) &&
              typeof value === "object" &&
              "name" in (value as Record<string, unknown>)
          );
        }) ?? output[0];

      if (detailedEntry && typeof detailedEntry === "object") {
        planets = Object.entries(detailedEntry as Record<string, unknown>)
          .filter(([, value]) => {
            if (!value || typeof value !== "object") {
              return false;
            }

            const record = value as Record<string, unknown>;
            return typeof record.name === "string";
          })
          .map(([name, value]) =>
            normalizePlanet(name, value as Record<string, unknown>)
          );
      }
    } else if (output && typeof output === "object") {
      planets = Object.entries(output as Record<string, unknown>)
        .filter(([, value]) => Boolean(value) && typeof value === "object")
        .map(([name, value]) => normalizePlanet(name, value as Record<string, unknown>));
    }

    if (planets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Unexpected response format from astrology API" },
        { status: 500 }
      );
    }

    const ascendantRaw = planets.find(
      (planet) => planet.name === "Ascendant"
    );

    const result = {
      success: true,
      ascendant: ascendantRaw?.sign || "",
      rising_sign: ascendantRaw?.sign || "",
      planets: planets
        .filter((planet) => planet.name !== "Ascendant"),
    };

    const sun = result.planets.find((planet) => planet.name === "Sun");
    const moon = result.planets.find((planet) => planet.name === "Moon");

    return NextResponse.json({
      ...result,
      sun_sign: sun?.sign || "",
      moon_sign: moon?.sign || "",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    console.error("[birthchart] Request failed", error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
