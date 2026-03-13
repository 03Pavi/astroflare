import { NextRequest, NextResponse } from "next/server";
import { find as findTimezones } from "geo-tz";

type IncomingBody = {
  year?: number;
  month?: number;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  latitude?: number;
  longitude?: number;
  timezone?: number;
  config?: {
    observation_point?: "topocentric" | "geocentric";
    ayanamsha?: "lahiri" | "sayana";
  };
};

function getOffsetHours(
  timezoneName: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
) {
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

  if (!tzPart) return undefined;
  const offsetMatch = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(tzPart);
  if (!offsetMatch) return undefined;

  const offsetHours = Number.parseInt(offsetMatch[1], 10);
  const offsetMinutes = Number.parseInt(offsetMatch[2] ?? "0", 10);
  return offsetHours + Math.sign(offsetHours || 1) * offsetMinutes / 60;
}

function normalizePayload(body: IncomingBody) {
  const year = body.year;
  const month = body.month;
  const date = body.date;
  const hours = body.hours ?? 0;
  const minutes = body.minutes ?? 0;
  const seconds = body.seconds ?? 0;
  const latitude = body.latitude;
  const longitude = body.longitude;
  let timezone: number | undefined =
    typeof body.timezone === "number" ? body.timezone : undefined;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(date) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  if (!Number.isFinite(timezone)) {
    const timezoneName = findTimezones(latitude!, longitude!)[0];
    if (!timezoneName) return null;
    timezone = getOffsetHours(
      timezoneName,
      year!,
      month!,
      date!,
      hours!,
      minutes!,
      seconds!
    );
  }

  if (!Number.isFinite(timezone)) return null;

  return {
    year: year!,
    month: month!,
    date: date!,
    hours: hours!,
    minutes: minutes!,
    seconds: seconds!,
    latitude: latitude!,
    longitude: longitude!,
    timezone: timezone!,
    config: {
      observation_point: body.config?.observation_point ?? "topocentric",
      ayanamsha: body.config?.ayanamsha ?? "lahiri",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingBody;
    const payload = normalizePayload(body);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid career input payload" },
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

    const response = await fetch("https://json.freeastrologyapi.com/d10-chart-info", {
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
    const output = rawData?.output ?? rawData?.data ?? rawData;
    return NextResponse.json({ success: true, output });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
