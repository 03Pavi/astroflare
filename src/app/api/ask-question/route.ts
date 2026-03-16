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

/* ---------------- ROUTE ---------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chartData, stream } = body;

    if (!question) {
      return new Response("Question required", { status: 400 });
    }
    /* -------- chart context -------- */
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
          body: JSON.stringify({ text: `${question}\n${JSON.stringify(chartData)}` }), // 🔥 ONLY question
        }
      );

      const embeddingData = await embeddingRes.json();
      const vector = embeddingData.result.data[0];

      const search = await client.search("vedic-astro", {
        vector,
        limit: 6,
      });

      console.log(search, 'search')

      const relevant = search.filter((r) => r.score && r.score > 0.2);

      if (relevant.length > 0) {
        context = relevant
          .map((r, i) => {
            const text = r.payload?.text;
            if (!text || typeof text !== "string") return null;

            return `Reference ${i + 1}:\n${text.slice(0, 400)}`;
          })
          .filter(Boolean)
          .join("\n\n");
      } else {
        context = search
          .slice(0, 2)
          .map((r, i) => {
            const text = r.payload?.text;
            if (!text || typeof text !== "string") return null;

            return `Reference ${i + 1}:\n${text.slice(0, 800)}`;
          })
          .filter(Boolean)
          .join("\n\n");
      }
    } catch (err) {
      console.error("Embedding or search error:", err);
    }

    if (!context) {
      return Response.json({
        answer: "No astrology knowledge found in database.",
      });
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
        chartData: JSON.stringify(chartData).slice(0, 1200),
        context,
        stream,
      }),
    });

    if (!res.ok) {
      return new Response(await res.text(), { status: res.status });
    }

    if (stream && res.body) {
      return new Response(res.body, {
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