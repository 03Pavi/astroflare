import { NextRequest, NextResponse } from "next/server";
import { find as findTimezones } from "geo-tz";

type PartnerInput = {
  year?: number;
  month?: number;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  latitude?: number;
  longitude?: number;
  timezone?: number;
};

type IncomingBody = {
  female?: PartnerInput;
  male?: PartnerInput;
  config?: {
    observation_point?: "topocentric" | "geocentric";
    language?: "te" | "hi" | "en";
    ayanamsha?: "sayana" | "lahiri";
  };
};

type NormalizedPartner = {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  latitude: number;
  longitude: number;
  timezone: number;
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

function normalizePartner(data?: PartnerInput): NormalizedPartner | null {
  if (!data) return null;

  const year = data.year;
  const month = data.month;
  const date = data.date;
  const hours = data.hours ?? 0;
  const minutes = data.minutes ?? 0;
  const seconds = data.seconds ?? 0;
  const latitude = data.latitude;
  const longitude = data.longitude;

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

  let timezone: number | undefined =
    typeof data.timezone === "number" ? data.timezone : undefined;
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
  };
}

function mapAshtakoot(output: any) {
  return {
    varna: {
      score: Number(output?.varna_kootam?.score ?? 0),
      max: 1 as const,
      name: "Varna" as const,
      description: "Work & spiritual compatibility" as const,
    },
    vashya: {
      score: Number(output?.vasya_kootam?.score ?? 0),
      max: 2 as const,
      name: "Vashya" as const,
      description: "Dominance & attraction" as const,
    },
    tara: {
      score: Number(output?.tara_kootam?.score ?? 0),
      max: 3 as const,
      name: "Tara" as const,
      description: "Destiny & mutual well-being" as const,
    },
    yoni: {
      score: Number(output?.yoni_kootam?.score ?? 0),
      max: 4 as const,
      name: "Yoni" as const,
      description: "Intimacy & physical compatibility" as const,
    },
    grahaMaitri: {
      score: Number(output?.graha_maitri_kootam?.score ?? 0),
      max: 5 as const,
      name: "Graha Maitri" as const,
      description: "Mental & psychological match" as const,
    },
    gana: {
      score: Number(output?.gana_kootam?.score ?? 0),
      max: 6 as const,
      name: "Gana" as const,
      description: "Temperament & behavior" as const,
    },
    bhakoot: {
      score: Number(output?.rasi_kootam?.score ?? 0),
      max: 7 as const,
      name: "Bhakoot" as const,
      description: "Health, romance & family" as const,
    },
    nadi: {
      score: Number(output?.nadi_kootam?.score ?? 0),
      max: 8 as const,
      name: "Nadi" as const,
      description: "Genetic & physiological compatibility" as const,
    },
    total: Number(output?.total_score ?? 0),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingBody;
    const female = normalizePartner(body.female);
    const male = normalizePartner(body.male);

    if (!female || !male) {
      return NextResponse.json(
        { success: false, message: "Invalid compatibility input payload" },
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

    const payload = {
      female,
      male,
      config: {
        observation_point: body.config?.observation_point ?? "topocentric",
        language: body.config?.language ?? "en",
        ayanamsha: body.config?.ayanamsha ?? "lahiri",
      },
    };

    const response = await fetch(
      "https://json.freeastrologyapi.com/match-making/ashtakoot-score",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `External API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const output = rawData?.output;
    if (!output) {
      return NextResponse.json(
        { success: false, message: "Unexpected compatibility API response format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: mapAshtakoot(output),
      raw: output,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
