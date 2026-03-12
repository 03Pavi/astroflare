import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";

const ASTRO_API_URL = "https://astro.pavitar-1127.workers.dev/ask-question";
const ASTRO_API_KEY =
  process.env.NEXT_PUBLIC_ASTRO_API_KEY || "hellothisissecret";

// -------- QDRANT --------
const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_KEY!,
  checkCompatibility: false,
});

function parseChartData(chartData: unknown) {
  if (!chartData) return null;

  let parsedRoot: unknown = chartData;

  if (typeof chartData === "string") {
    try {
      parsedRoot = JSON.parse(chartData);
    } catch (error) {
      console.error("[ask-question] Failed to parse chart payload", error);
      return null;
    }
  }

  if (!parsedRoot || typeof parsedRoot !== "object") {
    return null;
  }

  const root = parsedRoot as Record<string, unknown>;
  let nestedDetails: Record<string, unknown> | null = null;

  if (typeof root.chartData === "string") {
    try {
      const parsedNested = JSON.parse(root.chartData);
      if (parsedNested && typeof parsedNested === "object") {
        nestedDetails = parsedNested as Record<string, unknown>;
      }
    } catch (error) {
      console.error("[ask-question] Failed to parse nested chartData", error);
    }
  }

  return { root, details: nestedDetails };
}

function formatChartSummary(chartPayload: ReturnType<typeof parseChartData>) {
  if (!chartPayload) return "No birth chart data provided.";

  const { root, details } = chartPayload;
  const summary = [
    `Label: ${root.label ?? "Unknown"}`,
    `Birth date: ${root.birthDate ?? "Unknown"}`,
    `Birth time: ${root.birthTime ?? "Unknown"}`,
    `Birth place: ${root.birthPlace ?? "Unknown"}`,
    `Sun sign: ${root.sunSign ?? details?.sun_sign ?? "Unknown"}`,
    `Moon sign: ${root.moonSign ?? details?.moon_sign ?? "Unknown"}`,
    `Rising sign: ${root.risingSign ?? details?.ascendant ?? details?.rising_sign ?? "Unknown"}`,
    `Chart details: ${JSON.stringify(details ?? root)}`,
  ];

  return summary.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chartData } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const chartPayload = parseChartData(chartData);
    const chartContext = formatChartSummary(chartPayload);
    const retrievalInput = `Question: ${question}\nBirth chart: ${chartContext}`;

    // -------- STEP 1: embed question --------
    const embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    const emb = await embedder(retrievalInput, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(emb.data);

    // -------- STEP 2: search Qdrant --------
    try {
      await client.getCollections();
      console.log("[Qdrant] Connection OK");
    } catch (qdrantError) {
      console.error("[Qdrant] Connection failed", qdrantError);
      throw new Error("Qdrant is not responding");
    }

    const search = await client.search("books", {
      vector,
      limit: 5,
    });

    const context = search
      .map((r) => r.payload?.text)
      .filter(Boolean)
      .join("\n\n");

    // -------- STEP 3: send to astro API --------
    const prompt = [
      "You are an astrologer answering from the provided birth chart.",
      "Do not ask the user for birth details.",
      "If chart details are present, use them directly and give a concrete answer.",
      "",
      `User question: ${question}`,
      "",
      "Birth chart:",
      chartContext,
      "",
      "Retrieved reference context:",
      context || "No extra reference context found.",
    ].join("\n");

    const response = await fetch(ASTRO_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ASTRO_API_KEY,
      },
      body: JSON.stringify({
        question: prompt,
        chartData: chartContext,
        context: `${chartContext}\n\n${context}`.trim(),
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "API Error" }, { status: response.status });
    }

    const data = await response.json();

    // nested JSON support
    if (data.response && typeof data.response === "string") {
      try {
        const parsed = JSON.parse(data.response);
        return NextResponse.json({ ...data, ...parsed });
      } catch {}
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[ask-question] Request failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
