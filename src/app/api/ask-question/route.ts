import { NextRequest } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";


export const runtime = "edge"; // ✅ required

const ASTRO_API_URL = "https://astro.pavitar-1127.workers.dev/ask-question";
const ASTRO_API_KEY =
  process.env.NEXT_PUBLIC_ASTRO_API_KEY || "hellothisissecret";

/* ---------------- QDRANT ---------------- */

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_KEY!,
  checkCompatibility: false,
});

/* ---------------- HELPERS ---------------- */

function parseChartData(chartData: unknown) {
  if (!chartData) return null;

  let parsedRoot: unknown = chartData;

  if (typeof chartData === "string") {
    try {
      parsedRoot = JSON.parse(chartData);
    } catch {
      return null;
    }
  }

  if (!parsedRoot || typeof parsedRoot !== "object") return null;

  const root = parsedRoot as Record<string, unknown>;
  let nestedDetails: Record<string, unknown> | null = null;

  if (typeof root.chartData === "string") {
    try {
      const parsedNested = JSON.parse(root.chartData);
      if (parsedNested && typeof parsedNested === "object") {
        nestedDetails = parsedNested as Record<string, unknown>;
      }
    } catch {}
  }

  return { root, details: nestedDetails };
}

function formatChartSummary(chartPayload: ReturnType<typeof parseChartData>) {
  if (!chartPayload) return "No birth chart data provided.";

  const { root, details } = chartPayload;

  return [
    `Label: ${root.label ?? "Unknown"}`,
    `Birth date: ${root.birthDate ?? "Unknown"}`,
    `Birth time: ${root.birthTime ?? "Unknown"}`,
    `Birth place: ${root.birthPlace ?? "Unknown"}`,
    `Sun sign: ${root.sunSign ?? details?.sun_sign ?? "Unknown"}`,
    `Moon sign: ${root.moonSign ?? details?.moon_sign ?? "Unknown"}`,
    `Rising sign: ${
      root.risingSign ?? details?.ascendant ?? details?.rising_sign ?? "Unknown"
    }`,
    `Chart details: ${JSON.stringify(details ?? root)}`,
  ].join("\n");
}

/* ---------------- ROUTE ---------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chartData, stream } = body;

    if (!question) {
      return new Response("Question required", { status: 400 });
    }

    const isStream = stream === true;

    /* -------- chart context -------- */

    const chartPayload = parseChartData(chartData);
    const chartContext = formatChartSummary(chartPayload);

    let context = "";

    try {
      // ✅ fast embedding
      const embeddingRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-small-en-v1.5`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: question }), // 🔥 ONLY question
        }
      );

      const embeddingData = await embeddingRes.json();
      const vector = embeddingData.result.data[0];

      const search = await client.search("books", {
        vector,
        limit: 4,
      });

      context = search
        .map((r) => {
          const text = r.payload?.text;
          return typeof text === "string" ? text.slice(0, 700) : undefined;
        })
        .filter(Boolean)
        .join("\n\n");
    } catch (err) {
      console.error(err);
      context = "";
    }

    /* -------- call worker -------- */

    const res = await fetch(ASTRO_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ASTRO_API_KEY,
      },
      body: JSON.stringify({
        question,
        chartData,
        context,
        stream: true,
        system_prompt: `You are an expert Vedic astrology consultant. Your role is to provide insights based on provided birth chart data. Answer questions clearly and concisely, focusing only on astrological interpretation. Do not answer personal questions or questions outside the scope of Vedic astrology.`
      }),
    });

    if (!res.ok) {
      return new Response(await res.text(), { status: res.status });
    }

    /* ---------------- STREAM FIX ---------------- */

    if (isStream && res.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });

              // 🔥 directly forward chunk (no parsing)
              controller.enqueue(encoder.encode(chunk));
            }

            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    /* -------- NORMAL RESPONSE -------- */

    return Response.json(await res.json());
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500 });
  }
}