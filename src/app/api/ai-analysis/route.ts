import { NextRequest } from "next/server";

export const runtime = "edge"; // important for streaming

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    if (query !== "career") {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    const body = await req.json();
    const stream = body?.stream !== false;

    let normalizedChartData: unknown = body?.chartData;
    if (!normalizedChartData && body?.career) {
      normalizedChartData = Array.isArray(body.career)
        ? body.career
        : { output: body.career };
    }

    // Ensure worker receives one of the accepted shapes:
    // 1) array
    // 2) { output: ... }
    if (
      normalizedChartData &&
      !Array.isArray(normalizedChartData) &&
      typeof normalizedChartData === "object" &&
      !(normalizedChartData as { output?: unknown }).output
    ) {
      normalizedChartData = { output: normalizedChartData };
    }

    const response = await fetch(
      "https://astro.pavitar-1127.workers.dev/career",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ASTRO_API_KEY || "hellothisissecret"
        },
        body: JSON.stringify({
          chartData: normalizedChartData,
          context: body?.context || null,
          stream
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html") || /<!doctype html>/i.test(errorText);

      return Response.json(
        {
          error: "Upstream worker failed",
          upstreamStatus: response.status,
          details: isHtml
            ? "Cloudflare worker exception (HTML error page returned). Check worker logs."
            : errorText.slice(0, 1000),
        },
        { status: response.status || 502 }
      );
    }

    if (!response.body) {
      return Response.json(
        { error: "Upstream returned no body" },
        { status: 502 }
      );
    }

    if (stream === true) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive"
        }
      });
    }

    const data = await response.json();
    return Response.json(data);

  } catch (err: any) {
    return Response.json(
      { error: "fetch failed", cause: err?.message },
      { status: 500 }
    );
  }
}
